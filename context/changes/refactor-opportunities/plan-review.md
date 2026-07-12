# Plan Review: refactor-opportunities

**Reviewed:** 2026-07-12  
**Reviewer:** agent (10x-plan-review — light pass)  
**Verdict:** **APPROVED** — gotowy do `/10x-implement phase 1`

## Checklist (świeże oczy)

| Pytanie                                           | Wynik | Uwagi                                                       |
| ------------------------------------------------- | ----- | ----------------------------------------------------------- |
| Plan odpowiada research ranking (#1→#2→#3)?       | ✅    | Sekwencja guard-first zgodna z `research.md` §5             |
| Phase 1 = characterization **przed** edycją prod? | ✅    | Explicit contract 5+ scenariuszy                            |
| Fazy = osobne commity / reversible?               | ✅    | 4 fazy z własnym scope                                      |
| „What We're NOT Doing” obecne?                    | ✅    | Domain Model, realtime, Cloud Tasks, Angular UI             |
| Decyzje wywiadu udokumentowane?                   | ✅    | Tabela w `plan.md` — OK bez live interview                  |
| Auto + manual verification per phase?             | ✅    | `functions:test` + opcjonalny smoke phase 3                 |
| Mechanism vs enforcement rozdzielone?             | ✅    | Test harness = mechanism; CI już egzekwuje `functions:test` |
| Format Progress dla `/10x-implement`?             | ✅    | Tabela phase/status/commit                                  |
| Nie koliduje z `provider-accept-booking` phase 3? | ✅    | Manual checklist poza scope                                 |
| Link do M4L3 research?                            | ✅    | W change.md, research.md, plan.md                           |

## Luki (nice-to-have, nie blokują phase 1)

1. **Eksport tx z route** — phase 1 może wymagać minimalnego refactoru pod testowalność; rozważyć od razu wydzielenie pure fn w phase 1 zamiast testowania Express handlera end-to-end.
2. **Supertest / emulator** — plan zakłada mock tx (jak R-04); pełna integracja Firestore emulator → Phase 2 test-plan, nie ten change.
3. **`verification.md`** — utworzyć dopiero przy implementacji (deliberate break opcjonalny).
4. **Typ odpowiedzi `respondToRequest` w Angular** — kosmetyka; poza scope.

## Ryzyko regresji

| Obszar              | Ocena   | Mitygacja w planie        |
| ------------------- | ------- | ------------------------- |
| Respond accept path | Wysokie | Phase 1 harness           |
| Expiry 410          | Średnie | Characterization przed P2 |
| Kontrakt HTTP       | Niskie  | Explicit no-change        |

## Werdykt

Brak blockerów. **Phase 1** implementowalna przez:

```bash
/10x-implement refactor-opportunities phase 1
```

Po phase 3 rozważyć wpis w `lessons.md` jeśli wzorzec „test przed refaktorem tx Firestore” się powtórzy.
