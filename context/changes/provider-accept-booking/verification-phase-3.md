# Phase 3 — Manual verification (provider-accept-booking)

Change ID: `provider-accept-booking`  
Roadmap: S-06  
Date documented: 2026-07-25

Phases 1–2 are **done** in code (API error mapping + navigate to `/bookings` after accept).  
Phase 3 is **manual only** — agent cannot complete without two Firebase Auth accounts in `rentme2-76ba8`.

## MVP.md §7 happy path (kroki 3–5)

Prerequisites: seeker + provider (profile complete, online, category + rate > 0).

1. [ ] Seeker wysyła request do online providera
2. [ ] Provider na `/provider/requests` klika **Akceptuj**
3. [ ] Request → `ACCEPTED`; powstaje **jeden** booking `CONFIRMED`
4. [ ] Provider trafia na `/bookings` (auto-nav); seeker widzi booking po poll / na `/bookings`
5. [ ] Decline path: osobny request → **Odrzuć** → `DECLINED`, **brak** bookingu
6. [ ] Timeout path (powiązane S-05): brak odpowiedzi ≥2 min → `TIMEOUT`, **brak** bookingu

## Automated coverage (not Phase 3)

- Vitest respond harness: `functions/src/routes/providers.respond.test.ts` (accept / decline / TIMEOUT / …)
- E2E `accept-booking.spec.ts`: **SKIP** until `E2E_SEEKER_*` / `E2E_PROVIDER_*`

## Roadmap handoff

- S-06 remains **`in-progress`** until checklist above is green (or E2E R-01/R-03 passes).
- Do **not** mark S-06 `done` on docs-only sign-off.
