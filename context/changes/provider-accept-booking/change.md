---
change_id: provider-accept-booking
title: Provider akceptuje prośbę — powstaje booking (S-06)
status: impl_reviewed
created: 2026-07-12
updated: 2026-07-12
roadmap_ref: S-06
prd_refs: US-02, FR-008, FR-012
---

## Intent

Zweryfikować i utwardzić pionowy slice **north star**: provider odpowiada TAK/NIE na pending request; po akceptacji powstaje booking `CONFIRMED` widoczny u obu stron; DECLINED/TIMEOUT nie tworzą bookingu.

## Baseline (2026-07-12)

Kod slice'a **largely exists**:

- API: `POST /api/providers/requests/:id/respond` — transakcja accept/decline + tworzenie bookingu + offline providera (`functions/src/routes/providers.ts`)
- UI provider: `ProviderRequestsComponent` — lista pending + Akceptuj/Odrzuć
- UI seeker: `RequestWaitingComponent` — polling + link do `/bookings` po ACCEPTED
- Bookings: `GET /api/bookings/my`, lista w `BookingsListComponent`

## Gaps identified for this change

1. **API:** błędy transakcji (`NOT_FOUND`, `FORBIDDEN`, `TIMEOUT`, `NOT_PENDING`) nie są mapowane na HTTP — ryzyko cichych 500 zamiast `{ error: string }`.
2. **UX provider:** po akceptacji brak nawigacji do rezerwacji (seeker już ma link).
3. **Weryfikacja:** brak testów jednostowych dla respond; manual happy path wymaga dwóch kont.

## Out of scope (this change)

- S-07 complete-booking, S-08 rate-after-complete (osobne change-id)
- F-01 prod-observability-gate
- Rewrite całego flow request→booking

## Acceptance (from roadmap Outcome)

- Provider może zaakceptować lub odrzucić pending request w oknie ~2 min
- Po akceptacji obie strony widzą booking ze statusem CONFIRMED
- DECLINED/TIMEOUT nie tworzą bookingu
