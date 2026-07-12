# Deployment result — 2026-07-12

Target project: `rentme-b5e34`  
Public URL: https://rentme-b5e34.web.app  
Console: https://console.firebase.google.com/project/rentme-b5e34/overview

## Result

- Angular production build: **passed**.
- Functions TypeScript build: **passed**.
- Firestore rules compilation: **passed**.
- Firestore rules and indexes: **deployed**.
- Functions `api` and `expireRequests`: **deployed**, 2nd gen, Node.js 22,
  `europe-west1`.
- Direct Function health check: **passed**, `{"ok":true}`.
- Firebase Hosting production release: **deployed**.
- Hosting root: **HTTP 200**.
- Angular deep route `/login`: **HTTP 200**, SPA shell present.
- Hosting rewrite `/api/health`: **HTTP 200**, `{"ok":true}`.
- Public `/api/categories`: **HTTP 200**, JSON.

The Angular build reports a non-blocking initial bundle budget warning:
836.11 kB against the 500 kB warning threshold. It remains below the 1 MB error
threshold.

## Changes made for production

- Hosting serves `dist/rentme/browser`.
- `/api/**` explicitly targets function `api` in `europe-west1`.
- Functions runtime was upgraded from deprecated Node.js 20 to Node.js 22.
- `firebase-functions` was upgraded to the current compatible release.
- Compatible dependency audit fixes removed the high-severity findings; eight
  moderate transitive `uuid` findings remain behind `firebase-admin` 13. A
  forced audit fix would install incompatible `firebase-admin` 14, so it was not
  applied.
- Production and development environment files are ignored; safe templates are
  committed instead.

## Partial blockers and manual actions

### Firebase Storage

Storage rules were not deployed because Firebase Storage has not been initialized
for this project. The CLI reported:

```text
Firebase Storage has not been set up on project 'rentme-b5e34'.
```

Manual owner action:

1. Open https://console.firebase.google.com/project/rentme-b5e34/storage.
2. Click **Get started**, confirm the intended bucket location and billing
   implications.
3. Run:
   `npx -y firebase-tools@latest deploy --only storage --project rentme-b5e34`.

The current client initializes the Storage SDK but has no upload/read feature, so
this did not block the deployed MVP smoke tests.

### Artifact Registry cleanup

Functions deployed successfully, but the CLI returned a final non-zero exit code
because no container-image cleanup policy exists in `europe-west1`. No policy was
created automatically because it deletes old images and requires explicit owner
approval.

After approving retention, run:

```text
npx -y firebase-tools@latest functions:artifacts:setpolicy --location europe-west1
```

Review the CLI's proposed retention before confirming.

### 10xDevs lesson pack

Fetching M1L5 was blocked by an expired 10x CLI session. The manifest therefore
still truthfully points to `m1l4`; it was not forged. The existing RentMe override
in `.cursor/rules/10x-course.mdc` remains intact.

Manual owner action:

1. Run `npx @przeprogramowani/10x-cli@latest auth --email <COURSE_EMAIL>`.
2. Complete the emailed authentication flow.
3. Run
   `npx @przeprogramowani/10x-cli@latest get m1l5 --tool cursor`.
4. Verify `.cursor/.10x-cli-manifest.json` says `m1l5` and the RentMe override
   remains outside the generated BEGIN/END block.

The infrastructure research, anti-bias analysis, deploy plan, production
deployment and result recording were completed manually according to the lesson
contract despite that content-fetch blocker.
