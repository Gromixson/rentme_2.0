<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: S-05 Request timeout & expiry (Phase 1)

- **Plan**: `context/changes/request-timeout-expiry/plan.md`
- **Scope**: Phase 1 of 4 — Firestore index + scheduler hardening
- **Date**: 2026-07-12
- **Verdict**: APPROVED
- **Findings**: 0 critical · 0 warnings · 2 observations

## Verdicts

| Dimension | Verdict | Uwagi |
|-----------|---------|-------|
| Plan Adherence | PASS ✅ | Index `status+expiresAt`; scheduler używa `expirePendingRequest` per doc |
| Scope Discipline | PASS ✅ | Tylko `firestore.indexes.json` + `functions/src/services/requests.ts` |
| Safety & Quality | PASS ✅ | Transakcyjny re-check PENDING eliminuje race z accept |
| Architecture | PASS ✅ | Reuse istniejącego `expirePendingRequest`; bez nowych warstw |
| Pattern Consistency | PASS ✅ | Spójne z lazy path `resolveRequestStatus` |
| Success Criteria | PASS ✅ | `npm run functions:build` exit 0 |

## Success criteria verification (Phase 1)

| Kryterium | Wynik | Dowód |
|-----------|-------|-------|
| `firestore.indexes.json` zawiera index status + expiresAt | PASS | Nowy wpis w tablicy indexes |
| `functions:build` OK | PASS | `npm run functions:build` exit 0 (2026-07-12) |
| Po deploy brak „missing index” | PENDING | Wymaga `firebase deploy --only firestore:indexes` |

## Findings

### F1 — Sekwencyjne tx w pętli (do 100 docs)

- **Severity**: 👁 OBSERVATION
- **Impact**: 🏃 LOW — scheduler co 1 min; limit 100 wystarczający na MVP
- **Dimension**: Safety & Quality
- **Location**: `functions/src/services/requests.ts:27-31`
- **Detail**: Iteracja sekwencyjna zamiast batch — zamierzone per plan (race safety > throughput).
- **Decision**: ACCEPTED — zgodnie z Contract phase 1

### F2 — Brak deploy indexu w tym commicie

- **Severity**: 👁 OBSERVATION
- **Impact**: 🔎 MEDIUM — prod scheduler nadal może failować do deploy
- **Dimension**: Success Criteria
- **Location**: `firestore.indexes.json`
- **Detail**: Index w repo; deploy to osobny krok infra.
- **Decision**: SKIPPED — poza scope implementacji; dokumentacja w manual verification

## Triage summary

| ID | Decyzja |
|----|---------|
| F1 | ACCEPTED — zgodnie z planem |
| F2 | SKIPPED — deploy infra poza phase 1 code |

## Overall verdict

**APPROVE** — Phase 1 spełnia Intent + Contract. Brak blockerów dla phase 2 (API read-path consistency).
