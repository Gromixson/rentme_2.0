---
project: RentMe
version: 1
status: draft
created: 2026-07-12
updated: 2026-07-26
prd_version: 2
main_goal: learn
top_blocker: skills
---

# Mapa drogowa: RentMe

> Pochodzi z `context/foundation/prd.md` (v2) + automatycznie zbadana baza kodu.
> Edytuj na miejscu; archiwizuj po zastąpieniu.
> Fragmenty poniżej są wymienione w kolejności zależności. Tabela „W skrócie” to indeks.

## Podsumowanie wizji

Ludzie szukający lokalnej usługi „na już” tracą czas na nieformalne wiadomości i ogłoszenia — bez wiedzy, kto jest dostępny, po jakiej cenie i czy w ogóle odpowie. RentMe to marketplace usług w stylu Fixly: klient wybiera kategorię, widzi usługodawców **online**, wysyła jedną krótką wiadomość; usługodawca ma ~2 minuty na TAK/NIE; po akceptacji powstaje rezerwacja, usługa się kończy, klient ocenia.

Rebuild greenfield na kursie — bez migracji danych z poprzedniej wersji. Kanoniczna specyfikacja implementacji: [`MVP.md`](../../MVP.md).

## Gwiazda przewodnia

**S-06: Provider akceptuje prośbę — powstaje booking widoczny u obu stron** — najmniejszy kompleksowy moment, który udowadnia hipotezę produktu: popyt klienta spotyka podaż usługodawcy online w kategorii, a akceptacja materializuje rezerwację w czasie.

> **Gwiazda przewodnia** — najmniejszy, kompleksowy fragment, którego pomyślne dostarczenie udowadnia podstawową hipotezę produktu; umieszczony tak wcześnie, jak pozwalają wymagania wstępne, bo reszta ma znaczenie tylko wtedy, gdy ten przepływ działa.

## W skrócie

| ID   | ID zmiany                 | Wynik (użytkownik może …)                                                | Wymagania wstępne | Odniesienia do PRD            | Status      |
| ---- | ------------------------- | ------------------------------------------------------------------------ | ----------------- | ----------------------------- | ----------- |
| F-01 | prod-observability-gate   | (fundament) podstawowa obserwowalność prod włączona przed demem          | —                 | NFR (błędy widoczne)          | proposed    |
| S-01 | auth-and-role-switch      | zarejestrować się, zalogować i przełączyć rolę SEEKER ↔ PROVIDER         | —                 | US-01, FR-001, FR-002         | ready       |
| S-02 | provider-profile-online   | uzupełnić profil providera (kategorie + stawka) i włączyć online         | S-01              | FR-003, FR-007                | ready       |
| S-03 | categories-and-seed       | przeglądać kategorie z liczbą online i zaseedować dane demo              | S-01              | FR-004, FR-006                | ready       |
| S-04 | discover-online-providers | zobaczyć listę tylko online providerów w wybranej kategorii              | S-02, S-03        | FR-005                        | ready       |
| S-05 | seeker-send-request       | wysłać jedną wiadomość-request i śledzić status z timerem                | S-04              | US-01, FR-010, FR-011, FR-013 | in-progress |
| S-06 | provider-accept-booking   | provider odpowiada TAK/NIE; po TAK powstaje booking u obu stron          | S-05              | US-02, FR-008, FR-012         | in-progress |
| S-07 | complete-booking          | oznaczyć usługę jako zakończoną (COMPLETED)                              | S-06              | FR-009                        | ready       |
| S-08 | rate-after-complete       | po COMPLETED wystawić ocenę 1–5; średnia aktualizuje się na liście       | S-07              | US-03, FR-014                 | ready       |
| S-09 | szukam-interest           | gdy nikt nie jest online, zasygnalizować „Szukam!”; provider widzi popyt | S-03              | FR-015                        | proposed    |

## Strumienie

Pomoc nawigacyjna — grupuje elementy, które dzielą łańcuch wymagań wstępnych. Kanoniczna kolejność nadal znajduje się w grafie zależności poniżej.

| Strumień | Temat                   | Łańcuch                                    | Uwaga                                                                          |
| -------- | ----------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| A        | Konto i tożsamość       | `S-01` → `S-02` / `S-03`                   | `main_goal: learn` — najpierw Auth + role, potem równolegle profil i kategorie |
| B        | Pętla klient → provider | `S-04` → `S-05` → `S-06` → `S-07` → `S-08` | Gwiazda przewodnia `S-06` w środku łańcucha; weryfikuje happy path §7 MVP.md   |
| C        | Popyt bez podaży        | `S-09`                                     | Should-have; dołącza do Strumienia A po `S-03`                                 |
| D        | Gotowość prod           | `F-01`                                     | Równolegle ze Strumieniem B; odblokowuje pewne demo na Hosting                 |

## Baza

Co już jest na miejscu w bazie kodu na dzień `2026-07-12` (automatycznie zbadane; użytkownik delegował — bez korekty ręcznej).
Fundamenty poniżej zakładają, że te elementy są obecne i NIE tworzą ich ponownie.

- **Frontend:** obecny — Angular 21 standalone, routing (`src/app/app.routes.ts`), feature modules seeker/provider/bookings/auth, PrimeNG, `ApiService` (`src/app/core/api/api.service.ts`)
- **Backend / API:** obecny — Express w Cloud Functions v2 (`functions/src/app.ts`), trasy auth/users/categories/providers/requests/bookings, scheduler `expireRequests` (`functions/src/index.ts`)
- **Dane:** obecny — Firestore Admin SDK (`functions/src/db.ts`), reguły (`firestore.rules`), indeksy (`firestore.indexes.json`), kolekcje users/providers/categories/requests/bookings/ratings/interests
- **Autoryzacja:** obecny — Firebase Auth email/hasło po stronie klienta (`src/app/core/auth/`), JWT middleware (`functions/src/middleware/auth.ts`), `POST /api/auth/active-role`
- **Wdrożenie / infra:** obecny — `firebase.json` (Hosting + Functions rewrite `/api/**`), `.firebaserc`, CI build+test (`.github/workflows/ci.yml`), skrypty `setup:appengine` / `setup:auth` (README, `context/foundation/infra-research.md`)
- **Obserwowalność:** częściowy — dokument `context/foundation/monitoring.md`, opcjonalny Firebase Performance w `firebase.providers.ts`; brak Crashlytics SDK; Cloud Logging domyślny dla Functions

## Fundamenty

### F-01: Brama obserwowalności przed produkcją

- **Wynik:** (fundament) Performance Monitoring włączone w Console, flaga prod ustawiona, podstawowy przegląd logów Functions po teście happy path.
- **ID zmiany:** prod-observability-gate
- **Odniesienia do PRD:** NFR (komunikaty błędów widoczne dla użytkownika; brak cichych 500)
- **Odblokowuje:** S-05, S-06, S-07, S-08 (pewne demo i diagnoza bez „cichych” awarii API)
- **Wymagania wstępne:** —
- **Równolegle z:** S-01, S-02, S-03
- **Blokady:** —
- **Niewiadome:** —
- **Ryzyko:** Warstwa częściowa w bazie — bez tego pierwsze demo na Hosting może ukrywać błędy CORS/cold start za toastami UI.
- **Status:** proposed

## Fragmenty

### S-01: Rejestracja, logowanie i przełącznik roli

- **Wynik:** użytkownik może zarejestrować się i zalogować emailem/hasłem oraz przełączyć aktywną rolę SEEKER ↔ PROVIDER (przełączenie na SEEKER gasi status online providera).
- **ID zmiany:** auth-and-role-switch
- **Odniesienia do PRD:** FR-001, FR-002
- **Wymagania wstępne:** —
- **Równolegle z:** F-01
- **Blokady:** —
- **Niewiadome:** —
- **Ryzyko:** Kod auth istnieje; ryzyko to regresja przy zmianach guardów — weryfikować przed pętlą request→booking.
- **Status:** ready (kod auth + role switch w repo; regresja opcjonalna przed demem)

### S-02: Profil providera i status online

- **Wynik:** provider może ustawić kategorie i stawkę > 0, a następnie jednym kliknięciem przełączyć online/offline (bez kompletnego profilu — blokada z komunikatem).
- **ID zmiany:** provider-profile-online
- **Odniesienia do PRD:** FR-003, FR-007
- **Wymagania wstępne:** S-01
- **Równolegle z:** S-03
- **Blokady:** —
- **Niewiadome:** —
- **Ryzyko:** Wymagane przed S-04 (tylko online w kategorii); dashboard i profil już w `src/app/features/provider/`.
- **Status:** ready

### S-03: Kategorie i seed demo

- **Wynik:** klient może przeglądać kategorie z liczbą providerów online i zaseedować kategorie jednym przyciskiem (dev/demo).
- **ID zmiany:** categories-and-seed
- **Odniesienia do PRD:** FR-004, FR-006
- **Wymagania wstępne:** S-01
- **Równolegle z:** S-02
- **Blokady:** —
- **Niewiadome:** —
- **Ryzyko:** Pusta baza bez seeda blokuje cały flow — sprawdzić `POST /api/categories/seed` przed demem.
- **Status:** ready

### S-04: Odkrywanie providerów online

- **Wynik:** klient może wybrać kategorię i zobaczyć kartę każdego **online** providera (pseudonim, ocena, stawka/h, status).
- **ID zmiany:** discover-online-providers
- **Odniesienia do PRD:** FR-005
- **Wymagania wstępne:** S-02, S-03
- **Równolegle z:** —
- **Blokady:** —
- **Niewiadome:** —
- **Ryzyko:** Filtr `isOnline` + kategoria po stronie API (`GET /api/categories/:id/providers`) — kluczowy guardrail PRD.
- **Status:** ready

### S-05: Wysłanie requestu i oczekiwanie

- **Wynik:** klient może wysłać jedną wiadomość (10–500 znaków) do wybranego online providera, zobaczyć ekran oczekiwania z timerem i listę „Moje prośby” ze statusami PENDING/ACCEPTED/DECLINED/TIMEOUT.
- **ID zmiany:** seeker-send-request
- **Odniesienia do PRD:** US-01, FR-010, FR-011, FR-013
- **Wymagania wstępne:** S-04
- **Równolegle z:** —
- **Blokady:** —
- **Niewiadome:**
  - Czy timeout wystarczająco niezawodny w demo (scheduler co 1 min + lazy expiry przy odczycie)? — Właściciel: implementer. Blokada: nie.
- **Ryzyko:** Implementacja scheduler + `resolveRequestStatus` już w `functions/src/services/requests.ts`; w demo sprawdzić scenariusz negatywny TIMEOUT z MVP.md §7.
- **Status:** in-progress — **code-complete** (phases 0–3 + cancel soft-delete 2026-07-26); `done` dopiero po phase 4 manual §7 / E2E — `request-timeout-expiry/verification.md`

### S-06: Akceptacja providera i utworzenie bookingu

- **Wynik:** provider może zaakceptować lub odrzucić pending request w oknie ~2 min; po akceptacji obie strony widzą booking ze statusem CONFIRMED; DECLINED/TIMEOUT nie tworzą bookingu.
- **ID zmiany:** provider-accept-booking
- **Odniesienia do PRD:** US-02, FR-008, FR-012
- **Wymagania wstępne:** S-05
- **Równolegle z:** —
- **Blokady:** —
- **Niewiadome:** —
- **Ryzyko:** To jest **kamień milowy walidacji** (rdzeń marketplace); bez tego slice reszta produktu nie ma wartości demonstracyjnej.
- **Status:** in-progress — **code-complete** (phases 1–2 + Vitest respond); `done` dopiero po phase 3 manual §7 / E2E — `provider-accept-booking/verification-phase-3.md`

### S-07: Zakończenie usługi

- **Wynik:** użytkownik może oznaczyć booking jako COMPLETED (przycisk „Zakończ usługę” w liście rezerwacji).
- **ID zmiany:** complete-booking
- **Odniesienia do PRD:** FR-009
- **Wymagania wstępne:** S-06
- **Równolegle z:** —
- **Blokady:** —
- **Niewiadome:**
  - Kto może zakończyć usługę — tylko provider czy obie strony? — Właściciel: user. Blokada: nie (MVP.md dopuszcza obie strony; UI już wspiera obie role na `/bookings`).
- **Ryzyko:** Niejednoznaczność aktora completion nie blokuje happy path demo na dwóch kontach.
- **Status:** ready

### S-08: Ocena po zakończeniu

- **Wynik:** klient może po COMPLETED wystawić ocenę 1–5 z opcjonalnym komentarzem; średnia i liczba ocen aktualizują się na profilu i liście providerów.
- **ID zmiany:** rate-after-complete
- **Odniesienia do PRD:** US-03, FR-014
- **Wymagania wstępne:** S-07
- **Równolegle z:** —
- **Blokady:** —
- **Niewiadome:** —
- **Ryzyko:** Ostatni krok happy path MVP.md §7 (krok 7); domyka pętlę reputacji providera.
- **Status:** ready

### S-09: „Szukam!” — sygnał popytu

- **Wynik:** gdy w kategorii nikt nie jest online, klient może kliknąć „Szukam!”; zapis w `interests`; provider w kategorii widzi wskaźnik popytu (badge/liczba).
- **ID zmiany:** szukam-interest
- **Odniesienia do PRD:** FR-015
- **Wymagania wstępne:** S-03
- **Równolegle z:** S-04
- **Blokady:** —
- **Niewiadome:** —
- **Ryzyko:** Should-have — API i UI częściowo istnieją; pełny badge po stronie providera może wymagać dopracowania UX; nie blokuje MVP gate.
- **Status:** proposed

## Przekazanie do backlogu

| ID mapy drogowej | ID zmiany                 | Sugerowany tytuł problemu                          | Gotowe do `/10x-plan` | Uwagi                                                           |
| ---------------- | ------------------------- | -------------------------------------------------- | --------------------- | --------------------------------------------------------------- |
| F-01             | prod-observability-gate   | Włączyć obserwowalność prod przed demem            | no                    | Checklist w `monitoring.md`                                     |
| S-01             | auth-and-role-switch      | Zweryfikować auth i przełącznik roli               | yes                   | Kod obecny — plan na regresję/happy path                        |
| S-02             | provider-profile-online   | Zweryfikować profil providera i online/offline     | yes                   | —                                                               |
| S-03             | categories-and-seed       | Zweryfikować kategorie i seed                      | yes                   | —                                                               |
| S-04             | discover-online-providers | Zweryfikować listę tylko online providerów         | yes                   | —                                                               |
| S-05             | seeker-send-request       | Zweryfikować request + timer + TIMEOUT             | yes                   | Scenariusz negatywny MVP.md §7                                  |
| S-06             | provider-accept-booking   | Zweryfikować accept → booking (gwiazda przewodnia) | no (manual only)      | **Priorytet demo** — kod ✅; phase 3 = checklist §7 / E2E creds |
| S-07             | complete-booking          | Zweryfikować zakończenie usługi                    | yes                   | —                                                               |
| S-08             | rate-after-complete       | Zweryfikować ocenę i średnią                       | yes                   | Domknięcie happy path                                           |
| S-09             | szukam-interest           | Dopracować „Szukam!” (should-have)                 | no                    | Po zamknięciu must-have                                         |

## Otwarte pytania dotyczące mapy drogowej

1. **Implementacja timeoutu requestu** — scheduler Cloud Function vs wyłącznie lazy expiry przy odczycie? Właściciel: implementer. Blokada: `roadmap-wide` (informacyjnie — oba mechanizmy już w kodzie; weryfikacja w S-05).
2. **Aktor zakończenia bookingu** — tylko provider vs obie strony? Właściciel: user. Blokada: S-07 (nie — UI wspiera obie strony).
3. **Functions vs bezpośredni Firestore w kliencie** — które endpointy z MVP.md §4.3 w v1? Właściciel: user. Blokada: `roadmap-wide` (rozstrzygnięte: API przez Functions + `ApiService`; nie zmieniać bez PRD).

## Zaparkowane

- **PWA (manifest + service worker)** — MVP+ wysoki priorytet; poza bramką MVP (`MVP.md` §5).
- **Push notifications (Web Push / FCM)** — MVP+; pełne powiadomienia odłożone (`MVP.md` §5, PRD Non-Goals).
- **Geolokalizacja (odległość, promień)** — MVP+ średni; discovery list-based w MVP.
- **OAuth Google** — opcjonalne demo; email/hasło wystarcza (PRD Non-Goals).
- **Ciemny motyw** — MVP+ niski.
- **i18n (PL + EN)** — MVP+ niski.
- **Chat w trakcie bookingu** — MVP+; brak czatu przed bookingiem to guardrail MVP.
- **Portfolio zdjęć providera** — MVP+ niski.
- **Płatności Stripe, panel admina, KYC, mapa Leaflet, 8 języków** — świadomie poza MVP (`MVP.md` §6, PRD Non-Goals).

## Zrobione

(Puste przy pierwszym generowaniu. `/10x-archive` dodaje wpisy po zarchiwizowaniu zmian.)
