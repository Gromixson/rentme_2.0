---
name: rentme-code-review
description: >
  Recenzja kodu RentMe 2.0 (Angular 21 + Firebase Functions): pięć wymiarów
  (correctness, security, maintainability, conventions, testCoverage), hard rules
  z AGENTS.md i rentme-project.mdc. Użyj przy review PR, diffa lub przed merge.
  Trigger: code review, review PR, przejrzyj diff, recenzja kodu RentMe.
---

# RentMe — code review

## Kiedy używać

- Review PR lub lokalnego `git diff` przed commitem
- Weryfikacja zgodności z hard rules (`AGENTS.md`, `.cursor/rules/rentme-project.mdc`)
- Uzupełnienie lokalnego agenta `agents/code-review/` (OpenRouter) — ten skill działa w Cursor/Claude/Codex bez API

## Pięć wymiarów (skala 1–10)

| Wymiar              | Co sprawdzać                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| **correctness**     | Logika, edge case'y, transakcje Firestore, race accept/timeout               |
| **security**        | Auth guards, brak sekretów, reguły Firestore/Storage, `{ error: string }`    |
| **maintainability** | Czytelność, brak duplikacji expiry, spójność warstw                          |
| **conventions**     | `ApiService` zamiast Firestore w komponentach; standalone Angular; roleGuard |
| **testCoverage**    | Vitest dla Functions, Karma dla Angular; E2E przy ryzykownych ścieżkach      |

**Verdict:** `pass` — brak krytycznych problemów; `fail` — naruszenie hard rules lub brak testów przy ryzyku.

## Hard rules (RentMe)

1. Auth w kliencie: `signInWithEmailAndPassword` / `signOut` — **nie** `POST /api/auth/login`
2. Dane domenowe: tylko przez `ApiService` → `environment.apiUrl` — **nie** Firestore w komponentach
3. Tokeny: `FIREBASE_AUTH`, `FIREBASE_FIRESTORE`, `FIREBASE_STORAGE` z `core/firebase/`
4. Błędy API: `err?.error?.error` ← `{ error: string }`
5. MVP out of scope: płatności, chat, OAuth, logistyka — nie dodawać bez zmiany PRD

## Procedura

1. Przeczytaj diff — **tylko** zmienione pliki; nie wymyślaj kontekstu spoza diffa
2. Oceń pięć wymiarów (1–10) i podaj verdict
3. `summary` w Markdown: nagłówki, listy, konkretne uwagi z ścieżkami plików
4. Przy `fail` — wskaż minimalną poprawkę (co, gdzie, dlaczego)

## Powiązane artefakty

- Prompt PR: `.cursor/prompts/review-pr.md` (po instalacji toolkitu)
- Agent CLI: `agents/code-review/` — `git diff HEAD~1 | npm run review:diff` (wymaga `OPENROUTER_API_KEY`)
- Test plan: `@context/foundation/test-plan.md` — ryzyka R-01…R-10
- Reguły aplikacji: `@.cursor/rules/rentme-project.mdc`

## Czego NIE robić

- Nie sugeruj `@angular/fire` ani Supabase/Astro
- Nie wklejaj całego PRD — odwołuj się `@context/foundation/prd.md`
- Nie oceniaj treści produktowej — tylko jakość i zgodność zmian
