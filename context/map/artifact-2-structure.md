# Artifact 2 — Struktura (dependency scan)

> **Narzędzie:** `madge@8.0.0` (devDependency, dodane dla M4L2).  
> **Polecenia:** `npx madge --circular --extensions ts src/app`, `npx madge --circular --extensions ts functions/src`.  
> **Uwaga:** madge `--json` / `--summary` zwróciły `{}` / 0 plików — Angular używa lazy `import()` w `app.routes.ts`; statyczny graf nie obejmuje dynamicznych tras. Poniżej: wyniki circular + ręczna analiza importów.

---

## Punkty wejścia

| Warstwa             | Plik                     | Rola                                     | Dowód                                              |
| ------------------- | ------------------------ | ---------------------------------------- | -------------------------------------------------- |
| Angular bootstrap   | `src/main.ts`            | `bootstrapApplication(App, appConfig)`   | bezpośredni import `./app/app.config`              |
| Angular routing     | `src/app/app.routes.ts`  | trasy seeker/provider/auth + lazy load   | `loadComponent: () => import('./features/...')`    |
| Angular DI          | `src/app/app.config.ts`  | router, HTTP, Firebase, PrimeNG          | `provideRentMeFirebase()`, `provideRouter(routes)` |
| Functions HTTP      | `functions/src/index.ts` | `export const api = onRequest(..., app)` | region `europe-west1`                              |
| Functions scheduler | `functions/src/index.ts` | `expireRequests` co 1 min                | import `./services/requests`                       |
| Express mount       | `functions/src/app.ts`   | `/api/*` routers                         | 6 route modules                                    |

---

## Angular — wynik madge

```text
npx madge --circular --extensions ts src/app
Processed 30 files (17 warnings)
√ No circular dependency found!
```

| Metryka            | Wynik | Dowód                                           |
| ------------------ | ----- | ----------------------------------------------- |
| Pliki przetworzone | 30    | madge stdout                                    |
| Cykle              | **0** | `--circular`                                    |
| Ostrzeżenia        | 17    | prawdop. nierozwiązane lazy routes / path alias |

---

## Functions — wynik madge

```text
npx madge --circular --extensions ts functions/src
Processed 15 files (567ms)
√ No circular dependency found!
```

| Metryka  | Wynik                         |
| -------- | ----------------------------- |
| Pliki TS | 15 (w tym `requests.test.ts`) |
| Cykle    | **0**                         |

---

## Warstwy Angular — granice importów

Konwencja docelowa (`AGENTS.md`): `features → core, shared`; `shared` bez importów z `features`.

| Warstwa                     | Importuje z                                               | Przykład                                                        | Naruszenie?                               |
| --------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `features/*`                | `core/api`, `core/auth`, `core/models`, `shared/services` | `provider-requests.component.ts` → `ApiService`, `ToastService` | nie                                       |
| `core/auth`                 | tylko `@angular/*`, Firebase tokens                       | guards, `AuthService`                                           | nie                                       |
| `core/api`                  | `core/models`, `environment`                              | `ApiService` — jedyne miejsce HTTP                              | nie                                       |
| `shared/layout`             | `core/auth`, `core/models`                                | `app-header.component.ts`                                       | **drobne** — shared czyta auth (nagłówek) |
| `features/*` ↔ `features/*` | brak bezpośrednich                                        | routing przez URL, nie import                                   | OK                                        |

### Tabela coupling — feature → core

| Komponent (feature)        | core/api | core/auth | core/models | shared |
| -------------------------- | -------- | --------- | ----------- | ------ |
| seeker/\* (5 komponentów)  | ✅       | —         | ✅          | toast  |
| provider/\* (4 komponenty) | ✅       | —         | ✅          | toast  |
| auth/login, register       | —        | ✅        | —           | toast  |
| bookings/list              | ✅       | ✅        | ✅          | toast  |
| home                       | —        | ✅        | —           | —      |

**Wzorzec:** każdy ekran domenowy = `ApiService` + `ToastService`; auth ekrany = `AuthService`. Brak Firestore w komponentach (zgodnie z regułami projektu).

---

## Functions — graf warstw (ręcznie z importów)

```
index.ts
  ├── app.ts (express)
  │     ├── routes/auth.ts
  │     ├── routes/users.ts
  │     ├── routes/categories.ts
  │     ├── routes/providers.ts  ──► services/provider.ts, services/requests.ts
  │     ├── routes/requests.ts   ──► services/provider.ts, services/requests.ts
  │     └── routes/bookings.ts   ──► services/provider.ts
  └── services/requests.ts (scheduler expiry)
        └── db.ts, types.ts
middleware/auth.ts ◄── wszystkie routes (requireAuth)
```

| Moduł                  | Zależności wewnętrzne                                             | Coupling                                    |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `routes/providers.ts`  | `services/provider`, `services/requests`, `db`, `middleware/auth` | **najwyższy** — accept/decline + booking tx |
| `routes/requests.ts`   | `services/requests`, `services/provider`                          | średni                                      |
| `routes/bookings.ts`   | `services/provider` (rating)                                      | niski                                       |
| `routes/auth.ts`       | `with-timeout`, `middleware/auth`, Firebase Admin                 | auth + timeout helper                       |
| `services/requests.ts` | `db`, `types`                                                     | czysta logika domenowa + scheduler          |

**Brak cykli:** services nie importują routes.

---

## Most klient ↔ serwer (niewidoczny dla madge)

| Powierzchnia | Klient                            | Serwer                                     | Kontrakt             |
| ------------ | --------------------------------- | ------------------------------------------ | -------------------- |
| HTTP API     | `src/app/core/api/api.service.ts` | `functions/src/app.ts` mount `/api/*`      | REST + Bearer token  |
| Auth         | `AuthService` (Firebase SDK)      | `middleware/auth.ts` (Admin verifyIdToken) | JWT Firebase         |
| Env          | `src/environments/environment.ts` | `firebase.json` rewrite / cloud URL        | `environment.apiUrl` |
| Firestore    | **tylko server-side** w MVP       | `functions/src/db.ts`                      | brak `@angular/fire` |

**Unknown / runtime coupling (Firebase):**

- Reguły `firestore.rules` — nie analizowane statycznie; klient **nie** czyta Firestore bezpośrednio.
- Scheduler `expireRequests` ↔ indeks `firestore.indexes.json` — coupling deploy-time (brak indeksu = query fail w prod).
- CORS whitelist w `app.ts` — coupling z URL Hosting (`*.web.app`).
- Brak Javy/Go — runtime Node 20+ (Firebase Functions v2); wersja runtime w `functions/package.json` (nie skanowana przez madge).

---

## Podsumowanie ryzyk strukturalnych

| Obszar                         | Ocena            | Dowód                      |
| ------------------------------ | ---------------- | -------------------------- |
| Cykle importów TS              | ✅ brak          | madge ×2                   |
| Feature isolation              | ✅ dobre         | brak cross-feature imports |
| Shared → core                  | ⚠️ akceptowalne  | header potrzebuje auth     |
| Routes ↔ services (Functions)  | ⚠️ sprzężone     | co-change 3 commity        |
| Lazy routes vs static analysis | ⚠️ ograniczenie  | madge JSON pusty           |
| Client-server contract         | 📋 ręczna wiedza | `ApiService` ↔ route paths |
