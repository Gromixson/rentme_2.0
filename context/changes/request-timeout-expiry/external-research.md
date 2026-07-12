---
change_id: request-timeout-expiry
researched_at: 2026-07-12
sources:
  - https://firebase.google.com/docs/firestore/ttl
  - https://firebase.google.com/docs/functions/schedule-functions
  - https://cloud.google.com/tasks/docs/comp-tasks-sched
  - https://medium.com/firebase-developers/how-to-schedule-a-cloud-function-to-run-in-the-future-in-order-to-build-a-firestore-document-ttl-754f9bf3214a
  - context/foundation/infra-research.md
---

# External research — request timeout / expiration

## Problem domain

RentMe wymaga **egzekwowania biznesowego statusu** (`PENDING` → `TIMEOUT`) w oknie ~1–2 min (MVP.md §3.5, FR-011). To nie jest czyste „usunięcie dokumentu po TTL”, lecz **zmiana pola `status`** widoczna dla seekera (timer UI) i providera (lista pending).

## Porównane podejścia

| #   | Podejście                                   | Plusy                                                                          | Minusy                                                                                                                | Źródło                                                                                                                                                                                   |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | **Cloud Scheduler + `onSchedule`** (obecne) | Proste, już w repo; koszt ~$0.10/m job + invocations w Blaze; batch do 100/run | Min. interwał 1 min → opóźnienie expiry do +60s; wymaga composite index                                               | [Firebase schedule functions](https://firebase.google.com/docs/functions/schedule-functions), [Cloud Tasks vs Scheduler](https://cloud.google.com/tasks/docs/comp-tasks-sched)           |
| B   | **Lazy expiry przy odczycie** (obecne)      | Natychmiastowa korekta przy GET; brak dodatkowej infra                         | Nie aktualizuje dokumentów „niewidzianych”; N+1 writes przy liście `/requests/my`                                     | Wzorzec read-time validation; infra-research.md §Scheduled expiry lag                                                                                                                    |
| C   | **Firestore TTL na `expiresAt`**            | Zero kodu schedulera do cleanup                                                | Usuwa dokumenty, nie ustawia `TIMEOUT`; opóźnienie **do 24h**; nie nadaje się do access control / statusu biznesowego | [Firestore TTL docs](https://firebase.google.com/docs/firestore/ttl): _"Data is typically deleted within 24 hours"_; _"TTL trades deletion timeliness"_                                  |
| D   | **Cloud Tasks — jeden task per request**    | Precyzyjne wywołanie w `expiresAt`                                             | Kolejka + callback HTTP + cancel przy accept/decline; więcej moving parts na MVP                                      | [Doug Stevenson — Cloud Tasks TTL](https://medium.com/firebase-developers/how-to-schedule-a-cloud-function-to-run-in-the-future-in-order-to-build-a-firestore-document-ttl-754f9bf3214a) |

## Werdykt

**Wybieramy hybrydę A + B (Cloud Scheduler co 1 min + lazy expiry w `resolveRequestStatus`), bo oficjalna dokumentacja Firestore TTL mówi, że „deletion is not instantaneous” i „TTL trades deletion timeliness for reduced cost of ownership” — TTL służy do **usuwania** danych, nie do natychmiastowej zmiany statusu biznesowego w oknie 2 min; Cloud Tasks (D) dałby precyzję sekundową, ale Scheduler vs Tasks ([Google Cloud comparison](https://cloud.google.com/tasks/docs/comp-tasks-sched)) pokazuje, że Tasks opłaca się przy **pojedynczych\*\* przyszłych wywołaniach, podczas gdy RentMe ma już działający `onSchedule` i akceptuje lag ≤1 min przy pollingu UI co 3s.

> **Doc snippet (Firebase TTL):** _"Expired documents continue to appear in queries and lookup requests until the TTL process actually deletes them. TTL trades deletion timeliness for the benefit of reduced total cost of ownership for deletions. Data is typically deleted within 24 hours after its expiration date."_ — [firebase.google.com/docs/firestore/ttl](https://firebase.google.com/docs/firestore/ttl)

> **Doc snippet (Scheduler):** _"Once a minute is the most fine-grained interval supported"_ (Cloud Scheduler via `onSchedule`) — [cloud.google.com/tasks/docs/comp-tasks-sched](https://cloud.google.com/tasks/docs/comp-tasks-sched)

## Implikacje dla RentMe

1. **Nie** włączać Firestore TTL na `expiresAt` — pole służy do logiki statusu, dokument ma pozostać dla historii „Moje prośby”.
2. **Utrzymać** `REQUEST_TIMEOUT_MS = 120_000` (`functions/src/db.ts`) zgodnie z MVP ~2 min.
3. **Dodać** composite index `requests`: `status ASC`, `expiresAt ASC` — bez niego scheduler query może failować w prod ([infra-research.md](../../foundation/infra-research.md) §Indexes).
4. **Opcjonalnie** ujednolicić scheduler batch z transakcją `expirePendingRequest` (obecnie batch update bez re-check `PENDING` w transakcji — race z accept).

## Odrzucone na MVP

- **Cloud Tasks per request** — over-engineering przy ≤100 requestów/demo; revisit jeśli product wymaga sub-minutowej precyzji bez pollingu.
- **Firestore TTL** — semantycznie błędne (delete vs status change).
