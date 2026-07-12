# RentMe — zakres MVP (wersja kursowa)

**Cel dokumentu:** Określa, co musi działać w pierwszej wersji produktu budowanej od zera na kursie.  
**Inspiracja produktu:** marketplace usług „na już” (Uber Eats / Fixly) — minimum formularzy, szybka odpowiedź TAK/NIE.

---

## 1. Co to jest MVP w tym projekcie?

MVP to **działająca ścieżka od rejestracji do zakończonej usługi i oceny**, bez płatności online, panelu admina, wielu języków ani zaawansowanych integracji.

**Jedno zdanie wartości:** Klient wybiera kategorię, widzi dostępnych usługodawców online, wysyła jedną wiadomość; usługodawca ma ~2 minuty na TAK/NIE; po akceptacji powstaje rezerwacja, usługa się kończy, klient wystawia ocenę.

---

## 2. Role i tryby

| Element | W MVP | Opis |
|--------|-------|------|
| Rejestracja / logowanie | **TAK** | Email + hasło (Firebase Auth) |
| Dwie role w jednym koncie | **TAK** | Użytkownik może być usługodawcą i klientem (przełącznik trybu) |
| OAuth Google | Opcjonalnie | Ułatwia demo, nie jest warunkiem MVP |
| Panel administratora | **NIE** | Poza MVP |
| Weryfikacja KYC / VIP | **NIE** | Poza MVP |

**Tryby w UI:**
- **Klient (SEEKER)** — niebieski motyw w nagłówku
- **Usługodawca (PROVIDER)** — pomarańczowy motyw; przełączenie na klienta **gasi** status online

---

## 3. Must-have — funkcje biznesowe

### 3.1 Autentykacja i profil

- [ ] Rejestracja i logowanie (email/hasło)
- [ ] Wybór / zapis roli przy pierwszym wejściu (lub domyślna rola + przełącznik)
- [ ] Profil użytkownika: imię / pseudonim (minimum do wyświetlania na liście)
- [ ] **Profil usługodawcy** wymagany przed przejściem na online:
  - co najmniej jedna kategoria usług
  - stawka za godzinę (> 0)
  - krótki opis (bio) — opcjonalnie w MVP minimum, ale zalecane
- [ ] Wylogowanie

### 3.2 Kategorie usług

- [ ] Lista kategorii (np. sprzątanie, gotowanie, naprawy, transport, edukacja…)
- [ ] Podkategorie lub tagi w ramach kategorii głównej
- [ ] Liczba usługodawców **online** przy kategorii (może być 0)
- [ ] Seed kategorii (skrypt / endpoint dev) — żeby nie wpisywać ręcznie przy każdym starcie

### 3.3 Tryb usługodawcy

- [ ] Przełącznik **online / offline** (jedno kliknięcie)
- [ ] Wybór kategorii, w których świadczy usługi
- [ ] Ustawienie stawki za godzinę
- [ ] Lista **oczekujących próśb** (requestów) skierowanych do niego
- [ ] Odpowiedź na prośbę: **Akceptuj** / **Odrzuć** (bez czatu)
- [ ] Po akceptacji: widok aktywnej rezerwacji (booking)
- [ ] Zakończenie usługi (status COMPLETED) — przez usługodawcę lub obie strony (patrz booking)

### 3.4 Tryb klienta

- [ ] Wybór kategorii → lista usługodawców **tylko online** w tej kategorii
- [ ] Na karcie usługodawcy: pseudonim, ocena (1–5), stawka/h, status online
- [ ] Wysłanie **jednej wiadomości** (request) — min. ~10 znaków, max. ~500
- [ ] Ekran oczekiwania na odpowiedź (timer / status: oczekuje, zaakceptowano, odrzucono, wygasło)
- [ ] Lista „Moje prośby” z aktualnym statusem
- [ ] Po akceptacji: widok rezerwacji i możliwość zakończenia / oceny

### 3.5 Request (szybkie zamówienie)

- [ ] Jeden request = jedna wiadomość od klienta do wybranego usługodawcy
- [ ] Statusy: `PENDING` → `ACCEPTED` | `DECLINED` | `TIMEOUT`
- [ ] **Timeout 1–2 minuty** — po czasie bez odpowiedzi request wygasa (scheduled job lub sprawdzenie przy odczycie)
- [ ] **Brak czatu** przed utworzeniem bookingu (zgodnie z koncepcją produktu)

### 3.6 Booking (rezerwacja)

- [ ] Automatyczne utworzenie bookingu po akceptacji requestu
- [ ] Statusy minimum: `CONFIRMED` → `COMPLETED` (ew. `CANCELLED`)
- [ ] Rozpoczęcie / zakończenie usługi — w MVP wystarczy prosty flow: np. przycisk „Zakończ usługę” po stronie usługodawcy lub obu
- [ ] Usługodawca po akceptacji może przejść na **offline** (zalecane w logice biznesowej)

### 3.7 Oceny

- [ ] Po `COMPLETED` klient ocenia usługodawcę: 1–5 gwiazdek + opcjonalny komentarz
- [ ] Średnia ocena i liczba ocen na profilu / liście usługodawców
- [ ] Dwukierunkowe oceny — **poza MVP minimum** (wystarczy ocena od klienta)

### 3.8 Funkcja „Szukam!” (zalecane w MVP+)

Gdy w kategorii **nikt nie jest online**:

- [ ] Klient klika „Szukam!” / „Chcę usługę”
- [ ] Zapis w bazie (`interests`) + opcjonalnie proste powiadomienie (nawet toast / odświeżenie listy)
- [ ] Usługodawcy w kategorii widzą, że ktoś szuka (badge liczby)

*Pełne push notifications można odłożyć na MVP+ (patrz sekcja 5).*

---

## 4. Must-have — technologie i architektura

### 4.1 Stack (minimum kursowe)

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Angular (standalone components), TypeScript, SCSS |
| UI | PrimeNG **lub** własne komponenty (toast, dialogi) — spójnie w całej aplikacji |
| Backend | Firebase Cloud Functions (Express w Functions) |
| Baza | Firestore |
| Auth | Firebase Authentication (email/hasło) |
| Hosting | Firebase Hosting (build Angular → `dist`) |

### 4.2 Struktura repozytorium (minimum)

```
rentme/
├── frontend/          # Angular PWA
├── functions/         # API + logika
├── firebase.json
├── .firebaserc
└── MVP.md             # ten plik
```

### 4.3 API — endpointy wymagane w MVP

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login` — **deprecated (410)**; client uses Firebase `signInWithEmailAndPassword` only
- `GET /api/auth/me`
- `POST /api/auth/active-role` (zmiana trybu PROVIDER ↔ SEEKER)

**Użytkownicy / profil**
- `GET /api/users/me`
- `PUT /api/users/profile`

**Kategorie**
- `GET /api/categories`
- `GET /api/categories/:id/providers` (tylko online w tej kategorii)

**Usługodawcy**
- `PUT /api/providers/status` (online/offline)
- `PUT /api/providers/categories` + stawka w profilu
- `GET /api/providers/requests` (pending dla zalogowanego providera)
- `POST /api/providers/requests/:id/respond` (accept / decline)

**Requesty**
- `POST /api/requests`
- `GET /api/requests/:id`
- `GET /api/requests/my` (dla klienta)

**Bookings**
- `GET /api/bookings/my`
- `PATCH` lub `POST` zakończenie usługi (np. `/api/bookings/:id/complete`)

**Oceny**
- `POST /api/bookings/:id/rate`

**Dev (opcjonalnie)**
- `POST /api/categories/seed` — tylko emulator / dev

### 4.4 Firestore — kolekcje w MVP

| Kolekcja | Zawartość minimum |
|----------|-------------------|
| `users` | email, name, roles[], activeRole |
| `providers` | userId, hourlyRate, isOnline, averageRating, categories[] |
| `categories` | name, parentId?, onlineCount (opcjonalnie) |
| `requests` | seekerId, providerId, categoryId, message, status, expiresAt, createdAt |
| `bookings` | requestId, providerId, seekerId, status, startTime?, endTime? |
| `ratings` | bookingId, providerId, seekerId, rating, comment? |

### 4.5 Bezpieczeństwo i jakość (minimum)

- [ ] Middleware JWT na chronionych endpointach
- [ ] Walidacja wejścia (długość wiadomości, wymagane pola)
- [ ] CORS tylko dla znanych originów (localhost + domena prod)
- [ ] Responsywny layout (mobile-first)
- [ ] Komunikaty błędów dla użytkownika (toast / alert), nie „ciche” 500

---

## 5. MVP+ (po MVP, jeśli starczy czasu na kursie)

Te elementy **ulepszają** projekt, ale **nie są warunkiem** uznania MVP za kompletne:

| Funkcja | Priorytet |
|---------|-----------|
| PWA (manifest + service worker) | Wysoki |
| Push notifications (Web Push / FCM) | Wysoki |
| Geolokalizacja (odległość, promień usług) | Średni |
| OAuth Google | Średni |
| Ciemny motyw | Niski |
| i18n (PL + EN) | Niski |
| Chat tylko w trakcie bookingu | Niski |
| Portfolio zdjęć usługodawcy | Niski |

---

## 6. Świadomie poza MVP (pełna wersja RentMe)

Nie implementuj tego w pierwszej iteracji kursowej — to osobne fazy produktu:

- Płatności Stripe, blokady co 30 min, napiwki, prowizja 12%
- Panel administratora, statystyki, skargi, VIP
- Weryfikacja tożsamości (KYC), ubezpieczenie, spory
- Subskrypcje providerów, kalendarz dostępności
- Mapa z markerami na liście providerów (Leaflet) — można zastąpić sortowaniem listy
- 8 języków, email Resend, zaawansowane filtry i rekomendacje AI
- Real-time tracking pozycji providera w drodze

---

## 7. Happy path — scenariusz demonstracyjny

Użyj tego jako **test akceptacji** i prezentacji na zaliczenie:

1. **Usługodawca** rejestruje się, uzupełnia profil (kategorie + stawka), włącza **online**.
2. **Klient** (drugie konto lub przełącznik roli) loguje się, wybiera kategorię, widzi usługodawcę na liście.
3. Klient wysyła **request** z jedną wiadomością.
4. Usługodawca w ≤ 2 min odpowiada **TAK**.
5. Powstaje **booking** widoczny u obu stron.
6. Usługodawca (lub obie strony) oznacza usługę jako **zakończoną**.
7. Klient wystawia **ocenę** 1–5; średnia aktualizuje się na liście.

**Scenariusz negatywny (krótko):** klient wysyła request → usługodawca **NIE** lub **brak odpowiedzi** → status `DECLINED` / `TIMEOUT`, brak bookingu.

---

## 8. Kryteria ukończenia MVP (checklist)

Projekt uznaj za MVP, gdy:

- [ ] Działa lokalnie: frontend + emulator Functions + Firestore (lub deploy na Firebase)
- [ ] Przechodzi happy path z sekcji 7 bez ręcznej edycji bazy
- [ ] Request wygasa po upływie czasu (TIMEOUT)
- [ ] Klient widzi tylko providerów **online** w wybranej kategorii
- [ ] Provider bez uzupełnionego profilu **nie może** włączyć online (lub jest wyraźny komunikat)
- [ ] Kod w repozytorium: README z instrukcją `npm install` / `firebase emulators` / `npm start`
- [ ] Brak krytycznych błędów w konsoli przy podstawowych akcjach

---

## 9. Sugerowana kolejność implementacji (sprinty)

| Sprint | Zakres | Rezultat |
|--------|--------|----------|
| **1** | Firebase projekt, Auth, Angular szkielet, routing, shared header | Logowanie, role, puste dashboardy |
| **2** | Kategorie (seed + lista), profil providera, online/offline | Provider może „być dostępny” |
| **3** | Lista providerów dla klienta, tworzenie requestu, timeout | Klient wysyła prośbę |
| **4** | Odpowiedź TAK/NIE, booking, lista rezerwacji | Pełny flow bez ocen |
| **5** | Oceny, średnia, poprawki UX, README, opcjonalnie PWA/push | MVP zamknięte + demo |

---

## 10. Metryki sukcesu (dla Ciebie / prezentacji)

- Czas od wysłania requestu do odpowiedzi providera (średnio)
- % requestów zaakceptowanych vs odrzuconych / timeout
- Liczba kategorii z co najmniej jednym providerem online (w demo)
- Czy użytkownik wykonuje cały flow bez instrukcji (test z osobą trzecią)

---

## 11. Powiązane pliki w repozytorium

- `README.md` — opis produktu i stack
- `cursor-rules.md` — szczegółowa specyfikacja pełnego produktu (TRL-0 i więcej)
- `.cursor/rules/roadmap-development.md` — roadmap po MVP (fazy 1–4)

---

*Ostatnia aktualizacja: 2026-05-20 — wersja pod kurs „od zera”; pełna aplikacja w repo może zawierać funkcje spoza tego zakresu.*
