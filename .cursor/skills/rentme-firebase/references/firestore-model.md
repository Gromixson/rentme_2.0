# Firestore model — RentMe MVP

## Collections

### `users/{uid}`

| Field | Type | Notes |
|-------|------|--------|
| email | string | Mirror Auth |
| displayName | string? | Optional |
| roles | string[] | `owner`, `renter` — both allowed |

### `listings/{listingId}`

| Field | Type | Notes |
|-------|------|--------|
| ownerId | string | uid |
| title | string | |
| description | string | |
| dailyPriceCents | number | Integer cents |
| photoPath | string? | Storage path |
| unavailableDates | string[] | ISO date `YYYY-MM-DD` blocked |
| createdAt | timestamp | server |

### `bookings/{bookingId}`

| Field | Type | Notes |
|-------|------|--------|
| listingId | string | |
| renterId | string | uid |
| ownerId | string | denormalized from listing |
| startDate | string | `YYYY-MM-DD` |
| endDate | string | inclusive end |
| status | string | `pending` \| `confirmed` \| `rejected` |
| createdAt | timestamp | |
| updatedAt | timestamp | |

## Queries (MVP)

- Browse: `listings` where dates not overlapping blocked/unavailable (client filter OK for small scale)
- Renter bookings: `bookings` where `renterId == uid`
- Owner inbox: `bookings` where `ownerId == uid` and `status == pending`
- Owner listings: `listings` where `ownerId == uid`

## Indexes

Composite indexes as needed when queries fail in console — typical: `bookings` by `listingId` + `status` + `startDate`.
