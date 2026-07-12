<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: S-06 Provider accept → booking (Phase 1)

- **Plan**: `context/changes/provider-accept-booking/plan.md`
- **Scope**: Phase 1 of 3 — Harden API error mapping for respond
- **Date**: 2026-07-12
- **Verdict**: APPROVED (po triage i poprawkach F1/F2)
- **Findings**: 0 critical · 2 warnings · 3 observations

## Verdicts

| Dimension           | Verdict    | Uwagi                                                                            |
| ------------------- | ---------- | -------------------------------------------------------------------------------- |
| Plan Adherence      | PASS ✅    | try/catch + `respondHttpError`; mapowanie zgodne z Contract                      |
| Scope Discipline    | PASS ✅    | Tylko `functions/src/routes/providers.ts`; brak zmian poza fazą                  |
| Safety & Quality    | PASS ✅    | Po F1/F2: TIMEOUT persystuje, recalc nie maskuje sukcesu                         |
| Architecture        | PASS ✅    | Logika transakcji w route; bez nowych warstw                                     |
| Pattern Consistency | WARNING ⚠️ | Helper `respondHttpError` vs inline w `bookings.ts`/`requests.ts` — akceptowalne |
| Success Criteria    | PASS ✅    | `npm run build` + `functions:build` green                                        |

## Success criteria verification (Phase 1)

| Kryterium                                       | Wynik   | Dowód                                               |
| ----------------------------------------------- | ------- | --------------------------------------------------- |
| Każdy kod błędu → właściwy status + `{ error }` | PASS    | `respondHttpError` mapuje NOT_FOUND/403/409/410/500 |
| Happy path accept/decline bez regresji          | PASS    | Transakcja bez zmian logiki biznesowej (poza F1)    |
| `functions:build` OK                            | PASS    | `npm run functions:build` exit 0 (2026-07-12)       |
| Manual verification (optional)                  | PENDING | Phase 3                                             |

## Findings

### F1 — TIMEOUT w transakcji był rollbackowany przez throw

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — klient dostawał 410, ale status w Firestore mógł zostać `PENDING`
- **Dimension**: Safety & Quality
- **Location**: `functions/src/routes/providers.ts:134-136` (przed poprawką)
- **Detail**: `tx.update(..., TIMEOUT)` + `throw new Error('TIMEOUT')` powoduje rollback całej transakcji Firestore. HTTP 410 był poprawny, stan DB — niekonsekwentny do momentu lazy-expire przez `resolveRequestStatus`.
- **Fix**: Zwróć `{ errorCode: 'TIMEOUT' }` z callbacka transakcji zamiast throw; obsłuż po `runTransaction`.
- **Decision**: FIXED (fix now)

### F2 — Błąd `recalcCategoryOnlineCounts` maskowany jako błąd respond

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — po udanym accept klient mógł dostać 500 mimo utworzonego bookingu
- **Dimension**: Safety & Quality
- **Location**: `functions/src/routes/providers.ts:168-172` (przed poprawką)
- **Detail**: `recalcCategoryOnlineCounts()` wewnątrz tego samego try/catch co transakcja; failure recalc → `respondHttpError` → fałszywy błąd respond.
- **Fix**: Osobny try/catch wokół recalc; log + kontynuuj z `res.json(result)`.
- **Decision**: FIXED (fix now)

### F3 — Niespójne polskie komunikaty 404 dla requestów

- **Severity**: 👁 OBSERVATION
- **Impact**: 🏃 LOW — kosmetyka UX/API
- **Dimension**: Pattern Consistency
- **Location**: `functions/src/routes/providers.ts:99` vs `functions/src/routes/requests.ts:74`
- **Detail**: respond: „Prośba nie istnieje”; GET `/:id`: „Prośba nie znaleziona”.
- **Fix**: Ujednolicić copy w całym API requests.
- **Decision**: SKIPPED — poza scope phase 1; brak wpływu na kontrakt `{ error: string }`; phase 2/3 nie dotyka copy backendu.

### F4 — Brak testów jednostkowych respond handler

- **Severity**: 👁 OBSERVATION
- **Impact**: 🔎 MEDIUM — regresje mapowania błędów bez automatycznej siatki
- **Dimension**: Success Criteria
- **Location**: N/A (brak harness w `functions/`)
- **Detail**: Plan-review odroczył testy; phase 1 weryfikuje buildem.
- **Fix**: Dodać test harness + cases dla respondHttpError w osobnym change.
- **Decision**: SKIPPED — zgodnie z plan-review.md i „What we're NOT doing”; manual checklist w phase 3.

### F5 — Brak commita phase 1 (git identity)

- **Severity**: 👁 OBSERVATION
- **Impact**: 🏃 LOW — brak śladu w historii git
- **Dimension**: Plan Adherence
- **Location**: N/A
- **Detail**: Repo bez commitów; `git config user.name/email` nie ustawione — implement phase 1 odnotował to w Progress.
- **Fix**: Użytkownik ustawia tożsamość git i commituje ręcznie.
- **Decision**: ACCEPTED RISK — poza kompetencją agenta (nie modyfikować git config).

## Triage summary

| ID  | Decyzja                                         |
| --- | ----------------------------------------------- |
| F1  | FIXED — fix now                                 |
| F2  | FIXED — fix now                                 |
| F3  | SKIPPED — kosmetyka, poza phase 1               |
| F4  | SKIPPED — zgodnie z planem, brak harness        |
| F5  | ACCEPTED RISK — brak git identity u użytkownika |

## Lesson recorded

- `context/foundation/lessons.md` → **Do not throw after a Firestore write you intend to commit** (z F1)

## Applied fixes (post-review)

1. `RespondTxResult` + return `{ errorCode: 'TIMEOUT' }` zamiast throw po `tx.update`
2. Osobny try/catch dla `recalcCategoryOnlineCounts` po sukcesie transakcji
3. `respondHttpError` loguje pełny `err` dla nieznanych kodów 500

Build po poprawkach: `npm run functions:build` ✅

## Overall verdict

**APPROVE** — Phase 1 spełnia Intent + Contract planu. Dwa istotne problemy niezawodności (F1, F2) naprawione w scope. Brak blockerów dla phase 2 (Provider UX → `/bookings`).
