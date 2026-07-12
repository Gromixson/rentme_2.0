# Plan — ci-cd-code-review (M5L3)

> Change: [`change.md`](change.md) · Requirements: [`requirements.md`](requirements.md)

## End state

1. Agent `agents/code-review` z 6 kryteriami, DoD RentMe, build → `dist/review.js`
2. Composite action `.github/actions/code-review` — input diff, output verdict
3. Workflow `.github/workflows/ai-code-review.yml` — PR comment + labele
4. Root `npm run review:diff` — lokalny diff → agent
5. promptfoo evals na `sample-flawed.diff`
6. README agenta + wpis w `pending-backlog.md`

---

## Phase 1: Composite action + schema agenta

### Deliverables

| Plik                                              | Intent                                       |
| ------------------------------------------------- | -------------------------------------------- |
| `agents/code-review/src/common/review-schema.ts`  | 6 kryteriów Zod + `.describe()` rubryki 1/10 |
| `agents/code-review/src/common/rentme-context.ts` | DoD + deriveVerdict                          |
| `agents/code-review/src/review.ts`                | OpenRouter, JSON schema output               |
| `agents/code-review/esbuild.config.mjs`           | Bundle `dist/review.js`                      |
| `.github/actions/code-review/action.yml`          | Composite: node setup, build, run            |

### Success criteria

- [ ] `npm run build --prefix agents/code-review` — green
- [ ] Lokalnie z kluczem: `git diff master...HEAD \| node agents/code-review/dist/review.js --title test`

---

## Phase 2: Workflow GHA + root script

### Deliverables

| Plik                                   | Intent                                    |
| -------------------------------------- | ----------------------------------------- |
| `.github/workflows/ai-code-review.yml` | PR master, workflow_dispatch, label retry |
| `.github/actions/code-review/run.mjs`  | Bridge env → agent, GITHUB_OUTPUT         |
| `scripts/review-diff.mjs`              | `npm run review:diff`                     |
| Root `package.json` script             | `review:diff`                             |

### Success criteria

- [ ] Workflow YAML valid (actionlint / manual review)
- [ ] `npm run review:diff` działa bez remote (fallback HEAD~1)
- [ ] Dokumentacja sekretów + uprawnień GITHUB_TOKEN

---

## Phase 3: promptfoo evals

### Deliverables

| Plik                                | Intent                                 |
| ----------------------------------- | -------------------------------------- |
| `evals/promptfooconfig.yaml`        | 3 providery OpenRouter                 |
| `evals/fixtures/sample-flawed.diff` | Firestore w Angular + open admin route |
| `evals/prompts/review.txt`          | Prompt aligned z agentem               |
| `evals/README.md`                   | `npx promptfoo eval`                   |

### Success criteria

- [ ] `npx promptfoo eval --dry-run` — config OK
- [ ] Z `OPENROUTER_API_KEY`: flawed diff → verdict fail

---

## Phase 4 (optional): readPlan tool

| Plik                       | Intent                                    |
| -------------------------- | ----------------------------------------- |
| `src/tools/read-plan.ts`   | read `context/changes/*/plan.md`          |
| `src/review-with-tools.ts` | `--with-tools` / osobny bundle            |
| README sekcja              | CI = scorer-only; lokalnie `--with-tools` |

---

## What we're NOT doing

- Blokada merge przy `fail` (tylko label + comment)
- SHA pinning wszystkich actions (notatka w README; checkout/setup-node @v4)
- businessAlignment / architecturalFit scoring
- Automatyczne tworzenie labeli w repo (instrukcja `gh label create`)
