---
change_id: request-timeout-expiry
title: Timeout requestu — wygasanie PENDING → TIMEOUT (S-05)
status: proposed
created: 2026-07-12
updated: 2026-07-12
roadmap_ref: S-05
prd_refs: US-01, FR-010, FR-011, FR-013
---

## Intent

Zweryfikować i utwardzić slice **request timeout + expiration**: klient wysyła prośbę, widzi timer ~2 min, a system niezawodnie przechodzi `PENDING` → `TIMEOUT` gdy provider nie odpowie; scenariusz negatywny MVP.md §7 przechodzi bez ręcznej edycji Firestore.

## Dlaczego ten slice (M2L4)

- **Status roadmap:** `ready` — brak dedykowanego planu (w przeciwieństwie do `provider-accept-booking`).
- **Nieoczywisty wybór architektury:** Cloud Scheduler vs lazy expiry vs Firestore TTL vs Cloud Tasks — każda opcja ma inne trade-offy czasu, kosztu i spójności.
- **Kod częściowy:** scheduler `expireRequests` i `resolveRequestStatus` istnieją, ale brakuje indeksu composite, spójności batch vs transaction oraz pełnej weryfikacji UX timera.
- **Blokuje demo:** MVP checklist §8 wymaga „Request wygasa po upływie czasu (TIMEOUT)”.

## Baseline (2026-07-12)

| Warstwa | Stan | Dowód |
|---------|------|-------|
| API create/read | present | `functions/src/routes/requests.ts` — `expiresAt` przy tworzeniu |
| Scheduler | present | `functions/src/index.ts` — `expireRequests` co 1 min |
| Lazy expiry | present | `resolveRequestStatus` na GET `/requests/:id`, `/requests/my`, provider list |
| UI timer | partial | `RequestWaitingComponent` — countdown z `expiresAt`, poll co 3s |
| Indeks Firestore | **gap** | Brak `status + expiresAt` w `firestore.indexes.json` |
| Respond guard | present | `providers.ts` — transakcja odrzuca wygasłe z `TIMEOUT` |

## Out of scope (this change)

- S-06 provider-accept-booking (osobny change; tylko zależność kontraktu TIMEOUT)
- S-08 rating aggregation
- Cloud Tasks per-request (rozważone w external-research; odrzucone na MVP)
- Push notifications przy TIMEOUT

## Acceptance (from roadmap Outcome)

- Klient wysyła request 10–500 znaków do online providera
- Ekran oczekiwania pokazuje timer i końcowy status TIMEOUT
- Lista „Moje prośby” odzwierciedla TIMEOUT (nie wiszące PENDING)
- Scenariusz negatywny MVP.md §7: brak odpowiedzi → TIMEOUT, brak bookingu
