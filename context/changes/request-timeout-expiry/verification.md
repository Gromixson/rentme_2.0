# Verification — request-timeout-expiry (M3L2 tests)

Change ID: `request-timeout-expiry`  
Risk: **R-04** — request wygasa, UI/API nie wisi na PENDING  
Oracle: PRD FR-011, MVP §3.5/§7, guardrail „TIMEOUT nie tworzy bookingu”

## Automated

```bash
npm run functions:test   # 9 tests — requests.test.ts
npm test                 # 8 tests — Angular guards (baseline)
npm run build
npm run functions:build
```

### Results (2026-07-12)

| Command                   | Result         |
| ------------------------- | -------------- |
| `npm run functions:test`  | **PASS** — 9/9 |
| `npm test`                | **PASS** — 8/8 |
| `npm run build`           | **PASS**       |
| `npm run functions:build` | **PASS**       |

## Test coverage map (regression)

| Plik                                      | Co łapie                                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `functions/src/services/requests.test.ts` | Overdue PENDING → TIMEOUT; future PENDING bez mutacji; terminal status bez re-expiry; okno 120s; lazy read-path |
| `src/app/core/auth/role.guard.spec.ts`    | (baseline S-01) R-07 — osobny change                                                                            |

## Manual mutation check (must fail tests)

1. W `functions/src/services/requests.ts` zmień `isPendingPastExpiry` na `return false`.
2. Uruchom `npm run functions:test`.
3. **Oczekiwane:** fail testów „returns true when PENDING and expiresAt is in the past” oraz „returns TIMEOUT after persisting…”.
4. Cofnij zmianę — wszystkie testy zielone.

Alternatywnie: w teście `requestExpiresAt` tymczasowo oczekuj `REQUEST_TIMEOUT_MS + 1` — fail potwierdza, że test nie jest tautologią.

## Sign-off

- [x] Vitest harness w `functions/`
- [x] Oracle z PRD/MVP, nie z mirrorowania implementacji
- [x] ≥1 edge case (terminal status, future PENDING)
- [ ] Phase 1–4 implementacji S-05 (indeks, scheduler) — poza zakresem M3L2
