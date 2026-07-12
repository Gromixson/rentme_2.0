# Refactor opportunities S-06 — Plan implementacji

> Change ID: `refactor-opportunities`  
> Roadmap: S-06 (north star) · Upstream: [`provider-accept-booking-flow/research.md`](../provider-accept-booking-flow/research.md)  
> Research: [`research.md`](research.md)

## Stan docelowy (po wszystkich fazach)

1. **`POST .../respond`** ma harness Vitest pokrywający accept, decline, 410 TIMEOUT, 409 NOT_PENDING, 403 FORBIDDEN — zgodnie z `test-plan.md` R-01/R-02/R-06.
2. Guard expiry **współdzielony** między respond tx a `expirePendingRequest` — bez rozjazdu reguł `isPendingPastExpiry`.
3. Handler respond **cienki** — logika transakcji w `services/` (Strangler), route tylko HTTP + mapowanie błędów.
4. **Zero regresji** — `npm run functions:test` + CI green po każdej fazie.
5. Kontrakt HTTP i Angular (`ApiService.respondToRequest`) **bez zmian** — refaktor wewnętrzny Functions.

## Decyzje wywiadu (udokumentowane — brak live interview)

| Pytanie wywiadu                         | Decyzja                                                           | Uzasadnienie                                  |
| --------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Czy refaktorować przed testami?         | **Nie** — guard-first (ranking #1)                                | P1 blokuje P4/P10; R-01 P0                    |
| Big-bang Domain Model?                  | **Odrzucone**                                                     | MVP scale, 7 commitów, solo dev               |
| Które rankingi realizujemy?             | **#1 + #2 + #3** sekwencyjnie                                     | Najtańsze first; #3 opcjonalnie jeśli czas    |
| E2E creds w tym change?                 | **Poza scope** — notatka w phase 4                                | Blocker użytkownika; osobny backlog item      |
| Zmiana kontraktu HTTP / polling UI?     | **Nie**                                                           | Struktura wewnętrzna only                     |
| Mechanism vs enforcement (M3L3 lesson)? | Test harness = mechanism; CI gate już istnieje (`functions:test`) | Nie dodajemy nowego hooka — rozszerzamy suite |

## What We're NOT Doing

- Pełny **Domain Model** (Request/Booking aggregates, event sourcing)
- **Realtime** / WebSocket zamiast poll 3 s / 5 s
- **Cloud Tasks** per request (odrzucone w S-05)
- Przeniesienie **`recalcCategoryOnlineCounts`** do transakcji respond
- Refaktor **komponentów Angular** (`request-waiting`, `provider-requests`) — osobny change `seeker-send-request`
- **Phase 3 manual** `provider-accept-booking` — pozostaje w backlogu; nie blokuje faz 1–3 tego planu
- Zmiana **`REQUEST_TIMEOUT_MS`** (120 s) — poza scope

---

## Phase 1: Characterization tests — respond harness (guard-first)

### Overview

Dodać testy Vitest **zanim** dotkniemy logiki produkcyjnej respond. Wzorzec: mock `db().runTransaction` jak w `requests.test.ts`.

### Pliki

#### `functions/src/routes/providers.respond.test.ts` (nowy)

**Intent:** Zamknąć lukę P1 — każda przyszła refaktoryzacja respond ma siatkę regresji.

**Contract (minimalny zestaw):**

| Scenariusz              | Oczekiwany wynik                                       |
| ----------------------- | ------------------------------------------------------ |
| accept, PENDING, valid  | `{ status: 'ACCEPTED', bookingId }` + tx set booking   |
| decline                 | `{ status: 'DECLINED', bookingId: null }`              |
| expiresAt w przeszłości | HTTP 410 / `{ errorCode: 'TIMEOUT' }` + status TIMEOUT |
| status ≠ PENDING        | 409 NOT_PENDING                                        |
| providerId ≠ uid        | 403 FORBIDDEN                                          |
| brak dokumentu          | 404 NOT_FOUND                                          |

**Changes:** nowy plik testowy; ewentualnie minimalny export helpera z `providers.ts` **tylko jeśli** test wymaga — preferuj test przez wywołanie logiki tx wydzielonej w phase 3.

### Success criteria (auto)

- [x] `npm run functions:test` — wszystkie stare + nowe testy **PASS** (15 total, 2026-07-12)
- [x] Co najmniej **5** przypadków respond (accept, decline, timeout, not_pending, forbidden) — 6 w `providers.respond.test.ts`
- [ ] CI `.github/workflows/ci.yml` — `functions:test` green (wymaga git remote)

### Success criteria (manual — opcjonalnie)

- [ ] Przegląd: testy nie są tautologią (mock tx weryfikuje wywołania `update`/`set`)

### Weryfikacja fazy

```bash
npm run functions:test
npm run functions:build
```

---

## Phase 2: Wspólny guard expiry (P3 + P4)

### Overview

Usunąć duplikację inline `expiresAt <= Date.now()` w respond — użyć `isPendingPastExpiry` i wspólnego wzorca persist TIMEOUT. **Bez zmiany** zachowania HTTP (410).

### Pliki

#### `functions/src/routes/providers.ts`

**Intent:** Respond tx używa tej samej reguły co lazy expiry — jedna prawda o „wygasłym PENDING”.

**Contract:**

- Przed decline/accept: jeśli `isPendingPastExpiry(data)` → `tx.update(TIMEOUT)` + `{ errorCode: 'TIMEOUT' }`
- Semantyka identyczna z phase 1 testami (characterization musi zostać green)

#### `functions/src/services/requests.ts`

**Intent:** Opcjonalnie wyekstrahować `applyTimeoutIfExpired(tx, ref, data): 'TIMEOUT' | null` — **tylko** jeśli redukuje duplikację bez over-engineering.

**Contract:** `expirePendingRequest` i respond wołają ten sam helper wewnątrz tx.

### Success criteria (auto)

- [ ] Wszystkie testy phase 1 **PASS** (bez zmiany oczekiwań)
- [ ] Testy `requests.test.ts` (9) **PASS**
- [ ] `rg "expiresAt.toMillis() <= Date.now()" functions/src/routes/` → **0** (inline usunięty)

### Success criteria (manual)

- [ ] Porównanie: respond na wygasły request nadal 410 `{ error: 'Czas na odpowiedź minął' }`

### Weryfikacja fazy

```bash
npm run functions:test
npm run functions:build
```

---

## Phase 3: Ekstrakcja serwisu respond (P10 — Strangler)

### Overview

Przenieść ciało transakcji z route do `functions/src/services/respond.ts` (nazwa robocza). Route = walidacja body + auth + wywołanie serwisu + `respondHttpError`.

### Pliki

#### `functions/src/services/respond.ts` (nowy)

**Intent:** Testowalna jednostka bez Express; route cienki.

**Contract:**

```typescript
// Sygnatura robocza — implementacja doprecyzuje typy
respondToRequestTx(input: {
  providerId: string;
  requestId: string;
  action: 'accept' | 'decline';
}): Promise<RespondTxResult>;
```

#### `functions/src/routes/providers.ts`

**Intent:** Handler < 30 LOC — delegacja do serwisu.

**Contract:** Bez zmiany ścieżki URL, body, kodów HTTP.

### Success criteria (auto)

- [ ] Phase 1 + 2 testy green (możliwa relokacja importów testów do serwisu)
- [ ] `npm run functions:build` OK
- [ ] `npm run build` (Angular) OK — brak zmian klienta

### Success criteria (manual)

- [ ] Smoke: emulator lub dwa konta — accept/decline happy path bez regresji

### Weryfikacja fazy

```bash
npm run functions:test
npm run functions:build
npm run build
```

---

## Phase 4: Handoff — backlog i E2E (bez kodu refaktoru)

### Overview

Zaktualizować dokumentację postępu; **nie** implementować E2E creds w tym change — tylko odnotować zależność.

### Pliki

#### `context/foundation/pending-backlog.md`

**Intent:** Oznaczyć fazy refactor-opportunities jako done po implementacji 1–3.

#### `context/changes/refactor-opportunities/verification.md` (opcjonalnie przy implementacji)

**Intent:** Log deliberate-break jeśli wymagany przez quality gates.

### Success criteria

- [ ] Backlog odzwierciedla stan testów respond
- [ ] Notatka: E2E creds nadal blocker dla R-03 pełnej weryfikacji

---

## Progress (format `/10x-implement`)

| Phase | Opis                           | Status  | Commit | Notes                                              |
| ----- | ------------------------------ | ------- | ------ | -------------------------------------------------- |
| 1     | Respond characterization tests | done    | M5L5   | Headless lokalnie (async dry-run); 6 testów Vitest |
| 2     | Shared expiry guard            | pending | —      | Wymaga phase 1 green                               |
| 3     | Extract respond service        | pending | —      | Strangler                                          |
| 4     | Docs handoff                   | pending | —      | Backlog + opcjonalnie verification.md              |

---

## Ryzyka

| Ryzyko                              | Mitygacja                                                        |
| ----------------------------------- | ---------------------------------------------------------------- |
| Refaktor bez testów (P1)            | Phase 1 obowiązkowa przed 2–3                                    |
| Mock tx nie odzwierciedla Firestore | Phase 3 manual smoke; Phase 2 emulator opcjonalnie               |
| Over-extraction w phase 2           | Helper tylko jeśli ≤15 LOC; inaczej inline `isPendingPastExpiry` |
| Scope creep → Domain Model          | Explicit „What We're NOT Doing”                                  |

---

## Powiązane

- M4L3 research: `provider-accept-booking-flow/research.md`
- Implementacja slice: `provider-accept-booking/plan.md`
- Test plan P0: `context/foundation/test-plan.md` §Phase 1
