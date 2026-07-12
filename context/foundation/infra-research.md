---
project: rentme
researched_at: 2026-05-23
stack: angular-21-firebase
region: europe-west1
billing_plan: blaze
context_type: brownfield
sources:
  - functions/src/app.ts
  - functions/src/index.ts
  - firebase.json
  - README.md
  - scripts/setup-appengine.mjs
---

# RentMe 2.0 — Infrastructure Research (lite)

**Scope:** Firebase production path for Angular 21 + Auth + Firestore + Cloud Functions v2 (`europe-west1`). Not a deploy runbook — see `README.md` for commands.

## Stack snapshot

| Layer   | Production                                                       |
| ------- | ---------------------------------------------------------------- |
| Client  | Angular 21 → Hosting (`dist/rentme/browser`) or `localhost:4200` |
| Auth    | Firebase Auth Email/Password (client SDK only)                   |
| Data    | Firestore (server via Admin SDK in Functions)                    |
| API     | HTTPS `api` + scheduled `expireRequests` in `europe-west1`       |
| Billing | **Blaze** required for Cloud Functions + Scheduler               |

Hosting rewrites `/api/**` → function `api`; dev proxy targets `…/europe-west1/api` (see `proxy.conf.json`).

---

## Devil's advocate — what breaks in prod

1. **CORS / origin mismatch** — API uses Express `cors` with a fixed allowlist (`functions/src/app.ts`). A custom domain, preview URL, or `ng serve` on a non-listed port gets blocked; browser shows generic “no API” toasts.
2. **Auth provider off** — Register/login hit Firebase Auth directly; if Email/Password is disabled in Console and `setup:auth` was never run, users see Firebase errors unrelated to Functions health.
3. **Functions never deployed / App Engine missing** — First deploy fails with bucket 403 until App Engine exists (`npm run setup:appengine`). Local `ng serve` against cloud `apiUrl` then fails with connection errors.
4. **Firestore rules vs API** — Client must not write domain collections; if rules are too open, security hole; if too tight without Functions deployed, nothing works. Misconfigured indexes break `expireStalePendingRequests` queries at scale.
5. **Scheduled expiry lag** — `expireRequests` runs every minute; UX assumes ~2 min request timeout (`REQUEST_TIMEOUT_MS`). Heavy load + batch limit (100/run) can leave stale `PENDING` until lazy expiry on read (`resolveRequestStatus`).
6. **Cold starts** — Gen2 `api` after idle: first request slow; no `minInstances` in repo — acceptable for MVP, painful under demos or traffic spikes.
7. **Emulator drift** — `useEmulators: true` while pointing `apiUrl` at production (or vice versa) mixes Auth hosts and tokens; classic “works locally once” trap.

---

## Pre-mortem — top 3 failure scenarios

| #   | Scenario                                      | How it surfaces                                                                                                                      | Mitigation                                                                                                                                           |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Deploy without App Engine**                 | `firebase deploy --only functions` → 403 on default GCS bucket for Functions v2 artifacts                                            | Run `npm run setup:appengine` once per project (`europe-west` location in `scripts/setup-appengine.mjs`); wait ~1 min, redeploy                      |
| 2   | **Production CORS blocks the real UI origin** | Seeker/provider flows fail after Hosting on custom URL; Network tab: CORS error on `/api/*`                                          | Add exact origin to `allowedOrigins` in `functions/src/app.ts`, redeploy functions; prefer `*.web.app` / `*.firebaseapp.com` regexes already present |
| 3   | **Auth Email/Password disabled**              | Registration returns Firebase `auth/operation-not-allowed`; API register may surface Polish hint from `functions/src/routes/auth.ts` | `npm run setup:auth` (`firebase deploy --only auth` per `firebase.json` `auth.providers.emailPassword`) or enable manually in Console                |

---

## Unknown unknowns

| Area                             | Risk                                                                       | Notes for RentMe                                                                                                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Billing (Blaze)**              | Unexpected charges if schedulers/API abused                                | Blaze unlocks Functions + Scheduler; free tiers cover MVP traffic. **`expireRequests` every 1 min ≈ 43k invocations/month** plus Scheduler job — negligible at demo scale; revisit if query work per tick grows (Firestore reads on `PENDING` + `expiresAt`). |
| **IAM**                          | Over-privileged default SA, leaked service account keys                    | Functions run as project default compute SA; needs Firestore access. No keys in repo — good. Review Firestore/Storage rules on each rules deploy.                                                                                                             |
| **CORS**                         | `onRequest({ cors: false })` — Firebase does not add CORS; Express owns it | Requests with no `Origin` (curl, some tools) allowed; browser calls from allowed origins only. `credentials: true` — cookies not used for API auth (Bearer token).                                                                                            |
| **Cold starts**                  | Latency spikes, timeouts on slow mobile                                    | Gen2 in `europe-west1`; consider `minInstances: 1` on `api` only if demos require it (cost).                                                                                                                                                                  |
| **Indexes**                      | Composite query on `requests` (`status` + `expiresAt`)                     | Ensure `firestore.indexes.json` deployed with rules; missing index → scheduler logs errors, expiry stuck.                                                                                                                                                     |
| **Region lock-in**               | All Functions + App Engine location must stay consistent                   | Project scripted for `europe-west` / `europe-west1`; cross-region adds latency and config pain.                                                                                                                                                               |
| **ID token clock skew / expiry** | 401 on API after long idle tab                                             | Client should refresh token before protected calls (standard Firebase SDK behaviour).                                                                                                                                                                         |

---

## Auth — Email/Password & `setup:auth`

- **Client:** `signInWithEmailAndPassword` / `signOut` via `FIREBASE_AUTH` — not `POST /api/auth/login` (410).
- **Server:** `POST /api/auth/register` creates Firestore profile after Firebase user exists; protected routes expect `Authorization: Bearer <ID token>`.
- **One-time enable:** `firebase.json` declares `auth.providers.emailPassword: true`. **`npm run setup:auth`** runs `firebase deploy --only auth` so Console matches repo. Without it, Email/Password may stay off on a fresh project.

---

## Scheduler — `expireRequests` (every 1 minute)

Defined in `functions/src/index.ts`:

- Schedule: `every 1 minutes`, region `europe-west1`.
- Work: `expireStalePendingRequests()` — query up to 100 `PENDING` requests with `expiresAt <= now`, batch update to `TIMEOUT`.
- **Lazy fallback:** reads through `resolveRequestStatus` still expire overdue rows if scheduler misses.

**Blaze cost note:** Requires billing enabled. At MVP volume, cost is dominated by free quotas (Cloud Scheduler + Functions invocations). Cost becomes visible if: (a) minute tick does expensive scans, (b) many environments each run their own scheduler, (c) `minInstances` added elsewhere. For course/MVP, **do not change to sub-minute** without product reason — doubles Scheduler/Function invocations.

---

## CORS — allowed origins (`functions/src/app.ts`)

```text
http://localhost:4200
http://127.0.0.1:4200
^https://.*\.web\.app$
^https://.*\.firebaseapp\.com$
```

- **Not listed:** custom domains, Vercel/Netlify previews, alternate dev ports — must extend the array and redeploy.
- **Hosting + API same project:** browser calls `https://<project>.web.app/api/...` — origin matches regex; rewrite to `api` function is server-side (no CORS for same-origin Hosting rewrite from browser’s perspective when using relative `/api` — but RentMe client uses `environment.apiUrl`, often full Functions URL in cloud mode; then CORS applies).

---

## App Engine prerequisite (Functions v2 deploy)

Cloud Functions **2nd gen** use an App Engine–associated default bucket for build artifacts. **First-time deploy fails without an App Engine app.**

- **Script:** `npm run setup:appengine` → `scripts/setup-appengine.mjs` enables App Engine API and creates app with `locationId: europe-west` (pairs with Functions region).
- **After create:** wait ~1 minute, then `firebase deploy --only functions` (see README troubleshooting table).

---

## References

- Commands & troubleshooting: `@README.md` (Blaze setup block)
- API surface: `@MVP.md`
- Agent hard rules: `@AGENTS.md`
