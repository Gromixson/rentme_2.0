# Mom Test — pytania walidacyjne (draft)

> Helper: **Mission Log status digest** · Kontekst: solo dev + kurs 10xDevs  
> Status: **draft** — pytania do przyszłej rozmowy z innym deweloperem/mentorem; nie „czy byś użył”.

---

## Pytania (przeszłe zachowanie)

1. **Ostatnia sesja przed kodowaniem:** Jak ostatnio sprawdzałeś, co jest zablokowane w projekcie — otwierałeś backlog, Firebase Console, czy coś innego? Ile czasu to zajęło?

2. **Powtarzalność:** Ile razy w ostatnim tygodniu uruchamiałeś testy (`functions:test` / `e2e`) _zanim_ zacząłeś nową lekcję lub feature — żeby upewnić się, że nic nie jest czerwone?

3. **E2E creds:** Kiedy ostatnio odkryłeś, że north-star testy są SKIP — przed commitem, po merge, czy dopiero na etapie odznaki? Co wtedy zrobiłeś?

4. **Rozproszone źródła:** Czy zdarzyło Ci się zacząć pracę nad slice’em (np. `request-timeout-expiry` phase 2), a potem przypomnieć sobie, że phase 1 deploy jest w innym pliku niż backlog? Jak to wychwyciłeś?

5. **10x CLI:** Co robiłeś, gdy `10x-cli auth` nie zadziałał — kopiowałeś skilli ręcznie, czekałeś na maila, czy odłożyłeś lekcję? Ile razy powtórzyłeś `auth`?

6. **Git remote:** Czy próbowałeś już otworzyć PR lub uruchomić CI na tym repo? Na jakim kroku utknąłeś (brak remote, brak `gh`, coś innego)?

7. **Digest jednym skrótem:** Gdybyś dostał jedną stronę Markdown z: blockerami, statusem testów Functions, flagą E2E i manifestem 10x — czy _ostatnio_ przed jakąś sesją byłby to pierwszy plik, który byś otworzył? Dlaczego tak/nie?

8. **Koszt fałszywego alarmu:** Czy zdarzyło Ci się, że agent zaczął implementację, a Ty dopiero później zauważyłeś brak creds lub pustą sekcję w raporcie architekta? Co wtedy straciłeś (czas, tokeny, revert)?

---

## Notatki interpretacyjne (solo)

- Pytania 1–4 walidują **sygnał 4** (rozproszony status).
- Pytania 5–6 walidują **complement** vs **Kup** dla 10x CLI i GitHub.
- Pytanie 7 testuje wartość digestu bez pytania „czy byś kupił”.
- Pytanie 8 mierzy koszt braku helpera — ważne przy solo + agent.
