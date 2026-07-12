# Repository Guidelines

RentMe 2.0 is an **on-demand service marketplace** (seeker ↔ provider): **Angular 21** (standalone) + **Firebase Auth** + **Cloud Functions API** + Firestore. Product contract: `@context/foundation/prd.md`; implementation spec: `@MVP.md`; stack: `@context/foundation/tech-stack.md`.

## Hard rules

- **Auth in the client:** `signInWithEmailAndPassword` / `signOut` via `FIREBASE_AUTH` — not `POST /api/auth/login` (410; never verified passwords).
- **Domain data in the client:** HTTP only through `@src/app/core/api/api.service.ts` → `environment.apiUrl`. Default: cloud Functions URL in dev (`npm start`); `/api` via Hosting rewrite. Local Functions: `npm run dev:api` + `apiUrl: '/api'` + `@proxy.conf.json`. Do **not** read/write Firestore from components; do not add `@angular/fire`.
- Inject `FIREBASE_AUTH`, `FIREBASE_FIRESTORE`, `FIREBASE_STORAGE` from `@src/app/core/firebase/` — wired in `@src/app/app.config.ts`.
- Copy `@src/environments/environment.example.ts` → `environment.ts` locally; never commit real Firebase keys (`@.gitignore`).
- MVP excludes payments, in-app chat, OAuth, delivery logistics — `@context/foundation/prd.md` non-goals.
- Do not overwrite `context/` when scaffolding.

## Commands

| Command                  | Purpose                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `npm start`              | Dev server; API via `environment.apiUrl` (cloud Functions URL by default)                           |
| `npm run dev:api`        | Optional local Functions emulator                                                                   |
| `npm run build`          | Production build to `dist/rentme` — run after non-trivial changes                                   |
| `npm test`               | Unit tests (Karma + Jasmine, headless Chrome)                                                       |
| `npm run functions:test` | Functions unit tests (Vitest)                                                                       |
| `npm run e2e`            | Playwright E2E — guest seed always; auth needs `E2E_SEEKER_*` / `E2E_PROVIDER_*` (`@e2e/README.md`) |
| `npm run e2e:ui`         | Playwright UI mode                                                                                  |
| `npm run hooks:verify`   | Smoke-test Cursor hook scripts                                                                      |
| `npm run hooks:install`  | Install lefthook pre-commit (Prettier + tsc on staged files)                                        |

## Architecture

| Layer           | Location / notes                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Angular UI      | `src/app/` — `core/` · `features/` (auth, seeker, provider, bookings) · `shared/`                         |
| API client      | `ApiService` → `environment.apiUrl`; errors `{ error: string }` → `err?.error?.error`                     |
| Cloud Functions | `functions/src/` — Express routes, Firestore transactions server-side                                     |
| Firebase        | Auth + Firestore + Storage via injected tokens; rules in `firestore.rules`, `storage.rules`               |
| Routing         | `@src/app/app.routes.ts` — `/seeker/*` → `roleGuard('SEEKER')`, `/provider/*` → `roleGuard('PROVIDER')`   |
| Roles           | `activeRole` from profile drives home redirect; switch via `POST /auth/active-role`, then refresh profile |

Firestore shape (server-side): `@.cursor/skills/rentme-firebase/references/firestore-model.md`. App rules for `src/**`: `@.cursor/rules/rentme-project.mdc`.

## Conventions

- Standalone components; SCSS per component; Prettier `@.prettierrc`
- Functions register roles: only `SEEKER` and `PROVIDER` (`@functions/src/routes/auth.ts`)
- Default **`useEmulators: false`**; optional emulators via `useEmulators: true` in `@src/app/core/firebase/firebase.providers.ts`
- Commits: short imperative messages (e.g. `feat: add provider request list`)

## Agent skills

| Skill             | When                                       |
| ----------------- | ------------------------------------------ |
| `rentme-stack`    | Folders, MVP scope                         |
| `rentme-firebase` | Auth, Firestore, Storage, rules, emulators |
| `rentme-feature`  | A specific FR/US from PRD                  |
| `/10x-*`          | Course workflow under `context/` only      |

## Reference

| Topic               | Path                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| Context index       | `@context/README.md`                                                           |
| PRD, roadmap, tests | `@context/foundation/` — `prd.md`, `roadmap.md`, `test-plan.md`, `lessons.md`  |
| Pending work        | `@context/foundation/pending-backlog.md`                                       |
| In-flight changes   | `@context/changes/`                                                            |
| Deploy              | `@context/deployment/`, `@README.md` (one-time Firebase setup)                 |
| Quality gates       | `@context/foundation/test-plan.md` §7, `@.cursor/rules/m3l3-quality-gates.mdc` |
| Course chain        | `@.cursor/rules/10x-course.mdc` (applies to `context/**`)                      |

<!-- BEGIN @rentme/ai-toolkit -->

## RentMe AI Toolkit — reguły zespołowe

> Wstrzyknięte przez `@rentme/ai-toolkit`. Nie edytuj ręcznie między sentinelami — uruchom `npm run toolkit:install` po aktualizacji paczki.

### Code review

- Przed merge PR uruchom skill `rentme-code-review` lub lokalny agent: `git diff origin/main...HEAD | npm run review:diff` (wymaga `OPENROUTER_API_KEY` w `agents/code-review/`).
- **Verdict `fail`** blokuje merge bez uzgodnionej poprawki lub świadomej akceptacji ryzyka w opisie PR.
- Krytyczne naruszenia: Firestore w komponentach, `POST /api/auth/login`, sekrety w repo, brak testów przy zmianach w `respond` / expiry / transakcjach.

### Współdzielone artefakty

| Artefakt     | Ścieżka po instalacji                        |
| ------------ | -------------------------------------------- |
| Skill review | `.cursor/skills/rentme-code-review/SKILL.md` |
| Prompt PR    | `.cursor/prompts/review-pr.md`               |
| Manifest     | `.cursor/.rentme-ai-toolkit-manifest.json`   |

### Aktualizacja toolkitu

```bash
npm run toolkit:install    # po bump wersji @rentme/ai-toolkit
npm run toolkit:uninstall  # usuwa tylko pliki z manifestu
```

<!-- END @rentme/ai-toolkit -->
