# Rule Review — AGENTS.md (M4L1)

**Overall:** Zdrowy plik MVP (~76 linii); po refaktorze M4L1 — TOC wskazujący na `context/`, bez encyklopedii. Wszystkie akcje z scorecardu zastosowane w tej lekcji.

**Data:** 2026-07-12 · **Przed:** 76 linii niepustych · **Po:** 68 linii niepustych

## Scorecard (przed refaktorem)

| #   | Check               | Verdict | Score                                  |
| --- | ------------------- | ------- | -------------------------------------- |
| 1   | Length              | OK      | 76 non-blank lines                     |
| 2   | Direct snippets     | OK      | 1 flagged block (structure tree)       |
| 3   | Precise language    | OK      | 0 vague phrases                        |
| 4   | Redundant knowledge | WARN    | 3 redundant rules                      |
| 5   | Rule ordering       | OK      | Hard rules at top; reference scattered |

## Findings (przed)

### 1. Length — OK

76 linii niepustych — w docelowym zakresie MVP (50–120).

### 2. Direct snippets — OK

- `AGENTS.md:26-31` — drzewo `src/app/` → zastąpione tabelą Architecture (format referencyjny, bez duplikacji z `rentme-project.mdc`).

### 3. Precise language — OK

Brak ogólników typu „write clean code”; reguły są testowalne (auth path, error shape, guards).

### 4. Redundant knowledge — WARN

- `AGENTS.md:50` — szczegóły Cursor hooks → `@context/foundation/test-plan.md` §7 (zastosowano).
- `AGENTS.md:52` — łańcuch setup Firebase → `@README.md` + `@context/deployment/` (zastosowano).
- `AGENTS.md:75-79` — Security duplikuje `rentme-project.mdc` → skrócone do pointerów w Conventions (zastosowano).

### 5. Rule ordering — OK

Hard rules na górze; sekcja Reference przeniesiona na dół jako spis treści `context/`.

## Top 3 actions (wykonane)

1. **Restrukturyzacja TOC** — Project → Hard rules → Commands → Architecture → Conventions → Skills → Reference.
2. **Przeniesienie szczegółów do context/** — deploy, hooks, pełny test-plan przez `@`-linki zamiast inline.
3. **Dodanie `context/README.md`** — indeks drzewa kontekstu (ladder step 1).

## Ladder decision

**RentMe pozostaje na step 1:** root `AGENTS.md` + centralne `context/`. Brak per-module `AGENTS.md` / `context/features/…` — MVP-scale, jeden zespół, jeden onboarding.

Architect path L2–L5 (per-area rules, nested context) — **pending**; patrz `pending-backlog.md`.

## Po refaktorze — scorecard

| #   | Check               | Verdict                  |
| --- | ------------------- | ------------------------ |
| 1   | Length              | OK (68)                  |
| 2   | Direct snippets     | OK (0 fenced blocks)     |
| 3   | Precise language    | OK                       |
| 4   | Redundant knowledge | OK                       |
| 5   | Rule ordering       | OK (Reference at bottom) |
