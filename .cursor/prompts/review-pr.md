# Prompt — review pull request (RentMe)

Przejrzyj poniższy pull request w projekcie **RentMe 2.0** (Angular 21 + Firebase Functions).

## Kontekst

- Hard rules: `@AGENTS.md`, `@.cursor/rules/rentme-project.mdc`
- Skill: `rentme-code-review` (pięć wymiarów + verdict pass/fail)
- Ryzyka domenowe: `@context/foundation/test-plan.md` (R-01 accept race, R-04 timeout)

## Wejście

```
{{PR_DIFF}}
```

## Oczekiwany format odpowiedzi

1. **Scores** (1–10): correctness, security, maintainability, conventions, testCoverage
2. **Verdict:** `pass` | `fail`
3. **Summary** (Markdown):
   - Co zmienia PR (1–2 zdania)
   - Blockers (jeśli fail) — plik, problem, sugerowana poprawka
   - Nice-to-have (opcjonalnie)
4. **Checklist** (tak/nie):
   - [ ] Brak Firestore w komponentach Angular
   - [ ] API errors jako `{ error: string }`
   - [ ] Testy Functions/Angular przy ryzykownej logice
   - [ ] Brak sekretów i kluczy Firebase w diffie

Skup się wyłącznie na diffie. Nie wymyślaj plików spoza zmian.
