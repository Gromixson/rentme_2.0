# Production deployment plan

Target: Firebase project `rentme-b5e34`  
Platform: Firebase Hosting + Cloud Functions 2nd gen + Firestore + Storage  
Owner: repository owner; automation executes only the approved resource list

## Release order

The backend and rules go first. Hosting goes live only after the direct Function
health check succeeds. This prevents publishing an SPA whose same-origin API
rewrite points at a missing function.

## Manual prerequisites

Owner confirms these once in Firebase/Google Cloud Console:

- authenticated account has deploy access to `rentme-b5e34`;
- Blaze billing is enabled for 2nd-gen Functions and Cloud Scheduler;
- billing budget alerts are configured;
- Firestore `(default)` exists in `eur3`;
- App Engine/service infrastructure required by Functions exists;
- Authentication Email/Password is enabled;
- default Storage bucket exists;
- required APIs shown by Firebase CLI are enabled;
- `src/environments/environment.prod.ts` exists locally from
  `environment.prod.example.ts` and contains the correct Firebase web config;
- no service-account key, refresh token or private key is present in the repo.

Enabling billing, APIs, IAM roles or creating/deleting cloud resources is a human
approval gate. Do not accept automatic function deletion prompts.

## Preflight and build

Run from the repository root:

```text
npx -y firebase-tools@latest --version
npx -y firebase-tools@latest login:list
npx -y firebase-tools@latest use
npx -y firebase-tools@latest projects:list
npm ci
npm ci --prefix functions
npm run build
npm run functions:build
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes,storage --project rentme-b5e34 --dry-run
```

Expected:

- active/target project is exactly `rentme-b5e34`;
- Angular output exists at `dist/rentme/browser/index.html`;
- Functions compile to `functions/lib`;
- build exits zero (the current Angular initial-bundle budget warning is
  non-blocking);
- rules/index configuration parses without errors.

If the installed CLI does not support `deploy --dry-run`, omit only that line;
the build and explicit project/resource flags remain mandatory.

## Production deploy

Human approval gate: owner approves live backend/rules deployment.

```text
npx -y firebase-tools@latest deploy --only functions,firestore:rules,firestore:indexes,storage --project rentme-b5e34
```

Do not approve deletion of any deployed function automatically. If the CLI
reports a removed function, stop and review it.

Validate the direct API:

```text
Invoke-RestMethod https://europe-west1-rentme-b5e34.cloudfunctions.net/api/api/health
```

Expected HTTP 200 and a healthy JSON response.

Human approval gate: after the direct API passes, owner approves live frontend.

```text
npx -y firebase-tools@latest deploy --only hosting --project rentme-b5e34
```

## Post-deploy validation

```text
Invoke-WebRequest https://rentme-b5e34.web.app/ -UseBasicParsing
Invoke-RestMethod https://rentme-b5e34.web.app/api/health
Invoke-RestMethod https://rentme-b5e34.web.app/api/categories
npx -y firebase-tools@latest functions:list --project rentme-b5e34
npx -y firebase-tools@latest hosting:channel:list --project rentme-b5e34
```

Acceptance:

- SPA root returns HTTP 200;
- a deep Angular route returns `index.html` rather than 404;
- `/api/health` returns HTTP 200 through the Hosting rewrite;
- public categories endpoint returns JSON;
- `api` and `expireRequests` are deployed in `europe-west1`;
- Firebase Hosting console shows a new live release.

Manually smoke-test registration/login and one role switch with a disposable
account. Do not seed production with course/demo data.

## Preview deployment

For frontend review only:

```text
npm run build
npx -y firebase-tools@latest hosting:channel:deploy m1l5 --expires 7d --project rentme-b5e34
```

The preview uses the production Function and data. Do not run destructive tests
there. Create a separate staging Firebase project before CI or team previews.

## Configuration and secrets

- Local production config: `src/environments/environment.prod.ts` (ignored).
- Safe template: `src/environments/environment.prod.example.ts`.
- Firebase Functions secrets, when introduced:
  `npx -y firebase-tools@latest functions:secrets:set SECRET_NAME`.
- CI authentication: dedicated principal with least privilege and workload
  identity federation where supported.
- Never commit `FIREBASE_TOKEN`, service-account JSON or `.env` credentials.

## Rollback

Hosting:

1. Firebase Console → Hosting → Release history.
2. Select the last known-good release → **Roll back**.
3. Re-run root and `/api/health` smoke tests.

CLI promotion of a tested channel is also possible:

```text
npx -y firebase-tools@latest hosting:clone rentme-b5e34:<channel> rentme-b5e34:live
```

Functions/rules/indexes:

1. Human selects the known-good Git revision.
2. Build it locally/CI.
3. Redeploy the explicit affected resource list.
4. Prefer roll-forward compatibility; do not delete functions or indexes during
   an incident unless separately approved.

Hosting rollback is not an API/database rollback. If schema behavior changed,
deploy the compatible backend before switching the frontend release.

## Stop conditions

Stop without publishing Hosting when:

- project ID differs;
- Blaze, IAM, API enablement, quota or App Engine setup blocks Functions;
- direct Function health check fails;
- production environment config is absent;
- deploy asks to delete a function;
- rules validation fails.

Safe rules-only deployment is allowed only when it is independently required and
does not make the current live clients unusable. Hosting-only deployment is not
allowed when the required API function is absent.
