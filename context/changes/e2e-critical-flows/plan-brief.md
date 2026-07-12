# Plan brief — e2e-critical-flows

## Wybrane ryzyka E2E (multi-boundary)

| ID            | Dlaczego E2E                                                       | Granice                                    |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| **R-07**      | roleGuard + `activeRole` — unit nie łapie pełnego routingu Angular | Auth state → router → UI nagłówka          |
| **R-01/R-03** | North star S-06 — transakcja + widoczność bookingu u obu stron     | Firebase Auth × 2, API, UI seeker/provider |

Seed (R-08): authGuard dla gościa — bez kont testowych.

## Artefakty

| Plik                         | Ryzyko     |
| ---------------------------- | ---------- |
| `e2e/seed.spec.ts`           | R-08       |
| `e2e/role-guard.spec.ts`     | R-07       |
| `e2e/accept-booking.spec.ts` | R-01, R-03 |

## Weryfikacja

1. `npx playwright install chromium`
2. `npm run e2e` — seed zawsze; auth testy skip bez env
3. Deliberate break → red → revert (verification.md)
4. `npm run build` — green
