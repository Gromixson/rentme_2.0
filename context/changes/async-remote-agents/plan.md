# M5L5 — Plan wykonania delegacji async

> Change: `async-remote-agents` · Delegowany change: `refactor-opportunities` Phase 1

## Faza A — Przygotowanie (kontrola ludzka)

| Krok | Opis                                              | Odpowiedzialny |
| ---- | ------------------------------------------------- | -------------- |
| A1   | Wybór zadania: Phase 1 vs digest → **Phase 1**    | Human          |
| A2   | Decyzja trybu: Tryb 2 dry-run (cloud zablokowany) | Human          |
| A3   | Napisać `decision.md` + `delegation-contract.md`  | Agent lokalny  |
| A4   | Sprawdzić blockery: remote, 10x-cli, E2E          | Agent lokalny  |

## Faza B — Delegacja (async / cloud — dry-run)

| Krok | Opis                                                        | Oczekiwany wynik         |
| ---- | ----------------------------------------------------------- | ------------------------ |
| B1   | Push branch `feature/refactor-opportunities-phase-1`        | PR na GitHub             |
| B2   | Uruchomić Cloud Agent z promptem z `delegation-contract.md` | Agent pracuje w sandbox  |
| B3   | Agent: implementacja testów + `functions:test`              | Green lokalnie w sandbox |
| B4   | Agent: commit + push                                        | Branch zaktualizowany    |
| B5   | Human: review PR (lub `agents/code-review` lokalnie)        | Approve / poprawki       |

**Status w tym repo:** B1–B5 **zablokowane** — brak `git remote`. Patrz `dry-run.md`.

## Faza C — Fallback headless (Tryb 1 — wykonane lokalnie)

| Krok | Opis                                                  | Status       |
| ---- | ----------------------------------------------------- | ------------ |
| C1   | Export minimalny `executeRespondTx` w `providers.ts`  | ✅           |
| C2   | `providers.respond.test.ts` — 6 scenariuszy           | ✅           |
| C3   | `npm run functions:test`                              | ✅ 15 passed |
| C4   | Aktualizacja `refactor-opportunities/plan.md` Phase 1 | ✅           |
| C5   | `dry-run.md` + `review.md`                            | ✅           |

## Faza D — Zamknięcie lekcji

| Krok | Opis                                              |
| ---- | ------------------------------------------------- |
| D1   | Skill stub `10x-goal-implement` (CLI auth failed) |
| D2   | Backlog M5L5 + Moduł 5 Innovate                   |
| D3   | Link w `context/README.md`                        |
| D4   | Commit dokumentacji + kodu testów                 |

## Warunek stopu całej delegacji (produkcja zespołowa)

Delegacja async uznana za **produkcyjnie bezpieczną** dopiero gdy:

1. Istnieje `git remote` + PR review
2. CI (`functions:test`) na PR green
3. Kontrakt `/goal` w repo, nie tylko w czacie
4. Cloud Agent ma read-only MCP / brak prod secrets w env

Patrz `review.md` §Decyzja zespołowa.
