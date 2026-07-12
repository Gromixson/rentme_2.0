# E2E review — anti-patterns (5 checks)

Change: `e2e-critical-flows`  
Data: 2026-07-12

| #   | Anti-pattern                       | Wynik    | Uwagi                                                                                             |
| --- | ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| 1   | Hard-coded `waitForTimeout`        | **PASS** | Wyłącznie `expect`, `waitForURL`, `toBeVisible`                                                   |
| 2   | Selektory `nth-child` / kruche CSS | **PASS** | `getByRole`, `getByText`, `locator('input[type=email]')` tylko gdzie brak aria (PrimeNG password) |
| 3   | Naiwne asercje                     | **PASS** | R-07: URL + heading + negacja provider UI; flow: CONFIRMED tag                                    |
| 4   | Współdzielony stan między testami  | **PASS** | `Date.now()` w message; `afterEach` zamyka provider context                                       |
| 5   | Obejście konwencji projektu        | **PASS** | Auth przez UI Firebase, nie deprecated API login                                                  |

## Rekomendacje (P2)

- Dodać `aria-label` na polach logowania — ułatwi `getByLabel`
- R-04: osobny spec z mockiem API / skróconym expiry (poza M3L4)
