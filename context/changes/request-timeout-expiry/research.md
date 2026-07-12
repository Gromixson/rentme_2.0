---
change_id: request-timeout-expiry
researched_at: 2026-07-12
roadmap_ref: S-05
external: context/changes/request-timeout-expiry/external-research.md
---

# Research — request timeout & expiration (S-05)

## Summary

Slice timeout requestu jest **częściowo zaimplementowany**: tworzenie z `expiresAt`, scheduled function `expireRequests`, lazy expiry w `resolveRequestStatus`, UI timera w `RequestWaitingComponent`. Główne luki to **brak composite index** (`status` + `expiresAt`) dla schedulera, **niespójność** między batch update a transakcyjnym expire, oraz **brak testów/weryfikacji** scenariusza negatywnego MVP §7. Werdykt external research: utrzymać hybrydę Scheduler + lazy expiry; nie używać Firestore TTL do statusu biznesowego.

## Detailed Findings

### Backend — timeout constants & expiry logic

| Finding                     | Location                                   | Notes                                                                     |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| Timeout window 120s         | `functions/src/db.ts:7`                    | `REQUEST_TIMEOUT_MS = 120_000` — zgodne z MVP ~2 min                      |
| `expiresAt` at create       | `functions/src/routes/requests.ts:46`      | `requestExpiresAt()` przy POST                                            |
| Lazy expiry on read         | `functions/src/services/requests.ts:41-49` | `resolveRequestStatus` → `expirePendingRequest` if overdue                |
| Transactional single expire | `functions/src/services/requests.ts:4-15`  | Re-checks `PENDING` + `expiresAt` in tx                                   |
| Batch scheduler expire      | `functions/src/services/requests.ts:17-34` | Query `PENDING` + `expiresAt <= now`, limit 100, **batch** update (no tx) |
| Scheduled function          | `functions/src/index.ts:12-19`             | `onSchedule('every 1 minutes')` → `expireStalePendingRequests()`          |

### Backend — read paths invoking lazy expiry

| Endpoint                  | File:line                              | Behavior                                      |
| ------------------------- | -------------------------------------- | --------------------------------------------- |
| `GET /requests/:id`       | `functions/src/routes/requests.ts:82`  | Seeker/provider poll; triggers lazy TIMEOUT   |
| `GET /requests/my`        | `functions/src/routes/requests.ts:65`  | Lista seekera; per-doc `resolveRequestStatus` |
| `GET /providers/requests` | `functions/src/routes/providers.ts:89` | Provider pending list; filtruje po resolve    |

### Backend — respond path (timeout enforcement)

| Finding              | Location                                    | Notes                                                       |
| -------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Inline timeout in tx | `functions/src/routes/providers.ts:129-131` | Sets TIMEOUT + throws before accept/decline                 |
| HTTP 410 mapping     | `functions/src/routes/providers.ts:102`     | `{ error: 'Czas na odpowiedź minął' }` — spójne z S-06 plan |

### Firestore indexes — **gap**

| Finding                         | Location                                   | Notes                                                                               |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Scheduler query needs composite | `functions/src/services/requests.ts:20-24` | `.where('status','==','PENDING').where('expiresAt','<=',now)`                       |
| Index **missing** in repo       | `firestore.indexes.json`                   | Has `providerId+status+createdAt`, `seekerId+createdAt` — **no `status+expiresAt`** |
| Documented risk                 | `context/foundation/infra-research.md:64`  | Missing index → scheduler errors, expiry stuck                                      |

### Frontend — seeker UX

| Finding                | Location                                                                         | Notes                                          |
| ---------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| Waiting screen + timer | `src/app/features/seeker/request-waiting/request-waiting.component.ts:18,98-100` | Countdown from `expiresAt`; poll 3s            |
| Toast on TIMEOUT       | `request-waiting.component.ts:85-86`                                             | „Czas minął”                                   |
| My requests list       | `src/app/features/seeker/my-requests/my-requests.component.ts:44`                | Loads via API (lazy expiry applies)            |
| Create → waiting       | `src/app/features/seeker/request-form/request-form.component.ts:69-72`           | Navigate after POST                            |
| API methods            | `src/app/core/api/api.service.ts:125-138`                                        | `createRequest`, `getRequest`, `getMyRequests` |

### Types & contract

| Finding                        | Location                                                     | Notes                                                       |
| ------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------- |
| RequestStatus includes TIMEOUT | `functions/src/types.ts:3`, `src/app/core/models/index.ts:2` | Aligned                                                     |
| RequestDoc.expiresAt           | `functions/src/types.ts:40`                                  | Firestore Timestamp server-side; ISO string in client model |

## Architecture Insights

1. **Dual-path expiry** jest świadomym wzorcem: scheduler „sprząta” niewidziane dokumenty; lazy expiry gwarantuje poprawny status przy każdym odczycie (seeker poll co 3s maskuje lag schedulera ≤60s).
2. **UI timer jest client-side** — opiera się na `expiresAt` z API, nie czeka na scheduler; po `expiresAt` poll powinien zwrócić TIMEOUT (przez lazy path) nawet jeśli scheduler jeszcze nie odpalił.
3. **Race accept vs batch expire:** `expireStalePendingRequests` używa batch bez transakcji — teoretyczny wyścig z `respond` accept w tej samej sekundzie; `respond` używa transakcji (bezpieczniejsze). Scheduler batch powinien używać tej samej logiki co `expirePendingRequest` lub tx per doc.
4. **N+1 writes:** `GET /requests/my` może triggerować wiele lazy expires (do 50 docs) — akceptowalne na MVP scale.
5. **Firestore model skill outdated:** `.cursor/skills/rentme-firebase/references/firestore-model.md` opisuje rental/listings — kanoniczny model requestów jest w `MVP.md` §4.4 i `functions/src/types.ts`.

## Open Questions

| #   | Pytanie                                                                        | Właściciel  | Blokada?       | Propozycja z research                           |
| --- | ------------------------------------------------------------------------------ | ----------- | -------------- | ----------------------------------------------- |
| 1   | Czy lag schedulera (+0–60s po `expiresAt`) jest akceptowalny dla demo?         | user        | nie            | Tak — UI timer + poll; dokumentować w planie    |
| 2   | Czy batch scheduler ma przejść na transakcyjne `expirePendingRequest` per doc? | implementer | nie            | Tak — minimalna zmiana, mniejsze race z accept  |
| 3   | Czy dodać indeks `status+expiresAt` do `firestore.indexes.json` i deploy?      | implementer | **tak (prod)** | Tak — wymagane przez query schedulera           |
| 4   | Czy seeker powinien widzieć TIMEOUT zanim poll (optimistic UI at 0s)?          | user        | nie            | Opcjonalna faza UX — poza must-have MVP         |
| 5   | Cloud Tasks w v2 — revisit kiedy?                                              | —           | nie            | Po MVP jeśli sub-minutowa precyzja bez pollingu |

## Dependencies

- **S-04** discover-online-providers — POST wymaga online providera
- **S-06** provider-accept-booking — wspólny kontrakt TIMEOUT/410; nie implementować ponownie

## References

- `@MVP.md` §3.5, §7 (scenariusz negatywny), §8 (checklist TIMEOUT)
- `@context/foundation/roadmap.md` S-05, open question #1
- `@context/changes/request-timeout-expiry/external-research.md`
- `@context/foundation/infra-research.md` §Scheduler, §Indexes

---

## Test oracle (M3L2 — R-04)

**Ryzyko:** R-04 — seeker widzi wiszące PENDING po upływie okna odpowiedzi.

| Oracle (źródło produktowe) | Oczekiwane zachowanie                                                     | Najtańszy test                                          |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| PRD FR-011, MVP §3.5       | Request `PENDING` po ~120s bez odpowiedzi → status `TIMEOUT`              | Unit pure fn `isPendingPastExpiry` + `requestExpiresAt` |
| PRD guardrail              | `DECLINED` / `TIMEOUT` / `ACCEPTED` **nie** przechodzą ponownie w TIMEOUT | Edge: terminal status + przeszły `expiresAt` → false    |
| MVP §7 negatywny           | Lazy read (`GET /requests/:id`) zwraca TIMEOUT gdy overdue                | Unit `resolveRequestStatus` z mock tx                   |
| AGENTS.md lessons          | Expiry w transakcji — re-check PENDING przed update                       | Unit `expirePendingRequest` mock `runTransaction`       |

**Pliki testowe:** `functions/src/services/requests.test.ts` (Vitest, `npm run functions:test`).

**Manual mutation check:** w `verification.md` — zmiana `isPendingPastExpiry` na `return false` musi złamać test overdue.
