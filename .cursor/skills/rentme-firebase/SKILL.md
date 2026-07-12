---
name: rentme-firebase
description: >
  Firebase patterns for RentMe: Auth, Firestore collections, Storage paths,
  security rules sketch, emulators. Use when adding auth flows, Firestore queries,
  uploads, or firestore.rules. Trigger: Firebase, Firestore, Auth, Storage,
  security rules, emulator.
---

# RentMe — Firebase

## Injection (Angular)

Use tokens from `src/app/core/firebase/firebase.tokens.ts`:

```typescript
import { inject } from '@angular/core';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE, FIREBASE_STORAGE } from '../core/firebase';

private readonly auth = inject(FIREBASE_AUTH);
private readonly db = inject(FIREBASE_FIRESTORE);
private readonly storage = inject(FIREBASE_STORAGE);
```

Providers are registered in `app.config.ts` → `provideRentMeFirebase()`.

## Emulators

Set `useEmulators: true` in `environment.ts` (Auth 9099, Firestore 8080, Storage 9199). Requires Firebase CLI emulators running.

## Firestore model (MVP)

See `references/firestore-model.md` for collection shapes and status enums.

Rules of thumb:

- `listings.ownerId` === `request.auth.uid` for writes
- `bookings`: renter creates `pending`; only `listing.ownerId` may set `confirmed` | `rejected`
- No overlapping `confirmed` bookings for same `listingId` + date range (enforce in transaction or Cloud Function later; MVP: transaction in service)

## Storage

- Path: `listings/{listingId}/{fileName}` — max one photo MVP (FR-005)
- Only owner uploads; public read after listing is published (or signed URL if you tighten rules)

## Security rules

Starter rules live in `references/firestore.rules` — deploy with Firebase CLI when project exists. Tighten before production.

## Errors

- Surface `FirebaseError` codes to the user in Polish for auth flows
- Do not log API keys; config only in `environment.ts`
