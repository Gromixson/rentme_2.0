---
change_id: async-remote-agents
title: M5L5 — Async & Remote Agents (delegacja + dry-run)
status: complete
created: 2026-07-12
updated: 2026-07-12
lesson: M5L5
upstream_plan: context/changes/refactor-opportunities/plan.md
related_changes:
  - refactor-opportunities
---

## Intencja

Przygotować i udokumentować **jedną realną delegację async/remote** z jasnymi granicami: wybór zadania, tryb kontroli, kontrakt `/goal`, workflow change oraz dry-run operacyjny (gdy Cloud Agent niedostępny).

## Wybrane zadanie delegacji

**`refactor-opportunities` Phase 1** — Vitest harness dla `POST .../respond`.

## Artefakty lekcji

| Plik                     | Opis                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `decision.md`            | Zadanie + tryb kontroli (Tryb 2 dry-run + Tryb 1 lokalnie)     |
| `delegation-contract.md` | Pełny prompt `/goal` po polsku                                 |
| `requirements.md`        | Wymagania i granice                                            |
| `plan.md`                | Kroki wykonania delegacji async                                |
| `dry-run.md`             | Status każdego kroku (wykonane / zablokowane / do sprawdzenia) |
| `review.md`              | Checklist review + decyzja zespołowa                           |

## Powiązania

- Plan implementacji: [`refactor-opportunities/plan.md`](../refactor-opportunities/plan.md)
- M5L1 digest: `npm run status:digest`
- M5L2 agent review: `agents/code-review/`
- Backlog: [`context/foundation/pending-backlog.md`](../../foundation/pending-backlog.md)

## Acceptance (M5L5)

- [x] `decision.md` — zadanie + tryb + uzasadnienie braku prod scope
- [x] `delegation-contract.md` — `/goal` z Cel/Zakres/Stop/Setup/Sieć/MCP/Sekrety/Review
- [x] Workflow change (change, requirements, plan, dry-run)
- [x] Skill stub `10x-goal-implement` (10x-cli auth failed)
- [x] Phase 1 wykonana lokalnie (Tryb 1 headless) — 6 testów, 15 total PASS
- [x] `review.md` + aktualizacja backlogu
