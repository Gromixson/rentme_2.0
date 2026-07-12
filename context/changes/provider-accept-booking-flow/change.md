---
change_id: provider-accept-booking-flow
title: Deep focus — przepływ accept booking (S-06)
status: researched
created: 2026-07-12
updated: 2026-07-12
roadmap_ref: S-06
prd_refs: US-02, FR-008, FR-012
lesson: M4L3
related_change: provider-accept-booking
---

## Cel

**Analiza tylko (bez refaktoru)** przepływu north star S-06: seeker wysyła prośbę → provider odpowiada (accept/decline/timeout) → booking `CONFIRMED` widoczny u obu stron. Artefakt: `research.md` z trace E2E, długiem technicznym i weryfikacją strukturalną.

## Dlaczego ten change-id (wg `context/map/repo-map.md`)

1. **Gwiazda przewodnia roadmapy** — `S-06` w `context/foundation/roadmap.md` to najmniejszy kompleksowy moment udowadniający hipotezę produktu.
2. **Strefy ryzyka mapy** — slice łączy wszystkie wysokie-ryzyko obszary z repo-map: transakcje Firestore (`providers.ts`), timeout scheduler (`services/requests.ts` + `index.ts`), auth JWT (`middleware/auth.ts`), role guards (izolacja stref seeker/provider).
3. **Pierwszy dzień — happy path** — repo-map wskazuje kolejność czytania: `request-form` → `request-waiting` → `provider-requests` → `providers.ts` (respond) → `bookings-list`.

## Zakres

| W zakresie                         | Poza zakresem                                        |
| ---------------------------------- | ---------------------------------------------------- |
| Feature overview + trace file:line | Refaktor kodu                                        |
| Technical debt + blast radius      | Phase 3 manual checklist (`provider-accept-booking`) |
| Structural claims + ast-grep/rg    | Nowe testy / implementacja                           |

## Powiązania

- Mapa repo: `context/map/repo-map.md` — §Strefy ryzyka, §Pierwszy dzień
- Implementacja slice: `context/changes/provider-accept-booking/` (phase 1–2 done)
- Timeout (S-05): `context/changes/request-timeout-expiry/`
- Test plan: `context/foundation/test-plan.md` — R-01, R-02, R-03, R-04

## Acceptance (M4L3)

- [x] `change.md` z goal + link do repo-map
- [x] `research.md` — feature overview, technical debt, structural claims
- [x] Weryfikacja strukturalna (rg — ast-grep niedostępny na Win)
- [x] `pending-backlog.md` — M4L3 complete
