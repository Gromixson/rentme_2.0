# auth-and-role-switch (S-01) — Plan Brief

> Pełny plan: `context/changes/auth-and-role-switch/plan.md`  
> Roadmap: S-01 | PRD: FR-001, FR-002

## What & Why

Slice S-01 zapewnia bramkę tożsamości dla całego RentMe: rejestracja, logowanie Firebase, przełącznik SEEKER/PROVIDER. Kod istnieje (~90%); change weryfikuje kontrakt i utwardza guardy przed Strumieniem B (request→booking).

## Starting Point

- Auth client: `AuthService` + login/register + guards
- API: register, me, active-role; login deprecated 410
- Brak testów `roleGuard`; cichy catch w `toggleRole()`

## Desired End State

Stabilny auth z testami guardów, toastem przy błędzie roli, checklistą manualną i zielonym build/test — gotowe do S-02/S-03.

## Key Decisions

| Decyzja | Wybór | Uzasadnienie |
| ------- | ----- | ------------ |
| Scope | Weryfikacja, nie rewrite | Baseline present w repo |
| Phase 1 focus | Testy + UX + checklist | Najszybszy sygnał jakości |
| Login endpoint | Nie dotykać 410 | AGENTS.md hard rule |

## Phases at a Glance

| Phase | Deliverable | Ryzyko |
| ----- | ----------- | ------ |
| 1 | role.guard.spec.ts, toast, verification.md, build/test | Niskie |
| 2 | Manual smoke, roadmap status | Wymaga Firebase |
| 3 | Archive | — |

## Success (summary)

Register → login → role switch (obie strony) → guards → build/test green.
