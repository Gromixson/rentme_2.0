# @rentme/ai-toolkit

Współdzielony rejestr skilli, reguł i promptów AI dla zespołu RentMe — lekcja **M5L4** (Shared AI Registry).

## Zawartość (MVP)

| Artefakt                     | Opis                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `skills/rentme-code-review/` | Skill recenzji kodu (5 wymiarów, hard rules RentMe)    |
| `rules/team-rules.md`        | Snippet wstrzykiwany do `AGENTS.md` między sentinelami |
| `prompts/review-pr.md`       | Szablon promptu do review PR                           |

## Instalacja lokalna (monorepo / dev)

Z katalogu głównego RentMe:

```bash
npm run toolkit:install
```

Profil domyślny: **cursor** (`.cursor/skills`, `.cursor/prompts`).

Inne profile:

```bash
node packages/rentme-ai-toolkit/install.mjs --profile=claude-code
node packages/rentme-ai-toolkit/install.mjs --profile=codex
```

### Co robi installer

1. Kopiuje skilli i prompty (tryb **copy**, bez symlinków)
2. Wstrzykuje `rules/team-rules.md` do `AGENTS.md` między:
   - `<!-- BEGIN @rentme/ai-toolkit -->` … `<!-- END @rentme/ai-toolkit -->`
3. Zapisuje manifest: `.cursor/.rentme-ai-toolkit-manifest.json`

Instalacja jest **addytywna** — nie nadpisuje skilli `10x-*` ani `rentme-*` z repo.

## Deinstalacja

```bash
npm run toolkit:uninstall
```

Usuwa wyłącznie pliki wymienione w manifeście oraz blok sentinel w `AGENTS.md`.

## Instalacja z GitHub Packages (docelowy model zespołowy)

### 1. Token konsumenta

Utwórz Personal Access Token z zakresem `read:packages`. W katalogu projektu (lub globalnie `~/.npmrc`):

```ini
@rentme:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_PKG_TOKEN}
```

**Nie commituj** tokenów. Użyj zmiennej środowiskowej `GH_PKG_TOKEN`.

### 2. Instalacja paczki

```bash
npm install @rentme/ai-toolkit --save-dev
npx @rentme/ai-toolkit-install
# lub po skonfigurowaniu bin w package.json paczki:
node node_modules/@rentme/ai-toolkit/install.mjs
```

Stub `ensureGitHubPackagesAuth()` w `install.mjs` ostrzega, gdy brak `.npmrc`.

## Publikacja (maintainer)

Wymaga `git remote` na GitHubie i uprawnień `packages: write` (domyślnie `GITHUB_TOKEN` w Actions).

### Wersjonowanie

Przed publikacją podnieś `version` w `package.json` (semver).

### Workflow

- **Repo root:** `.github/workflows/publish-ai-toolkit.yml` — push tag `ai-toolkit-v*` lub ręczny `workflow_dispatch`
- **Paczka:** `packages/rentme-ai-toolkit/.github/workflows/publish.yml` — push do `main` z zmianą w `packages/rentme-ai-toolkit/**`

```bash
git tag ai-toolkit-v0.1.0
git push origin ai-toolkit-v0.1.0
```

Sekrety: **brak** dla publish (`GITHUB_TOKEN` wystarczy). Konsumenci potrzebują `GH_PKG_TOKEN` (read:packages).

## Profile narzędzi

| Profil        | Skills           | Manifest                                   |
| ------------- | ---------------- | ------------------------------------------ |
| `cursor`      | `.cursor/skills` | `.cursor/.rentme-ai-toolkit-manifest.json` |
| `claude-code` | `.claude/skills` | `.claude/.rentme-ai-toolkit-manifest.json` |
| `codex`       | `.agents/skills` | `.agents/.rentme-ai-toolkit-manifest.json` |

## Model dostawy (kurs vs zespół)

| Model                         | Opis                                                 | RentMe                                     |
| ----------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| **Model 1** — GitHub Packages | Prywatny npm w org — wersjonowanie, CI publish       | **docelowy** dla małego zespołu            |
| **Model 2** — Marketplace     | Lock-in vendora (Cursor/Copilot store)               | odrzucony                                  |
| **Model 3** — 10x-cli         | `npx @przeprogramowani/10x-cli get` — lekcje kursowe | **obecny** (manifest `m1l4`, auth timeout) |

Paczka `@rentme/ai-toolkit` uzupełnia Model 3 o **własne** reguły produktowe RentMe, niezależne od sync kursu.

## Powiązania

- Agent CLI: `agents/code-review/` (M5L2)
- Change docs: `context/changes/ai-toolkit-registry/`
- Backlog: `context/foundation/pending-backlog.md` — M5L4
