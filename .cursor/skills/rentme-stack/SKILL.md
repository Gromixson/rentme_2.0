---
name: rentme-stack
description: >
  RentMe 2.0 project conventions: Angular 21 standalone, Firebase (Auth, Firestore,
  Storage), PRD in context/foundation. Use when implementing features, reviewing
  structure, or asking where code should live. Trigger: RentMe, wynajem, listing,
  booking, Angular structure, project layout.
---

# RentMe — stack & layout

## Stack (locked for this repo)

| Layer | Choice | Notes |
|-------|--------|--------|
| UI | Angular 21, standalone components, SCSS, `provideRouter` | No NgModules for new code |
| Auth | Firebase Auth (email/password) | Inject `FIREBASE_AUTH` |
| Data | Cloud Firestore | Inject `FIREBASE_FIRESTORE` |
| Files | Firebase Storage | Listing photos; inject `FIREBASE_STORAGE` |
| Config | `src/environments/environment.ts` | Copy from `environment.example.ts`; never commit real keys |

Firebase is wired in `src/app/app.config.ts` via `provideRentMeFirebase()` from `src/app/core/firebase/`.

**Do not** add Supabase, Astro, or `@angular/fire` unless `tech-stack.md` is deliberately changed.

## Product contract

Read before coding:

- `context/foundation/prd.md` — FR-001…FR-008, non-goals
- `context/foundation/tech-stack.md` — hand-off metadata

MVP domain rule: **match renters to listing availability for a date range**; confirmed bookings block the calendar.

## Folder conventions

```
src/app/
  core/           # Firebase providers, guards, shared services
  features/       # One folder per feature area
    auth/
    listings/
    bookings/
  shared/         # UI primitives, pipes, utils (no feature logic)
```

- New routes → `app.routes.ts` + lazy `loadComponent` when the feature grows
- Services: `inject(FIREBASE_*)` tokens, not `getAuth()` in components
- Prefer signals + `async` pipe or `toSignal()` for Firestore streams

## Out of MVP (do not implement unless PRD changes)

Payments, in-app chat, delivery logistics, OAuth providers, favorites (FR-009), realtime/WebSockets.

## Course skills

For PRD/stack/bootstrap workflow use `/10x-*` skills listed in `.cursor/skills/README.md` — do not duplicate that chain here.
