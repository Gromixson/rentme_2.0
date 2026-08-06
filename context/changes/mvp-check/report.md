# Raport mvp-check — RentMe 2.0

**Data:** 2026-07-26 (re-check triage: nadal 5/5; CLI `auth_expired`; firestore-model + E2E smoke docs odświeżone)  
**Zakres:** repo `D:/programowanie/rentme_2.0` (Angular 21 + Firebase Functions / Firestore)  
**Prompt:** [`.cursor/prompts/mvp-check.md`](../../.cursor/prompts/mvp-check.md)  
**Uwaga o źródle promptu:** oficjalny `get m0l0` **nadal** niedostępny (`auth_expired` przy re-check). Prompt = rekonstrukcja z ogłoszenia. Po udanym `10x auth` → `sync` + `get m0l0` nadpisz oficjalnym i porównaj kryteria.

**mvp-check nie ocenia:** UI/stylowania ani deployu (świadomie poza zakresem).

---

## Checklist (fundamenty 10xBuilder)

| #   | Kryterium                    | Status | Dowód (skrót)                      |
| --- | ---------------------------- | ------ | ---------------------------------- |
| 1   | CRUD (C+R+U+D)               | ✅     | C/R/U + soft-delete cancel PENDING |
| 2   | Logika biznesowa (poza CRUD) | ✅     | Transakcja accept/decline + expiry |
| 3   | Testy ↔ ryzyko z test-plan   | ✅     | R-04, R-01/R-02/R-06 (+ R-07)      |
| 4   | Auth + zasoby user-scoped    | ✅     | Firebase Auth JWT + filtry `uid`   |
| 5   | Docs (README + foundation)   | ✅     | README, PRD, roadmap, test-plan    |

**Wynik strukturalny:** **5/5** (100%).

---

### 1. CRUD — ✅

| Litera       | Status | Dowód                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C** Create | ✅     | `POST /api/requests/` — [`functions/src/routes/requests.ts`](../../functions/src/routes/requests.ts); `POST /api/auth/register`; `POST /api/categories/:id/interests`; booking przy accept w `executeRespondTx`                                                                                                                                                                                                                                                      |
| **R** Read   | ✅     | `GET /api/requests/my`, `GET /api/requests/:id`; `GET /api/bookings/my`; `GET /api/providers/requests`; `GET /api/categories`                                                                                                                                                                                                                                                                                                                                        |
| **U** Update | ✅     | `PUT /api/users/profile`, `PUT /api/providers/status`, `PUT /api/providers/categories`; `POST .../respond`; `POST /api/bookings/:id/complete`, `.../rate`                                                                                                                                                                                                                                                                                                            |
| **D** Delete | ✅     | Soft-delete: `POST /api/requests/:id/cancel` → status `CANCELLED` (tylko owner `seekerId`, tylko `PENDING`); tx w [`functions/src/services/cancel.ts`](../../functions/src/services/cancel.ts); klient [`ApiService.cancelRequest`](../../src/app/core/api/api.service.ts); UI Anuluj na [`my-requests`](../../src/app/features/seeker/my-requests/my-requests.component.ts); Vitest [`requests.cancel.test.ts`](../../functions/src/routes/requests.cancel.test.ts) |

**Uwaga:** brak hard Firestore `delete()` — domena append-only / status machine; cancel spełnia literę D jako usunięcie logiczne (zgodnie z opcją A w P0).

---

### 2. Logika biznesowa — ✅

Nie samo CRUD — reguły i workflow:

| Funkcja / flow                                                          | Plik                                                                             | Co robi                                                                                                                                  |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `executeRespondTx`                                                      | [`functions/src/services/respond.ts`](../../functions/src/services/respond.ts)   | Tylko właściwy `providerId`; accept → booking `CONFIRMED` + provider offline; decline → `DECLINED` bez bookingu; past expiry → `TIMEOUT` |
| `isPendingPastExpiry` / `expirePendingRequest` / `resolveRequestStatus` | [`functions/src/services/requests.ts`](../../functions/src/services/requests.ts) | Okno ~2 min PENDING→TIMEOUT (scheduler + lazy read-path)                                                                                 |
| `executeCancelTx`                                                       | [`functions/src/services/cancel.ts`](../../functions/src/services/cancel.ts)     | Tylko `seekerId`; PENDING → `CANCELLED`; reject FORBIDDEN / NOT_PENDING; past expiry → `TIMEOUT`                                         |
| Rating gate                                                             | [`functions/src/routes/bookings.ts`](../../functions/src/routes/bookings.ts)     | Ocena tylko seeker, tylko `COMPLETED`, bez duplikatu                                                                                     |

---

### 3. Testy ↔ test-plan — ✅

`context/foundation/test-plan.md` definiuje ryzyka R-01…R-12. Przykłady zestawów powiązanych z ryzykiem:

| Ryzyko (test-plan)                                                                     | Zestaw testów                                           | Plik                                                                                                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **R-04** (TIMEOUT / expiry)                                                            | `request timeout (R-04 / FR-011)` — 9 przypadków Vitest | [`functions/src/services/requests.test.ts`](../../functions/src/services/requests.test.ts)               |
| **R-01 / R-02 / R-06** (wyścig accept, IDOR respond, brak bookingu po decline/timeout) | `POST .../respond — characterization`                   | [`functions/src/routes/providers.respond.test.ts`](../../functions/src/routes/providers.respond.test.ts) |
| **R-07** (role guard)                                                                  | `roleGuard`                                             | [`src/app/core/auth/role.guard.spec.ts`](../../src/app/core/auth/role.guard.spec.ts)                     |
| Cancel (CRUD D)                                                                        | happy path + FORBIDDEN + NOT_PENDING (+ TIMEOUT)        | [`functions/src/routes/requests.cancel.test.ts`](../../functions/src/routes/requests.cancel.test.ts)     |

Wymagane minimum („co najmniej jeden zestaw pod konkretne ryzyko”) jest spełnione wielokrotnie.  
_(E2E Playwright z dual creds nadal częściowo SKIP — to poza kryterium mvp-check, ale warto domknąć przed Demo Day.)_

---

### 4. Autentykacja + zasoby użytkownika — ✅

| Warstwa           | Dowód                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Login klienta     | Firebase Auth (`signInWithEmailAndPassword`) — nie `POST /api/auth/login` (410)                                                                                          |
| API               | `requireAuth` weryfikuje Bearer ID token → `req.uid` — [`functions/src/middleware/auth.ts`](../../functions/src/middleware/auth.ts)                                      |
| User-scoped reads | `GET /requests/my` → `where('seekerId','==',req.uid)`; `GET /bookings/my` → seekerId **lub** providerId = uid; `GET /requests/:id` → 403 jeśli uid ≠ seeker i ≠ provider |
| Respond ownership | `executeRespondTx`: `data.providerId !== providerId` → `FORBIDDEN`                                                                                                       |
| Cancel ownership  | `executeCancelTx`: `data.seekerId !== seekerId` → `FORBIDDEN`                                                                                                            |
| Role UI           | `roleGuard('SEEKER'                                                                                                                                                      | 'PROVIDER')` w routingu Angular |

---

### 5. Dokumentacja / `context/foundation` — ✅

| Artefakt                                                        | Stan                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| [`README.md`](../../README.md)                                  | ✅ Opis produktu, stack, Firebase, run/deploy        |
| [`context/foundation/prd.md`](../foundation/prd.md)             | ✅ ~8.6 KB — wizja, FR, personas (align z `MVP.md`)  |
| [`context/foundation/roadmap.md`](../foundation/roadmap.md)     | ✅ ~16 KB — slice'y S-01…                            |
| [`context/foundation/test-plan.md`](../foundation/test-plan.md) | ✅ ~28 KB — ryzyka R-01…R-12, oracles, quality gates |

---

## Priorytetowe poprawki

### P0 — CRUD Delete — ✅ zamknięte (2026-07-26)

`POST /api/requests/:id/cancel` (soft-delete → `CANCELLED`) + Vitest + UI na moich prośbach.

### P1 (nie blokuje mvp-check, ale cert / Mission Log)

1. **10x CLI auth + `get m0l0` / `sync`** — sesja `auth_expired` (re-check 2026-07-26).
2. **Git remote** — `git remote -v` puste; potrzebny **Twój** URL (`git remote add origin <url>`).
3. **E2E creds** — pełny R-01/R-03; bez creds: smoke `e2e/seed.spec.ts` (R-08) — patrz `e2e/README.md`.
4. **Deploy soft-cancel** — lokalny kod cancel ✅; prod Hosting/Functions dopiero po Twoim commit + deploy (triage **nie** deployował).

---

## Podsumowanie pod formularz zgłoszeniowy (do skopiowania)

RentMe 2.0 (Angular 21 + Firebase Auth/Functions/Firestore) spełnia fundamenty 10xBuilder: CRUD z soft-delete cancel PENDING requestu (`POST /api/requests/:id/cancel` → `CANCELLED`), logika biznesowa (transakcyjny accept/decline + timeout), testy powiązane z ryzykami z `test-plan.md` (m.in. R-04, R-01/R-02/R-06) oraz cancel Vitest, autentykacja JWT z zasobami scoped do `uid`, dokumentacja w `README` + `context/foundation`. Wynik checklisty: **5/5**.

---

## Terminy certyfikacji 10xBuilder (z ogłoszenia)

| Termin               | Uwaga                              |
| -------------------- | ---------------------------------- |
| 5 lipca 2026         | wyróżnienia / Demo Day — **minął** |
| **10 sierpnia 2026** | kolejny deadline zgłoszeń (23:59)  |
| 14 września 2026     | ostateczny                         |

CRUD (w tym Delete / cancel) jest domknięty przed deadline **10.08**.
