---
change_id: refactor-opportunities
researched_at: 2026-07-12
last_updated: 2026-07-12
tag: verified
lesson: M4L4
upstream: context/changes/provider-accept-booking-flow/research.md
roadmap_ref: S-06
---

# Research — możliwości refaktoryzacji (S-06 north star)

**Cel jednolinijkowy:** Na podstawie dowodów z M4L3 ocenić, które problemy długu technicznego w slice accept/timeout/booking kwalifikują się do refaktoryzacji strukturalnej, a które wymagają testów, dokumentacji lub procesu — bez zmian w kodzie.

**Źródło dowodów:** [`provider-accept-booking-flow/research.md`](../provider-accept-booking-flow/research.md) (M4L3). Poniższe twierdzenia traktujemy jako hipotezy robocze i weryfikujemy w §6.

---

## 0. Klasyfikacja wstępna

### KANDYDAT (refaktor strukturalny)

| ID      | Problem (skrót)                                             | Dlaczego kandydat                                         |
| ------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| **P3**  | Triple-path expiry — scheduler + lazy read + inline respond | Trzy ścieżki muszą być spójne co do `expiresAt`; coupling |
| **P4**  | Duplikacja guarda timeout w dwóch transakcjach Firestore    | Ta sama reguła biznesowa w `providers.ts` i `requests.ts` |
| **P10** | Monolityczny handler respond (~60 LOC tx w route)           | Transaction Script w trasie Express — trudny harness      |

### NIE-KANDYDAT (testy, proces, akceptowalny coupling MVP)

| ID     | Problem (skrót)                                   | Dlaczego nie refaktor strukturalny                         |
| ------ | ------------------------------------------------- | ---------------------------------------------------------- |
| **P1** | Brak Vitest dla `POST .../respond`                | Luka testowa — guard-first, nie zmiana architektury        |
| **P2** | E2E `accept-booking` SKIP bez creds               | Blocker env / proces weryfikacji                           |
| **P5** | Race accept vs expire — brak testu integracyjnego | Test harness, nie kształt kodu                             |
| **P6** | Brak unit testów `request-waiting` polling        | Test komponentu z mock API                                 |
| **P7** | `provider-accept-booking` phase 3 manual pending  | Checklist MVP §7 — proces, nie struktura                   |
| **P8** | `recalcCategoryOnlineCounts` poza tx              | Świadomy trade-off MVP (best-effort counts)                |
| **P9** | Polling bez backoff (seeker 3 s, provider 5 s)    | Niski koszt na skali MVP; zmiana UX, nie dług transakcyjny |

---

## 1. Pełna lista problemów z M4L3 (P1–P10)

| ID      | Opis                                                                                                                       | Źródło M4L3  | Ryzyko test-plan       |
| ------- | -------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------- |
| **P1**  | Brak unit/harness dla `POST /providers/requests/:id/respond` (accept, decline, 410, 409, 403)                              | §2.1, §2.5   | R-01, R-02, R-06, R-10 |
| **P2**  | E2E north star SKIP — `test.skip(!hasDualAccountCreds())`                                                                  | §2.1, §1.5   | R-01, R-03             |
| **P3**  | Triple-path expiry: scheduler (`index.ts:12-19`) + lazy (`resolveRequestStatus`) + inline respond (`providers.ts:134-137`) | §1.3, §2.3   | R-04, R-01             |
| **P4**  | Duplikacja re-check `PENDING` + `expiresAt` w dwóch `runTransaction`                                                       | §2.3, §2.4   | R-01, R-06             |
| **P5**  | Race accept vs expire w ostatniej sekundzie — brak testu                                                                   | §2.1         | R-01                   |
| **P6**  | `request-waiting` — poll 3 s bez unit testów z mock API                                                                    | §2.1         | R-04 (UI)              |
| **P7**  | Phase 3 manual MVP §7 niezamknięta → S-06 `in-progress`                                                                    | §2.1, §2.5   | —                      |
| **P8**  | `recalcCategoryOnlineCounts` po respond poza tx — failure tylko log                                                        | §2.3         | R-09 (niski)           |
| **P9**  | Stałe interwały poll bez backoff                                                                                           | §2.3         | niski                  |
| **P10** | Handler respond = Transaction Script w `routes/providers.ts` (tx + booking + offline w jednym bloku)                       | §2.4 hotspot | R-01 blast radius      |

---

## 2. Trzy perspektywy — KANDYDAT P3 (triple-path expiry)

### Obecny kształt

**Transaction Script + dual-path read model** — logika expiry rozproszona między scheduler, serwis read-path i handler respond.

| Ścieżka     | Plik:linia                   | Mechanizm                                        | Etykieta     |
| ----------- | ---------------------------- | ------------------------------------------------ | ------------ |
| Scheduler   | `index.ts:12-19`             | `expireStalePendingRequests` co 1 min, limit 100 | **evidence** |
| Lazy read   | `services/requests.ts:41-49` | `resolveRequestStatus` → `expirePendingRequest`  | **evidence** |
| Respond     | `providers.ts:134-137`       | Inline `expiresAt <= now` → TIMEOUT w tx         | **evidence** |
| Stała czasu | `db.ts:7`                    | `REQUEST_TIMEOUT_MS = 120_000`                   | **evidence** |
| Utworzenie  | `routes/requests.ts:46`      | `expiresAt: requestExpiresAt()`                  | **evidence** |

**Wzorzec:** brak jednego „ExpiryPolicy” — trzy entry pointy egzekwują tę samą regułę ad hoc.

### Historia i intencjonalność

| Fakt                                                                                      | Etykieta                                               |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Repo: 9 commitów, jeden dzień (2026-07-12); brak ADR                                      | **evidence**                                           |
| Scheduler + lazy expiry: commit `a92e190` (request-timeout-expiry phase 1)                | **evidence**                                           |
| Inline timeout w respond: commit `0bfb66f` (baseline M2L5) — cały handler jednym commitem | **evidence** (git blame `providers.ts:118-178`)        |
| Intencja produktowa: MVP ~2 min timeout, poll 3 s seekera — lag schedulera akceptowalny   | **inference** z `request-timeout-expiry/plan-brief.md` |
| Brak commitu „extract expiry service” — dual-path był świadomym wyborem S-05              | **inference**                                          |

### Wykonalność migracji

| Aspekt           | Ocena                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Strategia        | **Branch by Abstraction** — wspólna funkcja `assertRequestPendingAndNotExpired(tx, ref)` wywoływana z respond i `expirePendingRequest` |
| Blast radius     | **Średni** — `providers.ts`, `services/requests.ts`, ewentualnie testy expiry                                                          |
| Istniejące testy | 9 testów Vitest expiry (`requests.test.ts`) — **nie** pokrywają respond inline                                                         |
| CI               | `functions:test` w CI — nowe testy respond wymagane **przed** ekstrakcją (guard-first)                                                 |
| Strangler        | Możliwy — najpierw shared pure fn, potem podmiana w obu tx bez zmiany kontraktu HTTP                                                   |

---

## 3. Trzy perspektywy — KANDYDAT P4 (duplikacja tx timeout)

### Obecny kształt

Dwa niezależne `runTransaction` z nakładającą się logiką:

```10:17:functions/src/services/requests.ts
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const data = snap.data() as RequestDoc;
    if (!isPendingPastExpiry(data)) return data.status;
    tx.update(ref, { status: 'TIMEOUT' });
    return 'TIMEOUT';
  });
```

```133:137:functions/src/routes/providers.ts
      if (data.status !== 'PENDING') throw new Error('NOT_PENDING');
      if (data.expiresAt.toMillis() <= Date.now()) {
        tx.update(requestRef, { status: 'TIMEOUT' });
        return { errorCode: 'TIMEOUT' };
      }
```

**Wzorzec:** Transaction Script zduplikowany; `isPendingPastExpiry` istnieje (`requests.ts:4-6`) ale respond **nie używa** go w tx — ręczne porównanie `expiresAt`.

### Historia i intencjonalność

| Fakt                                                                                            | Etykieta      |
| ----------------------------------------------------------------------------------------------- | ------------- |
| `isPendingPastExpiry` dodane w ramach S-05 (Vitest phase 0)                                     | **evidence**  |
| Respond handler starszy (baseline) — inline check przed refaktorem S-05                         | **inference** |
| Różnica semantyczna: expire zwraca status; respond zwraca `{ errorCode: 'TIMEOUT' }` → HTTP 410 | **evidence**  |

### Wykonalność migracji

| Aspekt           | Ocena                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Strategia        | **Guard-first** + **Strangler** — najpierw testy respond; potem respond tx woła `isPendingPastExpiry` + wspólny helper persist TIMEOUT  |
| Blast radius     | **Niski–średni** — 2 pliki produkcyjne + rozszerzenie `requests.test.ts`                                                                |
| Ryzyko regresji  | **Wysokie bez testów** (R-01) — dlatego P1 blokuje refaktor P4                                                                          |
| Incremental path | Krok 1: test harness respond; Krok 2: użyj `isPendingPastExpiry` w respond tx; Krok 3: opcjonalnie jeden helper `applyTimeoutIfExpired` |

---

## 4. Trzy perspektywy — KANDYDAT P10 (monolityczny respond handler)

### Obecny kształt

**Transaction Script** w warstwie route — jedna transakcja łączy: autoryzację providerId, expiry, decline, accept, tworzenie `bookings`, offline provider.

| Odpowiedzialność      | Plik:linia             | Etykieta     |
| --------------------- | ---------------------- | ------------ |
| HTTP + walidacja body | `providers.ts:118-124` | **evidence** |
| Tx biznesowa          | `providers.ts:128-161` | **evidence** |
| Mapowanie błędów HTTP | `providers.ts:163-177` | **evidence** |
| Side-effect poza tx   | `providers.ts:168-172` | **evidence** |

**Wzorzec Fowler:** Transaction Script (proceduralny blok w handlerze), nie Domain Model.

### Historia i intencjonalność

| Fakt                                                                                                            | Etykieta                               |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Cały handler z baseline `0bfb66f` — jednorazowy sprint MVP                                                      | **evidence**                           |
| Phase 1 `provider-accept-booking` dodał try/catch + HTTP map — bez ekstrakcji serwisu                           | **inference** (merge `d117768`)        |
| Konwencja repo: `routes/` → cienkie handlery, `services/` — logika współdzielona (patrz `services/requests.ts`) | **inference** z `AGENTS.md` + repo-map |
| Brak `services/respond.ts` — luka względem wzorca S-05                                                          | **inference**                          |

### Wykonalność migracji

| Aspekt           | Ocena                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Strategia        | **Strangler Fig** — `respondToRequest(providerId, requestId, action)` w `services/`; route zostaje cienki |
| Blast radius     | **Wysoki** — 1 komponent Angular + `ApiService` + handler (min. 3 pliki przy zmianie kontraktu)           |
| Testy            | Obecnie **zero** — ekstrakcja bez harness = ślepa refaktoryzacja                                          |
| MVP scale        | Na 7 commitach / solo dev — **premature** pełny Domain Model                                              |
| Incremental path | Phase A: testy; Phase B: extract fn do `services/respond.ts`; Phase C: route = parse + call + map errors  |

---

## 5. Refactor opportunities (ranking)

### #1 — Guard-first: harness Vitest dla `POST .../respond` (P1 + enabler P4/P10)

| Pole                      | Wartość                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Obecny → docelowy**     | Brak testów respond → plik `providers.respond.test.ts` (mock tx) pokrywający accept/decline/410/409/403 |
| **Koszt długu**           | **Wysoki** — R-01/R-02/R-06 bez siatki; każda zmiana w tx = ryzyko regresji                             |
| **Koszt zmiany**          | **Niski** — wzorzec z `requests.test.ts` (mock `runTransaction`)                                        |
| **Blast radius**          | **Niski** — tylko `functions/src/**` testy                                                              |
| **Ścieżka inkrementalna** | 1) Skopiuj harness z `requests.test.ts` → 2) 5–7 przypadków respond → 3) CI green                       |
| **Pierwszy krok**         | `functions/src/routes/providers.respond.test.ts` — test accept happy path                               |
| **Typ refaktoru**         | Nie strukturalny — **characterization / guard** przed edycją produkcji                                  |

### #2 — Wspólny guard expiry (P3 + P4)

| Pole                      | Wartość                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Obecny → docelowy**     | Triple-path ad hoc → `isPendingPastExpiry` + opcjonalnie `expireInTransaction(tx, ref)` używane w respond **i** `expirePendingRequest` |
| **Koszt długu**           | **Średni** — rozjazd reguł przy zmianie timeout window lub statusów terminalnych                                                       |
| **Koszt zmiany**          | **Niski–średni** po #1 — 2 pliki, bez zmiany kontraktu HTTP                                                                            |
| **Blast radius**          | `services/requests.ts`, `routes/providers.ts`                                                                                          |
| **Ścieżka inkrementalna** | Strangler: pure fn już istnieje → podmiana inline check w respond → testy regresji                                                     |
| **Pierwszy krok**         | Test: respond na wygasły request zwraca 410 **i** persist TIMEOUT (characterization)                                                   |
| **Strategia**             | Branch by Abstraction (wspólny helper w `services/requests.ts`)                                                                        |

### #3 — Ekstrakcja `respondToRequest` do serwisu (P10)

| Pole                      | Wartość                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| **Obecny → docelowy**     | Transaction Script w route → cienki handler + `services/respond.ts`    |
| **Koszt długu**           | **Średni** na MVP — utrudnia testowanie i review transakcji            |
| **Koszt zmiany**          | **Średni** — move method + importy; wymaga #1 green                    |
| **Blast radius**          | `providers.ts` + nowy plik; kontrakt HTTP bez zmian                    |
| **Ścieżka inkrementalna** | Cut-paste tx do serwisu → route woła serwis → usuń duplikaty stopniowo |
| **Pierwszy krok**         | Po fazie #1 — jeden test integracyjny accept tworzy booking w mock tx  |

### Odrzucone kandydaty

| Kandydat                             | Powód odrzucenia                                                  |
| ------------------------------------ | ----------------------------------------------------------------- |
| **Domain Model** (Request aggregate) | Over-engineering na MVP; 7 commitów, brak drugiego konsumenta API |
| **Realtime zamiast poll** (P9)       | Poza MVP; PRD non-goals; koszt infra >> korzyść na demo           |
| **Cloud Tasks per request**          | Odrzucone w S-05 (`request-timeout-expiry/plan-brief.md`)         |
| **Scalanie schedulera z respond**    | Różne triggery (cron vs HTTP) — coupling gorszy niż wspólny guard |
| **Przeniesienie recalc do tx** (P8)  | Zwiększa czas tx; counts best-effort akceptowalne na MVP          |
| **Refaktor polling UI** (P6, P9)     | Osobny change-id `seeker-send-request`; nie blokuje S-06          |

### Top 3 długi (podsumowanie)

1. **Brak testów respond** (P1) — najwyższy impact×likelihood; blokuje bezpieczny refaktor.
2. **Rozjechany guard expiry** (P3+P4) — realny dług strukturalny w Functions.
3. **Monolityczny respond handler** (P10) — utrzymanie i review; adresowalny po #1.

---

## 6. Weryfikacja twierdzeń (ast-grep)

**Status narzędzia:** `@ast-grep/cli` zainstalowany (`npm i -D`, 2026-07-12), ale **`npx @ast-grep/cli` → `could not determine executable`** na Windows (precedens M4L3). Weryfikacja przez **ripgrep**.

| #   | Twierdzenie                                                                | Werdykt       | Dowód                                                                                 | Metoda                                   |
| --- | -------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| V1  | Dokładnie **1** call site `respondToRequest` w Angular (poza definicją)    | **confirmed** | `api.service.ts:121` (def), `provider-requests.component.ts:67` (call)                | `rg respondToRequest src/`               |
| V2  | `runTransaction` w **2** plikach produkcyjnych Functions                   | **confirmed** | `providers.ts:128`, `services/requests.ts:10` (+ mock w `requests.test.ts`)           | `rg runTransaction functions/src/`       |
| V3  | `expirePendingRequest` — definicja + **2** wywołania wewnętrzne            | **confirmed** | def `:8`; wywołania `:31` (scheduler loop), `:46` (resolve)                           | `rg expirePendingRequest functions/src/` |
| V4  | Handler respond tylko pod `/requests/:id/respond`                          | **confirmed** | Jedyny match `providers.ts:118`                                                       | `rg "requests/:id/respond" functions/`   |
| V5  | Seeker feature **nie** woła respond                                        | **confirmed** | 0 wyników w `src/app/features/seeker/`                                                | `rg respond src/app/features/seeker/`    |
| V6  | Brak testów `respond` w Functions                                          | **confirmed** | 0 matches `*.test.ts` + pattern `respond`                                             | `rg respond functions --glob *.test.ts`  |
| V7  | `REQUEST_TIMEOUT_MS` — **1** definicja, użycia w **2** plikach prod + test | **confirmed** | def `db.ts:7`; import `services/requests.ts:1,38`; test `requests.test.ts:3,30,82-84` | `rg REQUEST_TIMEOUT_MS`                  |
| V8  | Triple-path expiry — 3 entry pointy                                        | **confirmed** | scheduler `index.ts:12-15`; lazy `requests.ts:41-46`; inline `providers.ts:134-137`   | `rg expiresAt functions/src/*.ts` + read |
| V9  | E2E accept SKIP bez creds                                                  | **confirmed** | `accept-booking.spec.ts:12` `test.skip(!hasDualAccountCreds())`                       | read                                     |
| V10 | Poll seeker 3 s, provider 5 s                                              | **confirmed** | `request-waiting.component.ts:65`; `provider-requests.component.ts:57`                | `rg setInterval src/app/features`        |

**Korekty względem M4L3:** brak — liczby C1–C5 potwierdzone identycznie.

---

## 7. Granica M4L5 (domain context)

Redesign konceptów biznesowych (np. osobny aggregate Booking vs Request, event sourcing statusów, zmiana reguły „accept = offline”) **nie należy** do tego change-id — wymaga nested domain context (`context/domain/` lub M4L5). Research kończy się na ranking + plan guard-first.

---

## Powiązane artefakty

- M4L3: [`provider-accept-booking-flow/research.md`](../provider-accept-booking-flow/research.md)
- Plan implementacji: `plan.md`
- Test plan: `context/foundation/test-plan.md` — R-01…R-06
- Timeout slice: `context/changes/request-timeout-expiry/`
