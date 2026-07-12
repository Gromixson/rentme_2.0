# Infrastructure decision

Status: accepted for the MVP  
Decision date: 2026-07-12  
Scope: Angular SPA, HTTP API, scheduled expiry job, Auth, Firestore, Storage

## Decision

Use **Firebase Hosting (Classic)** for the Angular SPA and **Cloud Functions for
Firebase, 2nd gen** for the Express API and scheduled job. Keep Firebase Auth,
Firestore and Storage in the same Firebase project, `rentme-b5e34`.

This is a managed/serverless production architecture. It preserves the existing
SDK, identity, data model, rules, Express code and one-project operational model.
The frontend is a static Angular build; it does not need Firebase App Hosting or
SSR.

Runtime and location decisions:

- Functions runtime: Node.js 22. The live Firebase CLI reported Node.js 20 as
  deprecated since 2026-04-30 and scheduled for decommissioning on 2026-10-30,
  so the repository was upgraded during this review.
- HTTP and scheduled functions: `europe-west1`.
- Firestore: `eur3`; `europe-west1` is the documented nearest Functions region.
- Hosting: global CDN; `/api/**` explicitly rewrites to function `api` in
  `europe-west1`.
- Plan: Blaze is required to deploy Functions. Add a budget alert before real
  traffic; a budget is an alert, not a hard spending cap.

## Evaluation criteria

Criteria are marked Pass, Partial or Fail for this repository:

### Firebase Hosting + Functions — selected

- **Stack/runtime fit — Pass.** Native fit for the existing Angular static build,
  Firebase Auth, Admin SDK, Firestore, Storage, scheduler and Express Function.
- **Managed/serverless — Pass.** CDN, TLS, scaling and runtime are managed.
- **CLI and agent-readable configuration — Pass.** `firebase.json`,
  `.firebaserc`, rules and indexes are declarative; the CLI supports scoped
  deploys, channels and release inspection.
- **Deploy API/integration — Pass.** Firebase CLI and Firebase Management APIs
  are available; the Firebase MCP provides project and deploy operations.
- **Preview — Pass with caveat.** Hosting preview channels have temporary URLs
  and configurable expiry. Without `pinTag`, previews use the production API
  rewrite; they must not be used for destructive test data.
- **Rollback — Pass with caveat.** Hosting has release history and rollback.
  Functions and database rules are rolled forward by redeploying a known Git
  revision; they are not automatically rolled back with Hosting.
- **EU/data proximity — Pass.** `eur3` plus `europe-west1` is the documented
  close pairing.
- **Cost predictability — Partial.** Hosting has a no-cost allowance, but
  Functions require Blaze and usage-based billing.

### Cloudflare Pages + existing Firebase backend

- **Angular/CDN/preview/rollback — Pass.** Static Angular, PR previews and
  production rollbacks are first-class.
- **Architecture fit — Partial.** Auth and backend remain on Firebase, while the
  frontend, domains, headers, secrets and deploy permissions move to a second
  control plane.
- **Same-origin API — Partial.** Requires Cloudflare proxy/Worker configuration
  or a cross-origin Functions URL and CORS policy.
- **Operational simplicity — Fail versus Firebase.** It adds Wrangler,
  Cloudflare IAM and separate release history without removing Firebase.

### Vercel + existing Firebase backend

- **Angular/CDN/preview — Pass.** Static Angular and preview deployments are
  supported.
- **Rollback — Partial.** Instant rollback exists, but Hobby is limited to the
  immediately previous production deployment.
- **Architecture fit — Partial.** Firebase still owns Auth/data/backend, and API
  routing becomes a cross-platform concern.
- **Operational simplicity — Fail versus Firebase.** Adds a second vendor,
  tokens and deployment model with no MVP capability gain.

Netlify has similar strengths to Cloudflare Pages (Angular static hosting,
unlimited deploy previews and one-click frontend rollback) and the same
two-control-plane drawback. Its post-2025 credit model is another pricing model
to monitor.

## Delivery model

Local and CI builds produce `dist/rentme/browser` and `functions/lib`.
Production deployment is intentionally split:

1. validate project identity, clean build and rules;
2. deploy Functions and rules/indexes;
3. smoke-test the direct API;
4. deploy Hosting last so the public SPA is never published against a missing
   API;
5. smoke-test the Hosting URL and same-origin `/api`.

Preview command:

```text
npx -y firebase-tools@latest hosting:channel:deploy <channel> --expires 7d --project rentme-b5e34
```

Preview channels are for frontend review against the production backend. A
separate Firebase staging project is required before previews may safely mutate
realistic data. `pinTag` is deliberately not enabled now: it would couple
Hosting-only deploys to billable Function revisions and consume Cloud Run tags.

## Secrets and configuration

- Firebase web configuration is not an administrative credential, but repository
  policy keeps project-specific values out of Git.
- Both `environment.ts` and `environment.prod.ts` are ignored. Create them from
  the corresponding example files on developer/CI machines.
- Never store service-account JSON, refresh tokens or private keys in the repo.
- Future server secrets must use Firebase Functions secret parameters backed by
  Google Secret Manager, and each function must explicitly bind only the secrets
  it needs.
- CI should use workload identity federation where available; do not commit
  `FIREBASE_TOKEN`.

## Permissions and human gates

- Human gate: selecting/changing the Firebase project.
- Human gate: enabling Blaze, APIs, budget alerts or changing IAM.
- Human gate: deploying to the live Hosting channel.
- Human gate: destructive database/index/rule changes and function deletion.
- Automation may build, validate rules, create expiring preview channels and
  deploy an explicitly approved resource list.
- Minimum practical deploy roles should be granted to a dedicated CI principal;
  avoid project Owner. Exact IAM is verified against current Firebase deployment
  errors before granting additional roles.

## Anti-bias checks

### Devil's advocate

Firebase concentrates hosting, identity, data and compute in one vendor,
Functions cold starts can hurt API latency, local emulation is less faithful than
an isolated cloud environment, and Blaze has no native hard cost cap. Cloudflare
or Vercel would provide stronger Git-preview ergonomics for the frontend.

Conclusion: those are real disadvantages, but moving only static hosting creates
a second control plane and does not remove Firebase lock-in. For this MVP,
integration simplicity and atomic identity/data operations outweigh frontend-only
platform advantages.

### 90-day pre-mortem

Assume the launch failed:

- A preview wrote test records to production because it reused the live API.
  Mitigation: label previews as production-data-connected and create a staging
  Firebase project before team testing.
- A deploy changed Functions before Hosting and broke clients. Mitigation:
  additive API changes, deploy backend first, smoke-test, then publish Hosting.
- Spend rose from abusive API traffic or scheduled invocations. Mitigation:
  App Check/rate limits when exposed, budget alerts and weekly usage review.
- A Hosting rollback did not restore compatible backend behavior. Mitigation:
  tag releases and keep a tested roll-forward command for Functions/rules.
- A runtime enters deprecation unnoticed. Mitigation: quarterly runtime review;
  Node 22 is now pinned after the CLI flagged Node 20.

### Unknown unknowns

- Real request volume, abuse profile and cold-start impact are not measured.
- Production IAM and billing status can only be proven by deployment.
- Preview channel behavior with authenticated production users needs a safe test.
- Scheduler and 2nd-gen container storage can create small charges even at low
  traffic.

Accepted risks: vendor concentration, usage-based Functions cost, production API
behind frontend previews, and non-atomic rollback across Hosting/Functions/rules.

Decision triggers:

- create a separate staging Firebase project before adding another developer or
  automated browser tests;
- reconsider Hosting if SSR/edge rendering becomes a product requirement;
- reconsider split hosting if measured global frontend needs outweigh the added
  control plane;
- reconsider Functions/Cloud Run if p95 API latency, concurrency, runtime limits
  or predictable-cost requirements are not met;
- migrate runtimes when the Firebase CLI first emits a deprecation warning;
- add stronger cost and abuse controls before public marketing traffic.

## Course-specific divergence

The lesson's Cloudflare/Astro/Supabase examples are not commands for this
repository. RentMe already selected Angular and Firebase and has a Firebase
Functions API. Therefore no Cloudflare MCP was configured and Wrangler was not
installed. The same evaluation gates and anti-bias workflow were applied to the
actual architecture.

## Official references

- Firebase Hosting: https://firebase.google.com/docs/hosting
- Hosting resources, channels and rollback:
  https://firebase.google.com/docs/hosting/manage-hosting-resources
- Hosting rewrites and function region:
  https://firebase.google.com/docs/hosting/functions
- Functions runtimes:
  https://firebase.google.com/docs/functions/manage-functions
- Functions locations:
  https://firebase.google.com/docs/functions/locations
- Functions configuration and secrets:
  https://firebase.google.com/docs/functions/config-env
- Hosting usage and pricing:
  https://firebase.google.com/docs/hosting/usage-quotas-pricing
- Functions pricing:
  https://firebase.google.com/docs/functions/quotas
- Cloudflare comparison:
  https://developers.cloudflare.com/pages/
- Vercel comparison: https://vercel.com/solutions/angular
- Netlify comparison: https://www.netlify.com/pricing/
