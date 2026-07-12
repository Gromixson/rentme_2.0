---
title: Anti-Corruption Layer — Firebase SDK
created: 2026-07-12
type: refactor-plan
---

# Anti-Corruption Layer — Firebase SDK

> Cel: odizolować domenę RentMe od szczegółów Firebase (typy, serializacja, błędy) tam, gdzie **nie są** celową decyzją architektoniczną. Auth w kliencie pozostaje — `AGENTS.md:7`.

---

## KROK 0 — Skan wycieków zależności

### Importy `firebase/*` w kliencie (`src/`)

| Plik                                         | Import                                                        | Rola                       |
| -------------------------------------------- | ------------------------------------------------------------- | -------------------------- |
| `core/auth/auth.service.ts:8`                | `firebase/auth`                                               | **Celowy** — login/signOut |
| `core/firebase/firebase.providers.ts:7-11`   | `firebase/app`, `auth`, `firestore`, `storage`, `performance` | Wiring DI                  |
| `core/firebase/firebase.tokens.ts:2-5`       | typy `firebase/*`                                             | Tokeny DI                  |
| `environments/environment.example.ts:1`      | `FirebaseOptions`                                             | Konfiguracja               |
| `environments/environment.prod.example.ts:1` | `FirebaseOptions`                                             | Konfiguracja               |

**Wynik rg:** **5 plików** z importem `firebase/*` w `src/`.

**Uwaga:** `FIREBASE_FIRESTORE` jest provisionowany (`firebase.providers.ts:55-56`), ale **żaden feature go nie injectuje** (grep `inject(FIREBASE_` → tylko `FIREBASE_AUTH` w `auth.service.ts:16`). Firestore w kliencie = martwa infrastruktura, nie leak operacyjny.

### Importy `firebase-admin` w Functions (`functions/src/`)

| Plik                   | Import                     |
| ---------------------- | -------------------------- |
| `db.ts:1`              | `firebase-admin/firestore` |
| `index.ts:1`           | `firebase-admin`           |
| `routes/auth.ts:2`     | `firebase-admin`           |
| `middleware/auth.ts:2` | `firebase-admin`           |

**Wynik rg:** **4 pliki** produkcyjne (bez testów).

### Wzorzec Angular HttpClient

- Wszystkie odczyty domenowe przez `ApiService` — `api.service.ts:17-160`.
- Błędy UI: `err?.error?.error` — 8 call sites w `features/` (np. `provider-requests.component.ts:77`).
- To **nie** są kody Firebase — to shape API `{ error: string }` z Express (`AGENTS.md:33`).

---

## KROK 1 — Klasyfikacja wycieków

| Wyciek                                                                  | Warstwa                | Severity   | Celowy?                                                    |
| ----------------------------------------------------------------------- | ---------------------- | ---------- | ---------------------------------------------------------- |
| `firebase/auth` w `AuthService`                                         | Klient                 | Niski      | **Tak** — `AGENTS.md:7`                                    |
| `firebase/firestore` w providers (DI)                                   | Klient                 | Niski      | Nieużywany — do usunięcia w przyszłości, nie ACL priorytet |
| `FirebaseFirestore.Timestamp` w `RequestDoc`, `BookingDoc`…             | Functions types        | **Wysoki** | **Nie** — typ domenowy = typ persistence                   |
| Surowe `res.json({ ...doc })` z Timestamp                               | API boundary           | **Wysoki** | **Nie** — brak DTO wyjściowego                             |
| `ServiceRequest.expiresAt: string` vs `RequestDoc.expiresAt: Timestamp` | Kontrakt klient–serwer | **Wysoki** | **Nie** — implicit JSON coupling                           |
| `FirebaseFirestore.Timestamp` w sygnaturze `requestExpiresAt()`         | Service                | Średni     | `services/requests.ts:37`                                  |

---

## KROK 2 — Najgorszy wyciek (dowód)

### **Typy domenowe powiązane z `FirebaseFirestore.Timestamp` + brak adaptera serializacji API**

**Dowód:**

1. `functions/src/types.ts:12-69` — wszystkie dokumenty używają `FirebaseFirestore.Timestamp` zamiast VO czasu.
2. API zwraca surowy dokument: `requests.ts:51` `res.status(201).json({ id: ref.id, ...doc })` — `doc.expiresAt` to Timestamp.
3. Klient deklaruje `expiresAt: string` — `models/index.ts:38`.
4. UI parsuje: `new Date(r.expiresAt).getTime()` — `request-waiting.component.ts:99`.

**Layer count (rozpiętość):** typ w **1 pliku centralnym** (`types.ts`), ale dotyka **6+ route handlerów** (requests, providers, bookings, auth) i **4 komponentów** (waiting, my-requests, provider-requests, bookings-list).

**Import count `FirebaseFirestore`:** rg → **2 unikalne pliki** (`types.ts`, `services/requests.ts:37`).

To gorsze niż sam `firebase-admin` w `db.ts` (akceptowalny adapter persistence), bo **kształt DTO przenika kontrakt HTTP** bez jawnej warstwy.

---

## KROK 3 — Projekt ACL: VO + port + adapter

### Value Objects (domena / kontrakt API)

```typescript
// functions/src/domain/vo/iso-timestamp.ts (propozycja)

type IsoTimestamp = string; // ISO 8601 UTC, np. "2026-07-12T20:54:00.000Z"

function toIsoTimestamp(ms: number): IsoTimestamp {
  return new Date(ms).toISOString();
}

function parseIsoTimestamp(iso: IsoTimestamp): number {
  return new Date(iso).getTime();
}
```

```typescript
// functions/src/domain/dto/service-request.dto.ts (propozycja)

interface ServiceRequestDto {
  id: string;
  seekerId: string;
  providerId: string;
  categoryId: string;
  message: string;
  status: RequestStatus;
  expiresAt: IsoTimestamp;
  createdAt: IsoTimestamp;
  seekerName?: string;
}
```

### Port (domena nie zna Firestore)

```typescript
// functions/src/domain/ports/request-repository.port.ts (propozycja)

interface RequestRepository {
  create(input: CreateRequestCommand): Promise<ServiceRequestDto>;
  getById(id: string): Promise<ServiceRequestDto | null>;
  saveStatus(id: string, status: RequestStatus): Promise<void>;
}
```

### Adapter (jedyny plik z firebase-admin/firestore)

```typescript
// functions/src/infrastructure/firestore/request-repository.adapter.ts (propozycja)

import { Timestamp } from 'firebase-admin/firestore';
import type { RequestDoc } from '../../types'; // tymczasowo

function toDto(id: string, doc: RequestDoc): ServiceRequestDto {
  return {
    id,
    ...doc,
    expiresAt: doc.expiresAt.toDate().toISOString(),
    createdAt: doc.createdAt.toDate().toISOString(),
  };
}

function toDoc(dto: Omit<ServiceRequestDto, 'id'>): RequestDoc {
  return {
    ...dto,
    expiresAt: Timestamp.fromDate(new Date(dto.expiresAt)),
    createdAt: Timestamp.fromDate(new Date(dto.createdAt)),
  };
}
```

### Klient — wspólny kontrakt

- `src/app/core/models/index.ts` — `ServiceRequest` **importuje** z shared OpenAPI / duplicated DTO zsynchronizowany z `ServiceRequestDto` (na MVP: ten sam plik wygenerowany lub ręcznie zsynchronizowany).
- `ApiService` zwraca wyłącznie DTO — bez zmian w komponentach poza ewentualnym usunięciem workaroundów parsowania.

---

## KROK 4 — Kryterium sukcesu (grep)

### `FirebaseFirestore` / `firebase-admin/firestore` w typach domenowych

| Stan         | Pliki z `FirebaseFirestore` w typach interfejsów domenowych       |
| ------------ | ----------------------------------------------------------------- |
| **Obecny**   | `functions/src/types.ts`, `functions/src/services/requests.ts:37` |
| **Docelowy** | **0** — tylko `infrastructure/firestore/*.adapter.ts` + `db.ts`   |

### `firebase/firestore` w kliencie (`src/`)

| Stan                              | Pliki                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Obecny**                        | `firebase.providers.ts`, `firebase.tokens.ts` (+ env examples)                                          |
| **Docelowy (opcjonalny cleanup)** | **0** jeśli usuniemy nieużywany `FIREBASE_FIRESTORE`; **2** (`auth` + `app`) jeśli zostawimy tylko Auth |

### Komenda weryfikacji

```bash
# Docelowo po fazie 3:
rg "FirebaseFirestore" functions/src/ --glob "!**/infrastructure/**"  # → 0 wyników
rg "from 'firebase/firestore'" src/app/features/                       # → 0 (już dziś 0)
```

---

## KROK 5 — Plan fazowy

| Faza  | Zakres                                                                                   | Ryzyko          |
| ----- | ---------------------------------------------------------------------------------------- | --------------- |
| **0** | Udokumentuj aktualny JSON Timestamp w odpowiedziach (manual curl / devtools)             | Brak            |
| **1** | `toDto()` dla GET/POST requests — cienka funkcja w `routes/requests.ts` przed `res.json` | Niskie          |
| **2** | Ten sam mapper dla `providers.ts:94`, `bookings.ts:26`                                   | Średnie         |
| **3** | Przenieś `RequestDoc` Timestamp → adapter; `types.ts` tylko persistence                  | Średnie         |
| **4** | Opcjonalnie: usuń `FIREBASE_FIRESTORE` z klienta (nieużywany DI)                         | Niskie          |
| **5** | Shared DTO package / OpenAPI generate dla `src/app/core/models`                          | Wyższe — po MVP |

**Nie w scope ACL:** migracja Auth z Firebase SDK — sprzeczna z `AGENTS.md`.

---

## KROK 6 — Podsumowanie

| Metryka                           | Wartość                                                    |
| --------------------------------- | ---------------------------------------------------------- |
| Najgorszy leak                    | `FirebaseFirestore.Timestamp` w typach + surowy `res.json` |
| Pliki z leakiem (typ)             | 2 (`types.ts`, `services/requests.ts`)                     |
| Pliki dotknięte kontraktem        | 6+ routes + 4 komponenty                                   |
| Import `firebase/*` klient        | 5 plików (Auth celowy)                                     |
| Import `firebase-admin` Functions | 4 pliki                                                    |
| Pierwszy krok                     | `toDto()` na `POST/GET /requests`                          |

---

## Mission Log — ACL checklist

- [x] KROK 0 — skan importów per warstwa
- [x] KROK 1 — klasyfikacja wycieków
- [x] KROK 2 — worst leak z dowodami
- [x] KROK 3 — VO + port + adapter (pseudokod)
- [x] KROK 4 — current vs target file lists + grep
- [x] KROK 5 — plan fazowy
- [x] KROK 6 — podsumowanie metryk
