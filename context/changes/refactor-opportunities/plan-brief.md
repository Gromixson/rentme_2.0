# Refactor opportunities S-06 — Plan Brief

> Pełny plan: [`plan.md`](plan.md)  
> Research: [`research.md`](research.md) · M4L3: [`provider-accept-booking-flow/research.md`](../provider-accept-booking-flow/research.md)

## Co i dlaczego

M4L3 wykazał dług w slice north star S-06: brak testów respond, rozproszony guard expiry, monolityczny handler. M4L4 **planuje** guard-first refaktor w Functions — **bez** Domain Model i bez zmian kontraktu HTTP/Angular.

## Decyzje kluczowe

| Decyzja      | Wybór                                      |
| ------------ | ------------------------------------------ |
| Kolejność    | Testy → wspólny guard → ekstrakcja serwisu |
| Domain Model | **Odrzucony** na skali MVP                 |
| E2E creds    | Poza tym change — backlog blocker          |
| Kontrakt API | **Bez zmian**                              |

## Fazy (skrót)

| Faza | Zakres                             | Koszt   |
| ---- | ---------------------------------- | ------- |
| 1    | Vitest harness respond (P1)        | Niski   |
| 2    | `isPendingPastExpiry` w respond tx | Niski   |
| 3    | `services/respond.ts` (Strangler)  | Średni  |
| 4    | Docs handoff                       | Minimal |

## Pierwsza komenda implementacji

```bash
/10x-implement refactor-opportunities phase 1
```

## Top 3 długi (z research)

1. Brak testów `POST .../respond`
2. Rozjechany guard expiry (3 ścieżki)
3. Transaction Script w `providers.ts`
