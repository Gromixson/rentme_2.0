# Firestore model — RentMe MVP

> Marketplace usług (seeker ↔ provider). Server-side writes via Cloud Functions Admin SDK; client uses HTTP (`ApiService`), not direct Firestore.

## Collections

### `users/{uid}`

| Field      | Type       | Notes                      |
| ---------- | ---------- | -------------------------- |
| email      | string     | Mirror Auth                |
| name       | string     | Display name               |
| roles      | string[]   | `SEEKER` and/or `PROVIDER` |
| activeRole | string     | `SEEKER` \| `PROVIDER`     |
| createdAt  | timestamp  |                            |
| updatedAt  | timestamp? |                            |

### `providers/{uid}`

| Field         | Type       | Notes                    |
| ------------- | ---------- | ------------------------ |
| userId        | string     | Same as doc id (uid)     |
| name          | string     | Denormalized             |
| hourlyRate    | number     | Must be > 0 to go online |
| bio           | string?    |                          |
| isOnline      | boolean    |                          |
| averageRating | number     |                          |
| ratingCount   | number     |                          |
| categories    | string[]   | Category ids             |
| updatedAt     | timestamp? |                          |

### `categories/{categoryId}`

| Field       | Type            | Notes                |
| ----------- | --------------- | -------------------- |
| name        | string          |                      |
| parentId    | string \| null? | Optional hierarchy   |
| onlineCount | number?         | Denormalized counter |

### `requests/{requestId}`

| Field      | Type      | Notes                                                             |
| ---------- | --------- | ----------------------------------------------------------------- |
| seekerId   | string    | uid                                                               |
| providerId | string    | uid                                                               |
| categoryId | string    |                                                                   |
| message    | string    | 10–500 chars                                                      |
| status     | string    | `PENDING` \| `ACCEPTED` \| `DECLINED` \| `TIMEOUT` \| `CANCELLED` |
| expiresAt  | timestamp | ~2 min window from create                                         |
| createdAt  | timestamp |                                                                   |
| seekerName | string?   | Denormalized                                                      |

**Status machine (requests):**

- `PENDING` → `ACCEPTED` (provider respond accept) \| `DECLINED` (decline) \| `TIMEOUT` (scheduler / lazy expiry) \| `CANCELLED` (seeker soft-cancel via `POST /api/requests/:id/cancel`)
- Terminal: `ACCEPTED`, `DECLINED`, `TIMEOUT`, `CANCELLED` — no further transitions

### `bookings/{bookingId}`

| Field      | Type       | Notes                                     |
| ---------- | ---------- | ----------------------------------------- |
| requestId  | string     | Source request                            |
| providerId | string     | uid                                       |
| seekerId   | string     | uid                                       |
| categoryId | string     |                                           |
| status     | string     | `CONFIRMED` \| `COMPLETED` \| `CANCELLED` |
| createdAt  | timestamp  | Created on accept                         |
| startTime  | timestamp? |                                           |
| endTime    | timestamp? |                                           |

### `ratings/{ratingId}`

| Field      | Type      | Notes             |
| ---------- | --------- | ----------------- |
| bookingId  | string    |                   |
| providerId | string    |                   |
| seekerId   | string    | Only seeker rates |
| rating     | number    | 1–5               |
| comment    | string?   |                   |
| createdAt  | timestamp |                   |

### `interests/{interestId}`

| Field      | Type      | Notes                   |
| ---------- | --------- | ----------------------- |
| seekerId   | string    | „Szukam!” demand signal |
| seekerName | string    |                         |
| categoryId | string    |                         |
| createdAt  | timestamp |                         |

## Queries (MVP)

- Online providers in category: `providers` where `isOnline == true` and `categories` array-contains `categoryId`
- Seeker requests: `requests` where `seekerId == uid`
- Provider pending inbox: `requests` where `providerId == uid` (filter `PENDING` after `resolveRequestStatus`)
- Expiry scheduler: `requests` where `status == PENDING` and `expiresAt <= now`
- Bookings for user: `bookings` where `seekerId == uid` **or** `providerId == uid`

## Indexes

See `firestore.indexes.json` — composites on `requests` (`status` + `expiresAt`, seeker/provider + `createdAt`) and `providers` (`isOnline` + `categories`).

## Canonical types

- Functions: `@functions/src/types.ts`
- Angular: `@src/app/core/models/index.ts`
