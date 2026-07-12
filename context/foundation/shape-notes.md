---
project: RentMe
context_type: greenfield
created: 2026-05-20
updated: 2026-05-20
product_alignment: MVP.md
note: Product pivoted from peer-to-peer rental (shape session) to service marketplace per MVP.md; prd.md v2 aligned 2026-05-20.
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: pain category
      decision: workflow friction + missing capability (no trusted short-term rental channel)
    - topic: auth strategy
      decision: email + password login; two roles — renter and owner
    - topic: primary persona scope
      decision: individuals who occasionally rent out or borrow items locally
  frs_drafted: 8
  quality_check_status: accepted
product_type: web-app
target_scale:
  users: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
---

# RentMe — shape notes

## Product alignment

**Implementation spec:** [`MVP.md`](../../MVP.md) (service marketplace: SEEKER / PROVIDER, categories, requests with timeout, bookings, ratings).

This file captures the **original** greenfield shaping session (peer-to-peer **rental** of items). The product was **pivoted** to the Fixly-style service model in `MVP.md`; [`prd.md`](prd.md) was updated to match for the course chain. Keep this file for Mission Log / shape history; do not treat rental FRs below as current scope.

---

Seed idea (from project context): platforma do wynajmu rzeczy między osobami prywatnymi — właściciel wystawia przedmiot z ceną i kalendarzem, najemca rezerwuje na wybrane daty, system pilnuje dostępności i statusu rezerwacji.

**Rebuild from zero:** Zastępujemy poprzednią wersję RentMe — bez migracji danych, bez parity ze starym kodem. Nowy kod w `rentme_2.0` od scaffoldu kursowego.

## Vision & Problem Statement

**Pain:** Osoby, które potrzebują na kilka dni sprzętu (np. wiertarki, namiotu, aparatu), kupują go na stałe albo pożyczają „na słowo” — bez kalendarza, bez jasnych zasad zwrotu i bez śladu umowy.

**Person:** Jan, 32 lata, mieszkaniec miasta — czasem pożycza, czasem wynajmuje.

**Moment:** Weekendowy remont lub wyjazd — potrzebuje konkretnej rzeczy na 2–3 dni, nie chce kupować.

**Cost today:** Kupno jednorazowe, albo chaos w wiadomościach (kto ma wolne, kiedy odda, ile kosztuje).

**Insight:** Wartość nie leży w „liście ogłoszeń”, tylko w **dopasowaniu terminu** — użytkownik widzi tylko to, co jest wolne w jego datach, i może dokończyć rezerwację w jednej sesji.

## User & Persona

**Primary — Renter (Jan):** Wynajmuje rzeczy od innych na krótki okres. Priorytet: szybko znaleźć dostępny przedmiot w terminie i potwierdzić rezerwację.

**Secondary — Owner (Anna):** Ma rzeczy, które leżą w szafie; chce je wystawić z ceną dzienną i minimalnym wysiłkiem (bez negocjacji w DM).

## Access Control

- Rejestracja i logowanie: email + hasło.
- Role: **owner** (dodaje i zarządza ofertami), **renter** (przegląda i rezerwuje). Jedno konto może być oboma rolami.
- Niezalogowany: przegląd publicznych ofert (lista + szczegóły), bez rezerwacji.
- Gated: tworzenie oferty, rezerwacja, „moje rezerwacje”, „moje oferty”.

## Success Criteria

### Primary

- Renter wybiera daty, widzi tylko oferty dostępne w tym oknie, składa rezerwację i widzi status „oczekuje / potwierdzona / odrzucona”.
- Owner potwierdza lub odrzuca rezerwację w jednym miejscu.

### Secondary

- Owner dodaje ofertę z ceną dzienną, opisem i zdjęciem (jedno) w &lt; 5 minut.

### Guardrails

- Podwójna rezerwacja tego samego przedmiotu w tym samym terminie jest niemożliwa.
- Dane kontaktowe widoczne dopiero po potwierdzeniu rezerwacji (prywatność przed umową).

## Functional Requirements

### Discovery & booking

- FR-001: Renter can search and filter listings by date range. Priority: must-have
  > Socrates: Counter: „filtr dat może zawęzić wyniki do zera”. Resolution: pusty stan z sugestią zmiany dat; zachowane.
- FR-002: Renter can view listing details (title, description, daily price, availability calendar). Priority: must-have
  > Socrates: Counter: „kalendarz bez integracji z zewnętrznymi kalendarzami”. Resolution: MVP — tylko wewnętrzny kalendarz oferty.
- FR-003: Renter can submit a booking request for selected dates. Priority: must-have
  > Socrates: Counter: „request bez płatności może generować no-show”. Resolution: MVP bez płatności; status i kontakt po akceptacji.
- FR-004: Owner can accept or reject a pending booking request. Priority: must-have
  > Socrates: No counter-argument; stands as written.

### Listings

- FR-005: Owner can create a listing with title, description, daily price, and one photo. Priority: must-have
  > Socrates: Counter: „jedno zdjęcie może być za mało”. Resolution: MVP — jedno zdjęcie; galeria w v2.
- FR-006: Owner can mark date ranges as unavailable on a listing calendar. Priority: must-have
  > Socrates: No counter-argument; stands as written.

### Accounts

- FR-007: User can register and log in with email and password. Priority: must-have
  > Socrates: Counter: „hasło = support burden”. Resolution: prosty model na MVP; OAuth w v2.
- FR-008: User can view their own bookings and owned listings in separate views. Priority: must-have
  > Socrates: No counter-argument; stands as written.

### Nice-to-have (out of MVP flow)

- FR-009: Renter can save favorite listings. Priority: nice-to-have
  > Socrates: Counter: „ulubione bez rezerwacji mało wartościowe”. Resolution: nice-to-have, poza MVP.

## User Stories

### US-01: Renter books available item

- **Given** a logged-in renter and a listing free on 2026-06-10–2026-06-12
- **When** they select those dates and submit a booking request
- **Then** the request appears as pending for the owner and as pending for the renter

#### Acceptance Criteria

- Overlapping confirmed booking blocks new request for same dates
- Renter sees clear pending state until owner acts

### US-02: Owner publishes listing

- **Given** a logged-in owner
- **When** they create a listing with title, price, photo, and mark some dates unavailable
- **Then** the listing is visible in public browse (except blocked dates)

## Business Logic

The application **matches rental demand to listing availability for a date range** and **locks the calendar** when a booking is confirmed, so two renters cannot claim the same item for the same days.

Supporting detail: Renter supplies start/end dates; the product returns only listings with no conflicting confirmed or pending-hold reservation in that window. Owner acceptance moves a request to confirmed and blocks those dates for other requests. Rejection frees the dates for other renters.

## Non-Functional Requirements

- Renter sees feedback within 2 seconds after submitting a booking request (success or validation error).
- Unauthenticated visitors can browse listings without creating an account.
- Product works in the latest two major versions of Chrome and Firefox on desktop.
- Personal contact details are not shown until booking is confirmed.

## Non-Goals

- **Avoid:** integrated online payments and deposits in MVP — settlement happens off-platform after confirmation; reduces regulatory scope for v1.
- **Avoid:** in-app chat and negotiation — fixed daily price only; keeps MVP flow linear.
- **Avoid:** delivery/logistics coordination — pickup/return arranged by users after confirmation.
- **Avoid:** multi-city marketplace scale — MVP targets one city/region mentally (no geo search engine).
- **Avoid:** native mobile apps — web-only for MVP.
- **Avoid:** OAuth / social login — email-password only in v1.

## Forward: tech-stack

- **Angular** — frontend framework (user choice, overrides course default 10x-astro-starter).
- **Firebase** — Auth, Firestore, Storage for listing photos; deploy target Firebase Hosting or self-host build output.

## Quality cross-check

All elements present at session close (greenfield):

- Access Control: present
- Business Logic (one-sentence rule): present
- Project artifacts: present
- Timeline-cost acknowledged: mvp_weeks ≤ 3
- Non-Goals: present (6 entries)
