---
change_id: refactor-opportunities
title: Refaktoryzacja z agentem — ocena długu S-06
status: planned
created: 2026-07-12
updated: 2026-07-12
roadmap_ref: S-06
lesson: M4L4
upstream_research: context/changes/provider-accept-booking-flow/research.md
related_changes:
  - provider-accept-booking
  - request-timeout-expiry
---

## Intencja

Odpowiedzieć **które** problemy wykryte w M4L3 (`provider-accept-booking-flow/research.md`) są warte naprawy strukturalnej, jaki jest **docelowy kształt** (Transaction Script → cienkie trasy + serwisy + wspólny guard expiry) oraz **kolejność** prac — bez implementacji w tej lekcji.

## Etapy (M4L4)

| Etap             | Artefakt          | Zakres                                     | Kod? |
| ---------------- | ----------------- | ------------------------------------------ | ---- |
| 1. Exploration   | `research.md`     | Klasyfikacja P1–P9, ranking, 3 perspektywy | ❌   |
| 2. Weryfikacja   | sekcja w research | ast-grep / rg — potwierdzenie twierdzeń    | ❌   |
| 3. Decision/plan | `plan.md`         | Decyzje wywiadu, fazy guard-first          | ❌   |
| 4. Plan review   | `plan-review.md`  | Checklist świeżych oczu                    | ❌   |
| 5. Implementacja | `/10x-implement`  | Dopiero po zamknięciu M4L4                 | ⏳   |

**Zasada lekcji:** w fazie exploration **zero refaktoru** w `src/` i `functions/`.

## Powiązanie z M4L3

- **Dowody bazowe:** [`context/changes/provider-accept-booking-flow/research.md`](../provider-accept-booking-flow/research.md) — E2E trace, dług techniczny §2, structural claims C1–C5.
- **Slice implementacyjny:** `provider-accept-booking` (phase 1–2 ✅, phase 3 manual ⏳).
- **Slice timeout:** `request-timeout-expiry` (phase 0–1 ✅, phases 2–4 ⏳).

## Zakres decyzyjny

| W zakresie M4L4                           | Poza zakresem (M4L5 / backlog)    |
| ----------------------------------------- | --------------------------------- |
| Ranking 2–3 refactor opportunities        | Redesign konceptów biznesowych    |
| Guard-first plan (testy przed refaktorem) | Big-bang Domain Model             |
| Odrzucenia z uzasadnieniem                | Realtime / WebSocket zamiast poll |
| Weryfikacja strukturalna rg               | Implementacja kodu                |

## Acceptance (M4L4)

- [x] `change.md` — intencja, etapy, link do M4L3
- [x] `research.md` — klasyfikacja, perspektywy, ranking (PL)
- [x] Weryfikacja twierdzeń (rg — ast-grep niedostępny na Win)
- [x] `plan.md` + opcjonalnie `plan-brief.md`
- [x] `plan-review.md`
- [x] `pending-backlog.md` — M4L4 complete
