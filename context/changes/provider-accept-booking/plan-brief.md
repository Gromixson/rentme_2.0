# Provider accept → booking — Plan Brief

> Pełny plan: `context/changes/provider-accept-booking/plan.md`
> Roadmap: S-06 `provider-accept-booking` (north star)
> PRD: US-02, FR-008, FR-012

## Co i dlaczego

Slice S-06 to **kamień milowy walidacji** RentMe — bez accept→booking reszta MVP nie ma wartości demo. Kod istnieje; ten change **weryfikuje kontrakt API i UX**, nie buduje flow od zera.

## Punkt startowy

- Transakcja accept tworzy `bookings` doc ze statusem `CONFIRMED`, ustawia request `ACCEPTED`, provider offline.
- UI po obu stronach jest podłączone do API przez `ApiService`.
- **Luka:** endpoint respond nie łapie błędów transakcji → klient może dostać 500 zamiast czytelnego `{ error }`.

## Stan docelowy

- Błędy respond mapowane na 404/403/409/410 z polskimi komunikatami (konwencja projektu).
- Provider po akceptacji widzi CTA do `/bookings`.
- `npm run build` + `functions:build` przechodzą.

## Fazy (skrót)

| Faza | Zakres                                  | Ryzyko |
| ---- | --------------------------------------- | ------ |
| 1    | Mapowanie błędów API respond            | Niskie |
| 2    | UX provider → bookings po accept        | Niskie |
| 3    | Checklist manual + aktualizacja roadmap | —      |

## Kryteria sukcesu (skrót)

- Accept tworzy dokładnie jeden booking; decline/timeout — zero bookingów.
- API zwraca `{ error: string }` dla wszystkich ścieżek błędu respond.
- Build Angular + Functions OK.
