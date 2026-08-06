# M3L5 — Swallowed-error audit (`functions/src`)

> Data: 2026-07-25 · Status: **ukończone** (bez paczki skill CLI — audyt ręczny + fix)

## Cel lekcji

Znaleźć `catch` bez logowania / bez mapowania na `{ error: string }` i naprawić ciche połykanie błędów.

## Audyt

| Miejsce                                                                  | Przed                                  | Werdykt                                            | Po                      |
| ------------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------- | ----------------------- |
| `middleware/auth.ts` `requireAuth`                                       | `catch { 401 }` bez logu               | **swallowed log** — HTTP OK, diagnostyka ślepa     | `console.warn` + 401    |
| `routes/auth.ts` register rollback `deleteUser().catch(() => undefined)` | ciche `undefined`                      | **swallowed** — orphan Auth user możliwy bez śladu | `console.error` z `uid` |
| `routes/providers.ts` recalc po respond                                  | `console.error` + kontynuacja          | **OK** — celowy soft-fail (booking już zapisany)   | bez zmian               |
| `routes/providers.ts` respond outer catch                                | `respondHttpError`                     | **OK**                                             | bez zmian               |
| `routes/auth.ts` outer register catch                                    | `console.error` + `{ error }`          | **OK**                                             | bez zmian               |
| Pozostałe routes                                                         | wczesne `res.status().json({ error })` | **OK** — brak pustych catch                        | bez zmian               |

## Fixy

1. [`functions/src/middleware/auth.ts`](../../functions/src/middleware/auth.ts) — log przy nieudanym `verifyIdToken`
2. [`functions/src/routes/auth.ts`](../../functions/src/routes/auth.ts) — log przy nieudanym rollbacku Auth
3. Bonus (UI): [`provider-requests.component.ts`](../../src/app/features/provider/requests/provider-requests.component.ts) — `error` na `getPendingRequests` (wcześniej tylko `next`)

## Lesson learned

Dopisane do [`lessons.md`](../foundation/lessons.md): rollback / cleanup w `catch` musi logować, nawet gdy nie zmienia odpowiedzi HTTP.
