# Wymagania — ci-cd-code-review (M5L3)

> Change: [`change.md`](change.md) · Język: PL · Stack: Angular 21 + Cloud Functions + Firebase

## 1. Workflow GitHub Actions

| ID   | Wymaganie                                                                                 | Priorytet                                     |
| ---- | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| W-01 | Workflow `ai-code-review.yml` na `pull_request` → branch `master`                         | Must                                          |
| W-02 | Trigger `workflow_dispatch` (ręczny rerun)                                                | Must                                          |
| W-03 | Trigger on-demand przez label `ai-cr:review` na PR (retry bez nowego commita)             | Should (faza 2 — zaimplementowane w workflow) |
| W-04 | `checkout@v4` z `fetch-depth: 0`                                                          | Must                                          |
| W-05 | Diff: `git diff origin/${{ github.base_ref }}...HEAD` z fallbackiem lokalnym              | Must                                          |
| W-06 | Uprawnienia `GITHUB_TOKEN`: `pull-requests: write`, `issues: write` (komentarze + labele) | Must                                          |

## 2. Composite action

| ID   | Wymaganie                                                                                                                       | Priorytet |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | --------- |
| A-01 | Ścieżka `.github/actions/code-review/action.yml`                                                                                | Must      |
| A-02 | Inputs: `api-key`, `pr-title`, `pr-body` (opcjonalny — oszczędność tokenów), `diff`, `base-ref`                                 | Must      |
| A-03 | Output: `verdict` (`pass` \| `fail`)                                                                                            | Must      |
| A-04 | Kroki: `setup-node@v4`, `npm ci` + `npm run build` w `agents/code-review`, uruchomienie skryptu via `${{ github.action_path }}` | Must      |
| A-05 | Pin `@v4` dla checkout/setup-node; notatka o SHA pinning w README                                                               | Must      |

## 3. Agent review — 6 kryteriów (skala 1–10)

Każde kryterium w `review-schema.ts` z `.describe()`: opis **1** (źle) i **10** (dobrze).

| Kryterium                     | 1 (źle)                                | 10 (dobrze)                                   |
| ----------------------------- | -------------------------------------- | --------------------------------------------- |
| **implementationCorrectness** | Logika błędna, regresje API/Firestore  | Zgodność z PRD/MVP, poprawne transakcje       |
| **idiomaticity**              | Firestore w komponencie, @angular/fire | ApiService, injected tokens, cienkie handlery |
| **complexity**                | Spaghetti / nadmiar abstrakcji         | Minimalny scope, czytelny podział warstw      |
| **testRiskCoverage**          | Brak testów na krytycznej ścieżce      | Vitest/Karma/Playwright wg test-plan          |
| **documentation**             | Brak kontekstu change / verification   | plan.md, verification, odwołania @path        |
| **securitySafety**            | Brak auth, wyciek sekretów, log hasła  | requireAuth, rules, walidacja wejścia         |

**Werdykt:** `pass` gdy wszystkie ≥7 i żadne ≤4; inaczej `fail`.  
**Output:** JSON + `summaryMarkdown` (PL).

**DoD (Definition of Done)** — wstrzykiwane z `AGENTS.md`: auth client-side, ApiService-only, brak sekretów, testy przy zmianach krytycznych.

## 4. Side effects (workflow, nie agent)

| ID   | Efekt                                                        | Implementacja              |
| ---- | ------------------------------------------------------------ | -------------------------- |
| S-01 | Komentarz na PR ze `summaryMarkdown`                         | `gh pr comment` w workflow |
| S-02 | Label `ai-cr:passed` lub `ai-cr:failed`                      | `gh pr edit --add-label`   |
| S-03 | Usunięcie poprzedniego labela werdyktu przed dodaniem nowego | workflow step              |

## 5. Parked (poza scope MVP)

- **businessAlignment** — zgodność z roadmap/PRD biznesowym
- **architecturalFit** — dopasowanie do DDD / architect-report

Udokumentowane w prompcie agenta; nie wpływają na werdykt.

## 6. Sekrety i lokalne uruchomienie

| Sekret                 | Gdzie                     |
| ---------------------- | ------------------------- |
| `OPENROUTER_API_KEY`   | GHA Secrets (preferowany) |
| `LLM_PROVIDER_API_KEY` | Alias w GHA / lokalnie    |

Bez klucza: czytelny komunikat błędu (exit 2), nie crash repo.

## 7. promptfoo evals (task 3)

- `agents/code-review/evals/promptfooconfig.yaml`
- 2–3 providery OpenRouter (Haiku, Sonnet, Gemini Flash)
- Fixture `sample-flawed.diff` — oczywiste naruszenia RentMe
- Asserts: is-json, javascript (werdykt fail), opcjonalnie llm-rubric

## 8. readPlan (task 4 — light)

- Opcjonalny entry `review-with-tools.ts` — wczytuje `context/changes/*/plan.md`
- Domyślna ścieżka CI: scorer-only (`tools: {}`), bez planów

## 9. Repo bez remote

Workflow i dokumentacja muszą działać lokalnie (`npm run review:diff`) bez `git remote`. CI aktywuje się po `git remote add origin` + push.
