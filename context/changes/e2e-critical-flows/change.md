---
change_id: e2e-critical-flows
status: in_progress
module: M3L4
lesson: E2E Playwright + /10x-e2e
created: 2026-07-12
risks: [R-07, R-01, R-03, R-08]
---

# e2e-critical-flows

Playwright E2E dla krytycznych ryzyk multi-boundary (auth, routing, API, UI) — lekcja M3L4.

## Zakres

- Setup: `playwright.config.ts`, `e2e/auth.setup.ts`, storageState
- Seed: `e2e/seed.spec.ts` (R-08)
- Generated: `e2e/role-guard.spec.ts` (R-07), `e2e/accept-booking.spec.ts` (R-01/R-03)
- Docs: `e2e/README.md`, bramki w `test-plan.md` §7

## Poza zakresem

- R-04 timeout 2 min (wolny; unit Vitest w `requests.test.ts`)
- CI job z sekretami (stub + komentarz)
