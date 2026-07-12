# Plan — e2e-critical-flows (M3L4)

## Faza 1 — Setup Playwright ✅

- `@playwright/test` devDependency
- `playwright.config.ts`: baseURL, webServer, projects (guest / seeker / flow)
- `playwright/.auth/` gitignored
- `e2e/auth.setup.ts` — storageState z env vars

## Faza 2 — seed.spec.ts ✅

Wzorce: getByRole, expect URL/visibility, Date.now() id, brak waitForTimeout.

## Faza 3 — Generated tests ✅

### R-07 role-guard.spec.ts

- Seeker storageState → `/provider/requests` → redirect `/seeker`
- Asercje: heading „Kategorie usług”, brak „Oczekujące prośby”, brak linku „Prośby”

### R-01/R-03 accept-booking.spec.ts

- Dual browser context (seeker page + provider context)
- Unique message, provider online, seed categories, accept, CONFIRMED u obu, cleanup COMPLETED

## Faza 4 — Docs & gates ✅

- `e2e/README.md`
- `test-plan.md` §7 E2E row
- `AGENTS.md` skrypty e2e
- CI komentarz + opcjonalny workflow stub

## Anti-patterns (review)

| #   | Anti-pattern             | Status                                        |
| --- | ------------------------ | --------------------------------------------- |
| 1   | `waitForTimeout`         | ✅ brak                                       |
| 2   | CSS nth-child            | ✅ brak                                       |
| 3   | Naiwne asercje (sam URL) | ✅ URL + heading/tag                          |
| 4   | Shared mutable state     | ✅ unikalny message + afterEach close context |
| 5   | POST /api/auth/login     | ✅ loginViaUi (Firebase client)               |

## VERIFY — deliberate breakage

Zobacz `verification.md`.
