# RentMe E2E (Playwright)

Testy end-to-end dla krytycznych flow MVP — Angular 21 + Firebase Auth (client) + Cloud Functions API.

**Projekt Firebase:** `rentme2-76ba8`  
**Prod Hosting:** https://rentme2-76ba8.web.app

## Wymagania

- Node 20+
- `npm ci` w katalogu głównym
- `npx playwright install chromium` (jednorazowo)
- Lokalnie: `environment.ts` skopiowany z `environment.example.ts` (gitignored)
- Domyślnie testy uruchamiają `ng serve` na `http://localhost:4200` (webServer w `playwright.config.ts`)

## Smoke bez credentials (zawsze działa)

Bez `E2E_SEEKER_*` / `E2E_PROVIDER_*` uruchamia się tylko gość:

```powershell
# Lokalnie (auto-start ng serve)
npm run e2e -- e2e/seed.spec.ts

# Prod Hosting (bez lokalnego serve)
$env:BASE_URL="https://rentme2-76ba8.web.app"
npm run e2e -- e2e/seed.spec.ts
```

`seed.spec.ts` = ryzyko **R-08** (authGuard → redirect na login).  
Pozostałe projekty Playwright (**role-guard**, **accept-booking**) są **SKIP** bez dual creds — to oczekiwane, nie invent secrets.

## Konta testowe (nigdy nie commituj haseł)

1. Skopiuj `e2e/.env.example` → `e2e/.env` (gitignored).
2. Utwórz **dwa osobne konta** Firebase Auth (email/hasło) w **`rentme2-76ba8`**.
3. Provider: profil z kategorią + stawką > 0 (może być online przed accept-booking).

| Zmienna                                        | Rola                  | Wymagania profilu              |
| ---------------------------------------------- | --------------------- | ------------------------------ |
| `E2E_SEEKER_EMAIL` / `E2E_SEEKER_PASSWORD`     | SEEKER (`activeRole`) | —                              |
| `E2E_PROVIDER_EMAIL` / `E2E_PROVIDER_PASSWORD` | PROVIDER              | Profil: kategoria + stawka > 0 |

PowerShell (sesja, zamiast `.env`):

```powershell
$env:E2E_SEEKER_EMAIL="seeker-test@example.com"
$env:E2E_SEEKER_PASSWORD="..."
$env:E2E_PROVIDER_EMAIL="provider-test@example.com"
$env:E2E_PROVIDER_PASSWORD="..."
```

Bez tych zmiennych:

- `e2e/seed.spec.ts` — **zawsze** (gość, bez auth)
- `e2e/role-guard.spec.ts` — **skip** setup + testy seeker
- `e2e/accept-booking.spec.ts` — **skip** cały describe

## Prod smoke (pełny suite — wymaga creds)

```powershell
$env:BASE_URL="https://rentme2-76ba8.web.app"
# + E2E_* jak wyżej
npm run e2e
```

`BASE_URL` wyłącza auto-start `ng serve`.

## Komendy

```bash
npm run e2e          # playwright test
npm run e2e:ui       # playwright test --ui
npm run e2e:report   # playwright show-report
```

## Auth setup (storageState)

Plik `e2e/auth.setup.ts` loguje się przez UI (`signInWithEmailAndPassword`) i zapisuje sesję do:

- `playwright/.auth/seeker.json`
- `playwright/.auth/provider.json`

Katalog `playwright/.auth/` jest w `.gitignore` — **nie commituj** plików sesji.

## Mapowanie ryzyk (test-plan.md)

| Plik                     | Ryzyko     | Opis                                               |
| ------------------------ | ---------- | -------------------------------------------------- |
| `seed.spec.ts`           | R-08       | authGuard → redirect na login                      |
| `role-guard.spec.ts`     | R-07       | SEEKER nie wchodzi na `/provider/*`                |
| `accept-booking.spec.ts` | R-01, R-03 | North star: request → accept → booking u obu stron |

## Anti-patterns (unikaj)

1. `waitForTimeout` — używaj `expect` / `waitForURL` / `toBeVisible`
2. Selektory CSS `nth-child` — preferuj `getByRole`, `getByLabel`, `getByText`
3. Naiwne asercje (tylko URL bez treści UI)
4. Współdzielony stan mutacji między testami — unikalny `Date.now()` + cleanup w afterEach
5. Logowanie przez `POST /api/auth/login` — endpoint zwraca 410; tylko Firebase SDK w UI

## CI

Pełny E2E nie jest w głównym pipeline (wolny + wymaga sekretów). Zobacz `.github/workflows/ci.yml` — komentarz + opcjonalny workflow stub.
