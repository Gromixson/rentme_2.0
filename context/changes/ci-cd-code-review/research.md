# Research — ci-cd-code-review (M5L3)

> Data: 2026-07-12

## Istniejący stan

| Element                    | Stan                                                                      |
| -------------------------- | ------------------------------------------------------------------------- |
| `agents/code-review/`      | **Brak przed M5L3** — utworzony od zera (M5L2 baseline w jednym commicie) |
| `.github/workflows/ci.yml` | Istnieje — `build` + `test` + `functions:test` na `main`/`master` PR      |
| `git remote`               | **Brak** — workflow gotowy, ale nie uruchomi się do pushu                 |
| `gh` CLI                   | Nie w PATH lokalnie; w GHA `gh` dostępny na runnerze                      |
| Sekrety OpenRouter         | Nie skonfigurowane — wymagane przez użytkownika w GitHub Settings         |

## Decyzje

1. **Skompilowany agent** (`esbuild` → `dist/review.js`) zamiast `tsx` w CI — stabilniejszy composite action.
2. **OpenRouter** jako provider LLM — jeden klucz, wiele modeli (evals + runtime).
3. **Komentarz PR w workflow**, nie w agencie — prostszy MVP, mniejszy scope agenta.
4. **Branch docelowy `master`** — zgodny z lokalnym default branch; `ci.yml` używa `main` — do ujednolicenia opcjonalnie później.
5. **readPlan** jako osobny entry (`review-with-tools.js`), nie domyślny w CI.

## Ryzyka

- Duży diff PR → limit tokenów / koszt — `pr-body` opcjonalny w CI.
- Brak labeli `ai-cr:*` w repo → pierwszy run `gh pr edit` może wymagać `gh label create` (udokumentowane w README).
- JSON schema support zależy od modelu OpenRouter — fallback: parse + Zod validate.

## Referencje

- `AGENTS.md` — kryteria RentMe
- `context/changes/*/plan.md` — kontekst readPlan
- `context/champion/opportunity-map.md` — sygnał #2 (brak remote)
