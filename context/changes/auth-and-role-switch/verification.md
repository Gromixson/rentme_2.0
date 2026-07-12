# S-01 Verification Checklist — auth-and-role-switch

Mapowanie: FR-001 (register/login), FR-002 (role switch), MVP §2–§3.1.

## Prerequisites

- [ ] `environment.ts` skopiowany z `environment.example.ts`
- [ ] Firebase Auth Email/Password włączone (`npm run setup:auth` lub Console)
- [ ] Firestore włączony w projekcie
- [ ] `npm start` — frontend; API przez `environment.apiUrl`

## Automated (Phase 1)

- [ ] `npm test` — headless Chrome, w tym `auth-ready.spec.ts` + `role.guard.spec.ts`
- [ ] `npm run build` — production build bez błędów

## Manual smoke

### Register (FR-001)

1. [ ] Otwórz `/auth/register`
2. [ ] Utwórz konto (email, hasło ≥6, imię)
3. [ ] Po sukcesie przekierowanie na `/seeker` lub `/` → dashboard klienta
4. [ ] Nagłówek niebieski (SEEKER), imię widoczne

### Login (FR-001)

1. [ ] Wyloguj → `/auth/login`
2. [ ] Zaloguj tym samym kontem
3. [ ] Trafi na dashboard zgodny z `activeRole`

### Role switch (FR-002)

1. [ ] Kliknij „Tryb usługodawcy” → nagłówek pomarańczowy, URL `/provider`
2. [ ] Kliknij „Tryb klienta” → nagłówek niebieski, URL `/seeker`
3. [ ] Przy błędzie API (np. offline) — toast z komunikatem (nie cichy fail)

### Provider offline on SEEKER (guardrail)

1. [ ] Jako PROVIDER: uzupełnij profil, włącz **online**
2. [ ] Przełącz na SEEKER
3. [ ] Wróć na PROVIDER — status **offline** (API `PUT /status` nie wymagany ręcznie)

### Route guards

1. [ ] Jako SEEKER: wejście na `/provider` → redirect (nie provider dashboard)
2. [ ] Jako PROVIDER: wejście na `/seeker` → redirect
3. [ ] Wylogowany: `/seeker` → `/auth/login`

### Logout

1. [ ] Wyloguj → `/auth/login`
2. [ ] `/` wymaga logowania

## Results (Phase 2)

| Step | Pass/Fail | Notes |
| ---- | --------- | ----- |
| Register | | |
| Login | | |
| Role switch | | |
| Offline on SEEKER | | |
| Guards | | |
| Logout | | |

## Sign-off

- [ ] Wszystkie kroki Pass — S-01 gotowy do archive
- [ ] Blocker: _______________
