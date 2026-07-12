# Artifact 1 — Teren (git wide scan)

> **Zakres:** cała historia repo (7 commitów, 2026-07-12) — okno „12 miesięcy” obejmuje 100% historii.  
> **Filtr:** wykluczone `package-lock.json`, `functions/package-lock.json`, `dist/`, `.firebase/`, `node_modules/`, `.angular/`.  
> **Polecenia:** `git log --name-only --pretty=format:`, `git rev-list --count HEAD`, analiza co-change w PowerShell.

---

## Podsumowanie wieku repo

| Metryka               | Wartość                   | Dowód                                               |
| --------------------- | ------------------------- | --------------------------------------------------- |
| Commity łącznie       | 7                         | `git rev-list --count HEAD` → 7 (przed M4L2 commit) |
| Pierwszy commit       | 2026-07-12 22:34:52 +0200 | `git log --reverse --format="%ai"`                  |
| Ostatni commit (scan) | 2026-07-12 22:50:40 +0200 | `git log -1 --format="%ai"`                         |
| Okres aktywności      | **1 dzień**               | brak commitów sprzed 2026-07-12                     |

**Ograniczenie:** breakdown kwartalny niemożliwy — cała historia mieści się w **2026-Q3, dzień 1**. Poniższa tabela kwartalna dokumentuje to uczciwie.

---

## Breakdown kwartalny (zmiany plików, po filtrze)

| Kwartał | Commity | Uwagi                                                                |
| ------- | ------- | -------------------------------------------------------------------- |
| 2026-Q3 | 7       | Jedyny kwartał z historią; brak Q1/Q2/Q4 2025 ani wcześniejszych lat |

---

## TOP katalogi (poziom 1) — liczba dotknięć pliku w commitach

| #   | Katalog       | Dotknięcia | Typ                                                |
| --- | ------------- | ---------- | -------------------------------------------------- |
| 1   | `context/`    | 72         | dokumentacja kursu + change plany                  |
| 2   | `src/`        | 39         | Angular SPA                                        |
| 3   | `.cursor/`    | 38         | reguły agenta, hooki, skille                       |
| 4   | `(root-file)` | 27         | `AGENTS.md`, `package.json`, `firebase.json`, itd. |
| 5   | `functions/`  | 26         | Cloud Functions API                                |
| 6   | `scripts/`    | 9          | setup Firebase, hooki                              |
| 7   | `e2e/`        | 7          | Playwright (M3L4)                                  |
| 8   | `.github/`    | 4          | CI workflow                                        |
| 9   | `.vscode/`    | 4          | ustawienia IDE                                     |
| 10  | `public/`     | 1          | statyczne assety                                   |
| 11  | `docs/`       | 1          | hooks equivalent                                   |

**Wniosek:** rdzeń produktu (`src/` + `functions/`) = **65 dotknięć** vs **72** w `context/` — repo jest równie „gorące” w warstwie dokumentacji/planowania co w kodzie aplikacji (typowe dla kursu 10xDevs + równoległe slice'y M2L5).

---

## TOP pliki (≥2 commity)

| Plik                                                                | Commity | Strefa                      |
| ------------------------------------------------------------------- | ------- | --------------------------- |
| `AGENTS.md`                                                         | 4       | onboarding agenta           |
| `package.json`                                                      | 3       | root deps                   |
| `.github/workflows/ci.yml`                                          | 3       | CI                          |
| `functions/src/services/requests.ts`                                | 3       | **timeout / expiry (R-04)** |
| `context/changes/provider-accept-booking/plan.md`                   | 3       | slice accept                |
| `context/changes/request-timeout-expiry/plan.md`                    | 3       | slice timeout               |
| `context/foundation/SOURCES.md`                                     | 3       | foundation                  |
| `context/foundation/README.md`                                      | 3       | foundation                  |
| `functions/src/routes/auth.ts`                                      | 2       | auth API                    |
| `functions/src/routes/bookings.ts`                                  | 2       | bookings API                |
| `functions/src/services/provider.ts`                                | 2       | provider service            |
| `firestore.indexes.json`                                            | 2       | **indeks status+expiresAt** |
| `src/app/core/auth/role.guard.ts`                                   | 2       | role guard (R-07)           |
| `src/app/features/provider/requests/provider-requests.component.ts` | 2       | provider UX accept          |

Pełna lista TOP 40: `git log --name-only --pretty=format: | Group-Object | Sort Count -Desc | Select -First 40`.

---

## Hot spoty w `src/app/features/` (dotknięcia)

| Feature     | Dotknięcia |
| ----------- | ---------- |
| `seeker/`   | 5          |
| `provider/` | 4          |
| `auth/`     | 2          |
| `bookings/` | 1          |
| `home/`     | 1          |

## Hot spoty w `functions/src/`

| Podkatalog                           | Dotknięcia |
| ------------------------------------ | ---------- |
| `routes/`                            | 9          |
| `services/`                          | 6          |
| root (`index.ts`, `app.ts`, `db.ts`) | 5          |
| `middleware/`                        | 1          |

## Hot spoty w `src/app/core/`

| Podkatalog  | Dotknięcia |
| ----------- | ---------- |
| `auth/`     | 8          |
| `firebase/` | 3          |
| `models/`   | 1          |
| `api/`      | 1          |

---

## Co-change pairs — katalogi zmieniane w tym samym commicie

### Ogólne (poziom repo)

| Para                                   | Wspólne commity | Interpretacja                                       |
| -------------------------------------- | --------------- | --------------------------------------------------- |
| `(root) + context/changes`             | 8               | merge slice'ów + pliki root                         |
| `(root) + context/foundation`          | 8               | foundation aktualizowane przy każdym większym kroku |
| `context/changes + context/foundation` | 7               | plan ↔ roadmap/test-plan                            |
| `(root) + .github/workflows`           | 7               | CI razem z kodem                                    |
| `.cursor + context/changes`            | 5               | reguły agenta ↔ implementacja                       |

### Hot spoty aplikacji (src + functions + firebase)

| Para                                            | Wspólne commity | Interpretacja                                                          |
| ----------------------------------------------- | --------------- | ---------------------------------------------------------------------- |
| `functions/src/routes + functions/src/services` | 3               | **silne sprzężenie API** — routes wołają services w tym samym commicie |
| `firebase-config + functions/src/services`      | 2               | indeks Firestore ↔ logika expiry                                       |
| `functions/src/routes + src/app/core/auth`      | 1               | auth API ↔ guard (role switch)                                         |
| `functions/src/services + src/app/core/auth`    | 1               | cross-stack auth                                                       |

**Wniosek:** zmiany domenowe (request/booking) idą parami **routes ↔ services** po stronie Functions; frontend `features/*` rzadziej co-commit z backendem (osobne slice'y w worktree M2L5).

---

## Firebase config — aktywność

| Plik                     | Commity |
| ------------------------ | ------- |
| `firestore.indexes.json` | 2       |
| `firestore.rules`        | 1       |
| `firebase.json`          | 1       |
| `.firebaserc`            | 1       |

---

## Usunięte / przeniesione pliki

```bash
git log --diff-filter=D --summary --since="2025-07-12"
```

**Wynik:** brak usunięć w historii. Repo młode — nie wykryto rename/delete do weryfikacji.

---

## Mapa terenu: rdzeń vs peryferia

| Strefa                       | Ścieżki                                                                                | Ocena                       |
| ---------------------------- | -------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| **Rdzeń domenowy**           | `functions/src/routes/`, `functions/src/services/`, `src/app/features/seeker           | provider                    | bookings`, `src/app/core/api/`, `src/app/core/auth/` | najwyższa częstotliwość zmian biznesowych |
| **Rdzeń infra**              | `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `functions/src/index.ts` | deploy + scheduler          |
| **Peryferia runtime**        | `public/`, `scripts/setup-*`, `.vscode/`                                               | rzadkie dotknięcia          |
| **Peryferia produktu (MVP)** | `e2e/`                                                                                 | nowe (M3L4), rośnie         |
| **Meta / kurs**              | `context/`, `.cursor/`                                                                 | bardzo aktywne, nie runtime |

---

## Oczekiwane vs rzeczywiste hot spoty (RentMe)

| Oczekiwane          | Potwierdzone? | Dowód                                      |
| ------------------- | ------------- | ------------------------------------------ |
| `functions/src/`    | ✅            | 26 dotknięć poziom 1; routes=9, services=6 |
| `src/app/features/` | ✅            | seeker=5, provider=4                       |
| `src/app/core/`     | ✅            | auth=8 (najgorętszy podkatalog core)       |
| `context/`          | ✅            | 72 — więcej niż sam `src/`                 |
| firebase config     | ✅ częściowo  | indexes=2 commity (timeout slice)          |
