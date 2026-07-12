---
name: rentme-feature
description: >
  Implement a RentMe MVP feature from PRD (FR-NNN or US-NN). Maps requirement to
  Angular feature folder + Firebase calls. Use when user asks to build login,
  listings, booking flow, owner dashboard. Trigger: FR-00, US-0, implement feature,
  zaimplementuj, listing, rezerwacja.
---

# RentMe — implement feature

## Before coding

1. Load `context/foundation/prd.md` — find the FR or US requested.
2. Load `rentme-stack` conventions (folder layout) and `rentme-firebase` (collections).
3. Confirm the feature is **must-have** MVP, not a non-goal.

## Implementation checklist

- [ ] Feature under `src/app/features/<name>/`
- [ ] Route added in `app.routes.ts`
- [ ] Firebase access only via `inject(FIREBASE_*)`
- [ ] Loading + error states for async operations
- [ ] No payments, chat, or OAuth unless PRD updated

## FR map (quick)

| ID | Feature area | Folder hint |
|----|----------------|-------------|
| FR-007 | Auth register/login | `features/auth/` |
| FR-005, FR-006 | Owner listing CRUD + calendar | `features/listings/` |
| FR-001, FR-002 | Browse + detail | `features/listings/` |
| FR-003, FR-008 | Booking request + my bookings | `features/bookings/` |
| FR-004 | Owner accept/reject | `features/bookings/` |

## Done when

- Acceptance criteria from the US pass manually
- `ng build` succeeds
- No secrets in committed files
