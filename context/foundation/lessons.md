# Lessons Learned

## Domain mutations go through the HTTP API, not Firestore in components

- **Context**: Any feature under `src/app/features/` that creates or updates requests, bookings, providers, or users.
- **Problem**: Agents added `collection()` / `doc()` calls in components or called deprecated `POST /api/auth/login`, bypassing validation in Cloud Functions.
- **Rule**: Use `ApiService` methods only for reads and writes of domain data. Use Firebase Auth SDK only for sign-in, sign-out, and ID tokens. Do not implement `POST /api/auth/login` in the client.
- **Applies to**: plan, implement, impl-review

## API error messages use a flat string shape

- **Context**: Angular `HttpClient` error callbacks in features.
- **Problem**: Agents assumed `{ error: { code, message } }` and broke toasts or logging.
- **Rule**: Surface API failures with `err?.error?.error` where the backend returns `{ error: string }`.
- **Applies to**: implement, impl-review

## Do not throw after a Firestore write you intend to commit

- **Context**: Cloud Functions handlers using `runTransaction` with business-error codes (`NOT_FOUND`, `TIMEOUT`, etc.) in `functions/src/routes/`.
- **Problem**: Throwing inside a transaction callback after `tx.update` rolls back the write; client gets the correct HTTP status but DB state stays stale (e.g. expired request remains `PENDING` until a separate read path expires it).
- **Rule**: If the transaction must persist a state change and still signal a business error to the caller, return a discriminated result (e.g. `{ errorCode }`) from the callback instead of throwing. Reserve `throw` for cases where no write should commit.
- **Applies to**: implement, impl-review
