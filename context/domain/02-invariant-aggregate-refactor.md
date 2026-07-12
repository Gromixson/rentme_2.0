---
title: Niezmiennik i agregat — ServiceRequest
created: 2026-07-12
type: refactor-plan
---

# Niezmiennik i agregat — ServiceRequest

> Powiązanie: [`01-domain-distillation.md`](01-domain-distillation.md), [`refactor-opportunities/plan.md`](../changes/refactor-opportunities/plan.md) (Opcja A guard-first), [`provider-accept-booking-flow/research.md`](../changes/provider-accept-booking-flow/research.md).

---

## KROK 0 — Odkrycie niezmienników

### Z PRD / MVP (guardrails)

| Niezmiennik                                             | Źródło                                                   |
| ------------------------------------------------------- | -------------------------------------------------------- |
| Brak bookingu po DECLINED lub TIMEOUT                   | `prd.md:54`                                              |
| Request wygasa do TIMEOUT po ~1–2 min                   | `prd.md:69`, `MVP.md:75`                                 |
| Booking powstaje automatycznie po accept                | `prd.md:46`, `MVP.md:80`                                 |
| Tylko provider przypisany do requestu może odpowiedzieć | `test-plan.md:31` (security: PROVIDER na cudze requesty) |
| Tylko PENDING może przejść przez respond                | `MVP.md:74`                                              |
| Provider offline po accept                              | `prd.md:137`, `MVP.md:83`                                |

### Z kodu (weryfikacja)

| Niezmiennik                                       | Enforcement     | Plik:linia                   |
| ------------------------------------------------- | --------------- | ---------------------------- |
| Tworzenie PENDING + expiresAt                     | route handler   | `requests.ts:45-46`          |
| Walidacja online + kategoria                      | route handler   | `requests.ts:26-34`          |
| Respond tylko dla `data.providerId === req.uid`   | tx              | `providers.ts:132`           |
| Respond tylko gdy `status === 'PENDING'`          | tx              | `providers.ts:133`           |
| Expiry inline w respond                           | tx              | `providers.ts:134-137`       |
| Accept → ACCEPTED + 1 booking CONFIRMED + offline | tx              | `providers.ts:144-158`       |
| Decline → DECLINED, bookingId null                | tx              | `providers.ts:139-141`       |
| Lazy expiry na read                               | service         | `services/requests.ts:41-49` |
| Scheduler expiry                                  | Cloud Scheduler | `index.ts:12-19`             |

### Niezmiennik nieegzistujący w kodzie (kandydat)

- **Jeden aktywny PENDING na parę seeker–provider** — brak w `requests.ts:10-51`; status **ignored**.

---

## KROK 1 — Klasyfikacja (3 osie)

| Niezmiennik                          | Core-ness  | Spread (warstwy)                                                | Enforcement                                       |
| ------------------------------------ | ---------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Przejścia stanu PENDING → terminalne | **Core**   | UI (poll) + API read + API respond + scheduler (4)              | Tx + lazy + scheduler — **częściowo rozproszone** |
| Accept tworzy dokładnie 1 Booking    | **Core**   | Tylko `providers.ts` tx                                         | **Tx atomowy** — silny                            |
| Tylko assigned provider respond      | **Core**   | `providers.ts` tx                                               | **Tx** — silny                                    |
| Expiry spójne z REQUEST_TIMEOUT_MS   | **Core**   | `db.ts`, `services/requests.ts`, `providers.ts`, `index.ts` (4) | 3 niezależne ścieżki — **ryzyko rozjazdu**        |
| Brak bookingu po DECLINED/TIMEOUT    | **Core**   | `providers.ts`                                                  | **Tx** — silny                                    |
| Jeden PENDING per para               | Supporting | —                                                               | **Brak**                                          |

---

## KROK 2 — Wybór niezmiennika #1

### **Przejścia stanu ServiceRequest (PENDING → ACCEPTED | DECLINED | TIMEOUT)**

**Uzasadnienie:**

1. Obejmuje north star S-06 i guardrails PRD (`prd.md:54`, `prd.md:69`).
2. Jest **najbardziej rozproszony** — trzy ścieżki expiry + respond tx + UI polling (`research.md:163`).
3. Sub-invariant „accept tworzy booking” jest **w tej samej transakcji** (`providers.ts:144-155`) — strażnik stanu naturalnie go pilnuje.
4. Brak testów respond (P0) — `research.md:120`, `test-plan.md:114`.

Alternatywa odrzucona jako #1: sam „jeden booking” — już dobrze egzekwowany w jednym `runTransaction`; większe ryzyko to **nielegalne przejścia** i race z expiry.

---

## KROK 3 — Diagnoza (dowody file:line)

### Angular UI

| Plik                                   | Rola                            | Problem                                                                            |
| -------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `request-waiting.component.ts:74-90`   | Poll GET `/requests/:id` co 3 s | UI reaguje na status z API; nie egzekwuje reguł — OK                               |
| `request-waiting.component.ts:98-100`  | Timer z `expiresAt`             | Parsuje `expiresAt` jako string ISO — zależy od serializacji API                   |
| `provider-requests.component.ts:66-77` | POST respond                    | Obsługa błędu przez `err?.error?.error` — nie rozróżnia kodów 409/410 semantycznie |
| `provider-requests.component.ts:19`    | Tag zawsze „PENDING”            | Lista już przefiltrowana API — OK                                                  |

### API routes

| Plik                   | Rola                               | Problem                                                            |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `requests.ts:82-83`    | GET `:id` + `resolveRequestStatus` | Lazy expiry — może zmienić status przed oczami providera           |
| `providers.ts:78-94`   | Lista PENDING                      | Drugie miejsce lazy expiry                                         |
| `providers.ts:128-161` | **Główna logika respond**          | Logika stanu + booking + offline w jednym bloku — trudna do testów |
| `providers.ts:134-137` | Duplikat warunku expiry            | Powtórzenie `isPendingPastExpiry` z `services/requests.ts:4-6`     |

### Firestore tx / services

| Plik                         | Rola                           | Problem                                                 |
| ---------------------------- | ------------------------------ | ------------------------------------------------------- |
| `services/requests.ts:8-17`  | `expirePendingRequest`         | Osobna tx — race z respond w ostatniej sekundzie (R-01) |
| `services/requests.ts:41-49` | `resolveRequestStatus`         | Side-effect na read path                                |
| `db.ts:7`                    | `REQUEST_TIMEOUT_MS = 120_000` | Kanoniczna stała — do współdzielenia ze strażnikiem     |

### Luki testowe

- Vitest: tylko expiry (`requests.test.ts`) — **9 testów**.
- Brak testów `POST .../respond` — `research.md:120`.

---

## KROK 4 — Projekt strażnika agregatu (pseudokod)

```typescript
// functions/src/domain/service-request-guard.ts (propozycja — NIE produkcja)

type RespondAction = 'accept' | 'decline';

type GuardResult =
  | { ok: true; nextStatus: 'ACCEPTED' | 'DECLINED'; createBooking: boolean }
  | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_PENDING' | 'TIMEOUT' };

function evaluateRespond(
  doc: RequestDoc,
  actorUid: string,
  action: RespondAction,
  nowMs: number = Date.now(),
): GuardResult {
  if (doc.providerId !== actorUid) return { ok: false, code: 'FORBIDDEN' };
  if (doc.status !== 'PENDING') return { ok: false, code: 'NOT_PENDING' };
  if (doc.expiresAt.toMillis() <= nowMs) return { ok: false, code: 'TIMEOUT' };

  if (action === 'decline') {
    return { ok: true, nextStatus: 'DECLINED', createBooking: false };
  }
  return { ok: true, nextStatus: 'ACCEPTED', createBooking: true };
}

// Handler respond (uproszczenie):
async function executeRespond(requestId, actorUid, action) {
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(requestRef);
    if (!snap.exists) throw new Error('NOT_FOUND');
    const data = snap.data() as RequestDoc;

    const decision = evaluateRespond(data, actorUid, action);
    if (!decision.ok) {
      if (decision.code === 'TIMEOUT') {
        tx.update(requestRef, { status: 'TIMEOUT' });
      }
      return { errorCode: decision.code };
    }

    tx.update(requestRef, { status: decision.nextStatus });
    if (decision.createBooking) {
      // tx.set(bookingRef, { status: 'CONFIRMED', requestId, ... })
      // tx.update(providerRef, { isOnline: false })
    }
    return { status: decision.nextStatus, bookingId: ... };
  });
}
```

**Zasady strażnika:**

- Czysta funkcja `evaluateRespond` — testowalna bez Firestore.
- Side-effecty (update, set) tylko w warstwie execute po pozytywnej decyzji.
- TIMEOUT w respond: persist + error (jak dziś `providers.ts:134-137`).

---

## KROK 5 — Before / After, fazy, testy

### Before (stan obecny)

```
providers.ts:128-161  — monolityczna tx (50+ LOC)
services/requests.ts  — expiry osobno
requests.test.ts      — 9 testów expiry only
providers.respond     — 0 testów
```

### After (docelowy)

```
domain/service-request-guard.ts  — evaluateRespond (pure)
services/requests.ts             — executeRespond lub import guard w providers.ts
providers.respond.test.ts        — harness Vitest
providers.ts:118-177             — cienki handler HTTP
```

### Plan fazowy (zgodny z M4L4 plan Opcja A)

| Faza   | Działanie                                                         | Pliki                                          |
| ------ | ----------------------------------------------------------------- | ---------------------------------------------- |
| **1a** | Wydziel `evaluateRespond` + testy jednostkowe przejść             | nowy `service-request-guard.ts`, `*.test.ts`   |
| **1b** | Podłącz guard w `providers.ts` tx                                 | `providers.ts:128-161`                         |
| **1c** | Harness integracyjny respond (mock db tx)                         | `providers.respond.test.ts`                    |
| **2**  | Ujednolić expiry: `isPendingPastExpiry` w guard zamiast duplikatu | `providers.ts:134`, `services/requests.ts:4-6` |
| **3**  | ACL ISO dates (opcjonalnie równolegle)                            | patrz `03-anti-corruption-layer.md`            |

### Przypadki testowe — przejścia legalne

| #   | Stan wejściowy                    | Akcja   | Oczekiwany stan | Booking       |
| --- | --------------------------------- | ------- | --------------- | ------------- |
| L1  | PENDING, w oknie                  | accept  | ACCEPTED        | 1 × CONFIRMED |
| L2  | PENDING, w oknie                  | decline | DECLINED        | brak          |
| L3  | PENDING, po expiresAt (lazy read) | GET     | TIMEOUT         | brak          |

### Przypadki testowe — przejścia nielegalne

| #   | Stan wejściowy                   | Akcja        | Kod                             | Booking                           |
| --- | -------------------------------- | ------------ | ------------------------------- | --------------------------------- |
| I1  | ACCEPTED                         | accept       | NOT_PENDING (409)               | brak nowego                       |
| I2  | DECLINED                         | decline      | NOT_PENDING (409)               | brak                              |
| I3  | TIMEOUT                          | accept       | NOT_PENDING lub TIMEOUT (410)   | brak                              |
| I4  | PENDING, inny providerId         | accept       | FORBIDDEN (403)                 | brak                              |
| I5  | PENDING, expiresAt w przeszłości | accept       | TIMEOUT (410) + persist TIMEOUT | brak                              |
| I6  | brak dokumentu                   | accept       | NOT_FOUND (404)                 | brak                              |
| I7  | PENDING, dwa równoległe accept   | drugi accept | NOT_PENDING (409)               | **inference** — `research.md:108` |

### Testy Vitest (szkic nazw)

```text
describe('evaluateRespond')
  ✓ L1 accept pending in window
  ✓ L2 decline pending in window
  ✓ I1 reject accept when already ACCEPTED
  ✓ I4 reject wrong provider
  ✓ I5 expire and reject accept after window

describe('POST /providers/requests/:id/respond (harness)')
  ✓ maps TIMEOUT to HTTP 410
  ✓ accept creates exactly one booking doc in tx
```

---

## Mission Log — invariant aggregate checklist

- [x] KROK 0 — niezmienniki z PRD + kod
- [x] KROK 1 — klasyfikacja 3 osie
- [x] KROK 2 — wybór #1 z uzasadnieniem
- [x] KROK 3 — diagnoza z file:line (UI, API, tx)
- [x] KROK 4 — pseudokod strażnika
- [x] KROK 5 — before/after, fazy, testy legal/illegal
- [x] Zgodność z M4L4 guard-first + Vitest respond
