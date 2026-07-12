# Context — RentMe 2.0

Centralized agent and course context. **Ladder step 1:** one root `AGENTS.md` + this tree — no per-module `AGENTS.md` or nested `context/` until the repo outgrows MVP scale.

## Layout

| Path                                  | Purpose                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| [`foundation/`](foundation/README.md) | Living docs — PRD, roadmap, tech-stack, test-plan, lessons, pending backlog |
| [`changes/<id>/`](changes/README.md)  | One folder per in-flight change (plan, research, reviews)                   |
| [`archive/`](archive/README.md)       | Completed changes (read-only)                                               |
| [`deployment/`](deployment/)          | Deploy plans and results                                                    |

## Start here

- **Onboarding:** root [`AGENTS.md`](../AGENTS.md) — hard rules, commands, architecture pointers
- **Product:** [`foundation/prd.md`](foundation/prd.md), implementation [`MVP.md`](../MVP.md)
- **What's next:** [`foundation/pending-backlog.md`](foundation/pending-backlog.md)
- **App code rules:** [`.cursor/rules/rentme-project.mdc`](../.cursor/rules/rentme-project.mdc) (`src/**` only)

## Conventions

- **Foundation** — edit-in-place; cross-change truth (see [`foundation/README.md`](foundation/README.md))
- **Changes** — scoped to one change ID; archive to `archive/` when done
- **Do not** put change-scoped artifacts in `foundation/` or overwrite `context/` during scaffold
