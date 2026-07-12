# Decyzja — model rejestru AI (M5L4)

**Odbiorca:** solo dev + kurs 10xDevs teraz; docelowo mały zespół na GitHubie współdzielący ten sam monorepo.

**Wybrany model:** **Model 1 — GitHub Packages** (`@rentme/ai-toolkit` w `npm.pkg.github.com`). Uzasadnienie: wersjonowanie semver, publish z CI bez lock-inu marketplace (Model 2), oraz niezależność od `10x-cli` (Model 3), który w tym repo utknął na `auth_timeout` i nie dostarcza reguł produktowych RentMe. Model 3 pozostaje kanałem lekcji kursowych; paczka GH Packages jest źródłem prawdy dla skilli zespołowych po dodaniu `git remote`.
