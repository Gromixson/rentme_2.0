# Artifact 3 — Kontrybutorzy (git log)

> **Zakres:** cała historia (= ostatnie 12 miesięcy; repo od 2026-07-12).  
> **Polecenia:** `git shortlog -sn`, `git log --format="%an" -- <path>`.

---

## TOP kontrybutorzy (commity)

| #   | Autor             | Commity | Udział | Bot?                                         |
| --- | ----------------- | ------- | ------ | -------------------------------------------- |
| 1   | Miroslaw Moskalik | 4       | 57%    | nie — właściciel repo                        |
| 2   | RentMe Agent      | 3       | 43%    | **tak** — agent Cursor (automatyzacja kursu) |

**Uwaga:** `git shortlog -sn --since="2025-07-12"` zawiesił się w PowerShell (brak outputu po 45s) — użyto `git log --format="%an" | Group-Object` jako fallback.

---

## Kontrybutorzy per hot area

### `functions/src/`

| Autor             | Commity |
| ----------------- | ------- |
| RentMe Agent      | 2       |
| Miroslaw Moskalik | 1       |

### `src/app/features/seeker/`

| Autor        | Commity |
| ------------ | ------- |
| RentMe Agent | 1       |

### `src/app/features/provider/`

| Autor        | Commity |
| ------------ | ------- |
| RentMe Agent | 2       |

### `src/app/features/auth/`

| Autor        | Commity |
| ------------ | ------- |
| RentMe Agent | 1       |

### `src/app/core/`

| Autor             | Commity |
| ----------------- | ------- |
| RentMe Agent      | 1       |
| Miroslaw Moskalik | 1       |

### `context/`

| Autor             | Commity |
| ----------------- | ------- |
| Miroslaw Moskalik | 4       |
| RentMe Agent      | 3       |

---

## Grupowanie tematyczne (ścieżki, nie grep)

| Temat                       | Ścieżki                                                                                                                | Kto dotykał                  | Commity łącznie |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------- |
| **Auth & role switch**      | `src/app/core/auth/**`, `src/app/features/auth/**`, `functions/src/routes/auth.ts`, `functions/src/middleware/auth.ts` | Moskalik + Agent (po 1)      | 2               |
| **Requests & timeout**      | seeker request-_ + provider/requests + `functions/.../requests._`                                                      | Agent 3, Moskalik 2          | 5               |
| **Provider accept/booking** | `src/app/features/provider/**`, `functions/.../providers.ts`, `functions/.../bookings.ts`                              | Agent 2, Moskalik 1          | 3               |
| **Bookings UX**             | `src/app/features/bookings/**`, `functions/.../bookings.ts`                                                            | po 1 każdy                   | 2               |
| **E2E / jakość**            | `e2e/**`, `.github/workflows/ci.yml`, `.cursor/hooks.json`                                                             | głównie Moskalik (M3L3/M3L4) | ~4 commity root |
| **Dokumentacja kursu**      | `context/**`                                                                                                           | Moskalik 4, Agent 3          | 7               |

---

## Kto „posiada” co (solo dev + agent)

| Domena                      | Owner                 | Uzasadnienie                              |
| --------------------------- | --------------------- | ----------------------------------------- |
| Decyzje produktowe / merge  | **Miroslaw Moskalik** | wszystkie merge commity, M3L4, M4L1       |
| Implementacja slice'ów M2L5 | **RentMe Agent**      | baseline + oba feature branch commity     |
| Auth guards / E2E           | **Miroslaw Moskalik** | role.guard, Playwright scaffold           |
| Firebase deploy / indeksy   | **Miroslaw Moskalik** | `context/deployment/deployment-result.md` |
| Reguły agenta               | **Miroslaw Moskalik** | `.cursor/rules`, `AGENTS.md`              |

**Wniosek:** projekt **1–2 autorów efektywnych** (człowiek + agent). Brak zespołu — pytania kierować do właściciela repo.

---

## Commity referencyjne (kontekst autorstwa)

| Hash      | Autor        | Opis                                     |
| --------- | ------------ | ---------------------------------------- |
| `0bfb66f` | RentMe Agent | baseline przed M2L5 worktrees            |
| `a92e190` | RentMe Agent | request-timeout-expiry phase 1           |
| `6840234` | RentMe Agent | provider-accept-booking phase 2          |
| `7beffba` | Moskalik     | merge provider-accept-booking            |
| `d117768` | Moskalik     | merge parallel slices, hooks, Vitest, CI |
| `e599836` | Moskalik     | Playwright M3L4                          |
| `bf7766f` | Moskalik     | AGENTS.md M4L1                           |
