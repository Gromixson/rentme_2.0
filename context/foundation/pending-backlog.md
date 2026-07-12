# Pending backlog — RentMe 2.0 + kurs 10xDevs

> Ostatnia aktualizacja: 2026-07-12  
> Cel: jedno miejsce na niedokończone lekcje, slice'y i blokery — żeby łatwo wrócić bez szukania w historii czatu.

---

## Blockers (wymagają działania użytkownika)

### Firebase — nowy projekt (migracja)

- **Status (2026-07-12):** repo skonfigurowane pod **`rentme2-76ba8`** (`.firebaserc`, przykłady env, lokalne `environment.ts` / `environment.prod.ts`, app web **RentMe Web**).
- **Pozostało ręcznie:** włączyć **Blaze** (Functions wymagają płatnego planu), **Authentication → Email/Password**, utworzyć **Firestore** (`npm run setup:firestore`), wdrożyć rules/functions/hosting (`README.md` § deploy). Stary projekt `rentme-b5e34` można zostawić jako archiwum lub usunąć po migracji danych.
- **Blokada deploy:** MCP raportuje **Billing Enabled: No** — bez Blaze deploy Functions się nie uda.

### 10x CLI auth

- **Problem:** `npx @przeprogramowani/10x-cli auth` kończy się `auth_timeout` — magic link na **miroslaw.moskalik@gmail.com** nie dotarł (sprawdź spam / filtry).
- **Skutek:** manifest utknął na **`m1l4`** (`.cursor/.10x-cli-manifest.json`); brak lokalnych skilli **m2l3–m3l5** z paczki kursowej.
- **Gdy link przyjdzie:**
  1. `npx @przeprogramowani/10x-cli auth`
  2. `npx @przeprogramowani/10x-cli sync` (lub `get <lessonId> --tool cursor` dla konkretnej lekcji)
  3. Zweryfikuj manifest → docelowo `m3l5` po ukończeniu lekcji
- **Uwaga:** override RentMe w `.cursor/rules/10x-course.mdc` (poza blokiem BEGIN/END) pozostaje — nie nadpisywać przy sync.

### Git remote + GitHub CLI

- **Problem:** repo **bez `git remote`**; **`gh` nie zainstalowany** w PATH.
- **Skutek:** nie da się pushować branchy z worktree M2L5 (`feature/request-timeout-expiry`, `feature/provider-accept-booking`) ani otwierać PR przez `gh pr create`.
- **Gdy gotowe:**
  1. Utwórz repo na GitHubie i `git remote add origin <url>`
  2. Zainstaluj [GitHub CLI](https://cli.github.com/) i `gh auth login`
  3. Push branchy + PR według `context/changes/m2l5-parallel-note.md`

### Konta E2E (Playwright)

- **Problem:** brak ustawionych zmiennych środowiskowych dla auth setup.
- **Wymagane:** `E2E_SEEKER_EMAIL` / `E2E_SEEKER_PASSWORD` oraz `E2E_PROVIDER_EMAIL` / `E2E_PROVIDER_PASSWORD` (dwa osobne konta Firebase Auth w **`rentme2-76ba8`**; provider z kategorią + stawką > 0).
- **Skutek:** `role-guard.spec.ts` i `accept-booking.spec.ts` są **SKIP**; działa tylko `seed.spec.ts` (gość).
- **Instrukcja:** `e2e/README.md`

---

## W toku / częściowe

### M4L2 — Repo map (Architect)

**Status:** **✅ ukończone** (2026-07-12)

| Element                                  | Stan                                 |
| ---------------------------------------- | ------------------------------------ |
| `context/map/artifact-1-territory.md`    | ✅ git wide scan                     |
| `context/map/artifact-2-structure.md`    | ✅ madge + warstwy Angular/Functions |
| `context/map/artifact-3-contributors.md` | ✅ autorzy per strefa                |
| `context/map/repo-map.md`                | ✅ synteza 7 sekcji                  |
| `context/README.md` + link w foundation  | ✅                                   |
| `madge@8.0.0` devDep                     | ✅                                   |

**Architect path — pozostałe:** M4L5 domain.

### M3L4 — E2E (Playwright)

**Status:** implementacja **ukończona w repo**; pełny happy path **niezweryfikowany z creds**.

| Element                                              | Stan                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `playwright.config.ts`                               | ✅ projects: guest, setup-seeker/provider, role-guard, accept-booking |
| `e2e/auth.setup.ts` + `helpers/`                     | ✅ storageState                                                       |
| `e2e/seed.spec.ts`                                   | ✅ R-08                                                               |
| `e2e/role-guard.spec.ts`                             | ✅ R-07 (wymaga creds)                                                |
| `e2e/accept-booking.spec.ts`                         | ✅ R-01/R-03 (wymaga dual creds)                                      |
| `e2e/README.md`, CI stub                             | ✅                                                                    |
| `context/changes/e2e-critical-flows/verification.md` | ✅ deliberate break + build                                           |
| Ostatni commit                                       | `e599836` — feat(e2e) M3L4                                            |
| Run z kontami Firebase                               | ⏳ **pending** — zależy od blocker E2E env                            |

### M4L1 — Context architecture at scale

- **Status:** **✅ ukończone** (2026-07-12)
- **Wykonane:** refaktor `AGENTS.md` jako TOC (~76→68 linii); `context/README.md`; audyt w `context/foundation/agents-md-review.md`; ladder **step 1** (bez per-module AGENTS/context).
- **Architect path L1 follow-up:** per-area rules, nested context, split AGENTS — dopiero przy sygnałach skali (multi-team, >200 linii reguł, powtarzalne błędy per moduł).

### M4L3 — Deep focus (feature overview + technical debt)

- **Status:** **✅ ukończone** (2026-07-12)
- **Change-id:** `provider-accept-booking-flow` (S-06 north star)
- **Wykonane:** `context/map/repo-map.md` (minimalna mapa M4L2); `context/changes/provider-accept-booking-flow/change.md` + `research.md` (E2E trace, dług techniczny, structural claims + weryfikacja rg); ast-grep niedostępny na Win — fallback rg udokumentowany.
- **Architect path pending:** **L5 domain** (nested domain context) — po implementacji planu `refactor-opportunities` lub przy sygnałach skali.

### M4L4 — Refaktoryzacja z agentem (plan)

- **Status:** **✅ ukończone** (2026-07-12)
- **Change-id:** `refactor-opportunities` (osobny od `provider-accept-booking-flow`)
- **Wykonane:** `change.md` + `research.md` (klasyfikacja P1–P10, ranking, 3 perspektywy) + weryfikacja rg (ast-grep niedostępny Win) + `plan.md` / `plan-brief.md` + `plan-review.md`
- **Decyzja:** guard-first — Vitest respond przed refaktorem; wspólny guard expiry; Strangler extract serwisu; Domain Model odrzucony na MVP
- **Architect path pending:** **M4L5 domain** — nested domain context dla Request/Booking

### M4L4 — Plan refaktoryzacji

- **Status:** **✅ ukończone** (2026-07-12, zsyntetyzowane z M4L3 przy L5)
- **Change-id:** `refactor-opportunities`
- **Wykonane:** `context/changes/refactor-opportunities/plan.md` — Opcja A guard-first + Vitest respond; fazy 0–3; sekcja „czego NIE robimy”.

### M4L5 — Domain distillation + architect report

- **Status:** **✅ ukończone** (2026-07-12)
- **Wykonane:**
  - `context/domain/01-domain-distillation.md` — UL, subdomeny, agregaty, luki
  - `context/domain/02-invariant-aggregate-refactor.md` — niezmiennik #1 ServiceRequest
  - `context/domain/03-anti-corruption-layer.md` — ACL Firebase Timestamp/DTO
  - `context/architect-report.md` — zamknięcie Modułu 4
  - `context/domain/README.md` + linki w `context/README.md`
- **Moduł 4 Architect path:** **KOMPLETNY** (L1 context TOC · L2 repo-map · L3 S-06 research · L4 plan · L5 domain + report)

### M3L5 — debugging lesson (swallowed errors)

- **Status:** **NIE rozpoczęte**
- **Zadanie kursowe:** audyt „połykanych” błędów w backendzie — RentMe odpowiednik: `functions/src/` (routes, services, transakcje Firestore).
- **Kontekst lekcji:** szukaj `catch` bez logowania / bez mapowania na `{ error: string }`; porównaj z konwencją w `AGENTS.md` i `provider-accept-booking` phase 1.
- **Blokada:** skill m3l5 z paczki CLI — wymaga odblokowania **10x auth** (powyżej).

### `provider-accept-booking` — Phase 3

- **Status:** Phase 1 (API errors) ✅, Phase 2 (provider UX → `/bookings`) ✅ — merge w `d117768`
- **Phase 3 pending:** manualna checklista happy path **MVP §7** (kroki 3–5): accept → jeden booking u obu stron; decline/timeout → brak bookingu.
- **Pliki:** `context/changes/provider-accept-booking/plan.md` §Phase 3; roadmap S-06 nadal `in-progress`.

### `request-timeout-expiry` — Phases 1–4

| Phase    | Opis                                             | Stan                                                               |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| 0        | Vitest unit (R-04), M3L2                         | ✅ 9 testów                                                        |
| 1        | Index `status+expiresAt` + scheduler tx          | ✅ kod w `firestore.indexes.json` + `requests.ts`; merge `a92e190` |
| 1 deploy | Indeks wdrożony                                  | ✅ `context/deployment/deployment-result.md` (2026-07-12)          |
| 2        | API read-path consistency                        | ⏳ pending                                                         |
| 3        | Seeker UX verification (timer/poll)              | ⏳ pending                                                         |
| 4        | Manual checklist MVP §7 negatywny + roadmap S-05 | ⏳ pending                                                         |

---

## Ukończone (skrót — żeby backlog był użyteczny)

| Element              | Dowód / commit                                                               |
| -------------------- | ---------------------------------------------------------------------------- |
| M2L1 roadmap         | `context/foundation/roadmap.md`                                              |
| M2L2 plan            | change plany pod `context/changes/`                                          |
| M2L3 review          | impl-review w changes                                                        |
| M2L4 research        | `infra-research.md`, `context/deployment/`                                   |
| M2L5 parallel merge  | `context/changes/m2l5-parallel-note.md`; merge worktree → `d117768`          |
| M3L1 test-plan       | `context/foundation/test-plan.md`                                            |
| M3L2 Vitest          | `request-timeout-expiry` phase 0; `npm run functions:test`                   |
| M3L3 hooks           | lefthook + `.cursor/hooks.json`; w `d117768`                                 |
| M1L5 deploy          | `context/deployment/deployment-result.md`; prod https://rentme-b5e34.web.app |
| Merge baseline       | `d117768` — parallel slices, hooks, Vitest, CI gates                         |
| M3L4 E2E scaffold    | `e599836` — Playwright + specs (bez pełnego run z creds)                     |
| M4L1 context TOC     | `AGENTS.md` refactor; `context/README.md`; `agents-md-review.md`             |
| M4L2 repo-map        | `context/map/repo-map.md` + artefakty 1–3                                    |
| M4L3 deep focus S-06 | `provider-accept-booking-flow/` — change.md + research.md (E2E trace, dług)  |
| M4L4 refactor plan   | `refactor-opportunities/plan.md` — guard-first, fazy 0–3                     |
| M4L5 domain + report | `context/domain/*`, `architect-report.md` — DDD + zamknięcie M4              |
| M4L4 refactor plan   | `refactor-opportunities/` — research + plan guard-first (bez kodu)           |

---

## Następne kroki po odblokowaniu (kolejność)

1. **10x auth + sync** — odblokuj m2l3–m3l5; zaktualizuj manifest poza `m1l4`.
2. **E2E creds** — utwórz konta Firebase, ustaw env, uruchom `npm run e2e` (pełny suite).
3. **Dokończ M3L4** — jeśli coś failuje z creds, popraw i uzupełnij `e2e-critical-flows/verification.md`.
4. **M3L5 swallowed-error audit** — przejrzyj `functions/src/`, napraw ciche `catch`, dopisz wpis do `lessons.md` jeśli wzorzec się powtarza.
5. **Git remote + push** — opublikuj branchy feature; PR dla review.
6. **P0 testy `provider-accept-booking`** — R-01/R-02 w `test-plan.md` (unit/harness respond accept/decline).
7. **`request-timeout-expiry` phases 2–4** — API consistency, seeker UX, manual §7 negatywny.
8. **`provider-accept-booking` phase 3** — manual MVP §7 happy path → roadmap S-06 `done`.

---

## Powiązane dokumenty

- [`roadmap.md`](roadmap.md) — slice'y S-01…S-09
- [`test-plan.md`](test-plan.md) — ryzyka R-01…R-10, fazy testów
- [`deployment-result.md`](../deployment/deployment-result.md) — prod deploy + blockery M1L5
- [`m2l5-parallel-note.md`](../changes/m2l5-parallel-note.md) — worktree'y i merge order
- [`e2e/README.md`](../../e2e/README.md) — env vars Playwright
- [`../map/repo-map.md`](../map/repo-map.md) — mapa operacyjna M4L2
