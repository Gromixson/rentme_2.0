## RentMe AI Toolkit — reguły zespołowe

> Wstrzyknięte przez `@rentme/ai-toolkit`. Nie edytuj ręcznie między sentinelami — uruchom `npm run toolkit:install` po aktualizacji paczki.

### Code review

- Przed merge PR uruchom skill `rentme-code-review` lub lokalny agent: `git diff origin/main...HEAD | npm run review:diff` (wymaga `OPENROUTER_API_KEY` w `agents/code-review/`).
- **Verdict `fail`** blokuje merge bez uzgodnionej poprawki lub świadomej akceptacji ryzyka w opisie PR.
- Krytyczne naruszenia: Firestore w komponentach, `POST /api/auth/login`, sekrety w repo, brak testów przy zmianach w `respond` / expiry / transakcjach.

### Współdzielone artefakty

| Artefakt     | Ścieżka po instalacji                        |
| ------------ | -------------------------------------------- |
| Skill review | `.cursor/skills/rentme-code-review/SKILL.md` |
| Prompt PR    | `.cursor/prompts/review-pr.md`               |
| Manifest     | `.cursor/.rentme-ai-toolkit-manifest.json`   |

### Aktualizacja toolkitu

```bash
npm run toolkit:install    # po bump wersji @rentme/ai-toolkit
npm run toolkit:uninstall  # usuwa tylko pliki z manifestu
```
