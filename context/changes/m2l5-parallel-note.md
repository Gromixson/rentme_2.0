# M2L5 — Ocena równoległości slice'ów

**Data:** 2026-07-12  
**Lekcja:** Parallel agents with git worktrees

## Wybrane slice'y

| Slice | Change ID | Faza | Warstwa |
|-------|-----------|------|---------|
| A | `request-timeout-expiry` | Phase 1 | Infra (`firestore.indexes.json`) + backend scheduler (`functions/src/services/requests.ts`) |
| B | `provider-accept-booking` | Phase 2 | Frontend provider UX (`provider-requests.component.ts`) |

## Werdykt: **RÓWNOLEGŁE ✅**

### Brak konfliktu plików

- **Slice A** dotyka: `firestore.indexes.json`, `functions/src/services/requests.ts`
- **Slice B** dotyka: `src/app/features/provider/requests/provider-requests.component.ts`

Zero wspólnych plików w minimalnym scope faz.

### Brak konfliktu kontraktów

- Slice A utwardza scheduler expiry (transakcja per doc) — nie zmienia API respond ani shape requestów.
- Slice B dodaje CTA/link do `/bookings` po accept — konsumuje istniejący kontrakt `respondToRequest` bez modyfikacji.

### Warstwy ortogonalne

- A = backend/infra (Firestore index + Cloud Functions scheduler)
- B = Angular UI (provider requests screen)

### Zależność logiczna (akceptowalna)

- Oba slice'y dotyczą flow request→booking (S-05/S-06), ale fazy są niezależne implementacyjnie.
- Slice A wspiera niezawodny TIMEOUT, który Slice B już obsługuje w API (410) — brak blokady merge.

### Merge order

1. `feature/request-timeout-expiry` (index + scheduler)
2. `feature/provider-accept-booking` (provider UX)

Konflikt merge: **niski** — różne ścieżki w repo.

## Worktree'y

| Path | Branch |
|------|--------|
| `d:\programowanie\rentme-wt-request-timeout-expiry` | `feature/request-timeout-expiry` |
| `d:\programowanie\rentme-wt-provider-accept-booking` | `feature/provider-accept-booking` |

Koordynacja: główne repo `d:\programowanie\rentme_2.0` (branch `master`).
