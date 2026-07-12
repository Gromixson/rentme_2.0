# Agent code review (M5L2 + M5L3)

Lokalny agent recenzji kodu dla RentMe 2.0 — **Vercel AI SDK 6** (`ToolLoopAgent`, `Output.object`) + OpenRouter.  
Ocenia git diff według **6 kryteriów** (1–10), werdykt pass/fail, `summaryMarkdown` po polsku.

## 6 kryteriów

| Klucz                       | Opis                                                           |
| --------------------------- | -------------------------------------------------------------- |
| `implementationCorrectness` | Poprawność logiki, API, Firestore                              |
| `idiomaticity`              | Wzorce Angular 21 + Functions (ApiService, nie Firestore w UI) |
| `complexity`                | Czytelność, minimalny scope                                    |
| `testRiskCoverage`          | Testy Vitest/Karma/Playwright przy ryzyku                      |
| `documentation`             | plan.md, verification, komentarze                              |
| `securitySafety`            | Auth, sekrety, rules, walidacja                                |

**Werdykt:** `pass` — wszystkie ≥7, żadne ≤4; inaczej `fail`.  
**Parked (nie oceniane):** businessAlignment, architecturalFit.

## Wymagania

- Node.js 20+
- `OPENROUTER_API_KEY` lub `LLM_PROVIDER_API_KEY`

Bez klucza — czytelny komunikat błędu (exit 2).

## Instalacja

```bash
cd agents/code-review
npm install
cp .env.example .env   # lokalnie — nie commituj
npm run build          # dist/review.js dla CI
```

## Użycie lokalne

```bash
# z root repo (po build)
npm run review:diff -- --title "feat: moja zmiana"
npm run review:diff -- --with-tools   # + context/changes/*/plan.md (readPlan)

# dev (tsx, bez build)
git diff master...HEAD | npm run review --prefix agents/code-review -- --title "feat: foo" --json
```

Metryki tokenów na **stderr**; `--json` → stdout.

## CI — GitHub Actions

1. `git remote add origin <url>` + `git push -u origin master`
2. Secret **Settings → Actions:** `OPENROUTER_API_KEY`
3. Labele (jednorazowo):
   ```bash
   gh label create "ai-cr:passed" --color "0E8A16"
   gh label create "ai-cr:failed" --color "B60205"
   gh label create "ai-cr:review" --color "1D76DB"
   ```
4. PR do `master` → `.github/workflows/ai-code-review.yml`

**GITHUB_TOKEN permissions:** `pull-requests: write`, `issues: write` (komentarz + labele).

**Retry:** dodaj label `ai-cr:review` na PR.

**Pinning:** `checkout@v4`, `setup-node@v4`; produkcyjnie rozważ SHA pinning ([docs](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions)).

## promptfoo evals

```bash
cd agents/code-review/evals
export OPENROUTER_API_KEY=sk-or-...
npx promptfoo@latest eval
# bez klucza / starszy Node:
npx promptfoo@latest eval --dry-run
```

Szczegóły: [`evals/README.md`](evals/README.md).

## Format wyjścia (--json)

```json
{
  "scores": {
    "implementationCorrectness": 8,
    "idiomaticity": 7,
    "complexity": 8,
    "testRiskCoverage": 6,
    "documentation": 7,
    "securitySafety": 9
  },
  "verdict": "pass",
  "summaryMarkdown": "## Podsumowanie\n\n..."
}
```

## AGENTS.md

Agent wstrzykuje `../../AGENTS.md` do instructions. CI używa **scorer-only** (`tools: {}`).  
Opcjonalnie `review-with-tools.js` / `--with-tools` wczytuje plany z `context/changes/*/plan.md`.

## Typecheck (bez API)

```bash
npm run typecheck --prefix agents/code-review
```

## Powiązania

- Change M5L3: `context/changes/ci-cd-code-review/`
- Mapa możliwości: `context/champion/opportunity-map.md` (sygnał 2 — brak remote)
