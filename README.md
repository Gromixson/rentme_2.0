# RentMe — marketplace usług (MVP)

Aplikacja typu Fixly/Uber: klient wybiera kategorię, wysyła jedną wiadomość do usługodawcy online; usługodawca ma ~2 minuty na TAK/NIE; po akceptacji powstaje rezerwacja i ocena.

**Specyfikacja MVP:** [`MVP.md`](./MVP.md) (nadpisuje starszy `context/foundation/prd.md` dotyczący wynajmu przedmiotów).

## Struktura repozytorium

| Ścieżka | Opis |
|---------|------|
| `src/` | Angular 21 (standalone) — frontend pozostaje w korzeniu repo (nie `frontend/`) |
| `functions/` | Firebase Cloud Functions + Express API (`/api/*`) |
| `firebase.json`, `firestore.rules`, `storage.rules` | Konfiguracja Firebase |

## Stack

- **Frontend:** Angular 21, PrimeNG, Firebase JS SDK (Auth)
- **Backend:** Cloud Functions (Express), Firestore, Firebase Auth
- **Dev (domyślnie):** Auth, Firestore i API w chmurze (`useEmulators: false`); opcjonalnie Emulator Suite

## Wymagane jednorazowo: Firestore (lokalnie i online)

Rejestracja zapisuje profil w **Firestore**. Jednorazowo z terminala (wymaga `firebase login`):

```bash
npm run setup:firestore
```

Skrypt włącza API Firestore i tworzy bazę `(default)` w regionie `eur3`. Alternatywa ręczna: [Firebase Console → Firestore](https://console.firebase.google.com/project/rentme-b5e34/firestore).

## Wymagania

- Node.js 22 (Functions deklarują engine 22; Node 20 jest wycofywany)
- Firebase CLI: `npm install -g firebase-tools`
- Projekt Firebase (Auth email/hasło, Firestore, Functions, Hosting)

## Konfiguracja Firebase

1. Utwórz projekt w [Firebase Console](https://console.firebase.google.com/).
2. Włącz **Authentication → Email/Password**.
3. Utwórz **Firestore** (tryb testowy na dev).
4. Skopiuj konfigurację web:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```

5. Uzupełnij `firebase` w obu lokalnych plikach środowiska. Oba są ignorowane przez Git; nie commituj konfiguracji projektu ani poświadczeń. Domyślnie **`useEmulators: false`** — Auth i Firestore w chmurze.
6. Zaktualizuj `.firebaserc` → `"default": "TWÓJ_PROJECT_ID"`.
7. Ustaw **`apiUrl`** w `environment.ts` (region `europe-west1`):
   - **`npm start` (dev):** pełny URL Cloud Functions, np. `https://europe-west1-TWÓJ_PROJECT_ID.cloudfunctions.net/api/api` (bez proxy — API w chmurze).
   - **Hosting (`firebase deploy --only hosting`):** `apiUrl: '/api'` — rewrite w `firebase.json` kieruje `/api/**` na funkcję `api`.
   - **Opcjonalnie lokalne Functions:** `apiUrl: '/api'` + `proxy.conf.json` → `http://127.0.0.1:5001/TWÓJ_PROJECT_ID/europe-west1/api` oraz `npm run dev:api`.

## Uruchomienie (online — Blaze)

Auth, Firestore i API działają w chmurze (`useEmulators: false`, `apiUrl` → Cloud Functions).

**Jednorazowo (nowy projekt):**

```bash
npm run setup:firestore
npm run setup:appengine   # wymagane przed pierwszym deploy Functions
npm run setup:auth        # Email/Password (firebase.json → deploy --only auth)
firebase deploy --only functions,firestore:rules
```

**Dev — tylko frontend:**

```bash
npm install
npm start
```

http://localhost:4200 — API trafia na wdrożoną funkcję w `europe-west1` (`apiUrl` = URL chmury). **`npm run dev:api`** nie jest wymagane (tylko przy lokalnym emulatorze Functions).

**Hosting produkcyjny:**

`environment.prod.ts` ma `apiUrl: '/api'` (ten sam origin co SPA). Wdrażaj backend przed frontendem:

```bash
npm run build
npm run functions:build
npx -y firebase-tools@latest deploy --only functions,firestore:rules,firestore:indexes,storage --project rentme-b5e34
# po udanym smoke teście bezpośredniego /api/health:
npx -y firebase-tools@latest deploy --only hosting --project rentme-b5e34
```

Pełny plan, bramki akceptacji, testy i rollback: [`context/deployment/deploy-plan.md`](./context/deployment/deploy-plan.md).

### Tryb w pełni lokalny (opcjonalnie)

W `environment.ts` ustaw `useEmulators: true` i uruchom `npm run emulators` (wymaga Javy — Auth + Firestore + Storage lokalnie).

### Porty emulatorów zajęte (`Port 4000/9099 is not open`)

Stara sesja Firebase nadal działa w tle. Zatrzymaj ją, potem uruchom ponownie:

```bash
npm run emulators:stop
npm run dev:emulators
```

### Rejestracja nie działa?

| Objaw | Przyczyna | Co zrobić |
|--------|-----------|-----------|
| `ECONNREFUSED` / brak API | Functions niewdrożone | `npm run setup:appengine`, potem `firebase deploy --only functions` |
| Logowanie na `127.0.0.1:9099` | `useEmulators: true` | `useEmulators: false`, zrestartuj `npm start` |
| Deploy: bucket 403 | Brak App Engine | `npm run setup:appengine` |
| Toast: „Brak połączenia z API” | j.w. | j.w., potem odśwież stronę |
| Toast: „Firestore niedostępny…” | Firestore wyłączony w projekcie lub brak Javy | Włącz Firestore w Console lub `npm run emulators` z Javą |

### Pierwsze kroki w UI

1. Zarejestruj konto (ma obie role: SEEKER + PROVIDER).
2. Na liście kategorii kliknij **Załaduj kategorie** (jeśli baza pusta).
3. **Tryb usługodawcy** (pomarańczowy nagłówek): Profil → kategorie + stawka → **online**.
4. **Tryb klienta** (niebieski): kategoria → wyślij prośbę → czekaj ≤2 min.
5. Provider: Prośby → Akceptuj → Rezerwacje → Zakończ.
6. Klient: Rezerwacje → Oceń 1–5.

## API (Functions)

Bazowy prefix: `/api` — pełna lista w `MVP.md` §4.3. Klient woła `environment.apiUrl` + ścieżkę (np. `/categories`); w dev z URL chmury końcówka to `…/api/api/…` (funkcja `api` + mount Express `/api`).

Chronione endpointy wymagają nagłówka `Authorization: Bearer <Firebase ID token>`.

## Deploy (skrót)

```bash
npm run build
npm run functions:build
npx -y firebase-tools@latest use
npx -y firebase-tools@latest deploy --only functions,firestore:rules,firestore:indexes,storage --project rentme-b5e34
npx -y firebase-tools@latest deploy --only hosting --project rentme-b5e34
```

Hosting serwuje `dist/rentme/browser`; rewrite `/api/**` → funkcja `api` w `europe-west1`. Nie publikuj Hostingu, jeśli wdrożenie lub smoke test Functions nie powiodły się.

## Skrypty npm

| Skrypt | Opis |
|--------|------|
| `npm start` | `ng serve` — frontend; API przez `environment.apiUrl` (domyślnie Cloud Functions) |
| `npm run dev:api` | Opcjonalnie: emulator Functions (`127.0.0.1:5001`) — wtedy `apiUrl: '/api'` + proxy |
| `npm run setup:firestore` | Włącza API Firestore i bazę `(default)` (`eur3`) |
| `npm run setup:appengine` | App Engine (wymagane przed pierwszym deploy Functions) |
| `npm run setup:auth` | Deploy providera Email/Password (`firebase deploy --only auth`) |
| `npm run build` | Build produkcyjny Angular |
| `npm run functions:build` | Kompilacja TypeScript w `functions/` |
| `npm run emulators` | Pełny zestaw emulatorów (auth, firestore, functions, storage) |

## Observability (prod)

Przed pierwszym ruchem produkcyjnym włącz **Performance** (i opcjonalnie **Crashlytics**) w Firebase Console oraz sprawdź logi Functions — szczegóły i checklista: [`context/foundation/monitoring.md`](./context/foundation/monitoring.md). Build produkcyjny inicjuje Performance SDK, gdy w `environment.prod.ts` jest `enablePerformanceMonitoring: true`.

## Uwagi

- Klucze Firebase w `environment.ts` są w `.gitignore` — nie commituj prawdziwych sekretów.
- Scheduled function `expireRequests` wygasza prośby `PENDING` co minutę (oraz lazy check przy odczycie).
- Przełączenie na tryb **klienta** automatycznie gasi status **online** usługodawcy.
