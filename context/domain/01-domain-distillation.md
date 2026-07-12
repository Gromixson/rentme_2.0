---
title: Destylacja domeny RentMe
created: 2026-07-12
type: domain-distillation
---

# Destylacja domeny RentMe

> Źródła: [`prd.md`](../foundation/prd.md), [`MVP.md`](../../MVP.md), [`tech-stack.md`](../foundation/tech-stack.md), [`AGENTS.md`](../../AGENTS.md), kod `functions/src/`, `src/app/features/`, `src/app/core/models/`.

---

## KROK 0 — Odkrycie kontekstu

### Produkt

RentMe 2.0 to **marketplace usług on-demand** (SEEKER ↔ PROVIDER): klient wybiera kategorię, widzi providerów **online**, wysyła jedną wiadomość; provider ma ~2 minuty na TAK/NIE; po akceptacji powstaje **booking**, po zakończeniu — ocena.

- PRD: „On accept, a **booking** exists for both parties” — `prd.md:46`
- MVP §3.5: statusy requestu `PENDING` → `ACCEPTED` | `DECLINED` | `TIMEOUT` — `MVP.md:74`
- Guardrail: „No booking is created from a declined or timed-out request” — `prd.md:54`

### Stack i granice

| Warstwa         | Lokalizacja                                                                            | Rola                                                      |
| --------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Angular UI      | `src/app/features/` (seeker, provider, bookings, auth)                                 | Prezentacja, polling, toasty                              |
| API client      | `src/app/core/api/api.service.ts`                                                      | Jedyny kanał danych domenowych w kliencie (`AGENTS.md:8`) |
| Cloud Functions | `functions/src/routes/`, `functions/src/services/`                                     | Logika biznesowa, transakcje Firestore                    |
| Auth (wyjątek)  | `src/app/core/auth/auth.service.ts` + `FIREBASE_AUTH`                                  | Login przez Firebase SDK — celowy (`AGENTS.md:7`)         |
| Firestore       | Kolekcje `requests`, `bookings`, `providers`, `users`, `categories` — `MVP.md:164-173` | Tylko server-side w MVP                                   |

### Gdzie żyje logika biznesowa

| Obszar                               | Pliki (dowód)                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| Tworzenie requestu                   | `functions/src/routes/requests.ts:10-51`                                            |
| Odpowiedź providera (accept/decline) | `functions/src/routes/providers.ts:118-177`                                         |
| Wygaśnięcie (scheduler + lazy)       | `functions/src/index.ts:12-19`, `functions/src/services/requests.ts:8-49`           |
| Booking lifecycle                    | `functions/src/routes/bookings.ts:9-96`                                             |
| Profil providera / online            | `functions/src/routes/providers.ts:23-76`, `functions/src/services/provider.ts`     |
| UI seeker                            | `src/app/features/seeker/request-form.component.ts`, `request-waiting.component.ts` |
| UI provider                          | `src/app/features/provider/provider-requests.component.ts`                          |

---

## KROK 1 — Ubiquitous Language

| Termin (PL)                           | Definicja                                                                                                   | Cytat źródłowy (file:line)                                           | Lokalizacja w kodzie                                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ServiceRequest / Prośba / Request** | Jedna wiadomość od seekera do wybranego providera online; statusy PENDING → ACCEPTED \| DECLINED \| TIMEOUT | `prd.md:64-70` (US-01); `MVP.md:71-76`                               | Kolekcja Firestore `requests` — `MVP.md:171`; typ klienta `ServiceRequest` — `models/index.ts:31-41`; typ serwera `RequestDoc` — `types.ts:34-43` |
| **Booking / Rezerwacja**              | Powstaje automatycznie po ACCEPTED; statusy CONFIRMED → COMPLETED (ew. CANCELLED)                           | `prd.md:46-47`; `MVP.md:78-82`                                       | Kolekcja `bookings` — `MVP.md:172`; `Booking` — `models/index.ts:43-53`; `BookingDoc` — `types.ts:45-54`                                          |
| **SEEKER (Klient)**                   | Przegląda kategorie, wysyła request, ocenia                                                                 | `prd.md:34-35`; `MVP.md:27-28`                                       | `UserRole` — `models/index.ts:1`; guard `/seeker/*` — `app.routes.ts` (per `AGENTS.md:36`)                                                        |
| **PROVIDER (Usługodawca)**            | Profil + kategorie + stawka; online/offline; respond                                                        | `prd.md:36-37`; `MVP.md:27-28`                                       | Kolekcja `providers` — `MVP.md:169`; `ProviderProfile` — `models/index.ts:13-22`                                                                  |
| **User / activeRole**                 | Jedno konto, dwie role; `activeRole` steruje UI i API                                                       | `prd.md:38`; `prd.md:141-142`                                        | `UserProfile.activeRole` — `models/index.ts:10`; `POST /auth/active-role` — `api.service.ts:79-80`                                                |
| **respond (accept / decline)**        | Provider odpowiada TAK/NIE na pending request                                                               | `MVP.md:58`; `MVP.md:147`                                            | `respondToRequest` — `api.service.ts:121-122`; handler — `providers.ts:118-177`; UI — `provider-requests.component.ts:66-77`                      |
| **expiresAt / timeout / TIMEOUT**     | Request wygasa po ~2 min bez odpowiedzi                                                                     | `prd.md:69`; `MVP.md:75`; `REQUEST_TIMEOUT_MS = 120_000` — `db.ts:7` | `expiresAt` w `RequestDoc` — `types.ts:40`; `requestExpiresAt()` — `services/requests.ts:37-38`; status `TIMEOUT` — `types.ts:3`                  |
| **Category / Kategoria**              | Drzewo usług; liczba online przy kategorii                                                                  | `prd.md:94-96`; `MVP.md:45-50`                                       | `Category` — `models/index.ts:24-29`; endpointy — `api.service.ts:87-98`                                                                          |
| **Provider profile (kompletność)**    | Min. 1 kategoria + stawka > 0 przed online                                                                  | `prd.md:55`; `MVP.md:39-42`                                          | `isProviderProfileComplete` — `services/provider.ts` (używane `providers.ts:30-34`)                                                               |
| **isOnline**                          | Provider widoczny w liście kategorii; accept gasi online                                                    | `prd.md:68`; `MVP.md:54`                                             | `providers.ts:36-41` (toggle); `providers.ts:157-158` (offline po accept)                                                                         |
| **EXPIRED**                           | —                                                                                                           | —                                                                    | **BRAK w kodzie** — używany jest `TIMEOUT`, nie `EXPIRED` (`types.ts:3`, `models/index.ts:2`)                                                     |

---

## KROK 2 — Subdomeny

| Typ            | Subdomena                                     | Uzasadnienie (PRD success criteria)                                                                                                                                  |
| -------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**       | **Request → Respond → Booking**               | Primary success: „sends one short message; provider has about two minutes to accept or decline; on acceptance a booking is created” — `prd.md:28-29`, `prd.md:44-46` |
| **Core**       | **Provider availability (online + profil)**   | „Provider with complete profile can go **online**, receive pending requests” — `prd.md:45`; „only **online** providers” — `prd.md:44`                                |
| **Supporting** | **Auth & activeRole**                         | Umożliwia dual-role i guardy; nie jest unikalną wartością produktu — `prd.md:38`, `prd.md:141-142`                                                                   |
| **Supporting** | **Categories & discovery**                    | Lista kategorii i providerów online — prerequisite do requestu — `prd.md:94-96`                                                                                      |
| **Supporting** | **Ratings**                                   | Secondary success po COMPLETED — `prd.md:46-47`, US-03                                                                                                               |
| **Generic**    | **Firebase Auth / Hosting / Functions infra** | Stack z `tech-stack.md:29`; Auth w kliencie — konwencja `AGENTS.md:7`                                                                                                |
| **Generic**    | **Interest („Szukam!”)**                      | Should-have MVP+ — `prd.md:50`, FR-015                                                                                                                               |

---

## KROK 3 — Kandydaci na agregaty i niezmienniki

### Kandydat 1: **ServiceRequest** (kolekcja `requests`)

| Niezmiennik                                                                  | Status            | Dowód                                                                           |
| ---------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| Nowy request startuje jako `PENDING` z `expiresAt`                           | **enforced**      | `requests.ts:45-46`                                                             |
| Tylko seeker tworzy request do providera **online** w obsługiwanej kategorii | **enforced**      | `requests.ts:26-34`                                                             |
| Wiadomość 10–500 znaków                                                      | **enforced**      | `requests.ts:21-23`                                                             |
| Z `PENDING` tylko → ACCEPTED \| DECLINED \| TIMEOUT                          | **enforced** (tx) | `providers.ts:133-141`; `services/requests.ts:14-16`                            |
| Po ACCEPTED nie można ponownie respond (NOT_PENDING)                         | **enforced**      | `providers.ts:133` → HTTP 409                                                   |
| Po DECLINED/TIMEOUT brak bookingu                                            | **enforced**      | `providers.ts:139-141` (decline); `providers.ts:134-137` (timeout bez booking)  |
| Tylko przypisany provider może respond                                       | **enforced**      | `providers.ts:132` → FORBIDDEN                                                  |
| Accept po expiry → TIMEOUT, HTTP 410                                         | **enforced**      | `providers.ts:134-137`                                                          |
| **Jeden aktywny PENDING na parę seeker–provider**                            | **ignored**       | Brak query/walidacji w `requests.ts:10-51` — seeker może wysłać wiele requestów |

### Kandydat 2: **Booking** (kolekcja `bookings`)

| Niezmiennik                                | Status                      | Dowód                                                                                        |
| ------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------- |
| Booking powstaje tylko przy accept         | **enforced** (w tx respond) | `providers.ts:144-155`                                                                       |
| `requestId` wiąże booking z requestem      | **declared**                | `BookingDoc.requestId` — `types.ts:46`; brak unikalnego indeksu — **ignored** na poziomie DB |
| COMPLETED tylko z CONFIRMED                | **enforced**                | `bookings.ts:41-43`                                                                          |
| Ocena tylko po COMPLETED, jedna na booking | **enforced**                | `bookings.ts:70-82`                                                                          |

### Kandydat 3: **Provider** (kolekcja `providers`)

| Niezmiennik                        | Status            | Dowód                                                            |
| ---------------------------------- | ----------------- | ---------------------------------------------------------------- |
| Online wymaga kompletnego profilu  | **enforced**      | `providers.ts:30-34`                                             |
| Accept ustawia offline             | **enforced** (tx) | `providers.ts:157-158`                                           |
| Przełączenie na SEEKER gasi online | **declared**      | `prd.md:137` — wymaga weryfikacji w `routes/auth.ts` active-role |

---

## KROK 4 — MODEL vs KOD (luki)

| #   | Model (PRD/MVP/UL)                     | Kod                                                                                       | Luka                                                                                                 |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Termin „request” w API i UI            | Kolekcja `requests`, interfejs `ServiceRequest`                                           | Nazewnictwo: UL „ServiceRequest” vs storage „requests” — spójne semantycznie, różne nazwy            |
| 2   | `expiresAt` jako czas wygaśnięcia      | `RequestDoc.expiresAt: FirebaseFirestore.Timestamp` vs `ServiceRequest.expiresAt: string` | Brak jawnej warstwy mapowania API (`types.ts:40` vs `models/index.ts:38`)                            |
| 3   | EXPIRED (język naturalny)              | Status `TIMEOUT`                                                                          | Synonim nie ujednolicony — tylko `TIMEOUT`                                                           |
| 4   | Brak bookingu po DECLINED/TIMEOUT      | Implementacja w tx                                                                        | **Zgodne** — `providers.ts:139-141`, `134-137`                                                       |
| 5   | Provider offline po accept             | `isOnline: false` w tx                                                                    | **Zgodne** — `providers.ts:157-158`                                                                  |
| 6   | Jedna aktywna prośba na parę           | Brak reguły w PRD explicite                                                               | **Luka produktowa** — kod pozwala na wiele PENDING                                                   |
| 7   | Logika biznesowa w Functions, nie w UI | Komponenty przez `ApiService`                                                             | **Zgodne** — brak Firestore w `features/` (grep: 0 `getFirestore` poza `core/firebase/`)             |
| 8   | `firestore-model.md` skill             | Stary model listings/rental                                                               | **BRAK aktualizacji** — skill nadal opisuje `listings` (`firestore-model.md:13-36`), nie `requests`  |
| 9   | Testy respond                          | Brak harnessu                                                                             | **Luka** — `research.md:120`; tylko expiry w Vitest                                                  |
| 10  | Realtime / push                        | Polling 3 s / 5 s                                                                         | **Świadome odstępstwo MVP** — `request-waiting.component.ts:65`, `provider-requests.component.ts:57` |

---

## KROK 5 — Ranking refaktoryzacji (wartość / ryzyko)

| #   | Refaktor                                                           | Wartość                                 | Ryzyko                      | Priorytet   |
| --- | ------------------------------------------------------------------ | --------------------------------------- | --------------------------- | ----------- |
| 1   | Strażnik przejść ServiceRequest + testy Vitest respond             | Wysoka (R-01, R-02, R-06)               | Niskie — izolowany harness  | **P0**      |
| 2   | Wspólna funkcja expiry w tx respond (DRY z `expirePendingRequest`) | Średnia — mniej rozjazdów timeout       | Niskie                      | **P1**      |
| 3   | ACL serializacji API (Timestamp → ISO string)                      | Średnia — typy klienta zgodne z runtime | Średnie                     | **P1**      |
| 4   | Unikalność PENDING per seeker-provider (jeśli produkt potwierdzi)  | Średnia UX                              | Średnie — nowy indeks/query | **P2**      |
| 5   | Aktualizacja `firestore-model.md` do MVP                           | Niska dla runtime, wysoka dla agentów   | Bardzo niskie               | **P2**      |
| 6   | Big-bang aggregate module + event sourcing                         | Niska na skalę MVP                      | Wysokie                     | **Odłożyć** |
| 7   | Client Firestore / `@angular/fire`                                 | Ujemna — łamie architekturę             | Wysokie                     | **Odrzuć**  |

---

## Mission Log — M4L5 (distillation) checklist

- [x] KROK 0 — kontekst z PRD, MVP, stack, lokalizacja logiki
- [x] KROK 1 — tabela UL z cytatami file:line
- [x] KROK 2 — subdomeny Core/Supporting/Generic
- [x] KROK 3 — agregaty + niezmienniki (enforced/declared/ignored)
- [x] KROK 4 — MODEL vs KOD
- [x] KROK 5 — ranking refaktorów
