---
project: RentMe
version: 2
status: draft
created: 2026-05-20
updated: 2026-05-20
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
implementation_spec: MVP.md
---

# RentMe — Product Requirements Document

> **Implementation source of truth:** [`MVP.md`](../../MVP.md) at repo root (detailed endpoints, Firestore collections, sprint order). This PRD keeps the course greenfield schema aligned with that product.

## Vision & Problem Statement

People who need a local service right now (cleaning, repairs, transport, tutoring) often bounce between informal messages and classifieds — without knowing who is available, at what price, or whether anyone will respond. The cost is wasted time and abandoned requests.

RentMe is a **service marketplace “on demand”** (Fixly-style): a client picks a category, sees providers who are **online**, sends one short message; the provider has about two minutes to accept or decline; on acceptance a booking is created, the job completes, and the client rates the provider.

**Rebuild from zero:** This codebase replaces a prior RentMe implementation. No data migration or parity with legacy rental/listings flows is required for MVP — only behavior defined here and in `MVP.md`.

## User & Persona

**Primary — Client (SEEKER):** Needs a service in a category today. Success means finding an online provider, sending a request, and seeing clear status (pending, accepted, declined, timed out) through booking and rating.

**Secondary — Provider (PROVIDER):** Offers services in one or more categories with an hourly rate. Success means going online when ready, responding TAK/NIE to requests within the timeout, and completing bookings with a visible reputation (average rating).

**Dual role:** One account may act as both client and provider; UI mode switch (blue client header vs orange provider header). Switching to client mode turns provider **offline**.

## Success Criteria

### Primary

- A logged-in client selects a category, sees only **online** providers in that category, sends a one-message request, and sees status until the provider responds or the request times out.
- A provider with a complete profile (categories + hourly rate) can go **online**, receive pending requests, and accept or decline within the timeout window.
- On accept, a **booking** exists for both parties; after completion the client submits a 1–5 star rating and the provider’s average updates.

### Secondary

- When no provider is online in a category, the client can signal **“Szukam!”** (interest) so providers see demand (badge/count); full push is MVP+.

### Guardrails

- No booking is created from a declined or timed-out request.
- Provider cannot go online without minimum profile (at least one category, hourly rate > 0).
- No in-app chat before a booking exists (single message request only).

## User Stories

### US-01: Client requests an online provider

- **Given** a logged-in SEEKER and a PROVIDER online in category “Sprzątanie”
- **When** the client sends a request message (10–500 characters)
- **Then** the request is `PENDING` for both until the provider accepts, declines, or the request times out

#### Acceptance Criteria

- Only providers with `isOnline` in the selected category appear on the list
- Request expires to `TIMEOUT` after ~1–2 minutes without response
- `DECLINED` and `TIMEOUT` do not create a booking

### US-02: Provider accepts and completes service

- **Given** a pending request for the logged-in PROVIDER
- **When** they accept within the timeout
- **Then** a booking with status `CONFIRMED` is created and visible to both parties; either party can drive completion to `COMPLETED` per MVP flow

### US-03: Client rates after completion

- **Given** a booking in `COMPLETED`
- **When** the client submits a 1–5 rating (optional comment)
- **Then** the provider’s average rating and count update on profile and list cards

## Functional Requirements

### Auth & profile

- FR-001: User can register and log in with email and password. Priority: must-have
- FR-002: User can switch active role between SEEKER and PROVIDER. Priority: must-have
- FR-003: PROVIDER must set categories and hourly rate before going online; display name minimum for lists. Priority: must-have

### Categories & discovery

- FR-004: Client can browse categories (with optional subcategories/tags) and see online provider count per category. Priority: must-have
- FR-005: Client can list online providers in a category (pseudonym, rating, rate/h, online status). Priority: must-have
- FR-006: Seed categories for dev/demo (script or dev endpoint). Priority: must-have

### Provider operations

- FR-007: Provider can toggle online/offline in one action. Priority: must-have
- FR-008: Provider can view pending requests and accept or decline without chat. Priority: must-have
- FR-009: Provider can view active bookings and mark service complete. Priority: must-have

### Requests & bookings

- FR-010: Client can create a single-message request to a chosen online provider. Priority: must-have
- FR-011: System enforces request timeout (~1–2 min) to `TIMEOUT`. Priority: must-have
- FR-012: Accepted request automatically creates a booking (`CONFIRMED` → `COMPLETED` / optional `CANCELLED`). Priority: must-have
- FR-013: Client can view “my requests” with current status. Priority: must-have

### Ratings

- FR-014: Client can rate provider after `COMPLETED` (1–5 + optional comment); average shown on provider profile/list. Priority: must-have

### Interest (“Szukam!”)

- FR-015: When no provider is online, client can register interest; providers in category see demand indicator. Priority: should-have (MVP+ acceptable if timeboxed)

### Out of MVP scope (see Non-Goals)

- FR-016: Integrated online payments. Priority: deferred
- FR-017: In-app chat (before or after booking). Priority: deferred
- FR-018: Admin panel, KYC, VIP, geo map, multi-language. Priority: deferred

## Non-Functional Requirements

- Provider response UX: pending request visible within 2 seconds of client submit on a typical dev setup.
- Request timeout enforced reliably (scheduled job or consistent read-time check).
- Responsive layout (mobile-first); latest two major Chrome and Firefox versions on desktop.
- User-visible errors (toast/alert), not silent failures on primary flows.
- Protected API routes validate JWT; input validation on message length and required profile fields.

## Business Logic

The product matches **immediate service demand** to **online provider supply** in a category. A client message creates a time-boxed request; provider acceptance materializes a booking and may set the provider offline; completion unlocks client rating.

Rules: only online providers are discoverable per category; one request is one message with expiry; no booking without accept; ratings only after `COMPLETED`; switching account to SEEKER forces provider offline.

## Access Control

- Registration and login: email and password (Firebase Auth).
- Roles: **SEEKER** (browse, request, rate) and **PROVIDER** (profile, online status, respond, complete). One user may hold both; `activeRole` drives UI and API behavior.
- Unauthenticated: no requests, bookings, or provider online toggle (public marketing/browse policy as implemented in app).
- Authenticated gated areas: profile, provider dashboard, request/booking lists, rating submit.

## Non-Goals

- **No integrated online payments, deposits, or platform commission in MVP** — settlement off-platform.
- **No in-app chat or negotiation** — single message per request until MVP+ chat.
- **No admin panel, KYC/VIP, insurance, or dispute workflow** in MVP.
- **No real-time geo map / tracking** — list-based discovery only in MVP.
- **No OAuth requirement** — email/password sufficient; Google optional for demo only.
- **No PWA / push / i18n** as MVP gate — listed as MVP+ in `MVP.md`.
- **No peer-to-peer item rental, listing calendars, or date-range inventory** — superseded by service-on-demand model in `MVP.md`.

## Open Questions

1. **Request timeout implementation** — Cloud Function scheduler vs Firestore read-time expiry only? Owner: implementer. By: before FR-011.
2. **Booking completion actor** — Provider-only vs either party button? Owner: user. By: sprint 4 in `MVP.md`.
3. **Functions vs client-only Firestore** — Which endpoints from `MVP.md` §4.3 ship in v1 vs direct Firestore rules? Owner: user. By: before API scaffold.
