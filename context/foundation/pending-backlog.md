# Pending backlog — RentMe 2.0 + kurs 10xDevs

> Ostatnia aktualizacja: 2026-07-26 (triage close-out: firestore-model + E2E smoke docs; CLI nadal **auth_expired**; brak git remote)  
> Cel: jedno miejsce na niedokończone lekcje, slice'y i blokery — żeby łatwo wrócić bez szukania w historii czatu.

---

## Checklist odblokowań użytkownika (kurs → Mission Log / odznaki)

Bez tych kroków artefakty M1–M5 w repo nie przełożą się na pełne evidence odznak:

| #   | Odblokowanie                            | Komenda / miejsce                                                                                                                                                                          | Status                                                                                                         |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 1   | **10x CLI auth + sync**                 | `npx @przeprogramowani/10x-cli@latest auth --email miroslaw.moskalik@gmail.com` → klik magic link **podczas gdy CLI polluje** → `npx @przeprogramowani/10x-cli@latest sync` (+ `get m0l0`) | ⏳ **blocked** — 2026-07-26 re-check: `auth --status` → `auth_expired` (oficjalny `get m0l0` nadal niemożliwy) |
| 1b  | **mvp-check (10xBuilder)**              | Raport: [`../changes/mvp-check/report.md`](../changes/mvp-check/report.md); prompt (rekonstrukcja): [`.cursor/prompts/mvp-check.md`](../../.cursor/prompts/mvp-check.md)                   | ✅ **5/5** — CRUD Delete via `POST /requests/:id/cancel` → `CANCELLED`                                         |
| 2   | **Git remote + `gh`**                   | Patrz sekcja poniżej — **wymaga URL od Ciebie**; agent nie wymyśla remote                                                                                                                  | ⏳                                                                                                             |
| 3   | **E2E creds** (`rentme2-76ba8`)         | Dual auth → pełny suite; **bez creds:** smoke `e2e/seed.spec.ts` (R-08) — [`e2e/README.md`](../../e2e/README.md)                                                                           | ⏳ (smoke bez creds OK)                                                                                        |
| 4   | **Architect §6**                        | Propozycja decyzji w [`architect-report.md`](../architect-report.md) §6 ✅ — użytkownik wkleja/submit przy odznace M4                                                                      | ✅ (await badge)                                                                                               |
| 5   | **OPENROUTER_API_KEY** (opcjonalnie M5) | `agents/code-review/.env` → `npm run review:diff` / promptfoo                                                                                                                              | ⏳                                                                                                             |
| 6   | **Deploy cancel na prod** (opcjonalnie) | Po commit soft-cancel: `npx firebase deploy --only hosting,functions --project rentme2-76ba8` — **pominięte** w triage (niecommitowane zmiany; nie wymuszamy deploy)                       | ⏳                                                                                                             |

**Po odblokowaniu (kolejność agent/repo):** pełne E2E → `request-timeout-expiry` phase 4 (manual §7) → `provider-accept-booking` phase 3 (manual §7). Refactor-opportunities 1–4 ✅. M3L5 ✅. S-05/S-06 **code-complete** w repo (await manual).

---

## Blockers (wymagają działania użytkownika)

### Firebase â€” nowy projekt (migracja)

- **Status (2026-07-12, deploy):** **`rentme2-76ba8`** na **Blaze** — wdrożono Auth (Email/Password), Firestore Native `(default)` w **eur3** (rules + indexes), Functions **`api`** + **`expireRequests`** (`europe-west1`), Hosting **https://rentme2-76ba8.web.app** (rewrite `/api/**` → OK), **Storage** (`storage.rules` wdrożone 2026-07-12).
- **Pozostało ręcznie:** lokalne **`environment.ts` / `environment.prod.ts`** z kluczami SDK z Console; konta **E2E** w tym projekcie (`e2e/.env.example`). Stary `rentme-b5e34` — archiwum / migracja danych opcjonalnie.
- **Uwaga:** pierwsza baza Firestore była w **Datastore mode** — usunięta i utworzona ponownie jako **Native** (pusty projekt).

### 10x CLI auth + M0L0 / mvp-check

- **Re-check (2026-07-26):** `auth --status` → **`auth_expired`**; `doctor` auth fail (`expires_at` 2026-05-20); `get m0l0` → **`auth_expired`** (oficjalna paczka M0L0 **nie** pobrana).
- **Workaround:** prompt mvp-check zrekonstruowany z ogłoszenia → `.cursor/prompts/mvp-check.md`; raport → `context/changes/mvp-check/report.md` (**5/5** po soft-cancel Delete).
- **Po udanym auth:** `sync` / `get m0l0` (nadpisze oficjalny prompt + `#skill-explainer`), potem ewentualnie odśwież raport jeśli kryteria w oficjalnym pliku różnią się od rekonstrukcji.
- **Gdy cooldown/minie sesja:**
  1. Terminal (otwarte): `npx @przeprogramowani/10x-cli@latest auth --email miroslaw.moskalik@gmail.com`
  2. Klik magic link **podczas** polla CLI
  3. `auth --status` → OK → `sync` + `get m0l0`
- **Uwaga:** override RentMe w `.cursor/rules/10x-course.mdc` (poza BEGIN/END) — nie nadpisywać przy sync.

### Git remote + GitHub CLI

- **Problem (2026-07-26):** `git remote -v` jest **puste** — agent **nie wymyśla** URL. Bez Twojego repo nie ma `push` / PR.
- **`gh`:** zwykle brak w PATH — zainstaluj [GitHub CLI](https://cli.github.com/) jeśli chcesz `gh pr create`.
- **Instrukcja (tylko Ty):**
  1. Utwórz puste repo na GitHubie (np. `rentme_2.0`) — **nie** dodawaj README jeśli lokalnie już jest historia.
  2. Skopiuj URL (`https://github.com/<you>/<repo>.git` lub SSH) i w katalogu repo:
     ```powershell
     git remote add origin <TWÓJ_URL>
     git remote -v
     git push -u origin master
     ```
  3. `gh auth login` (opcjonalnie) → push feature branches / PR wg `context/changes/m2l5-parallel-note.md`.
- **Uwaga:** worktree branches `feature/request-timeout-expiry` / `feature/provider-accept-booking` są już zmergowane do `master` (baseline); remote potrzebny głównie pod cert / review / toolkit publish.

### Konta E2E (Playwright)

- **Problem:** brak `e2e/.env` / zmiennych auth — agent **nie inventuje** sekretów.
- **Smoke bez creds (zawsze):**
  ```powershell
  npm run e2e -- e2e/seed.spec.ts
  # prod guest:
  $env:BASE_URL="https://rentme2-76ba8.web.app"; npm run e2e -- e2e/seed.spec.ts
  ```
- **Pełny suite:** `E2E_SEEKER_EMAIL` / `E2E_SEEKER_PASSWORD` + `E2E_PROVIDER_*` (dwa konta w **`rentme2-76ba8`**; provider: kategoria + stawka > 0). Bez nich `role-guard` i `accept-booking` = **SKIP**.
- **Instrukcja:** [`e2e/README.md`](../../e2e/README.md) + `e2e/.env.example`

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

| Element                           | Stan                                  |
| --------------------------------- | ------------------------------------- |
| `agents/code-review/`             | âś… standalone ESM + TypeScript       |
| `ToolLoopAgent` + `Output.object` | ✅ 6 scores, verdict, summaryMarkdown |
| OpenRouter + metryki `totalUsage` | ✅ stderr                             |
| `AGENTS.md` inject                | ✅ relative path z repo root          |
| Root script `review:diff`         | ✅                                    |
| CI integracja                     | ✅ M5L3 — patrz sekcja poniżej        |

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

### M5L4 — AI toolkit registry (GH Packages)

**Status:** **✅ ukończone** (2026-07-12)

| Element                                | Stan                                               |
| -------------------------------------- | -------------------------------------------------- |
| `packages/rentme-ai-toolkit/`          | âś… skill, rules, prompts, install/uninstall       |
| `context/changes/ai-toolkit-registry/` | âś… decision (Model 1 GH Packages), plan, research |
| `npm run toolkit:install`              | âś… zweryfikowane lokalnie                         |
| Publish workflow                       | âś… `.github/workflows/publish-ai-toolkit.yml`     |
| Publish na żywo                        | ⏳ wymaga `git remote`                             |

### M5L5 — Async & Remote Agents (delegacja + dry-run)

- **Status:** **✅ ukończone** (2026-07-12)
- **Change-id:** `async-remote-agents`
- **Wybrane zadanie:** Phase 1 `refactor-opportunities` — Vitest respond harness (6 scenariuszy)
- **Tryb:** Tryb 2 sandbox **dry-run** (brak remote) + Tryb 1 headless lokalnie
- **Wykonane:**
  - `context/changes/async-remote-agents/` — decision, delegation-contract, change, requirements, plan, dry-run, review
  - Skill stub `.cursor/skills/10x-goal-implement/SKILL.md` (10x-cli `auth_expired`)
  - `functions/src/routes/providers.respond.test.ts` + export `executeRespondTx` — **15 testów PASS**
  - `refactor-opportunities/plan.md` Phase 1 → done
- **Moduł 5 Innovate path:** **KOMPLETNY** (L1 opportunity map · L2 code review · L3 CI review · L4 toolkit · L5 async delegation)

### M3L5 — debugging lesson (swallowed errors)

- **Status:** **✅ ukończone** (2026-07-25) — audyt bez paczki skill CLI
- **Wykonane:** `context/changes/m3l5-swallowed-errors/verification.md`; fix logów w `middleware/auth.ts` + `routes/auth.ts` rollback; wpis w `lessons.md`
- **Uwaga:** pełny sync skilli m3l5 z 10x-cli nadal zależy od auth użytkownika (checklist powyżej)

### `provider-accept-booking` — Phase 3

- **Status:** **code-complete** — Phase 1 (API errors) ✅, Phase 2 (UX → `/bookings`) ✅; Vitest respond ✅.
- **Phase 3 pending (user only):** manual MVP §7 — `verification-phase-3.md`. Roadmap S-06 = `in-progress` (nie `done` bez checklist/E2E).

### `request-timeout-expiry` — Phases 1–4

| Phase    | Opis                                             | Stan                                                               |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| 0        | Vitest unit (R-04), M3L2                         | ✅ 9 testów                                                        |
| 1        | Index `status+expiresAt` + scheduler tx          | ✅ kod w `firestore.indexes.json` + `requests.ts`; merge `a92e190` |
| 1 deploy | Indeks wdrożony                                  | ✅ `context/deployment/deployment-result.md` (2026-07-12)          |
| 2        | API read-path consistency                        | ✅ audit 2026-07-25 — `resolveRequestStatus` na GET paths          |
| 3        | Seeker UX verification (timer/poll)              | ✅ audit 2026-07-25 — waiting + my-requests OK                     |
| 4        | Manual checklist MVP §7 negatywny + roadmap S-05 | ⏳ user-only; S-05 = code-complete / `in-progress`                 |

**firestore-model:** ✅ zaktualizowany do marketplace + `CANCELLED` (`.cursor/skills/rentme-firebase/references/firestore-model.md`) — stary model listings/owner usunięty.

### `refactor-opportunities` — Phases 1–4

| Phase | Opis                   | Stan                                  |
| ----- | ---------------------- | ------------------------------------- |
| 1     | Respond Vitest harness | ✅ (M5L5)                             |
| 2     | Shared expiry guard    | ✅ 2026-07-25 — `isPendingPastExpiry` |
| 3     | Strangler `respond.ts` | ✅ 2026-07-25                         |
| 4     | Docs handoff           | ✅ verification.md + backlog          |

---

## Ukończone (skrót — żeby backlog był użyteczny)

| Element                | DowĂłd / commit                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------- |
| M2L1 roadmap           | `context/foundation/roadmap.md`                                                    |
| M2L2 plan              | change plany pod `context/changes/`                                                |
| M2L3 review            | impl-review w changes                                                              |
| M2L4 research          | `infra-research.md`, `context/deployment/`                                         |
| M2L5 parallel merge    | `context/changes/m2l5-parallel-note.md`; merge worktree â†’ `d117768`              |
| M3L1 test-plan         | `context/foundation/test-plan.md`                                                  |
| M3L2 Vitest            | `request-timeout-expiry` phase 0; `npm run functions:test`                         |
| M3L3 hooks             | lefthook + `.cursor/hooks.json`; w `d117768`                                       |
| M1L5 deploy            | `context/deployment/deployment-result.md`; prod https://rentme-b5e34.web.app       |
| Merge baseline         | `d117768` â€” parallel slices, hooks, Vitest, CI gates                             |
| M3L4 E2E scaffold      | `e599836` â€” Playwright + specs (bez peĹ‚nego run z creds)                        |
| M4L1 context TOC       | `AGENTS.md` refactor; `context/README.md`; `agents-md-review.md`                   |
| M4L2 repo-map          | `context/map/repo-map.md` + artefakty 1â€“3                                        |
| M4L3 deep focus S-06   | `provider-accept-booking-flow/` â€” change.md + research.md (E2E trace, dĹ‚ug)     |
| M4L4 refactor plan     | `refactor-opportunities/` â€” research + plan guard-first (bez kodu)               |
| Firebase Storage rules | `rentme2-76ba8` — `storage.rules` deploy 2026-07-12                                |
| M4L5 domain + report   | `context/domain/*`, `architect-report.md` â€” DDD + zamkniÄ™cie M4                 |
| M5L2 code review agent | `agents/code-review/` — OpenRouter, `npm run review:diff`                          |
| M5L3 CI code review    | composite action, `ai-code-review.yml`, promptfoo evals                            |
| M5L4 AI toolkit        | `packages/rentme-ai-toolkit/`; `npm run toolkit:install`; GH Packages ready        |
| M5L5 async delegation  | `context/changes/async-remote-agents/`; Phase 1 respond tests; Moduł 5 Innovate ✅ |

---

## Następne kroki po odblokowaniu (kolejność)

1. **10x auth + sync** — **nadal blocker** (2026-07-26: `auth_expired`). Po sukcesie: `sync` + `get m0l0` (nadpisz zrekonstruowany mvp-check).
2. **Git remote** — Ty podajesz URL → `git remote add origin <url>` → push (agent nie inventuje remote).
3. **E2E** — bez creds: smoke `seed.spec.ts`; z creds: pełny suite + uzupełnij `e2e-critical-flows/verification.md`.
4. **`request-timeout-expiry` phase 4** — manual §7 negatywny → roadmap S-05 `done`.
5. **`provider-accept-booking` phase 3** — manual MVP §7 → roadmap S-06 `done`.
6. **Deploy soft-cancel** (opcjonalnie) — po commit: `firebase deploy --only hosting,functions --project rentme2-76ba8`.
7. **OPENROUTER_API_KEY** — opcjonalnie pod live `review:diff` / promptfoo.

---

## PowiÄ…zane dokumenty

- [`roadmap.md`](roadmap.md) â€” slice'y S-01â€¦S-09
- [`test-plan.md`](test-plan.md) â€” ryzyka R-01â€¦R-10, fazy testĂłw
- [`deployment-result.md`](../deployment/deployment-result.md) â€” prod deploy + blockery M1L5
- [`m2l5-parallel-note.md`](../changes/m2l5-parallel-note.md) â€” worktree'y i merge order
- [`e2e/README.md`](../../e2e/README.md) â€” env vars Playwright
- [`../map/repo-map.md`](../map/repo-map.md) â€” mapa operacyjna M4L2
