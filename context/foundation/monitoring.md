# Production observability (RentMe 2.0)

Minimal “camera before prod”: enable Firebase/Google Cloud signals in Console, then turn on the optional Angular Performance hook for the web app. No extra npm packages required (`firebase` already includes Performance).

## Before you ship

| Layer | What | Where |
|-------|------|--------|
| Web app | Performance Monitoring (page load, HTTP) | [Firebase Console → Performance](https://console.firebase.google.com/project/_/performance) |
| Web app | Crashlytics (JS errors) — optional, web support is limited vs mobile | [Firebase Console → Crashlytics](https://console.firebase.google.com/project/_/crashlytics) |
| API | Structured logs, errors, latency | [Google Cloud Console → Logging](https://console.cloud.google.com/logs) → filter `resource.type="cloud_function"` |
| API | Error reporting (uncaught) | Same logs + [Error Reporting](https://console.cloud.google.com/errors) (auto for Cloud Functions on GCP) |

Replace `_` in Console URLs with your `projectId` (see `.firebaserc` / `environment.ts`).

---

## 1. Firebase Performance Monitoring (web)

### Console (required)

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. **Build → Performance** → **Get started** (accept terms if prompted).
3. Ensure the **Web** app is registered under **Project settings → Your apps** (same `appId` as in `src/environments/environment.ts`).
4. After deploy, open the hosted app (or production build) and browse a few routes; first data can take **~12–24 hours**; debug events appear sooner if you use the debug workflow below.

### App (optional, already wired)

Production builds can initialize the Performance SDK when:

- `environment.production === true`
- `environment.enablePerformanceMonitoring === true` (set in `environment.prod.ts`)
- `environment.useEmulators === false`

Implementation: `getPerformance()` in `src/app/core/firebase/firebase.providers.ts`. No `@angular/fire` — modular `firebase/performance` only.

**Local debug (optional):** Follow [Test & debug web Performance](https://firebase.google.com/docs/perf-mon/get-started-web#test-debug) so events show under the debug filter in Console before go-live.

---

## 2. Crashlytics (web) — Console-first

Crashlytics for **web** is available but less mature than Android/iOS. For MVP, treat it as **Console enable + verify after first prod session**.

### Console

1. **Build → Crashlytics** → **Enable Crashlytics**.
2. Select the **Web** app when prompted.
3. Deploy a production build to Hosting (or your prod URL); trigger a test error only in a **non-user** environment if you add SDK later.

### SDK (not in repo by default)

This repo does **not** ship Crashlytics SDK calls yet (avoids bundle noise and emulator quirks). To add later: `firebase/crashlytics` + `getCrashlytics(app)` behind the same `production && !useEmulators` guard. See [Crashlytics for Web](https://firebase.google.com/docs/crashlytics/get-started?platform=web).

**Pragmatic MVP:** rely on **browser devtools**, **Performance** HTTP traces, and **Cloud Logging** for API failures until you need crash grouping in Console.

---

## 3. Cloud Functions / Express API

Functions run on Cloud Functions (2nd gen) in `europe-west1`. Logging is automatic.

### Console

1. [Logs Explorer](https://console.cloud.google.com/logs/query):  
   `resource.type="cloud_run_revision" OR resource.type="cloud_function"`  
   (exact `resource.type` depends on gen; filter by function name `api`.)
2. Pin useful queries: `severity>=ERROR`, `jsonPayload.message`, request path `/api/`.
3. Optional: **Monitoring → Alerting** → log-based alert on error rate (Blaze plan).

### What to log in code (future)

Use `functions.logger` / `console.error` with structured fields (`uid`, `route`, `requestId`). No change required for the minimal observability pass.

---

## 4. Hosting & uptime (optional)

- **Firebase Hosting:** traffic and 4xx/5xx in Console → **Hosting**.
- **Uptime:** external ping (e.g. GCP Uptime Check, Better Stack) on `/` and a lightweight `/api/health` if you add one later — not required for MVP.

---

## 5. Checklist before production traffic

- [ ] Performance enabled in Firebase Console (web app selected).
- [ ] `enablePerformanceMonitoring: true` in `environment.prod.ts`; production build deployed.
- [ ] Crashlytics enabled in Console (optional) or consciously deferred.
- [ ] Cloud Logging reviewed after a test registration + API call flow.
- [ ] Emulators off in prod (`useEmulators: false`).
- [ ] No real user PII in client logs.

---

## Related files

| File | Role |
|------|------|
| `src/environments/environment.prod.ts` | `enablePerformanceMonitoring` flag |
| `src/app/core/firebase/firebase.providers.ts` | Optional `getPerformance()` init |
| `README.md` | Link to this doc |
| `firebase.json` | Hosting / Functions deploy targets |
