# Research — istniejące artefakty AI (M5L4)

## Skille w repo (`.cursor/skills/`)

| Skill             | Źródło              | Uwagi                                            |
| ----------------- | ------------------- | ------------------------------------------------ |
| `10x-*` (12+)     | Kurs / ręczna kopia | Workflow `context/`; nie pakować do toolkitu MVP |
| `rentme-stack`    | Repo lokalne        | Konwencje Angular + Firebase                     |
| `rentme-firebase` | Repo lokalne        | Auth, Firestore model, rules                     |
| `rentme-feature`  | Repo lokalne        | Implementacja FR/US z PRD                        |

**Wniosek:** toolkit MVP dodaje **jeden** skill `rentme-code-review` — nie duplikuje `rentme-*` ani `10x-*`.

## Reguły

| Plik                               | Sentinel / zakres                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                        | Brak `@rentme/ai-toolkit` przed M5L4; blok `BEGIN/END @przeprogramowani/10x-cli` z kursu (Model 3) |
| `.cursor/rules/rentme-project.mdc` | `src/**` — hard rules aplikacji                                                                    |
| `.cursor/rules/10x-course.mdc`     | `context/**` — łańcuch kursu                                                                       |

**Wniosek:** team-rules wstrzykiwane **poniżej** głównej treści `AGENTS.md`, osobny sentinel — nie koliduje z `10x-cli`.

## Agent code-review (M5L2)

- Ścieżka: `agents/code-review/` (`@rentme/code-review` private)
- Kryteria: `src/common/review-schema.ts` — 5 wymiarów, `SYSTEM_PROMPT` po polsku
- Uruchomienie: `git diff | npm run review` (wymaga `OPENROUTER_API_KEY`)
- Skill `rentme-code-review` **opakowuje** te kryteria dla hostów bez OpenRouter

## Wzorce instalacji

| Model                  | Mechanizm                                                                                      | Stan RentMe                   |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- |
| 10x-cli (M3)           | `npx @przeprogramowani/10x-cli get` + manifest `.cursor/.10x-cli-manifest.json`                | `auth_timeout`, lesson `m1l4` |
| GitHub Packages (M5L4) | `npm install @rentme/ai-toolkit` + `install.mjs` + manifest `.rentme-ai-toolkit-manifest.json` | **implementowany lokalnie**   |
| Copy vs symlink        | Lekcja: copy mode dla Windows/portable                                                         | **copy** w `install.mjs`      |

## Champion / opportunity map

- Sygnał 2 (brak `git remote`): toolkit + `agents/code-review` = lokalny review przed push
- Sygnał 3 (10x-cli): Model 3 dokumentowany jako kurs; nie blokuje toolkitu
- Link: `context/champion/opportunity-map.md` §M5L2

## Manifest 10x-cli (referencja)

Plik: `.cursor/.10x-cli-manifest.json` — osobny od `.rentme-ai-toolkit-manifest.json`; oba mogą współistnieć.
