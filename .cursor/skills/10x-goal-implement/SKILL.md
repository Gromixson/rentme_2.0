---
name: 10x-goal-implement
description: Headless phase implementation from a versioned plan.md — STOP on ambiguity, gate on tests, conventional commits. Use when /goal or async delegation targets a single plan phase (e.g. refactor-opportunities phase 1). Stub for M5L5 when 10x-cli m5l5 unavailable.
---

# /10x-goal-implement — Headless Phase from Plan

Implement **one phase** from an existing `context/changes/<change-id>/plan.md`. Designed for local headless agents or Cloud Agent replay when the course skill pack is unavailable.

## When to use

- Async/remote delegation with a bounded `/goal` prompt
- `/10x-implement <change-id> phase N` equivalent without CLI sync
- Phase work already specified in `plan.md` (files, contracts, success criteria)

## Hard rules

1. **STOP on ambiguity** — if plan vs code diverges, write a question to `context/changes/<change-id>/dry-run.md` or the active change folder; do not guess.
2. **One phase only** — do not start Phase N+1 without explicit approval.
3. **Gates from plan** — run every command listed under „Weryfikacja fazy” / Success criteria (auto) before marking done.
4. **No production secrets** — never read `environment.ts`, `.env`, E2E creds, or deploy keys.
5. **Conventional commits** — `feat(scope):`, `fix(scope):`, `docs:` matching repo history; one phase per commit when possible.
6. **Mechanism vs enforcement** — tests are mechanism; existing CI (`functions:test`, `npm run build`) is enforcement — do not add new hooks unless plan requires it.

## Process

### Step 1: Load context

Read in order:

1. `@AGENTS.md`
2. `@context/changes/<change-id>/plan.md` — target phase section only
3. `@context/changes/<change-id>/change.md` — scope boundaries
4. Related test plan rows (e.g. `@context/foundation/test-plan.md`)

### Step 2: Confirm phase contract

Extract from plan:

- **Files** to create/modify
- **Behavior contract** (table or bullets)
- **Success criteria (auto)** — checkboxes
- **What We're NOT Doing** — do not violate

If any file path is missing or contract is incomplete → **STOP**.

### Step 3: Implement minimally

- Match patterns from neighbouring code (e.g. `requests.test.ts` for Vitest mocks)
- Smallest diff that satisfies contract
- Export helpers **only if** plan allows („minimalny export … tylko jeśli test wymaga”)

### Step 4: Verify gates

Run commands from plan verbatim, e.g.:

```bash
npm run functions:test
npm run functions:build
```

All must pass before updating plan progress table.

### Step 5: Update progress

In `plan.md` Progress table:

| Phase | Status | Commit   | Notes      |
| ----- | ------ | -------- | ---------- |
| N     | done   | `<hash>` | brief note |

### Step 6: Commit

Short imperative message; include phase reference in body if multi-phase change.

## plan.md format reference

Phases follow this structure (from `refactor-opportunities/plan.md`):

- `## Phase N: Title`
- `### Overview`
- `### Pliki` — Intent, Contract, Changes
- `### Success criteria (auto)` — checkboxes
- `### Weryfikacja fazy` — bash commands

## Async delegation handoff

When used from Cloud Agent, the human-readable contract lives in:

`context/changes/async-remote-agents/delegation-contract.md`

Agent must not expand scope beyond the `/goal` block.

## Out of scope

- Cloud deploy, Firebase MCP live writes, E2E with real creds
- Multi-phase refactors in one run
- Overwriting `context/archive/`
