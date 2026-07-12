---
change_id: auth-and-role-switch
title: Rejestracja, logowanie i przełącznik roli SEEKER ↔ PROVIDER
status: in-progress
created: 2026-07-12
updated: 2026-07-12
roadmap_ref: S-01
prd_refs: FR-001, FR-002
---

## Notes

Slice **S-01** z `context/foundation/roadmap.md` — Strumień A (konto i tożsamość).

**Outcome (roadmap):** użytkownik może zarejestrować się i zalogować emailem/hasłem oraz przełączyć aktywną rolę SEEKER ↔ PROVIDER (przełączenie na SEEKER gasi status online providera).

**Baseline:** kod auth istnieje w `src/app/core/auth/`, `src/app/features/auth/`, `functions/src/routes/auth.ts`. Ten change nie przepisuje flow — weryfikuje kontrakt, uzupełnia testy guardów i dokumentuje checklistę regresji przed pętlą request→booking.

**North star dependency:** S-01 odblokowuje S-02 (profil providera) i S-03 (kategorie); bez stabilnego auth nie ma sensu implementować Strumienia B.
