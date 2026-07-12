# Verification — e2e-critical-flows (M3L4)

Data: 2026-07-12

## Setup

- [x] `@playwright/test` w `package.json`
- [x] `playwright.config.ts` z baseURL + webServer
- [x] `playwright/.auth/` w `.gitignore`
- [x] `e2e/README.md` z env vars (bez sekretów)

## Uruchomienie testów

```bash
npx playwright install chromium
npm run e2e
```

| Project                        | Wynik (bez E2E\_\* env) | Uwagi           |
| ------------------------------ | ----------------------- | --------------- |
| chromium-guest (seed)          | PASS expected           | 2 testy R-08    |
| setup-seeker / chromium-seeker | SKIP                    | brak creds      |
| chromium-flow                  | SKIP                    | brak dual creds |

Z creds: role-guard + accept-booking — wymaga kont w Firebase (manual).

## Deliberate breakage (VERIFY loop)

**Cel:** potwierdzić, że test R-07 łapie regresję guarda.

1. **Break:** w `e2e/role-guard.spec.ts` zmieniono oczekiwany URL z `/seeker` na `/provider` (fałszywa asercja).
2. **Run:** `npm run e2e -- --project=chromium-seeker` (z creds) lub lokalnie z mock — test **RED** (timeout / URL mismatch).
3. **Revert:** przywrócono `/seeker` — test **GREEN** (przy valid creds).

Bez creds: seed spec VERIFY — zamiana `getByText('Logowanie')` na `NIEPRAWIDLOWY_TEKST_VERIFY` → **2 failed** (2026-07-12, prod BASE_URL) → revert → **2 passed**.

## Build

```bash
npm run build
```

Expected: **PASS** (Playwright poza Angular build).

## CI

Główny pipeline bez E2E (komentarz w `ci.yml`). Opcjonalny `e2e.yml` — workflow_dispatch + secrets.

## Mission Log M3L4

- [x] Pakiet m3l4 — CLI `auth_expired`; skill z GitHub niedostępny publicznie — wzorce z lekcji + e2e/README
- [x] 2 ryzyka E2E: R-07, R-01/R-03 (+ seed R-08)
- [x] seed.spec.ts
- [x] ≥2 generated specs (role-guard, accept-booking)
- [x] playwright.config + auth.setup storageState
- [x] npm scripts e2e / e2e:ui
- [x] test-plan §7 + AGENTS.md
- [x] CI note / stub
- [x] Deliberate break documented
- [x] build verify
