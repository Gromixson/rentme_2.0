# Repository Guidelines

RentMe 2.0 is an **on-demand service marketplace** (seeker ↔ provider): **Angular 21** (standalone) + **Firebase Auth** + **Cloud Functions API** + Firestore. Implementation detail: `@MVP.md`; product contract: `@context/foundation/prd.md`; stack: `@context/foundation/tech-stack.md`.

## Hard rules

- **Auth in the client:** `signInWithEmailAndPassword` / `signOut` via `FIREBASE_AUTH` — not `POST /api/auth/login` (that endpoint returns 410; it never verified passwords).
- **Domain data in the client:** HTTP only through `@src/app/core/api/api.service.ts` → `environment.apiUrl`. Default online: Cloud Functions URL in dev (`npm start`); `/api` when served via Firebase Hosting rewrite. Local Functions only with `npm run dev:api` + `apiUrl: '/api'` + `@proxy.conf.json`. Do **not** read/write Firestore from components; do not add `@angular/fire`.
- Inject tokens `FIREBASE_AUTH`, `FIREBASE_FIRESTORE`, `FIREBASE_STORAGE` from `@src/app/core/firebase/` — wired in `@src/app/app.config.ts`.
- Copy `@src/environments/environment.example.ts` → `environment.ts` locally; never commit real Firebase keys (see `@.gitignore`).
- MVP excludes payments, in-app chat, OAuth, and delivery logistics — see non-goals in `@context/foundation/prd.md`.
- Do not overwrite `context/` when scaffolding; it holds PRD and course artifacts.

## API errors (project convention)

Backend and Functions return `{ error: string }`. In Angular HTTP error handlers use `err?.error?.error` (see `@src/app/features/provider/dashboard/provider-dashboard.component.ts`).

## Routing & roles

- `activeRole` from profile drives home redirect (`@src/app/features/home/home.component.ts`).
- `/seeker/*` → `roleGuard('SEEKER')`; `/provider/*` → `roleGuard('PROVIDER')` (see `@src/app/app.routes.ts`).
- Switch role via API `POST /auth/active-role`, then refresh profile.

## Project structure

```
src/app/
  core/       # firebase, api, auth guards, models
  features/   # auth | seeker | provider | bookings
  shared/     # presentational UI, toast
```

- Routes: `@src/app/app.routes.ts`
- Firestore shape (server-side): `@.cursor/skills/rentme-firebase/references/firestore-model.md`

## Build, test, and development

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server (`ng serve`); API via `environment.apiUrl` (cloud Functions URL by default) |
| `npm run dev:api` | Optional: local Functions emulator only |
| `npm run build` | Production build to `dist/rentme` |
| `npm test` | Unit tests (Karma + Jasmine, headless Chrome) |

New Firebase project (once): `setup:firestore` → `setup:appengine` → `setup:auth` → `firebase deploy --only functions,firestore:rules`. See `@README.md`.

Run `npm run build` after non-trivial changes.

## Coding style

- Standalone components; SCSS per component
- Prettier: `@.prettierrc` — `npx prettier --write .` when touching many files
- App code under `src/`: follow `@.cursor/rules/rentme-project.mdc`

## Agent skills (invoke by name)

| Skill | When |
|-------|------|
| `rentme-stack` | Folders, MVP scope |
| `rentme-firebase` | Auth, Firestore, Storage, rules, emulators |
| `rentme-feature` | A specific FR/US from PRD |
| `/10x-*` | Course workflow under `context/` only |

## Lessons learned

Recurring agent mistakes: `@context/foundation/lessons.md`

## Security and configuration

- Firebase config: `src/environments/environment.ts` (gitignored); default **`useEmulators: false`** (cloud Auth/Firestore)
- Optional local emulators: `useEmulators: true` — `@src/app/core/firebase/firebase.providers.ts`
- Functions register roles: only `SEEKER` and `PROVIDER` (see `@functions/src/routes/auth.ts`)

## Commits and PRs

Short imperative messages (e.g. `feat: add provider request list`).
