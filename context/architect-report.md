# Raport architekta — Moduł 4 (RentMe 2.0)

> Data: 2026-07-12 · Autor: agent (synteza artefaktów L2–L5)  
> Repo: **jeden projekt** — RentMe 2.0 (`d:\programowanie\rentme_2.0`)

---

## 1. Opisane projekty

Wszystkie artefakty Modułu 4 dotyczą **jednego repozytorium**: marketplace usług on-demand **RentMe 2.0** (Angular 21 + Firebase Auth + Cloud Functions + Firestore). Brak multi-repo ani osobnych bounded contextów w kodzie — dokumentacja `context/` opisuje ten sam produkt od mapy (L2) przez deep focus S-06 (L3), plan refaktoru (L4) po destylację domeny (L5).

---

## 2. Mapa projektu (M4L2)

Źródło: [`context/map/repo-map.md`](map/repo-map.md)

**Kluczowe ustalenia (5):**

1. **Rdzeń domenowy** to `functions/src/routes|services` + `src/app/features/seeker|provider` — cała logika accept/timeout/booking przechodzi przez ten pas (`repo-map.md:56-57`).
2. **Coupling klient–serwer** jest kontrolowany: wyłącznie `ApiService` ↔ `/api/*` (`repo-map.md:71-72`, `AGENTS.md:8`).
3. **Graf importów bez cykli** (madge) — routes→services jednokierunkowo (`repo-map.md:78`).
4. **6 stref ryzyka** zidentyfikowanych — najważniejsze dla S-06: accept race (R-01), timeout/expiry (R-04), E2E bez creds (`repo-map.md:84-91`).
5. **Repo młode** (7 commitów w momencie mapy) — brak trendów historycznych; hot spoty = cała baza (`repo-map.md:127-128`).

---

## 3. Analiza ficzeru (M4L3)

Źródło: [`context/changes/provider-accept-booking-flow/research.md`](changes/provider-accept-booking-flow/research.md)

**Przepływ:** seeker `POST /requests` → PENDING + poll 3 s → provider `GET /providers/requests` → `POST .../respond` → transakcja ACCEPTED + booking CONFIRMED + provider offline → obie strony `GET /bookings/my`.

**Dług techniczny (skrót):**

- Brak testów unit/harness dla respond (P0) — `research.md:120`.
- Triple-path expiry (scheduler + lazy read + inline w respond) — `research.md:163`.
- E2E north star SKIP bez creds — `research.md:122`.

**Structural claim potwierdzony (rg, ast-grep niedostępny na Win):**

- **C1:** dokładnie **jedno** wywołanie `respondToRequest` poza definicją — `provider-requests.component.ts:67` (`research.md:206` → **confirmed**).
- **C2:** `runTransaction` w **dwóch** plikach produkcyjnych — `providers.ts:128`, `services/requests.ts:10` (`research.md:207` → **confirmed**).

---

## 4. Plan refaktoryzacji (M4L4)

Źródło: [`context/changes/refactor-opportunities/plan.md`](changes/refactor-opportunities/plan.md) + [`plan-brief.md`](changes/refactor-opportunities/plan-brief.md)

**Wybrana opcja:** **Guard-first** — Vitest harness respond → wspólny guard expiry → Strangler `services/respond.ts` (fazy 1–3 w planie).

**Czego NIE robimy:** Domain Model big-bang, realtime, zmiana kontraktu HTTP/Angular, E2E creds w tym change (`plan.md` §What We're NOT Doing).

---

## 5. Domena DDD (M4L5)

Źródła: [`context/domain/01-domain-distillation.md`](domain/01-domain-distillation.md), [`02-invariant-aggregate-refactor.md`](domain/02-invariant-aggregate-refactor.md), [`03-anti-corruption-layer.md`](domain/03-anti-corruption-layer.md)

### Kluczowe terminy (5)

| Termin                  | Esencja                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **ServiceRequest**      | Jedna wiadomość seekera; kolekcja `requests`; statusy PENDING → ACCEPTED \| DECLINED \| TIMEOUT |
| **Booking**             | Powstaje tylko po ACCEPTED; CONFIRMED → COMPLETED                                               |
| **respond**             | `accept` \| `decline` — wyłącznie przypisany PROVIDER                                           |
| **expiresAt / TIMEOUT** | ~120 s (`db.ts:7`); nie ma statusu EXPIRED w kodzie                                             |
| **activeRole**          | SEEKER \| PROVIDER — steruje UI i guardami                                                      |

### Niezmiennik #1

**Przejścia stanu ServiceRequest** — PENDING może przejść tylko do ACCEPTED, DECLINED lub TIMEOUT; accept w tej samej tx tworzy dokładnie jeden booking. Uzasadnienie: najbardziej rozproszony i najsłabiej przetestowany (`02-invariant-aggregate-refactor.md` KROK 2).

### Najgorszy wyciek ACL

**`FirebaseFirestore.Timestamp` w `functions/src/types.ts`** + surowe `res.json` bez DTO — klient deklaruje `expiresAt: string` (`models/index.ts:38`), UI parsuje `new Date(r.expiresAt)` (`request-waiting.component.ts:99`). Import leak: **2 pliki** z `FirebaseFirestore`; **4 pliki** z `firebase-admin` (`03-anti-corruption-layer.md`).

---

## 6. Decyzje, które należą do mnie

**[DO UZUPEŁNIENIA przez użytkownika]** — poniższe punkty są szablonem pod formularz odznaki Modułu 4. Dopisz 3–5 zdań własnymi słowami (po polsku), odwołując się do konkretnych plików z tego raportu.

Sugerowane tematy do personalizacji:

- Czy akceptujesz **Opcję A (guard-first)** jako pierwszy refaktor po MVP, czy wolisz najpierw odblokować E2E creds?
- Czy reguła **„jeden aktywny PENDING na parę seeker–provider”** ma wejść do produktu, czy świadomie zostawiamy wiele równoległych próśb?
- Czy **usunięcie nieużywanego `FIREBASE_FIRESTORE`** z klienta jest w scope najbliższego sprintu?
- Kto zatwierdza **aktualizację `firestore-model.md`** (skill nadal opisuje stary model listings)?
- Jaką **głębokość DDD** bierzesz na produkcję: tylko strażnik + DTO (L5 faza 1–2), czy pełny port/adapter repository?

---

## Mission Log — architect report checklist

- [x] Sekcje 1–6 wg promptu lekcji
- [x] Cytowania artefaktów L2–L5 (bez wymyślonych faktów)
- [x] Placeholder decyzji użytkownika
- [x] Max ~2 strony
