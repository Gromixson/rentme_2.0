# MVP implementation note (2026-05-20)

`MVP.md` at repo root is the **product source of truth** for this build. It replaces the rental-items scope in `context/foundation/prd.md` (listings/renter/owner).

## What was built

- **Angular** at `src/` (not `frontend/`) — auth, seeker flow, provider flow, bookings, ratings, „Szukam!” interests
- **Cloud Functions** at `functions/` — Express API per MVP §4.3, JWT middleware, request timeout job
- **Firestore collections:** users, providers, categories, requests, bookings, ratings, interests
- **Security rules:** client read-only for business writes (mutations via API + Admin SDK)

## Manual setup still required

- Firebase project + `environment.ts` keys
- `.firebaserc` project id aligned with `proxy.conf.json`
- `firebase emulators:start` before local API calls

## Demo tip

One account can switch SEEKER ↔ PROVIDER in the header; for a realistic demo use two browsers/accounts.
