---
project: rentme
checked_at: 2026-05-23T11:25:00Z
health_status: needs-attention
context_type: brownfield
language_family: js
stack_assessment_available: false
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - ci_cd
  - configuration
audit_findings:
  critical: 0
  high: 0
  moderate: 9
  low: 0
test_runner_detected: true
ci_provider: github-actions
recommended_fixes: 5
---

# RentMe 2.0 — Health Check

## Dependency Health

### Lockfile

```
Status: present (package-lock.json)
Package manager: npm (packageManager: npm@10.9.4 in package.json)
```

Secondary lockfile: `functions/package-lock.json` (Cloud Functions subtree, Node 20 per `functions/package.json` engines).

### Security Audit

```
Tool: npm audit --json (root), npm audit (functions/)
Summary (root Angular app): 0 CRITICAL, 0 HIGH, 0 MODERATE, 0 LOW
Summary (functions/ subtree): 0 CRITICAL, 0 HIGH, 9 MODERATE, 0 LOW
Direct vs transitive: functions findings are transitive (uuid, google-gax → firebase-admin)
```

Root app is clean. Functions advisories are upstream of `firebase-admin` / `firebase-functions`; `npm audit fix --force` would downgrade `firebase-admin` (breaking) — monitor on routine dependency bumps, not an immediate blocker for Angular work.

### Outdated Dependencies

```
Packages with major version gaps: 1 (root); dev-only majors on jasmine tooling
```

- **typescript**: 5.9.3 → 6.0.3 (1 major behind). Angular 21 targets TypeScript 5.x; defer TS 6 until Angular documents support.
- **@types/jasmine** / **jasmine-core**: major bumps available; optional with Karma stack.
- Angular 21.2.x patch updates available (`wanted` vs `current`); no action required for agent work.

## Test Suite

```
Test runner: Karma + Jasmine (@angular/build:karma)
Tests found: 1 spec file — src/app/core/auth/auth-ready.spec.ts (3 examples)
Test execution: passing (local, 2026-05-23)
```

```
Configuration: angular.json → projects.rentme.architect.test; karma.conf.js
Framework: Jasmine 5.x, ChromeHeadless via npm test
```

Local run (`npm test`):

```
Chrome Headless: Executed 3 of 3 SUCCESS (~0.13s)
TOTAL: 3 SUCCESS
```

Coverage is minimal (auth guard helper only). Expand specs when touching features; `skipTests: true` in schematics still skips codegen for new components.

## CI/CD

```
Provider: GitHub Actions
Configuration: .github/workflows/ci.yml
```

| Stage      | Status | Notes                                                |
|------------|--------|------------------------------------------------------|
| Lint       | ✗      | No ESLint at repo root; functions has local eslint   |
| Test       | ✓      | `npm test` (ChromeHeadless, single run)              |
| Build      | ✓      | `npm run build` (Angular production)                 |
| Type check | ✓      | Enforced via `ng build` / strict tsconfig            |
| Security   | ✗      | No audit step or Dependabot in workflow              |

Workflow triggers on **push** and **pull_request** to **main**: checkout → Node 20 → `npm ci` → `npm run build` → `npm test`.

**Not in CI (by design for this pass):** `functions` build/test, `firebase deploy`, Hosting. Deploy remains manual per `README.md` / `firebase.json`.

## Firebase & Functions (brownfield)

```
Project: rentme-b5e34 (.firebaserc)
firebase.json: hosting, functions (predeploy build), firestore, storage, auth (emailPassword)
Deploy status: config on disk; production deploy is manual (not CI-gated here)
```

| Artifact        | Local verify (2026-05-23) | Deploy notes                                      |
|-----------------|---------------------------|---------------------------------------------------|
| Angular app     | `npm run build` → OK      | `firebase deploy --only hosting` when ready       |
| Cloud Functions | `npm run build` in `functions/` → OK | Requires Blaze, App Engine once (`setup:appengine`) |
| Auth provider   | Declared in firebase.json | `npm run setup:auth` one-time                     |

Operational risks (CORS allowlist, App Engine bucket, Email/Password) are documented in `context/foundation/infra-research.md` — not re-audited in this run.

## Configuration

### High severity

None at check time (production build and tests pass).

### Medium severity

- **ESLint** — No `eslint.config.*` at repo root. Agent-generated UI code is not lint-gated in CI. Fix: `ng add @angular-eslint/schematics` and add `npm run lint` to CI when adopted.
- **Test breadth** — Only `auth-ready.spec.ts`. Refactors outside `core/auth` lack regression signal. Fix: add smoke specs per feature as files change.

### Low severity

- **Bundle budget** — `ng build` warns initial bundle exceeds 500 kB budget (~801 kB). Non-blocking; tune `angular.json` budgets or lazy-load when optimizing.
- **Functions audit** — 9 MODERATE transitive advisories; track with `firebase-admin` releases.

### Present (no gap)

- `.gitignore`, `.editorconfig`, `.prettierrc` — present
- `tsconfig.json` — `strict: true`
- `AGENTS.md`, `context/foundation/tech-stack.md`, `firebase.json` — present
- `environment.example.ts` — Firebase config template (gitignored `environment.ts`)

## Stack Assessment Cross-Reference

```
No stack-assessment.md found. Run /10x-stack-assess for quality-gate analysis.
```

`tech-stack.md` marks agent-friendly gates as satisfied; health-check confirms **local** build/test work. CI now mirrors build+test on GitHub; deploy and lint remain follow-ups.

**Historical note:** `context/changes/bootstrap-verification/verification.md` may reference an older Astro bootstrap; on-disk stack is Angular 21 + Firebase.

## Recommended Fixes

### Fix before agent work (Category A)

### 1. Add ESLint and optional CI lint step

**Impact**: Inconsistent style and missed static issues in agent PRs.

**Severity**: medium

**Effort**: moderate (15–30 min)

**Fix**:

```bash
ng add @angular-eslint/schematics
```

Then add `npm run lint` to `.github/workflows/ci.yml` when ready.

### 2. Grow test coverage beyond auth-ready

**Impact**: Feature and provider/seeker flows have no automated regression checks.

**Severity**: medium

**Effort**: moderate (per feature)

**Fix**: Add specs alongside components you change; consider `skipTests: false` in `angular.json` schematics for new code.

### 3. Track functions transitive audit advisories

**Impact**: Security noise on `functions/` installs; no known exploit path for MVP API surface.

**Severity**: low

**Effort**: quick (monitor)

**Fix**: Re-run `npm audit` in `functions/` after `firebase-admin` / `firebase-functions` bumps; avoid blind `npm audit fix --force`.

### Addressed in upcoming lessons (Category B)

### Firebase deploy automation & walking skeleton

**Lesson**: [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)

**What you'll do there**: Wire `firebase deploy` (hosting/functions/rules), secrets in CI, and close the manual-deploy gap noted above.

### CI hardening (functions, audit, deploy)

**Lesson**: M1L5 (same as deploy)

**What you'll do there**: Optional job `npm run functions:build`, audit step, and deploy gates per `tech-stack.md`.

### Agent onboarding polish

**Lesson**: [Agent Onboarding: Agents.md, AI Rules i feedback loops (M1L4)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l4)

**What you'll do there**: `/10x-agents-md`, `/10x-rule-review` on `.cursor/rules/` — `AGENTS.md` already exists.

## Verification log (this run)

| Command | Result | Notes |
|---------|--------|-------|
| `npm run build` | **PASS** | ~7.2s; bundle budget warning only |
| `npm test` | **PASS** | 3/3 in `auth-ready.spec.ts`, ChromeHeadless |
| `npm run build` (functions/) | **PASS** | `tsc` clean |
| `npm audit` (root) | **PASS** | 0 vulnerabilities |
| `npm audit` (functions/) | **ADVISORY** | 9 moderate (transitive) |

## Summary

Health status: **needs-attention**

Dependency health and reproducibility are strong (lockfiles, clean root audit). **Build and headless tests pass locally**, and **GitHub Actions CI** (`.github/workflows/ci.yml`) now runs the same on `main`. Remaining gaps are **medium**: no root ESLint, narrow test surface, and functions transitive advisories. Firebase deploy is configured but still manual — expected until M1L5.

Next step: optional ESLint + broader specs as you implement features; use CI green on PRs before merge. Proceed to M1L4 agent onboarding with this report and `tech-stack.md` on disk.
