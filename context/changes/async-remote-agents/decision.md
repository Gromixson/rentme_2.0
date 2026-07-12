# M5L5 — Decyzja trybu kontroli

> Data: 2026-07-12 · Lekcja: Innovate — Async & Remote Agents

## Wybrane zadanie

**Phase 1 `refactor-opportunities`** — Vitest characterization tests dla `POST /api/providers/requests/:id/respond` (accept, decline, TIMEOUT, NOT_PENDING, FORBIDDEN, NOT_FOUND).

**Nie wybrano:** rutyna `npm run status:digest` — to zadanie M5L1 (Tryb 3 / routine) bez nowej wartości produktowej; Phase 1 ma gotowy plan z M4L4, jasne kryteria stopu i bezpośredni wpływ na P0 test-plan (R-01/R-02/R-06).

## Tryb kontroli

| Pole                  | Decyzja                                                       |
| --------------------- | ------------------------------------------------------------- |
| **Tryb docelowy**     | **Tryb 2 — sandbox (dry-run)**                                |
| **Wykonanie lokalne** | **Tryb 1 — headless** (implementacja Phase 1 bez Cloud Agent) |

### Uzasadnienie Trybu 2 (dry-run)

Cloud Agent / sandbox wymaga `git remote`, push brancha i dostępu do Cursor Cloud — wszystkie **zablokowane** (`pending-backlog.md`: brak remote, brak `gh`). Lekcja dopuszcza operacyjny dry-run: pełny kontrakt delegacji + checklista kroków bez faktycznego uruchomienia agenta w chmurze.

### Uzasadnienie lokalnej implementacji (Tryb 1)

Plan Phase 1 jest jednoznaczny (pliki, scenariusze, `npm run functions:test`). Solo dev może bezpiecznie wykonać headless w tym samym repo — wynik udokumentowany w `dry-run.md` jako „wykonane lokalnie”, podczas gdy kroki chmurowe pozostają „zablokowane przez dostęp”.

## Dlaczego NIE produkcja / szeroki scope

1. **Sekrety:** respond dotyka tylko mocków Vitest i kodu Functions — bez `environment.ts`, kluczy Firebase ani kont E2E.
2. **Zakres:** jedna faza jednego change-id (6 scenariuszy testowych); bez Phase 2–3 refaktoru, bez deployu, bez zmian kontraktu HTTP/Angular.
3. **Remote:** delegacja async zakłada review PR w CI — niemożliwe bez `git remote`; dry-run dokumentuje lukę zamiast udawać green pipeline.
