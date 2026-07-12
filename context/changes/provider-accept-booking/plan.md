# S-06: Provider accept → booking — Implementation Plan

> Change ID: `provider-accept-booking`
> Roadmap: S-06 (north star) | Prerequisites: S-05 (seeker-send-request)

## End state

Po zakończeniu wszystkich faz tego change:

1. Provider na `/provider/requests` może **Akceptuj** / **Odrzuć** pending request.
2. **Accept:** request → `ACCEPTED`, powstaje **jeden** booking `CONFIRMED`, provider przechodzi offline, obie strony widzą booking na `/bookings`.
3. **Decline / timeout:** request → `DECLINED` / `TIMEOUT`, **brak** dokumentu w `bookings`.
4. Wszystkie błędy API respond zwracają `{ error: string }` (nie ciche 500).
5. Build produkcyjny Angular + Functions przechodzi.

## Current state (baseline audit)

| Warstwa         | Stan    | Dowód                                        |
| --------------- | ------- | -------------------------------------------- |
| API respond     | partial | Transakcja OK, brak catch na błędy biznesowe |
| API bookings/my | present | `functions/src/routes/bookings.ts`           |
| Provider UI     | partial | Przyciski OK, brak linku po accept           |
| Seeker waiting  | present | Polling + link `/bookings` po ACCEPTED       |
| Bookings list   | present | `bookings-list.component.ts`                 |

## What we're NOT doing

- Pełny rewrite request/booking flow
- S-07 complete, S-08 rate (osobne change-id)
- Testy E2E Playwright (późniejsza lekcja)
- F-01 observability gate

---

## Phase 1: Harden API error mapping for respond

### Overview

Opakować `runTransaction` w handler mapujący błędy biznesowe na status HTTP zgodnie z konwencją `{ error: string }`.

### Files

#### `functions/src/routes/providers.ts`

**Intent:** Użytkownik (provider) dostaje czytelny komunikat przy próbie respond na nieistniejący, cudzy, wygasły lub już rozstrzygnięty request.

**Contract:**

- `NOT_FOUND` → 404 `{ error: 'Prośba nie istnieje' }`
- `FORBIDDEN` → 403 `{ error: 'Brak dostępu' }`
- `NOT_PENDING` → 409 `{ error: 'Prośba nie jest już oczekująca' }`
- `TIMEOUT` → 410 `{ error: 'Czas na odpowiedź minął' }`
- Inne błędy → 500 `{ error: 'Błąd serwera' }` + log
- Sukces accept: `{ status: 'ACCEPTED', bookingId: string }`
- Sukces decline: `{ status: 'DECLINED', bookingId: null }`

**Changes:** try/catch wokół `runTransaction`; helper `respondErrorFromCode(code)` inline lub lokalna funkcja.

### Success criteria

- [ ] Każdy kod błędu transakcji zwraca właściwy status i `{ error }`
- [ ] Happy path accept/decline bez regresji
- [ ] `npm run build --prefix functions` OK

### Manual verification (optional this phase)

- Emulator + dwa konta: accept → booking widoczny; decline → brak bookingu

---

## Phase 2: Provider UX — link to bookings after accept

### Overview

Po udanej akceptacji provider widzi CTA do listy rezerwacji (parity z seeker waiting screen).

### Files

#### `src/app/features/provider/requests/provider-requests.component.ts`

**Intent:** Provider od razu wie, gdzie zobaczyć utworzoną rezerwację.

**Contract:**

- Toast sukcesu zawiera informację o booking
- Opcjonalny link/przycisk „Zobacz rezerwacje” → `/bookings` lub auto-navigate po accept
- Nie zmieniać kontraktu `ApiService.respondToRequest`

### Success criteria

- [ ] Po accept widoczna ścieżka do `/bookings`
- [ ] `npm run build` OK

---

## Phase 3: Verification checklist + roadmap handoff

### Overview

Manual checklist happy path §7 MVP (kroki 3–5), aktualizacja statusu S-06 w roadmap jeśli slice domknięty.

### Files

#### `context/foundation/roadmap.md`

**Intent:** Odzwierciedlić postęp slice'a po weryfikacji.

**Contract:** S-06 status → `in-progress` po phase 1; `done` dopiero po pełnej weryfikacji manual (phase 3).

### Success criteria

- [ ] Checklist w `change.md` lub Progress uzupełniony
- [ ] Roadmap zaktualizowany jeśli slice verified

---

## Risks / Open Questions

| Ryzyko                          | Mitygacja                                          |
| ------------------------------- | -------------------------------------------------- |
| Regresja transakcji Firestore   | Minimalny diff — tylko catch, bez zmiany logiki tx |
| Demo wymaga dwóch kont Firebase | Dokumentacja w Progress; seed categories           |
| Brak testów automatycznych      | Phase 1 weryfikacja build; manual w phase 3        |

## Success Criteria (change-level)

1. Accept → jeden booking CONFIRMED u providera i seekera na `/bookings`.
2. Decline/timeout → brak bookingu.
3. Błędy respond zgodne z konwencją `err?.error?.error` w Angular.
4. `npm run build` + `functions:build` green.

---

## Progress

| Phase                      | Status  | Commit                                       | Notes                                                             |
| -------------------------- | ------- | -------------------------------------------- | ----------------------------------------------------------------- |
| 1 — API error mapping      | done    | — (commit blocked: brak git user.name/email) | try/catch + respondHttpError; impl-review F1/F2 fixed; builds OK  |
| 2 — Provider UX            | done    | inline author                                | auto-navigate to /bookings after accept; toast parity with seeker |
| 3 — Verification + roadmap | pending | —                                            |                                                                   |
