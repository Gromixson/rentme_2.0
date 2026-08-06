# mvp-check — 10xBuilder technical foundations

> **Źródło:** rekonstrukcja z oficjalnego ogłoszenia General Toolkit (M0L0) / 10xBuilder.
> Oficjalny plik z `npx @przeprogramowani/10x-cli@latest get m0l0` **nie został pobrany**
> (sesja CLI `auth_expired`, 2026-07-26). Po udanym `get m0l0` nadpisz ten plik wersją z paczki.

## Cel

Przeanalizuj bieżące repozytorium pod kątem **technicznych fundamentów certyfikacji 10xBuilder**
(moduły 1–3). Powiedz wprost: które wymagania są spełnione, czego brakuje i co konkretnie
poprawić — zanim użytkownik wyśle formularz.

Działa niezależnie od stacku (web, CLI, mobile, API). Analizuj kod i dokumentację w cwd.
**Nie oceniaj** stylowania, UI ani deployu (to idzie przez screeny + review repo).

## Kryteria (✅ / ❌ + dowód ścieżkami plików / nazwami funkcji)

### 1. CRUD

Czy użytkownik (lub API) może **tworzyć, odczytywać, aktualizować i usuwać** elementy domenowe?
Wskaż endpointy / handlery / serwisy dla C, R, U, D. Brak którejś litery = ❌ (albo uzasadnij
odstępstwo w komentarzu do formularza).

### 2. Logika biznesowa (poza CRUD)

Czy jest **co najmniej jedna** funkcja realizująca realną logikę domenową (workflow, reguły,
transakcje, wyliczenia) — nie samo CRUD?

### 3. Testy ↔ test-plan

Czy istnieje **co najmniej jeden** zestaw testów adresujący **konkretne ryzyko** z
`context/foundation/test-plan.md` (lub równoważnego dokumentu testowego)? Podaj ID ryzyka
(np. R-0N) i plik testu.

### 4. Autentykacja + zasoby użytkownika

Czy dostęp jest powiązany z użytkownikiem, który widzi **przypisane do niego** zasoby
(user-scoped), a nie globalny anonimowy dump danych?

### 5. Dokumentacja / fundament 10xWorkflow

Najpierw zajrzyj do `context/foundation/`:

- `prd.md` (lub PRD) — realna treść
- `roadmap.md` — realna treść
- `test-plan.md` — realna treść

oraz root `README.md` z sensownym opisem projektu.

## Format raportu

1. **Checklist** ✅/❌ dla każdego kryterium + krótkie wyjaśnienie + ścieżki plików
2. **Priorytetowe poprawki** (tylko dla ❌) — konkretne, dopasowane do stacku i domeny
3. **Podsumowanie pod formularz** (2–3 zdania do skopiowania)
4. Data / zakres analizy

Język raportu: według instrukcji użytkownika (domyślnie język instrukcji / PL jeśli proszono).
