# Agent code review (M5L2)

Lokalny, skryptowy agent recenzji kodu dla RentMe 2.0. Czyta **git diff ze stdin**, zwraca **strukturyzowany JSON** (5 ocen 1–10, verdict pass/fail, podsumowanie Markdown).

## Dlaczego Vercel AI SDK 6 (compose)

Lekcja M5L2 rekomenduje kategorię **compose** — jeden interfejs (`ToolLoopAgent`, `Output.object`) z wymienialnym providerem modelu. OpenRouter daje dostęp do wielu modeli bez zmiany kodu agenta. W v1 agent nie używa narzędzi (`tools: {}`) — przewidywalny, tani review diffa.

## Wymagania

- Node.js 20+
- Klucz API [OpenRouter](https://openrouter.ai/keys)

## Instalacja

```bash
cd agents/code-review
npm install
cp .env.example .env   # uzupełnij OPENROUTER_API_KEY lokalnie — nie commituj .env
```

## Zmienne środowiskowe

| Zmienna              | Wymagana | Opis                                                                                                  |
| -------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY` | tak      | Klucz OpenRouter                                                                                      |
| `REVIEW_MODEL`       | nie      | Domyślnie `anthropic/claude-sonnet-4`. Fallbacki: `anthropic/claude-3.5-sonnet`, `openai/gpt-4o-mini` |

Metryki tokenów (`totalUsage`, kroki) trafiają na **stderr**; JSON review na **stdout**.

## Użycie

Z katalogu pakietu:

```bash
git diff HEAD~1 | npm run review
```

Z katalogu głównego repozytorium:

```bash
git diff HEAD~1 | npm run review:diff
```

Inne przykłady:

```bash
git diff --staged | npm run review --prefix agents/code-review
git show 4a5b7e6 | npm run review --prefix agents/code-review
```

## Format wyjścia

```json
{
  "scores": {
    "correctness": 8,
    "security": 9,
    "maintainability": 7,
    "conventions": 8,
    "testCoverage": 6
  },
  "verdict": "pass",
  "summary": "## Podsumowanie\n\n..."
}
```

Przykładowy wynik z uruchomienia na żywo (gdy dostępny): [`sample-output.json`](sample-output.json).

## AGENTS.md

Compose SDK **nie ładuje** automatycznie reguł repozytorium. Agent wstrzykuje treść `../../AGENTS.md` (względem tego pakietu) do `instructions`.

## Typecheck (bez API)

```bash
npm run typecheck --prefix agents/code-review
```

## Scope M5L2 vs M5L3

- **M5L2 (ten pakiet):** lokalny skrypt, metryki tokenów, structured output.
- **M5L3 (później):** integracja z CI / lefthook — poza zakresem tej lekcji.

## Powiązania

- Mapa możliwości M5L1: [`context/champion/opportunity-map.md`](../../context/champion/opportunity-map.md) — sygnał 2 (brak PR review) → ten agent jako cienki helper przed merge.
