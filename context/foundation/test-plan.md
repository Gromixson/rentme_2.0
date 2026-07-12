---
project: RentMe
version: 1
status: draft
created: 2026-07-12
updated: 2026-07-12
module_hooks: M3L3
prd_version: 2
roadmap_version: 1
module: M3L2
lesson: /10x-test-plan + M3L2 implement
context_type: greenfield
stack: angular-21-firebase-functions
---

# RentMe — Plan testów (quality gates & risk map)

> **Cel:** Mapa ryzyk użytkownika, bramki jakości i fazy rollout testów dla MVP marketplace (SEEKER ↔ PROVIDER).  
> **Implementacja testów:** M3L2 — pierwszy rollout `request-timeout-expiry` (R-04); dalsze przez cykl `/10x-new` → research → plan → implement.  
> **Kanoniczne źródła:** [`prd.md`](prd.md), [`roadmap.md`](roadmap.md), [`MVP.md`](../../MVP.md) §7, [`AGENTS.md`](../../AGENTS.md).

---

## 0. Wywiad (delegowany — 2026-07-12)

| Pole                  | Wartość                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **top_fears**         | Wyścig accept/timeout → zły stan requestu/bookingu; seeker widzi cudzą rezerwację; obejście role guard; request wygasa, UI wisi na PENDING              |
| **past_pain**         | Integracja Firebase/Functions (CORS, cold start); `auth_expired` w 10x-cli; brakujący indeks Firestore przy query                                       |
| **budget_exclusions** | Pełny suite E2E Playwright (moduł 3 później); snapshoty stron marketingowych; unit testy komponentów PrimeNG; ścieżki tylko-emulator chyba że konieczne |
| **security focus**    | IDOR na bookings/requests; PROVIDER odpowiada na cudze requesty; wywołania API bez JWT / z fałszywym tokenem                                            |

---

## 1. Źródła (Sources)

Klasyfikacja materiałów użytych do mapy ryzyk i bramek.

| Źródło                                              | Typ                     | Rola w planie testów                                                                                     |
| --------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| [`context/foundation/prd.md`](prd.md)               | **Product contract**    | US-01…03, FR-001…015, NFR (timeout, JWT, błędy widoczne), guardrails (brak bookingu po DECLINED/TIMEOUT) |
| [`context/foundation/roadmap.md`](roadmap.md)       | **Build order**         | S-01…S-09, north star **S-06**; priorytety rollout testów zgodne ze slice'ami                            |
| [`context/foundation/tech-stack.md`](tech-stack.md) | **Stack hand-off**      | Angular 21 + Karma/Jasmine; Firebase Auth; Cloud Functions Express; brak `@angular/fire` w kliencie      |
| [`MVP.md`](../../MVP.md)                            | **Implementation spec** | Happy path §7, scenariusz negatywny, endpointy §4.3, minimum bezpieczeństwa §4.5                         |
| [`AGENTS.md`](../../AGENTS.md)                      | **Agent tripwires**     | Auth tylko przez Firebase SDK; domena przez `ApiService`; `err?.error?.error`; role guards               |
| [`context/foundation/lessons.md`](lessons.md)       | **Recurring failures**  | Mutacje przez API nie Firestore; flat error shape; transakcje Functions — nie throw po commit            |
| `package.json`, `karma.conf.js`                     | **Tooling**             | Skrypty `build`, `test`; brak root `lint`                                                                |
| `.github/workflows/ci.yml`                          | **CI gate**             | `npm ci` → `build` → `test` (tylko frontend)                                                             |
| Git churn scan                                      | **Hot spots**           | **Brak commitów** na `master` (2026-07-12) — poniżej proxy strukturalne zamiast historii diffów          |

### Hot spots (proxy bez historii git)

Obszary o najwyższej złożoności biznesowej i regresji — priorytet testów w Phase 1:

| Obszar            | Pliki / moduły                                                            | Dlaczego gorące                                          |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| Accept + booking  | `functions/src/routes/providers.ts`, `functions/src/services/requests.ts` | Transakcje Firestore, timeout, tworzenie bookingu (S-06) |
| Request lifecycle | `functions/src/routes/requests.ts`, `functions/src/index.ts` (scheduler)  | PENDING → TIMEOUT, lazy expiry vs scheduler              |
| Auth + role       | `src/app/core/auth/*`, `functions/src/middleware/auth.ts`                 | JWT, `activeRole`, guards SEEKER/PROVIDER                |
| Seeker flow       | `src/app/features/seeker/*`                                               | Request, waiting screen, polling                         |
| Provider flow     | `src/app/features/provider/*`                                             | Online toggle, lista pending, respond                    |

---

## 2. Istniejący baseline testów (honest)

### Frontend (Angular)

| Aspekt                    | Stan                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Runner                    | Karma 6 + Jasmine 5, ChromeHeadless (`npm test`)                                                                     |
| Konfiguracja              | `karma.conf.js`, `angular.json` → architect.test                                                                     |
| Pliki spec                | **2** — `src/app/core/auth/role.guard.spec.ts` (5 przypadków), `src/app/core/auth/auth-ready.spec.ts` (3 przypadki)  |
| Łącznie                   | **8 examples**, wszystkie **SUCCESS** (lokalnie 2026-07-12)                                                          |
| Coverage                  | Skonfigurowany reporter (`karma-coverage`), **brak progu w CI**; faktyczne pokrycie ~ auth guards only               |
| Feature / component tests | **Brak** — zero speców w `features/`, `shared/`, `core/api/`                                                         |
| E2E                       | **Playwright** — `e2e/seed.spec.ts` (guest); auth flow w `e2e/role-guard`, `e2e/accept-booking` (wymaga `E2E_*` env) |

### Backend (Cloud Functions)

| Aspekt                 | Stan                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| Runner                 | **Vitest 3** — `npm run functions:test` (`functions/package.json`)     |
| Pliki spec             | **1** — `functions/src/services/requests.test.ts` (9 przypadków, R-04) |
| Testy integracyjne API | **Brak**                                                               |
| Emulator harness       | Skrypty `dev:api`, `emulators` istnieją; **nie używane w CI**          |

### Wnioski baseline

- Jedyna realna siatka bezpieczeństwa: **2 guardy auth/role** po stronie klienta.
- Krytyczna logika marketplace (accept, timeout, booking, IDOR) jest **w Functions bez testów automatycznych**.
- CI weryfikuje tylko **build + unit frontend** — deploy Functions może regresować bez sygnału.

### Postęp M3L2 (2026-07-12)

| Change ID                 | Ryzyko           | Testy                                         | Status                        |
| ------------------------- | ---------------- | --------------------------------------------- | ----------------------------- |
| `request-timeout-expiry`  | **R-04**         | `functions/src/services/requests.test.ts` (9) | ✅ Phase 0 done               |
| `auth-and-role-switch`    | R-07             | `role.guard.spec.ts` (5)                      | ✅ (S-01 Phase 1, przed M3L2) |
| `provider-accept-booking` | R-01, R-02, R-06 | —                                             | ⏳ następny P0                |

---

## 3. Rollout faz testów

Każda faza wiąże ryzyka z **change-id** i cyklem kursowym: `/10x-new <change-id>` → `/10x-research` → `/10x-plan` → `/10x-implement` → `/10x-impl-review`.

### Phase 1 — Unit + API contract (M3L2, teraz)

**Cel:** Zamknąć luki w logice o najwyższym impact×likelihood bez E2E.

| Priorytet | Change ID (sugerowany)                    | Zakres testów                                                                                                 | Ryzyka adresowane      |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **P0**    | `provider-accept-booking`                 | Unit/harness: respond accept/decline, timeout, brak bookingu po DECLINED/TIMEOUT; mapowanie kodów błędów HTTP | R-01, R-02, R-06, R-10 |
| **P0**    | `seeker-send-request`                     | Request create, expiry read-path, status transitions                                                          | R-04, R-05             |
| **P1**    | `auth-and-role-switch`                    | Rozszerzenie guard specs; testy kontraktu `POST /auth/active-role` (mock/harness)                             | R-07, R-08             |
| **P1**    | `discover-online-providers`               | Filtr online + kategoria (API/service level)                                                                  | R-09                   |
| **P2**    | `complete-booking`, `rate-after-complete` | Po zamknięciu P0 happy path                                                                                   | R-03 (częściowo)       |

**Następna komenda (Phase 1):**

```bash
/10x-new provider-accept-booking
```

(North star S-06 — największa wartość demo i najwyższe ryzyko regresji transakcyjnej.)

**Ukończone w M3L2:** `request-timeout-expiry` — unit expiry (R-04), 9 testów Vitest.

### Phase 2 — Integration & security harness

- Testy API z emulatorami Auth + Firestore (lub supertest + mock admin) dla IDOR i JWT.
- CI job: `functions:build` + przyszły `functions:test`.
- Manual checklist happy path MVP.md §7 przed każdym demo.

### Phase 3 — E2E (M3L4 — w toku)

- Playwright: `e2e/seed.spec.ts`, `role-guard` (R-07), `accept-booking` (R-01/R-03).
- Auth storageState: `e2e/auth.setup.ts` + env `E2E_SEEKER_*` / `E2E_PROVIDER_*` — patrz `e2e/README.md`.
- CI: opcjonalny `.github/workflows/e2e.yml` (workflow_dispatch); główny pipeline bez E2E.

---

## 4. Mapa ryzyk (user scenarios)

Skala: **Impact** i **Likelihood** = H / M / L.  
**Priorytet** = kombinacja (H×H → P0, H×M → P0/P1, itd.).  
Scenariusze opisują **doświadczenie użytkownika**, nie brak pliku testowego.

| ID       | Scenariusz użytkownika                                                                                                                                                                        | Impact | Likelihood | P      | Roadmap / MVP                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- | ------ | ----------------------------- |
| **R-01** | Klient wysyła request; provider klika **Akceptuj** w ostatniej sekundie; u klienta wisi **oczekiwanie**, u providera błąd lub odwrotnie — **brak bookingu mimo TAK** lub **podwójny booking** | H      | M          | **P0** | S-06, MVP §7 krok 4–5         |
| **R-02** | Provider B klika Akceptuj/Odrzuć na request skierowany do **Provider A** — system pozwala lub ujawnia cudzą wiadomość                                                                         | H      | M          | **P0** | S-06, PRD access control      |
| **R-03** | Po akceptacji **seeker nie widzi bookingu** (lub widzi pustą listę), podczas gdy provider widzi CONFIRMED                                                                                     | H      | M          | **P0** | S-06, US-02                   |
| **R-04** | Request wygasa po ~2 min (**TIMEOUT**), ale ekran oczekiwania seekera **nadal pokazuje PENDING** bez odświeżenia                                                                              | M      | M          | **P1** | S-05, US-01, MVP §7 negatywny |
| **R-05** | Klient wysyła request do providera, który w międzyczasie poszedł **offline** — request przechodzi mimo niedostępności                                                                         | M      | M          | **P1** | FR-005, FR-010                |
| **R-06** | Provider odrzuca lub ignoruje request, a mimo to **powstaje booking**                                                                                                                         | H      | L          | **P0** | Guardrail PRD, MVP §3.5       |
| **R-07** | Użytkownik z `activeRole: SEEKER` wchodzi na `/provider/requests` przez URL i **widzi lub akceptuje** cudze prośby                                                                            | H      | L          | **P1** | S-01, FR-002                  |
| **R-08** | Wywołanie `GET /api/bookings/my` lub `GET /api/requests/:id` **bez JWT** lub z tokenem innego użytkownika zwraca dane                                                                         | H      | M          | **P0** | MVP §4.5, NFR                 |
| **R-09** | Klient w kategorii widzi providera **offline** na liście „dostępnych”                                                                                                                         | M      | M          | **P1** | US-01, FR-005                 |
| **R-10** | Provider bez uzupełnionego profilu (brak stawki/kategorii) włącza **online** i pojawia się na liście                                                                                          | M      | L          | **P2** | FR-003, MVP §8 checklist      |
| **R-11** | Przełączenie roli na SEEKER **nie gasi** statusu online — klienci nadal widzą providera jako dostępnego                                                                                       | M      | M          | **P1** | FR-002, PRD business rules    |
| **R-12** | Klient ocenia providera **przed COMPLETED** lub dwukrotnie — średnia oceny jest zafałszowana                                                                                                  | M      | L          | **P2** | S-08, FR-014                  |

### Macierz skrócona (impact × likelihood)

```
Likelihood →   L              M              H
Impact ↓
H              R-06,R-07      R-01,R-02,R-03,R-08   —
M              R-10           R-04,R-05,R-09,R-11   —
L              R-12           —                     —
```

### Top 5 ryzyk (do adresowania w Phase 1)

1. **R-01** — wyścig accept vs timeout; niespójny stan request/booking u obu stron
2. **R-02** — IDOR: provider odpowiada na cudzy request
3. **R-08** — API bez JWT / w cudze dane (bookings, requests)
4. **R-03** — seeker nie widzi bookingu po udanej akceptacji
5. **R-06** — booking powstaje mimo DECLINED/TIMEOUT

---

## 5. Scenariusze krytyczne RentMe (MVP §7 + S-06)

Mapowanie pięciu flow wymaganych w lekcji na ryzyka i typ testu (Phase 1).

| #   | Flow (user-facing)                                                            | Ryzyka           | Typ testu Phase 1                                   |
| --- | ----------------------------------------------------------------------------- | ---------------- | --------------------------------------------------- |
| 1   | Seeker wysyła request → provider akceptuje → **obie strony widzą booking**    | R-01, R-03, R-06 | Harness transakcji respond + contract list bookings |
| 2   | Request **timeout ~2 min** → status TIMEOUT, seeker **powiadomiony** (UI/API) | R-04             | Unit expiry + polling/waiting component (mock API)  |
| 3   | **Role guard** — SEEKER vs PROVIDER routes                                    | R-07             | Rozszerzenie `role.guard.spec.ts` + e2e manual      |
| 4   | **Firebase Auth client + API JWT** (`requireAuth`)                            | R-08             | Middleware/harness 401 bez Bearer; wrong uid        |
| 5   | **Provider online toggle + filtr kategorii**                                  | R-09, R-10, R-11 | Service/API test online gate + lista providers      |

---

## 6. Cookbook Patterns

> **Phase 1:** TBD — wypełnić w M3L2 przy pierwszej implementacji testów. Poniżej kandydaci zgodni ze stackiem.

| Pattern                                  | Kiedy                                                                                         | Status                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Guard test harness**                   | `roleGuard`, `waitForAuthReady` — mock `AuthService` + `TestBed.runInInjectionContext`        | ✅ Istnieje — wzorzec do kopiowania    |
| **HttpClientTestingModule + ApiService** | Komponenty seeker/provider wywołujące API                                                     | TBD Phase 1                            |
| **Signal mock auth state**               | Testy redirectów przy zmianie `profile.activeRole`                                            | TBD Phase 1                            |
| **Functions pure fn tests**              | `isPendingPastExpiry`, `expirePendingRequest` z mock `runTransaction` — Vitest w `functions/` | ✅ M3L2 — `requests.test.ts`           |
| **Supertest + mock admin**               | Trasy Express z `requireAuth`                                                                 | TBD Phase 2                            |
| **Firestore emulator integration**       | Pełna transakcja accept → booking                                                             | TBD Phase 2                            |
| **Playwright dual-context**              | Happy path MVP §7 dwoma kontami                                                               | ✅ M3L4 — `e2e/accept-booking.spec.ts` |

---

## 7. Quality gates

Propozycja bramek dla PR i lokalnej pracy — stan **as-is** vs **target Phase 1**.  
**M3L3 (2026-07-12):** Cursor hooks + opcjonalny lefthook pre-commit — patrz `.cursor/hooks.json`, `scripts/hooks/`, `lefthook.yml`.

| Gate                       | Komenda / artefakt                        | As-is (2026-07-12) | Per-edit (Cursor)                                 | Pre-commit (lefthook)       | CI                    |
| -------------------------- | ----------------------------------------- | ------------------ | ------------------------------------------------- | --------------------------- | --------------------- |
| **Install**                | `npm ci`                                  | ✅                 | —                                                 | —                           | ✅                    |
| **Format**                 | Prettier                                  | ❌                 | ✅ `prettier-after-edit.mjs` (--write)            | ✅ `--check` staged         | ❌                    |
| **Typecheck app**          | `tsc -p tsconfig.app.json --noEmit`       | ❌                 | ✅ po edycji `src/**/*.ts` (≠ spec)               | ✅ staged `src/**` (≠ spec) | via `build`           |
| **Typecheck spec**         | `tsc -p tsconfig.spec.json --noEmit`      | ❌                 | ✅ po edycji `*.spec.ts`                          | ✅ staged spec              | ❌                    |
| **Typecheck functions**    | `tsc -p functions/tsconfig.json --noEmit` | ❌                 | ✅ po edycji `functions/**`                       | ✅ staged functions         | ❌                    |
| **Unit frontend (scoped)** | `ng test --include=…`                     | ❌                 | ✅ tylko `src/app/core/auth/**` (~8s)             | ❌ (za wolne)               | ❌                    |
| **Unit frontend (full)**   | `npm test` (8 specs)                      | ✅                 | ❌                                                | ❌                          | ✅                    |
| **Build frontend**         | `npm run build`                           | ✅                 | ❌                                                | ❌                          | ✅                    |
| **Build functions**        | `npm run functions:build`                 | ✅                 | ❌                                                | ❌                          | ✅                    |
| **Functions tests**        | `npm run functions:test`                  | ✅ 9 specs (M3L2)  | ✅ tylko `functions/src/**` (≠ `.test.ts`, ~1–2s) | ❌                          | ✅                    |
| **Lint frontend**          | brak ESLint root                          | ❌                 | ❌                                                | ❌                          | opcjonalnie później   |
| **Lint functions**         | `npm run lint --prefix functions`         | ❌                 | ❌                                                | ❌                          | WARN lokalnie         |
| **Manual MVP §7**          | Checklist demo 7 kroków                   | manual             | —                                                 | —                           | przed merge S-06+     |
| **E2E Playwright (guest)** | `npm run e2e` (seed.spec.ts)              | ❌                 | ❌                                                | ❌ (wolne)                  | opcjonalnie `e2e.yml` |
| **E2E Playwright (auth)**  | `npm run e2e` + `E2E_*` env               | ❌                 | ❌                                                | ❌                          | workflow_dispatch     |
| **Secrets**                | brak `environment.ts` w git               | ✅                 | —                                                 | —                           | ✅                    |

### Warstwy — wybór M3L3

| Warstwa               | Narzędzie                 | Uzasadnienie                                                                                                  |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Format**            | per-edit                  | Prettier na jednym pliku &lt;1s — natychmiastowy feedback agentowi                                            |
| **Typecheck**         | per-edit **+** pre-commit | `tsc --noEmit` ~3–4s lokalnie — akceptowalne per-edit; lefthook łapie edycje poza agentem (IDE, `git commit`) |
| **Testy auth**        | per-edit (scoped)         | R-07 / flow 3 — tylko `core/auth/**`; pełny `npm test` zostaje w CI                                           |
| **Testy Functions**   | per-edit (scoped)         | R-04 — tylko `functions/src/**` (≠ `.test.ts`); pełny suite Vitest ~1–2s                                      |
| **Build + full test** | CI only                   | Karma + ng build zbyt wolne na każdą edycję                                                                   |

Instalacja pre-commit: `npm run hooks:install` (lefthook devDependency). Weryfikacja hooków: `npm run hooks:verify`; w Cursor — kanał **Hooks** po edycji pliku przez agenta.

### CI (`.github/workflows/ci.yml`)

Pipeline: checkout → Node 20 → `npm ci` → `build` → `test` → `functions:build` → `functions:test`.  
**Brakuje jeszcze:** optional emulator smoke.

---

## 8. Budget exclusions (co NIE testować najpierw)

Zgodnie z wywiadem delegowanym — świadomie **poza Phase 1**:

| Wykluczenie                                           | Uzasadnienie                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Pełny suite **E2E Playwright**                        | Moduł 3 kursu; najpierw unit/API na north star                  |
| **Snapshoty** stron marketingowych / home statycznego | Niska wartość regresji vs koszt utrzymania                      |
| Unit testy **komponentów PrimeNG** (toast, dialog)    | Testować zachowanie feature, nie biblioteki UI                  |
| Ścieżki **tylko-emulator**                            | Chyba że test IDOR/transaction wymaga Firestore — wtedy Phase 2 |
| **OAuth Google**, PWA, push, i18n                     | PRD non-goals / MVP+                                            |
| **Płatności, chat, admin**                            | Poza MVP                                                        |
| Perf/load testy                                       | Skala `small` w PRD                                             |

---

## 9. Security & abuse (minimum Phase 1)

| Scenariusz nadużycia                                           | Oczekiwane zachowanie                                           | Powiązane ryzyko | Test Phase |
| -------------------------------------------------------------- | --------------------------------------------------------------- | ---------------- | ---------- |
| `GET /api/bookings/my` **bez** nagłówka Authorization          | **401** `{ error: string }`                                     | R-08             | P0 harness |
| Seeker podstawia **cudze** `requestId` / `bookingId` w URL API | **403/404**, brak danych obcego                                 | R-02, R-08       | P0         |
| Provider `POST .../respond` na request **innego** providerId   | **403**, brak mutacji                                           | R-02             | P0         |
| Request **wygasły** — accept po TIMEOUT                        | **409/400**, brak bookingu, status TIMEOUT persisted            | R-01, R-06       | P0         |
| Manipulacja `activeRole` **tylko** w localStorage bez API      | UI może chwilowo kłamać; **API nadal egzekwuje** uid/providerId | R-07             | P1         |

---

## 10. Handoff do backlogu testowego

| Roadmap | Change ID                   | Pierwszy test focus      | Gotowe do `/10x-new` |
| ------- | --------------------------- | ------------------------ | -------------------- |
| S-06    | `provider-accept-booking`   | respond + booking + IDOR | **tak (P0)**         |
| S-05    | `seeker-send-request`       | timeout + waiting UI     | tak                  |
| S-01    | `auth-and-role-switch`      | guards + active-role     | tak                  |
| S-04    | `discover-online-providers` | online filter            | tak                  |
| S-07    | `complete-booking`          | status COMPLETED         | po S-06              |
| S-08    | `rate-after-complete`       | rating guard             | po S-07              |

---

_Wygenerowano: M3L1 `/10x-test-plan` — 2026-07-12. Pakiet CLI: `auth_expired`; skill zastosowany z wymagań lekcji i źródeł foundation._
