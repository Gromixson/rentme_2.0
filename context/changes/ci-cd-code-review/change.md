---
change_id: ci-cd-code-review
title: CI/CD — AI code review w pipeline PR
status: in-progress
module: M5L3
lesson: Code Review w erze AI — standardy, DoD, Agent w pipeline
created: 2026-07-12
updated: 2026-07-12
---

# ci-cd-code-review

Automatyczny code review PR przez agenta LLM (OpenRouter) w GitHub Actions — lekcja **M5L3**.

## Intencja

- Workflow GHA na PR do `master` + `workflow_dispatch`
- Composite action `.github/actions/code-review` — stabilny runner (skompilowany `dist/review.js`)
- Agent ocenia diff według **6 kryteriów** (1–10) + DoD RentMe z `AGENTS.md`
- Side effects w workflow (nie w agencie): komentarz PR, labele `ai-cr:passed` / `ai-cr:failed`
- Retry on-demand: label `ai-cr:review` (faza 2 — workflow już nasłuchuje)
- **Parked:** businessAlignment, architecturalFit — poza scope MVP review

## Powiązania

- Agent lokalny: `agents/code-review/` (M5L2 baseline rozszerzony o 6 kryteriów)
- Evals: `agents/code-review/evals/` (promptfoo)
- Istniejący CI: `.github/workflows/ci.yml` (build/test) — osobny job

## Outcome

Po pushu na GitHub z sekretem `OPENROUTER_API_KEY` każdy PR do `master` dostaje automatyczny review comment i label werdyktu.
