# Request timeout & expiration — Plan Brief

> Pełny plan: `context/changes/request-timeout-expiry/plan.md`  
> Roadmap: S-05 `seeker-send-request` (focus: timeout/expiry)  
> PRD: US-01, FR-010, FR-011, FR-013  
> Research: `research.md` + `external-research.md`

## Co i dlaczego

Slice S-05 domyka **scenariusz negatywny MVP** (brak odpowiedzi → TIMEOUT). Kod schedulera i lazy expiry **istnieje**, ale wybór architektury nie jest trywialny (Scheduler vs TTL vs Cloud Tasks) — ten change **weryfikuje kontrakt i domyka luki** (index, race batch/tx, checklist), nie buduje flow od zera.

## Punkt startowy

- `expireRequests` co 1 min + `resolveRequestStatus` przy GET
- UI: timer + poll 3s w `RequestWaitingComponent`
- **Luki:** brak indexu `status+expiresAt`; batch scheduler bez transakcji; brak manual verification

## Stan docelowy

- TIMEOUT niezawodny w demo (scheduler + lazy)
- Indeks Firestore wdrożony
- Checklist MVP §7 zielona
- Build green

## Kluczowe decyzje kontraktu (ze źródłami)

| Decyzja                 | Wybór                                                              | Źródło                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mechanizm expiry        | **Scheduler (1 min) + lazy on read**                               | [Firebase schedule functions](https://firebase.google.com/docs/functions/schedule-functions); [external-research.md](external-research.md) — odrzucenie TTL |
| Firestore TTL           | **Nie** — TTL usuwa docs z opóźnieniem do 24h, nie ustawia statusu | [Firestore TTL](https://firebase.google.com/docs/firestore/ttl): _"typically deleted within 24 hours"_                                                      |
| Cloud Tasks per request | **Nie na MVP** — precyzja sekundowa bez korzyści przy poll 3s      | [Cloud Tasks vs Scheduler](https://cloud.google.com/tasks/docs/comp-tasks-sched)                                                                            |
| Timeout duration        | **120s** (`REQUEST_TIMEOUT_MS`)                                    | `functions/src/db.ts:7`; MVP.md §3.5                                                                                                                        |
| Lazy expiry scope       | **GET** `/requests/:id`, `/requests/my`, `/providers/requests`     | `research.md` — existing paths                                                                                                                              |
| Scheduler implementacja | **Transakcyjne** `expirePendingRequest` per doc (nie blind batch)  | `research.md` §Race accept vs batch                                                                                                                         |
| Indeks Firestore        | **Dodać** `requests`: `status` + `expiresAt`                       | `firestore.indexes.json` gap; `infra-research.md` §Indexes                                                                                                  |
| UI odświeżanie          | **Poll 3s** + client countdown z `expiresAt`                       | `request-waiting.component.ts`; Scheduler min 1 min                                                                                                         |
| Respond na wygasły      | **410** `{ error: 'Czas na odpowiedź minął' }`                     | `provider-accept-booking/plan.md` — bez zmian                                                                                                               |

## Fazy (skrót)

| Faza | Zakres                         | Ryzyko                          |
| ---- | ------------------------------ | ------------------------------- |
| 1    | Index + scheduler tx hardening | Średnie — wymaga deploy indexes |
| 2    | Spójność API read paths        | Niskie                          |
| 3    | Weryfikacja UX seekera         | Niskie                          |
| 4    | Checklist manual + roadmap     | Wymaga 2 kont Firebase          |

## Otwarte pytania (explicit)

1. Czy lag schedulera +0–60s jest OK dla demo? → **propozycja: tak** (lazy + poll)
2. Optimistic TIMEOUT w UI przy 0s bez czekania na poll? → **opcjonalny polish**, nie blokuje MVP
3. Cloud Tasks revisit? → **po MVP**, jeśli product wymaga sub-minutowej precyzji

## Kryteria sukcesu (skrót)

- TIMEOUT bez ręcznej edycji DB
- Seeker waiting + „Moje prośby” spójne
- Provider pending bez wiszących overdue
- Brak bookingu po TIMEOUT
- Build OK
