# Mapa możliwości — sygnały tarcia (M5L1)

> Data: 2026-07-12 · Kontekst: solo dev + agenci AI, RentMe 2.0, kurs 10xDevs  
> Filtr: **Kup** / **Uzupełnij** / **Zbuduj** — uzupełniać istniejące narzędzia, nie zastępować.

---

## Krok 1 — Sygnały tarcia (5)

| #   | Sygnał                                                           | Dowód w repo                                                                                                    |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | **E2E creds brak → north star niezweryfikowany**                 | `pending-backlog.md` (blocker E2E); `role-guard.spec.ts` / `accept-booking.spec.ts` SKIP; `e2e/README.md`       |
| 2   | **Brak `git remote` + `gh` → brak PR/CI review**                 | `pending-backlog.md`; `.github/workflows/ci.yml` istnieje, ale pipeline nie ma gdzie biec                       |
| 3   | **10x CLI `auth_timeout` → lekcje m2l3–m5 nie zsynchronizowane** | manifest `.cursor/.10x-cli-manifest.json` utknął na `m1l4`; skilli kopiowane ręcznie                            |
| 4   | **Ręczny status w 3+ miejscach**                                 | Firebase Console + `pending-backlog.md` + `architect-report.md` + `deployment-result.md` — brak jednego digestu |
| 5   | **Sekcja „decyzje” w raporcie architekta pusta**                 | `architect-report.md` §6 — `[DO UZUPEŁNIENIA]` pod odznakę M4                                                   |

---

## Krok 2 — Mapy możliwości

### Sygnał 1: E2E creds → north star SKIP

| Pole                           | Treść                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Sygnał tarcia**              | Playwright ma pełny scaffold, ale R-01/R-03/R-07 są SKIP bez `E2E_*` env; happy path S-06 nie ma automatycznego dowodu regresji. |
| **SaaS / domyślna odpowiedź**  | Playwright + GitHub Actions secrets (`e2e.yml` stub) — wymaga remote + sekretów w CI.                                            |
| **Cienki helper (complement)** | Lokalny **preflight E2E** — sprawdza obecność zmiennych (bez wartości), listę projektów Playwright i które specy będą SKIP.      |
| **Pierwsza użyteczna wersja**  | Jedna komenda `npm run e2e:preflight` → tabela: seeker ✓/✗, provider ✓/✗, specy aktywne/skip.                                    |
| **Klasyfikacja**               | **Uzupełnij** — Playwright już jest; helper tylko sygnalizuje gotowość przed `npm run e2e`.                                      |

### Sygnał 2: Brak git remote

| Pole                           | Treść                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sygnał tarcia**              | Branchy feature (`m2l5-parallel-note.md`) nie mogą być pushowane; `gh pr create` niedostępne; CI w `.github/workflows/ci.yml` nie uruchomi się na PR.                                                                          |
| **SaaS / domyślna odpowiedź**  | GitHub + GitHub Actions + `gh` CLI — standardowy stack review.                                                                                                                                                                 |
| **Cienki helper (complement)** | **Release readiness check** — sekcja digestu: `git remote` ✓/✗, `gh` w PATH ✓/✗, ostatni commit, branch.                                                                                                                       |
| **Pierwsza użyteczna wersja**  | Linia w digestu: `Remote: brak` + link do instrukcji w backlogu.                                                                                                                                                               |
| **Klasyfikacja**               | **Kup** — problem rozwiązuje utworzenie repo na GitHubie; helper tylko przypomina.                                                                                                                                             |
| **M5L3 (2026-07-12)**          | **Zbudowano:** [`agents/code-review/README.md`](../../agents/code-review/README.md) + [`.github/workflows/ai-code-review.yml`](../../.github/workflows/ai-code-review.yml) — aktywacja po `git remote` + `OPENROUTER_API_KEY`. |

### Sygnał 3: 10x CLI auth timeout

| Pole                           | Treść                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Sygnał tarcia**              | `npx @przeprogramowani/10x-cli auth` kończy się timeoutem; manifest na `m1l4`; brak skilli m2l3–m5 z paczki.                         |
| **SaaS / domyślna odpowiedź**  | 10x CLI `auth` + `sync` / `get <lessonId>` — właściwe narzędzie kursu.                                                               |
| **Cienki helper (complement)** | **Manifest drift alert** — czyta `.10x-cli-manifest.json` (`lessonId`, `lastApplied`) i porównuje z oczekiwanym postępem w backlogu. |
| **Pierwsza użyteczna wersja**  | W digestu: `10x manifest: m1l4 (2026-05-20) — oczekiwane ≥ m4l5 po M4`.                                                              |
| **Klasyfikacja**               | **Kup** — odblokowanie wymaga magic linka od kursu; helper nie zastępuje CLI.                                                        |

### Sygnał 4: Rozproszony status misji (wybrany helper)

| Pole                           | Treść                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Sygnał tarcia**              | Przed sesją z agentem trzeba ręcznie czytać backlog, uruchamiać testy i sprawdzać deploy — powtarza się co sesję, łączy 4+ źródła.        |
| **SaaS / domyślna odpowiedź**  | Firebase Console (health), GitHub Actions (CI), Notion/Linear (backlog) — każdy w innym UI, bez kontekstu kursu.                          |
| **Cienki helper (complement)** | **Mission Log status digest** — jeden skrypt czyta lokalne pliki + szybkie checki, zwraca Markdown na stdout / `latest-digest.md`.        |
| **Pierwsza użyteczna wersja**  | `npm run status:digest` — blockers z backlogu, wynik `functions:test`, preflight E2E, git remote, manifest 10x, flaga decyzji architekta. |
| **Klasyfikacja**               | **Zbuduj** — brak gotowego SaaS łączącego backlog kursu + lokalne testy + Firebase project id z `.firebaserc`.                            |

### Sygnał 5: Pusta sekcja decyzji architekta

| Pole                           | Treść                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Sygnał tarcia**              | `architect-report.md` §6 ma placeholder — odznaka M4 wymaga 3–5 zdań od człowieka; łatwo zapomnieć przy kolejnych lekcjach. |
| **SaaS / domyślna odpowiedź**  | Formularz odznaki na platformie kursu — poza repo.                                                                          |
| **Cienki helper (complement)** | Digest sygnalizuje `architect-decisions: PENDING` dopóki w pliku jest `[DO UZUPEŁNIENIA]`.                                  |
| **Pierwsza użyteczna wersja**  | Jedna linia w digestu + link do §6 raportu.                                                                                 |
| **Klasyfikacja**               | **Uzupełnij** — treść decyzji i tak pisze człowiek; helper tylko przypomina.                                                |

---

## Krok 3 — Wybrany helper

**Wybrano sygnał 4** (rozproszony status) — powtarza się regularnie, łączy backlog + testy + git + manifest + raport architekta, testowalny lokalnie bez sekretów i bez pełnego produktu.

```
Helper: Mission Log status digest
Czyta: context/foundation/pending-backlog.md (sekcje Blockers + W toku), .firebaserc (project id),
       .cursor/.10x-cli-manifest.json, context/architect-report.md (flaga decyzji),
       zmienne E2E_* (tylko obecność), git remote/branch; opcjonalnie uruchamia npm run functions:test.
Zwraca: Markdown digest — data, Firebase project, lista blockerów, status testów Functions,
        preflight E2E, git remote, manifest 10x, flaga decyzji architekta, sugerowane następne kroki.
Nie robi: deployu, zapisu do Firebase Console, sync 10x CLI, uruchamiania pełnego E2E/Karma,
          nie wyświetla haseł ani wartości sekretów.
Ryzyko danych: niskie — tylko pliki lokalne i exit code testów; env vars sprawdzane boolean bez logowania wartości.
```

Implementacja: [`scripts/mission-status.mjs`](../../scripts/mission-status.mjs) · `npm run status:digest`

---

## M5L4 — Shared AI Registry

**Model docelowy:** GitHub Packages (`@rentme/ai-toolkit`) — patrz [`context/changes/ai-toolkit-registry/decision.md`](../changes/ai-toolkit-registry/decision.md).

| Element          | Ścieżka                                                            |
| ---------------- | ------------------------------------------------------------------ |
| Paczka           | [`packages/rentme-ai-toolkit/`](../../packages/rentme-ai-toolkit/) |
| Install          | `npm run toolkit:install`                                          |
| Skill            | `.cursor/skills/rentme-code-review/` (po instalacji)               |
| Agent CLI (M5L2) | [`agents/code-review/`](../../agents/code-review/)                 |

**Evidence Champion (screenshots później):** struktura `packages/rentme-ai-toolkit/`, wynik `npm run toolkit:install`, blok sentinel w `AGENTS.md`, manifest `.cursor/.rentme-ai-toolkit-manifest.json`.

---

## M5L2 — Agent code review (sygnał 2)

**Sygnał 2** (brak `git remote` / PR review) uzupełniony lokalnym helperem z lekcji M5L2:

- Pakiet: [`agents/code-review/`](../../agents/code-review/) — Vercel AI SDK 6 + OpenRouter
- Uruchomienie: `git diff HEAD~1 | npm run review:diff`
- Metryki tokenów na stderr; structured JSON na stdout
- CI / lefthook — planowane w **M5L3**
