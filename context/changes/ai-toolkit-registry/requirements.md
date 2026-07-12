# Wymagania MVP — @rentme/ai-toolkit (M5L4)

## Funkcjonalne

1. **Paczka npm** `@rentme/ai-toolkit@0.1.0` z `publishConfig.registry` → GitHub Packages.
2. **Installer** (`install.mjs`):
   - Profile: `cursor`, `claude-code`, `codex`
   - Kopiowanie skilli do `{profile}.skillsDir`
   - Kopiowanie promptów do `{profile}.promptsDir`
   - Idempotentny sentinel w `AGENTS.md`: `BEGIN/END @rentme/ai-toolkit`
   - Manifest JSON w `{profile}.manifestDir`
3. **Uninstaller** (`uninstall.mjs`): usuwa tylko pliki z manifestu + sentinel.
4. **Skrypt konsumenta** w root `package.json`: `toolkit:install`, `toolkit:uninstall`.
5. **CI publish**: `packages: write`, `GITHUB_TOKEN`, trigger tag `ai-toolkit-v*` lub push do `main` w ścieżce paczki.

## Zawartość MVP

| Artefakt | Plik źródłowy                        | Cel po instalacji (cursor)                   |
| -------- | ------------------------------------ | -------------------------------------------- |
| Skill    | `skills/rentme-code-review/SKILL.md` | `.cursor/skills/rentme-code-review/SKILL.md` |
| Reguły   | `rules/team-rules.md`                | blok w `AGENTS.md`                           |
| Prompt   | `prompts/review-pr.md`               | `.cursor/prompts/review-pr.md`               |

## Niefunkcjonalne

- **Addytywność:** nie modyfikować `.cursor/skills/10x-*`, `rentme-*` już w repo
- **Bez sekretów:** token GH tylko w `.npmrc` konsumenta (dokumentacja)
- **SKILL.md:** format Agent Skills open standard (frontmatter `name`, `description`)
- **Polski:** dokumentacja w `context/` i `README.md` paczki

## Kryteria ukończenia

- [x] `npm run toolkit:install` — exit 0, log `✓ skill`, `✓ manifest`

## Poza zakresem

- Publikacja na żywo (wymaga `git remote`)
- Integracja lefthook/CI z review agentem (M5L3)
- Sync z `@przeprogramowani/10x-cli`
