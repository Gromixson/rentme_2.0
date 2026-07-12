---
starter_id: angular
project_name: rentme
phase_3_status: ok
created: 2026-05-20
updated: 2026-05-20
---

## Hand-off

Consumed `context/foundation/tech-stack.md`:

- **starter_id:** `angular` (custom path — not `10x-astro-starter`)
- **Stack:** Angular 21 + Firebase JS SDK (Auth, Firestore, Storage)
- **package_manager:** npm
- **has_auth:** true (email/password per PRD / MVP)
- **deployment_target:** self-host / Firebase Hosting (build output from `ng build`)

Product scope aligned with service marketplace in `MVP.md` and `context/foundation/prd.md` (SEEKER / PROVIDER, categories, requests, bookings).

## Pre-scaffold verification

- Recency: Angular CLI `@angular/cli@^21` via `ng new` (official starter path for `starter_id: angular`).
- No Supabase / Astro starter used.
- `context/` preserved (foundation docs, shape-notes, PRD).

## Scaffold log

- **Strategy:** `ng new rentme` (standalone, SCSS, routing) in project cwd; not git-clone of `10x-astro-starter`.
- **Firebase:** `firebase` package + inject tokens (`FIREBASE_AUTH`, `FIRESTORE`, `STORAGE`) in `src/app/core/firebase/`; `provideRentMeFirebase()` in `app.config.ts`.
- **UI (optional):** PrimeNG added for course/MVP UI consistency.
- **Config:** `src/environments/environment.example.ts` → local `environment.ts` (gitignored); emulators optional via `useEmulators`.
- **context/:** unchanged during merge/scaffold.
- **Exit code (scaffold):** 0
- **`npm run build`:** succeeded on Angular shell immediately after scaffold (before feature modules expanded).

## Post-scaffold audit

- **`npm audit`:** run when convenient; informational only (bootstrapper WARN-AND-CONTINUE).
- **Re-check (2026-05-20):** with provider/seeker features in progress, `npm run build` may fail until `environment.apiUrl`, guards, and PrimeNG import paths match the installed PrimeNG version — re-run before demo/Mission Log acceptance.

## Hints recorded but not acted on in v1

- `deployment_target: self-host` — Firebase Hosting or static host of `dist/rentme` when ready.
- `ci_provider: github-actions` — workflow not customized for RentMe yet.
- Cloud Functions API layer described in `MVP.md` — separate from CLI scaffold; add when implementing backend routes.

## Next steps

1. Copy `src/environments/environment.example.ts` → `environment.ts` with Firebase project keys (do not commit secrets).
2. `npm start` for local Angular dev; optional Firebase emulators per `firebase.providers.ts`.
3. Implement flows per **`MVP.md`** (implementation spec) and **`context/foundation/prd.md`** (course PRD).
4. `/10x-agents-md` (M1L4) — root `AGENTS.md` documents Angular + Firebase layout.
