# M5L5 — Kontrakt delegacji (prompt /goal)

Prompt do wklejenia w Cloud Agent lub lokalnego subagenta headless.

---

```
/goal refactor-opportunities-phase-1

Cel: Zaimplementuj Phase 1 z @context/changes/refactor-opportunities/plan.md — characterization tests Vitest dla POST .../respond (guard-first, zero zmiany kontraktu HTTP).

Zakres:
- Nowy plik: functions/src/routes/providers.respond.test.ts
- Minimalny export executeRespondTx w functions/src/routes/providers.ts TYLKO jeśli test tego wymaga (patrz plan §Phase 1)
- Scenariusze: accept (ACCEPTED + bookingId), decline (DECLINED), expiresAt w przeszłości (TIMEOUT), status ≠ PENDING (NOT_PENDING), providerId ≠ uid (FORBIDDEN), brak dokumentu (NOT_FOUND)
- Wzorzec mock tx: jak functions/src/services/requests.test.ts
- Poza scope: Phase 2–3, Domain Model, Angular, deploy, E2E creds

Warunek stopu:
- npm run functions:test — wszystkie testy PASS (stare + nowe, min. 5 scenariuszy respond)
- npm run functions:build — OK
- Brak zmian w kontrakcie API (URL, body, kody HTTP)
- Jeśli plan vs kod się rozjeżdża — STOP, zapisz pytanie w context/changes/async-remote-agents/dry-run.md, nie zgaduj

Setup:
- Repo: RentMe 2.0 (Angular 21 + Firebase Functions)
- Czytaj: @AGENTS.md, @context/changes/refactor-opportunities/plan.md, @context/foundation/test-plan.md (R-01, R-02, R-06)
- Branch roboczy: feature/refactor-opportunities-phase-1 (lokalnie; push wymaga remote)

Sieć:
- Brak wymagań sieciowych dla testów Vitest
- Nie uruchamiaj firebase deploy ani emulatorów — unit/harness only

MCP:
- Nie wymagane (brak Firestore live, brak Firebase MCP)

Sekrety: brak produkcyjnych
- Nie czytaj src/environments/environment.ts
- Nie używaj OPENROUTER_API_KEY ani E2E_*

Review checklist:
- [ ] Co najmniej 5 przypadków respond z plan.md
- [ ] Mock tx weryfikuje update/set (nie tautologia)
- [ ] executeRespondTx tylko jeśli konieczne — bez przedwczesnej ekstrakcji do services/ (Phase 3)
- [ ] npm run functions:test green
- [ ] Zero zmian w src/app/ (Angular)
- [ ] Commit: feat(functions): respond characterization tests (phase 1)
```

---

## Notatka operacyjna

W tym repo delegacja **nie została uruchomiona w Cloud Agent** (brak remote). Kontrakt powyżej jest gotowy do replay po dodaniu `git remote`. Lokalnie wykonano headless (patrz `dry-run.md`).
