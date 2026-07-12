---
change_id: ai-toolkit-registry
title: Shared AI Registry — @rentme/ai-toolkit
status: done
created: 2026-07-12
updated: 2026-07-12
lesson: M5L4
related:
  - agents/code-review
  - context/champion/opportunity-map.md
---

## Intencja

Wydzielić współdzielone artefakty AI (skill code-review, reguły zespołowe, prompt PR) do paczki `@rentme/ai-toolkit` z installerem multi-tool (Cursor / Claude Code / Codex) i przygotować publish na GitHub Packages po dodaniu remote.

## Zakres MVP

| W pakiecie                                | Poza MVP                                      |
| ----------------------------------------- | --------------------------------------------- |
| 1 skill: `rentme-code-review`             | Pełny zestaw skilli `rentme-*`                |
| 1 rules snippet → sentinel w `AGENTS.md`  | Nadpisywanie `10x-course.mdc`                 |
| 1 prompt: `review-pr.md`                  | Marketplace / 10x-cli jako źródło produkcyjne |
| `install.mjs` / `uninstall.mjs` copy mode | Symlinki, auto-bump wersji                    |

## Acceptance (M5L4)

- [x] `decision.md` — Model 1 vs 2 vs 3 (PL)
- [x] `requirements.md`, `research.md`, `plan.md`
- [x] `packages/rentme-ai-toolkit/` — paczka + README
- [x] `npm run toolkit:install` — weryfikacja lokalna
- [x] Workflow publish (root + package)
- [x] `pending-backlog.md` — M5L4 complete

## Powiązania

- M5L2: `agents/code-review/` — agent OpenRouter (kryteria w `review-schema.ts`)
- M5L1: sygnał 2 (brak remote/PR) — toolkit uzupełnia review przed push
- Model 3: `.cursor/rules/10x-course.mdc` blok `BEGIN/END @przeprogramowani/10x-cli` — osobny kanał kursu
