# Evals — promptfoo (M5L3)

Porównanie modeli OpenRouter na syntetycznym diffie z oczywistymi błędami RentMe.

## Uruchomienie

```bash
cd agents/code-review/evals
export OPENROUTER_API_KEY=sk-or-v1-...
npx promptfoo@latest eval
```

Bez klucza / walidacja składni:

```bash
npx promptfoo@latest eval --dry-run
```

Wymaga Node `^20.20.0 || >=22.22.0` (promptfoo 0.121+).

## Fixture

`fixtures/sample-flawed.diff` — Firestore w komponencie Angular, open export users, POST /auth/login z logowaniem hasła.
