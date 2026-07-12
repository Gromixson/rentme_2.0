---
starter_id: angular
package_manager: npm
project_name: rentme
hints:
  language_family: js
  team_size: solo
  deployment_target: self-host
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: verified
  path_taken: custom
  quality_override: false
  self_check_answers:
    typed: true
    from_official_starter: true
    conventions: true
    docs_current: true
    can_judge_agent: true
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

RentMe rebuild uses **Angular 21** (standalone components, routing, SCSS, PrimeNG optional) as the web client — chosen explicitly over the course default `10x-astro-starter`. **Firebase** (Auth email/password, Firestore for users, providers, categories, requests, bookings, ratings; optional Storage; Cloud Functions for API per `MVP.md`) matches the service-marketplace MVP in [`MVP.md`](../../MVP.md) and [`prd.md`](prd.md) without Supabase.

Custom path on `/10x-tech-stack-selector`: user preference and Firebase familiarity. Bootstrap: `ng new` + Firebase JS SDK inject tokens (`starter_id: angular`). Angular clears agent-friendly gates; verification log in `context/changes/bootstrap-verification/verification.md`. Payments, in-app chat, and admin/KYC stay out of MVP per PRD non-goals.
