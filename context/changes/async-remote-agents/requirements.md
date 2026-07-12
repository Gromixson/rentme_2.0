# M5L5 — Wymagania delegacji async/remote

## Funkcjonalne

1. **Jedno bounded zadanie** — Phase 1 `refactor-opportunities` (characterization tests respond).
2. **Kontrakt delegacji** — prompt `/goal` z polami: Cel, Zakres, Warunek stopu, Setup, Sieć, MCP, Sekrety, Review checklist.
3. **Decyzja trybu** — dokumentacja Tryb 2 (sandbox dry-run) vs lokalny Tryb 1 (headless).
4. **Dry-run** — każdy krok async workflow oznaczony statusem.

## Niefunkcjonalne

| Wymaganie | Szczegół                                                           |
| --------- | ------------------------------------------------------------------ |
| Język     | Polski w `context/`                                                |
| Sekrety   | Brak produkcyjnych kluczy, env E2E, OpenRouter w delegacji         |
| Scope     | Tylko `functions/` — testy respond; bez Angular, deploy, Phase 2–3 |
| Review    | Checklist w `review.md`; zielony test ≠ sukces delegacji cloud     |

## Out of scope

- Uruchomienie faktycznego Cloud Agent (wymaga remote + Cursor Cloud)
- Phase 2–3 refactor-opportunities
- Integracja `agents/code-review` w CI (M5L3)
- Rutyna `status:digest` jako główne zadanie (M5L1 już done)

## Kryteria ukończenia lekcji

- [x] Wszystkie pliki w `context/changes/async-remote-agents/`
- [x] Skill stub `.cursor/skills/10x-goal-implement/SKILL.md`
- [x] `pending-backlog.md` — M5L5 + Moduł 5 Innovate complete
- [x] Commit: `docs: M5L5 async delegation contract and dry-run`
