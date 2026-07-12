# Pending backlog â€” RentMe 2.0 + kurs 10xDevs

> Ostatnia aktualizacja: 2026-07-12  
> Cel: jedno miejsce na niedokoĹ„czone lekcje, slice'y i blokery â€” ĹĽeby Ĺ‚atwo wrĂłciÄ‡ bez szukania w historii czatu.

---

## Blockers (wymagajÄ… dziaĹ‚ania uĹĽytkownika)

### Firebase â€” nowy projekt (migracja)

- **Status (2026-07-12, deploy):** **`rentme2-76ba8`** na **Blaze** — wdrożono Auth (Email/Password), Firestore Native `(default)` w **eur3** (rules + indexes), Functions **`api`** + **`expireRequests`** (`europe-west1`), Hosting **https://rentme2-76ba8.web.app** (rewrite `/api/**` → OK), **Storage** (`storage.rules` wdrożone 2026-07-12).
- **Pozostało ręcznie:** lokalne **`environment.ts` / `environment.prod.ts`** z kluczami SDK z Console; konta **E2E** w tym projekcie (`e2e/.env.example`). Stary `rentme-b5e34` — archiwum / migracja danych opcjonalnie.
- **Uwaga:** pierwsza baza Firestore była w **Datastore mode** — usunięta i utworzona ponownie jako **Native** (pusty projekt).

### 10x CLI auth

- **Problem:** `npx @przeprogramowani/10x-cli auth` koĹ„czy siÄ™ `auth_timeout` â€” magic link na **miroslaw.moskalik@gmail.com** nie dotarĹ‚ (sprawdĹş spam / filtry).
- **Skutek:** manifest utknÄ…Ĺ‚ na **`m1l4`** (`.cursor/.10x-cli-manifest.json`); brak lokalnych skilli **m2l3â€“m3l5** z paczki kursowej.
- **Gdy link przyjdzie:**
  1. `npx @przeprogramowani/10x-cli auth`
  2. `npx @przeprogramowani/10x-cli sync` (lub `get <lessonId> --tool cursor` dla konkretnej lekcji)
  3. Zweryfikuj manifest â†’ docelowo `m3l5` po ukoĹ„czeniu lekcji
- **Uwaga:** override RentMe w `.cursor/rules/10x-course.mdc` (poza blokiem BEGIN/END) pozostaje â€” nie nadpisywaÄ‡ przy sync.

### Git remote + GitHub CLI

- **Problem:** repo **bez `git remote`**; **`gh` nie zainstalowany** w PATH.
- **Skutek:** nie da siÄ™ pushowaÄ‡ branchy z worktree M2L5 (`feature/request-timeout-expiry`, `feature/provider-accept-booking`) ani otwieraÄ‡ PR przez `gh pr create`.
- **Gdy gotowe:**
  1. UtwĂłrz repo na GitHubie i `git remote add origin <url>`
  2. Zainstaluj [GitHub CLI](https://cli.github.com/) i `gh auth login`
  3. Push branchy + PR wedĹ‚ug `context/changes/m2l5-parallel-note.md`

### Konta E2E (Playwright)

- **Problem:** brak ustawionych zmiennych Ĺ›rodowiskowych dla auth setup.
- **Wymagane:** `E2E_SEEKER_EMAIL` / `E2E_SEEKER_PASSWORD` oraz `E2E_PROVIDER_EMAIL` / `E2E_PROVIDER_PASSWORD` (dwa osobne konta Firebase Auth w **`rentme2-76ba8`**; provider z kategoriÄ… + stawkÄ… > 0).
- **Skutek:** `role-guard.spec.ts` i `accept-booking.spec.ts` sÄ… **SKIP**; dziaĹ‚a tylko `seed.spec.ts` (goĹ›Ä‡).
- **Instrukcja:** `e2e/README.md`

---

## W toku / czÄ™Ĺ›ciowe

### M4L2 â€” Repo map (Architect)

**Status:** **âś… ukoĹ„czone** (2026-07-12)

| Element                                  | Stan                                  |
| ---------------------------------------- | ------------------------------------- |
| `context/map/artifact-1-territory.md`    | âś… git wide scan                     |
| `context/map/artifact-2-structure.md`    | âś… madge + warstwy Angular/Functions |
| `context/map/artifact-3-contributors.md` | âś… autorzy per strefa                |
| `context/map/repo-map.md`                | âś… synteza 7 sekcji                  |
| `context/README.md` + link w foundation  | âś…                                   |
| `madge@8.0.0` devDep                     | âś…                                   |

**Architect path:** **âś… ModuĹ‚ 4 ukoĹ„czony** (L2â€“L5, 2026-07-12).

### M3L4 â€” E2E (Playwright)

**Status:** implementacja **ukoĹ„czona w repo**; peĹ‚ny happy path **niezweryfikowany z creds**.

| Element                                              | Stan                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `playwright.config.ts`                               | âś… projects: guest, setup-seeker/provider, role-guard, accept-booking |
| `e2e/auth.setup.ts` + `helpers/`                     | âś… storageState                                                       |
| `e2e/seed.spec.ts`                                   | âś… R-08                                                               |
| `e2e/role-guard.spec.ts`                             | âś… R-07 (wymaga creds)                                                |
| `e2e/accept-booking.spec.ts`                         | âś… R-01/R-03 (wymaga dual creds)                                      |
| `e2e/README.md`, CI stub                             | âś…                                                                    |
| `context/changes/e2e-critical-flows/verification.md` | âś… deliberate break + build                                           |
| Ostatni commit                                       | `e599836` â€” feat(e2e) M3L4                                           |
| Run z kontami Firebase                               | âŹł **pending** â€” zaleĹĽy od blocker E2E env                         |

### M4L1 â€” Context architecture at scale

- **Status:** **âś… ukoĹ„czone** (2026-07-12)
- **Wykonane:** refaktor `AGENTS.md` jako TOC (~76â†’68 linii); `context/README.md`; audyt w `context/foundation/agents-md-review.md`; ladder **step 1** (bez per-module AGENTS/context).
- **Architect path L1 follow-up:** per-area rules, nested context, split AGENTS â€” dopiero przy sygnaĹ‚ach skali (multi-team, >200 linii reguĹ‚, powtarzalne bĹ‚Ä™dy per moduĹ‚).

### M4L3 â€” Deep focus (feature overview + technical debt)

- **Status:** **âś… ukoĹ„czone** (2026-07-12)
- **Change-id:** `provider-accept-booking-flow` (S-06 north star)
- **Wykonane:** `context/map/repo-map.md` (minimalna mapa M4L2); `context/changes/provider-accept-booking-flow/change.md` + `research.md` (E2E trace, dĹ‚ug techniczny, structural claims + weryfikacja rg); ast-grep niedostÄ™pny na Win â€” fallback rg udokumentowany.
- **PowiÄ…zanie z L5:** `context/domain/` + `architect-report.md`; plan implementacji w `refactor-opportunities/plan.md`.

### M4L4 â€” Refaktoryzacja z agentem (plan)

- **Status:** **âś… ukoĹ„czone** (2026-07-12)
- **Change-id:** `refactor-opportunities` (osobny od `provider-accept-booking-flow`)
- **Wykonane:** `change.md` + `research.md` (klasyfikacja P1â€“P10, ranking, 3 perspektywy) + weryfikacja rg (ast-grep niedostÄ™pny Win) + `plan.md` / `plan-brief.md` + `plan-review.md`
- **Decyzja:** guard-first â€” Vitest respond przed refaktorem; wspĂłlny guard expiry; Strangler extract serwisu; Domain Model odrzucony na MVP
- **Architect path:** L5 âś… â€” patrz sekcja M4L5 poniĹĽej.

### M4L5 â€” Domain distillation + architect report

- **Status:** **âś… ukoĹ„czone** (2026-07-12)
- **Wykonane:**
  - `context/domain/01-domain-distillation.md` â€” UL, subdomeny, agregaty, luki
  - `context/domain/02-invariant-aggregate-refactor.md` â€” niezmiennik #1 ServiceRequest
  - `context/domain/03-anti-corruption-layer.md` â€” ACL Firebase Timestamp/DTO
  - `context/architect-report.md` â€” zamkniÄ™cie ModuĹ‚u 4
  - `context/domain/README.md` + linki w `context/README.md`
- **ModuĹ‚ 4 Architect path:** **KOMPLETNY** (L1 context TOC Â· L2 repo-map Â· L3 S-06 research Â· L4 plan Â· L5 domain + report)

### M5L2 â€” Agent code review (Vercel AI SDK 6)

**Status:** **âś… ukoĹ„czone** (2026-07-12)

| Element                           | Stan                                              |
| --------------------------------- | ------------------------------------------------- |
| `agents/code-review/`             | âś… standalone ESM + TypeScript                   |
| `ToolLoopAgent` + `Output.object` | âś… 5 scores, verdict, markdown summary           |
| OpenRouter + metryki `totalUsage` | âś… stderr                                        |
| `AGENTS.md` inject                | âś… relative path z repo root                     |
| Root script `review:diff`         | âś…                                               |
| CI integracja                     | ✅ M5L3 — `ai-code-review.yml` + composite action |

### M5L3 — CI/CD code review (GHA + promptfoo)

**Status:** **✅ ukończone** (2026-07-12)

| Element                                                       | Stan                                    |
| ------------------------------------------------------------- | --------------------------------------- |
| 6 kryteriów + `documentation`                                 | ✅ `review-schema.ts`                   |
| Composite action                                              | ✅ `.github/actions/code-review/`       |
| Workflow PR → `master`                                        | ✅ `ai-code-review.yml`                 |
| Labele `ai-cr:passed` / `ai-cr:failed` / retry `ai-cr:review` | ✅ workflow                             |
| promptfoo evals                                               | ✅ `agents/code-review/evals/`          |
| readPlan (optional)                                           | ✅ `review-with-tools.js`               |
| Change folder                                                 | ✅ `context/changes/ci-cd-code-review/` |

**Status:** **âś… ukoĹ„czone** (2026-07-12)

| Element                                | Stan                                               |
| -------------------------------------- | -------------------------------------------------- |
| `packages/rentme-ai-toolkit/`          | âś… skill, rules, prompts, install/uninstall       |
| `context/changes/ai-toolkit-registry/` | âś… decision (Model 1 GH Packages), plan, research |
| `npm run toolkit:install`              | âś… zweryfikowane lokalnie                         |
| Publish workflow                       | âś… `.github/workflows/publish-ai-toolkit.yml`     |
| Publish na ĹĽywo                       | âŹł wymaga `git remote`                            |

### M3L5 â€” debugging lesson (swallowed errors)

- **Status:** **NIE rozpoczÄ™te**
- **Zadanie kursowe:** audyt â€žpoĹ‚ykanychâ€ť bĹ‚Ä™dĂłw w backendzie â€” RentMe odpowiednik: `functions/src/` (routes, services, transakcje Firestore).
- **Kontekst lekcji:** szukaj `catch` bez logowania / bez mapowania na `{ error: string }`; porĂłwnaj z konwencjÄ… w `AGENTS.md` i `provider-accept-booking` phase 1.
- **Blokada:** skill m3l5 z paczki CLI â€” wymaga odblokowania **10x auth** (powyĹĽej).

### `provider-accept-booking` â€” Phase 3

- **Status:** Phase 1 (API errors) âś…, Phase 2 (provider UX â†’ `/bookings`) âś… â€” merge w `d117768`
- **Phase 3 pending:** manualna checklista happy path **MVP Â§7** (kroki 3â€“5): accept â†’ jeden booking u obu stron; decline/timeout â†’ brak bookingu.
- **Pliki:** `context/changes/provider-accept-booking/plan.md` Â§Phase 3; roadmap S-06 nadal `in-progress`.

### `request-timeout-expiry` â€” Phases 1â€“4

| Phase    | Opis                                              | Stan                                                                |
| -------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| 0        | Vitest unit (R-04), M3L2                          | âś… 9 testĂłw                                                       |
| 1        | Index `status+expiresAt` + scheduler tx           | âś… kod w `firestore.indexes.json` + `requests.ts`; merge `a92e190` |
| 1 deploy | Indeks wdroĹĽony                                  | âś… `context/deployment/deployment-result.md` (2026-07-12)          |
| 2        | API read-path consistency                         | âŹł pending                                                         |
| 3        | Seeker UX verification (timer/poll)               | âŹł pending                                                         |
| 4        | Manual checklist MVP Â§7 negatywny + roadmap S-05 | âŹł pending                                                         |

---

## UkoĹ„czone (skrĂłt â€” ĹĽeby backlog byĹ‚ uĹĽyteczny)

| Element                | DowĂłd / commit                                                                |
| ---------------------- | ------------------------------------------------------------------------------ |
| M2L1 roadmap           | `context/foundation/roadmap.md`                                                |
| M2L2 plan              | change plany pod `context/changes/`                                            |
| M2L3 review            | impl-review w changes                                                          |
| M2L4 research          | `infra-research.md`, `context/deployment/`                                     |
| M2L5 parallel merge    | `context/changes/m2l5-parallel-note.md`; merge worktree â†’ `d117768`          |
| M3L1 test-plan         | `context/foundation/test-plan.md`                                              |
| M3L2 Vitest            | `request-timeout-expiry` phase 0; `npm run functions:test`                     |
| M3L3 hooks             | lefthook + `.cursor/hooks.json`; w `d117768`                                   |
| M1L5 deploy            | `context/deployment/deployment-result.md`; prod https://rentme-b5e34.web.app   |
| Merge baseline         | `d117768` â€” parallel slices, hooks, Vitest, CI gates                         |
| M3L4 E2E scaffold      | `e599836` â€” Playwright + specs (bez peĹ‚nego run z creds)                    |
| M4L1 context TOC       | `AGENTS.md` refactor; `context/README.md`; `agents-md-review.md`               |
| M4L2 repo-map          | `context/map/repo-map.md` + artefakty 1â€“3                                    |
| M4L3 deep focus S-06   | `provider-accept-booking-flow/` â€” change.md + research.md (E2E trace, dĹ‚ug) |
| M4L4 refactor plan     | `refactor-opportunities/` â€” research + plan guard-first (bez kodu)           |
| Firebase Storage rules | `rentme2-76ba8` — `storage.rules` deploy 2026-07-12                            |
| M4L5 domain + report   | `context/domain/*`, `architect-report.md` â€” DDD + zamkniÄ™cie M4             |
| M5L2 code review agent | `agents/code-review/` — OpenRouter, `npm run review:diff`                      |
| M5L3 CI code review    | composite action, `ai-code-review.yml`, promptfoo evals                        |
| M5L4 AI toolkit        | `packages/rentme-ai-toolkit/`; `npm run toolkit:install`; GH Packages ready    |

---

## NastÄ™pne kroki po odblokowaniu (kolejnoĹ›Ä‡)

1. **10x auth + sync** â€” odblokuj m2l3â€“m3l5; zaktualizuj manifest poza `m1l4`.
2. **E2E creds** â€” utwĂłrz konta Firebase, ustaw env, uruchom `npm run e2e` (peĹ‚ny suite).
3. **DokoĹ„cz M3L4** â€” jeĹ›li coĹ› failuje z creds, popraw i uzupeĹ‚nij `e2e-critical-flows/verification.md`.
4. **M3L5 swallowed-error audit** â€” przejrzyj `functions/src/`, napraw ciche `catch`, dopisz wpis do `lessons.md` jeĹ›li wzorzec siÄ™ powtarza.
5. **Git remote + push** â€” opublikuj branchy feature; PR dla review.
6. **P0 testy `provider-accept-booking`** â€” R-01/R-02 w `test-plan.md` (unit/harness respond accept/decline).
7. **`request-timeout-expiry` phases 2â€“4** â€” API consistency, seeker UX, manual Â§7 negatywny.
8. **`provider-accept-booking` phase 3** â€” manual MVP Â§7 happy path â†’ roadmap S-06 `done`.

---

## PowiÄ…zane dokumenty

- [`roadmap.md`](roadmap.md) â€” slice'y S-01â€¦S-09
- [`test-plan.md`](test-plan.md) â€” ryzyka R-01â€¦R-10, fazy testĂłw
- [`deployment-result.md`](../deployment/deployment-result.md) â€” prod deploy + blockery M1L5
- [`m2l5-parallel-note.md`](../changes/m2l5-parallel-note.md) â€” worktree'y i merge order
- [`e2e/README.md`](../../e2e/README.md) â€” env vars Playwright
- [`../map/repo-map.md`](../map/repo-map.md) â€” mapa operacyjna M4L2
