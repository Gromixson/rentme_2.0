# Plan: auth-and-role-switch (S-01)

> Roadmap: `context/foundation/roadmap.md` → S-01  
> Change: `context/changes/auth-and-role-switch/change.md`  
> PRD: FR-001, FR-002 | MVP: §2 role, §3.1 autentykacja

## End state

Po zamknięciu tego change:

1. Niezalogowany użytkownik trafia na `/auth/login`; zalogowany — na dashboard roli (`/` → `/seeker` lub `/provider`).
2. Rejestracja tworzy konto Firebase + dokument `users` + pusty `providers` przez `POST /api/auth/register`, potem loguje przez `signInWithEmailAndPassword`.
3. Przełącznik roli w nagłówku wywołuje `POST /api/auth/active-role`; po przejściu na SEEKER provider jest offline (API + UI odzwierciedla `activeRole`).
4. `roleGuard` blokuje `/seeker/*` i `/provider/*` dla niewłaściwej roli; testy jednostkowe pokrywają guardy.
5. Checklista weryfikacji manualnej istnieje i przechodzi przed kolejnymi slice'ami.

## Baseline audit (2026-07-12)

| Warstwa | Stan | Dowód |
| ------- | ---- | ----- |
| Client Auth | present | `auth.service.ts`, login/register components |
| API auth | present | `functions/src/routes/auth.ts` — register, me, active-role; login → 410 |
| Guards | present | `auth.guard.ts`, `guest.guard.ts`, `role.guard.ts`, `auth-ready.ts` |
| Role switch offline | present | `auth.ts` L155–162 — SEEKER → `isOnline: false` |
| Header toggle + redirect | present | `app-header.component.ts` |
| Unit tests | partial | tylko `auth-ready.spec.ts` — brak testów `roleGuard` |
| Error UX on role switch | partial | `toggleRole()` po cichu łyka błąd API |

**Wniosek:** implementacja ~90% — fazy skupiają się na weryfikacji, testach guardów i drobnej poprawce UX.

## Phases

### Phase 1: Guard tests + verification checklist + build gate

**Deliverable:** testy `roleGuard`, checklista manualna S-01, `npm run build` + `npm test` zielone.

#### Intent + Contract per file

| Plik | Intent | Contract |
| ---- | ------ | -------- |
| `src/app/core/auth/role.guard.spec.ts` | Pokryć reguły dostępu do tras rolowych | Nie zmieniać logiki guarda; testować redirect vs allow |
| `context/changes/auth-and-role-switch/verification.md` | Checklista regresji S-01 dla człowieka | Kroki mapowane na FR-001/FR-002 |
| `src/app/shared/layout/app-header.component.ts` | Toast przy błędzie przełączenia roli | Użyć `ToastService`; `err?.error?.error` |

#### Success Criteria

- [ ] `role.guard.spec.ts`: min. 4 przypadki (allow, wrong role redirect, missing role redirect, not logged in)
- [ ] `npm test` przechodzi headless
- [ ] `npm run build` bez błędów
- [ ] `verification.md` zawiera kroki: register, login, role switch obie strony, logout, guest redirect

#### Manual gate

Po fazie 1: opcjonalny szybki smoke w przeglądarce (register/login) — nie blokuje fazy 2 jeśli build+test OK.

---

### Phase 2: Manual smoke + roadmap update

**Deliverable:** wypełniona sekcja wyników w `verification.md`, status S-01 w roadmap → `done` (lub `in-progress` jeśli znaleziono blocker).

#### Intent + Contract

| Plik | Intent | Contract |
| ---- | ------ | -------- |
| `verification.md` | Wyniki manual smoke | Pass/fail per krok |
| `context/foundation/roadmap.md` | Status S-01 | Tylko pole Status + ewentualnie ## Zrobione |

---

### Phase 3: Archive (opcjonalnie po pełnym domknięciu)

`/10x-archive auth-and-role-switch` gdy wszystkie fazy done.

## Risks / Open Questions

| Ryzyko | Mitygacja |
| ------ | --------- |
| Firebase Console nie skonfigurowany | README + `setup:auth`; verification.md notuje wymagania |
| Regresja guardów przy refaktorze routingu | Testy Phase 1 |
| Provider online po switch — tylko server-side | Manual step w verification: sprawdzić offline po SEEKER |

## Success Criteria (change-level)

- [ ] Happy path auth z MVP §3.1 działa bez edycji Firestore ręcznie
- [ ] `POST /api/auth/login` nie jest używany w kliencie (410 preserved)
- [ ] Przełączenie SEEKER gasi online (API)
- [ ] Testy + build zielone
- [ ] Roadmap S-01 oznaczony done po Phase 2

## Progress

| Phase | Status | Commit | Notes |
| ----- | ------ | ------ | ----- |
| 1 | **done** | _(brak — git user.name/email nie skonfigurowany)_ | `role.guard.spec.ts` (5 testów), toast w `app-header`, `verification.md`; `npm test` 8/8 OK; `npm run build` OK |
| 2 | pending | — | Manual smoke + roadmap |
| 3 | pending | — | Archive |
