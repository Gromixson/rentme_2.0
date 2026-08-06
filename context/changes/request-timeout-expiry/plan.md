# S-05: Request timeout & expiration — Implementation Plan

> Change ID: `request-timeout-expiry`  
> Roadmap: S-05 (seeker-send-request) | Prerequisites: S-04 (discover-online-providers)  
> Research: `@context/changes/request-timeout-expiry/research.md`  
> External: `@context/changes/request-timeout-expiry/external-research.md`

## End state

Po zakończeniu wszystkich faz tego change:

1. Seeker wysyła request → widzi timer ~120s na `/seeker/waiting/:id`.
2. Bez odpowiedzi providera status przechodzi `PENDING` → `TIMEOUT` (scheduler + lazy expiry).
3. „Moje prośby” i provider pending list nie pokazują wiszących PENDING po upływie czasu.
4. Scenariusz negatywny MVP.md §7 przechodzi: TIMEOUT, brak bookingu.
5. Composite index `status + expiresAt` jest w repo i wdrożony.
6. Build Angular + Functions przechodzi.

## Current state (baseline audit)

| Warstwa                          | Stan         | Dowód                                                           |
| -------------------------------- | ------------ | --------------------------------------------------------------- |
| POST /requests + expiresAt       | present      | `functions/src/routes/requests.ts:39-51`                        |
| Scheduler expireRequests         | present      | `functions/src/index.ts:12-19`                                  |
| Lazy resolveRequestStatus        | present      | `functions/src/services/requests.ts:41-49`                      |
| Firestore index status+expiresAt | **missing**  | `firestore.indexes.json` — brak wpisu                           |
| Scheduler batch vs tx            | inconsistent | `expireStalePendingRequests` batch vs `expirePendingRequest` tx |
| UI timer + poll                  | present      | `request-waiting.component.ts`                                  |
| Manual verification              | **missing**  | Brak checklist w change                                         |

## What we're NOT doing

- Cloud Tasks per-request ([external-research.md](external-research.md) — odrzucone na MVP)
- Firestore TTL policy na `expiresAt` (TTL = delete, nie status TIMEOUT — [Firebase TTL docs](https://firebase.google.com/docs/firestore/ttl))
- Rewrite całego flow request→booking (S-06)
- Push notification przy TIMEOUT

---

## Phase 1: Firestore index + scheduler hardening

### Overview

Zapewnić, że scheduled query działa w prod i że batch expiry nie wygrywa wyścigu z accept.

### Files

#### `firestore.indexes.json`

**Intent:** Scheduler query `PENDING` + `expiresAt <= now` ma wymagany composite index.

**Contract:**

- Dodaj index: collection `requests`, fields `status` ASC, `expiresAt` ASC
- Źródło: [Firestore composite indexes](https://firebase.google.com/docs/firestore/query-data/index-overview) — query z dwoma inequality/range wymaga indexu; infra-research.md §Indexes

**Changes:** Jeden nowy obiekt w tablicy `indexes`.

#### `functions/src/services/requests.ts`

**Intent:** Scheduler używa tej samej logiki co lazy path — transakcyjny re-check `PENDING`.

**Contract:**

- `expireStalePendingRequests`: zamiast batch blind update, iteruj docs z query i wołaj `expirePendingRequest(id)` (lub tx loop z limitem 100)
- Idempotentne: drugie wywołanie na już TIMEOUT → no-op
- Źródło decyzji: research.md §Race accept vs batch expire; nie zakładamy „batch wystarczy"

### Success criteria

- [ ] `firestore.indexes.json` zawiera index `status + expiresAt`
- [ ] `npm run build --prefix functions` OK
- [ ] Po deploy rules/indexes scheduler nie loguje „missing index”

### Manual verification

- Emulator lub prod: utwórz PENDING z `expiresAt` w przeszłości (dev script) → scheduler/tick ustawia TIMEOUT

---

## Phase 2: API read-path consistency

### Overview

Upewnić się, że wszystkie ścieżki odczytu requestów przechodzą przez `resolveRequestStatus`.

### Files

#### `functions/src/routes/requests.ts`

**Intent:** Seeker poll i lista zawsze zwracają aktualny status po lazy expiry.

**Contract:**

- `GET /:id` i `GET /my` — bez zmian logiki (już OK); response zawiera zaktualizowany `status`
- Response shape: `{ id, seekerId, providerId, categoryId, message, status, expiresAt, createdAt, seekerName? }`
- Źródło: MVP.md §4.3 — brak osobnego endpointu „expire"; lazy pattern z [external-research.md](external-research.md) werdykt A+B

#### `functions/src/routes/providers.ts`

**Intent:** Provider pending list nie pokazuje wygasłych jako PENDING.

**Contract:**

- Po `resolveRequestStatus`, filtr `status === 'PENDING'` (już `providers.ts:90-92`)
- Spójność z S-06: respond na wygasły → 410 ([provider-accept-booking/plan.md](../provider-accept-booking/plan.md))

### Success criteria

- [ ] GET `/requests/:id` zwraca TIMEOUT gdy `expiresAt` minął (nawet bez schedulera)
- [ ] GET `/requests/my` nie zwraca overdue PENDING

---

## Phase 3: Seeker UX verification

### Overview

Timer i polling seekera odzwierciedlają backend timeout bez regresji.

### Files

#### `src/app/features/seeker/request-waiting/request-waiting.component.ts`

**Intent:** Użytkownik widzi countdown i finalny stan TIMEOUT z toastem.

**Contract:**

- Timer: `max(0, expiresAt - now)` — client-side, źródło `expiresAt` z API (MVP.md §3.4)
- Poll co 3s dopóki PENDING — wystarczające przy lazy expiry ([Firebase Scheduler min 1 min](https://cloud.google.com/tasks/docs/comp-tasks-sched))
- Po TIMEOUT: toast „Czas minął”, link do „Moje prośby"
- **Nie** zmieniać na Firestore listener — AGENTS.md: domain via ApiService

#### `src/app/features/seeker/my-requests/my-requests.component.ts`

**Intent:** Lista pokazuje status TIMEOUT (nie raw enum bez tłumaczenia — opcjonalny polish).

**Contract (minimal):**

- `getMyRequests()` odświeża statusy przez API lazy expiry
- Opcjonalnie: mapowanie labeli jak w waiting screen (open question #4)

### Success criteria

- [ ] Countdown dochodzi do 0, następnie poll zwraca TIMEOUT
- [ ] `npm run build` OK

---

## Phase 4: Verification checklist + roadmap handoff

### Overview

Manual scenariusz negatywny MVP.md §7 + aktualizacja roadmap.

### Files

#### `context/changes/request-timeout-expiry/verification.md` (create at implement time)

**Intent:** Powtarzalna checklista demo/CI manual.

**Contract checklist:**

1. Provider online, seeker wysyła request
2. Provider **nie** odpowiada ≥2 min
3. Seeker widzi TIMEOUT na waiting screen
4. „Moje prośby” → TIMEOUT
5. Provider lista pending pusta
6. Brak dokumentu w `bookings`

#### `context/foundation/roadmap.md`

**Intent:** S-05 status po weryfikacji.

**Contract:** `ready` → `in-progress` po phase 1; `done` po phase 4 checklist green.

### Success criteria

- [ ] Checklist w verification.md uzupełniona
- [ ] Roadmap S-05 zaktualizowany

---

## Risks / Open Questions

| Ryzyko / pytanie                           | Mitygacja / status                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Brak indexu w prod → scheduler silent fail | Phase 1 — deploy indexes                                                    |
| Scheduler lag +0–60s                       | Lazy expiry + poll 3s; akceptowalne per external research                   |
| Race accept vs expire                      | Phase 1 — tx per doc                                                        |
| Emulator bez schedulera                    | Test lazy path + manual trigger function                                    |
| Firestore TTL kusi jako „prostsze”         | Odrzucone — [TTL 24h delay](https://firebase.google.com/docs/firestore/ttl) |

## Success Criteria (change-level)

1. Request wygasa do TIMEOUT bez ręcznej edycji DB (MVP.md §8).
2. Seeker UI + API spójne co do statusu i czasu.
3. Indeks composite wdrożony.
4. `npm run build` + `functions:build` green.
5. Scenariusz negatywny §7 udokumentowany w verification.md.

---

## Progress

| Phase                 | Status   | Commit           | Notes                                                                       |
| --------------------- | -------- | ---------------- | --------------------------------------------------------------------------- |
| 0 — Unit tests (M3L2) | **done** | —                | `requests.test.ts` (9), Vitest harness, `isPendingPastExpiry` extract; R-04 |
| 1 — Index + scheduler | done     | inline author    | composite index + tx per doc in expireStalePendingRequests                  |
| 2 — API consistency   | **done** | audit 2026-07-25 | GET `/:id`, `/my`, provider pending — all use `resolveRequestStatus`        |
| 3 — Seeker UX         | **done** | audit 2026-07-25 | timer + poll 3s + TIMEOUT toast already in waiting/my-requests              |
| 4 — Verification      | pending  | —                | Manual §7 checklist in `verification.md` — needs dual Firebase accounts     |
