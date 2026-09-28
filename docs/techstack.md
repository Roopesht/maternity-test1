# Maternal Care Platform — Tech Stack

Source of truth: [docs/project/blueprint.cleaned.html](docs/project/blueprint.cleaned.html) (Architecture Blueprint, Draft v0.2). Choices below follow the blueprint except where explicitly marked **override** — those deliberately replace a choice the blueprint called "Confirmed" or "Deferred."

- **Override:** Data store is a web-based SQLite setup, not the blueprint's Confirmed PostgreSQL.
- **Override:** A custom CDN is adopted, not the blueprint's Deferred/no-CDN stance.

## Design Principles

- Multi-tenant by default — each hospital (tenant) is isolated at the data layer
- Microservices behind a single API Gateway, not a monolith
- Keep the core domain (Gate/Archive/Summing/Subscription state machines) independent of transport and infrastructure choices
- Configuration (departments, packages, rate lists, branding) is identical whether a tenant is on PaaS or SaaS
- Preserve all entries (including overridden/wrong ones) — never hard-delete audit-relevant records

## Current Stack

### Architecture Style

- Microservices architecture behind an API Gateway
- Ingress: Client Apps → CDN → AWS ALB → API Gateway → Microservices

### Frontend

- React + Vite + TypeScript

### Backend

- Node.js + Express + TypeScript

### Core Microservices

- Identity Service (IAM, AuthN)
- Authorisation Service (RBAC / permission matrix, split out from Identity Service in v0.2)
- Tenant Provisioning
- Patient Registry Service (same-tenant records + cross-tenant patient traversal)
- Gate Service (Gate 1/2/3 state machine)
- Antenatal Service
- EDD Service (split out from Antenatal Service in v0.2)
- Summing Engine
- Subscription Service
- Manual Override Service
- Delivery & Admission Service
- Document Service
- Notification Service
- Chat Service
- Search Service (local tenant-scoped + global cross-tenant tier)
- Incident Manager Service

### Data & Storage

- Web-based SQLite — per-tenant database (**override**, replaces blueprint's Confirmed PostgreSQL)
- Firebase document store — documents (discharge receipts, uploaded reports) (**override**, replaces blueprint's Confirmed AWS S3)

### Infrastructure

- Custom CDN — images and other static files (**override**, replaces blueprint's Deferred/no-CDN stance)
- AWS ALB — load balancing / ingress
- AWS SNS — on-call/incident alerting (no third-party paging tool)
- API Gateway — single entry point in front of all microservices

### Communication

- REST APIs between clients and services (implied by the API Gateway model)
- SMS — weekly/monthly reports to Hospital Admin via Notification Service

### Observability

- Application/platform monitoring dashboard (Super Admin-owned, for outages/lockouts)
- Override audit reporting across all hospitals
- Usage/API-cost billing breakdown per hospital

## Not Yet Specified

The blueprint explicitly defers these — do not assume a choice without confirming with the source author:

- Mobile application framework
- Auth mechanism/library (Identity/Authorisation Service scope is defined; implementation is not)
- Feature-flag system (needed for multi-tenant staged rollouts, mechanism unspecified)
- Play Store/App Store submission tooling for the PaaS→SaaS "own app" journey
- Multilingual / i18n support (vision-stage)
- Voice interaction (vision-stage)
- Distributed workflow infrastructure for long-running flows (Gate/Archive state transitions), if needed beyond simple service-level state

## Not In Scope (per blueprint)

- Third-party paging/on-call tooling (AWS SNS used directly)
- Tenant traversal/merging — only patients traverse across tenants, never tenant configuration or data

## Architectural Boundary

Per-service domain logic (Gate state machine, Archive transitions, Summing Engine rules, Subscription billing models) should remain portable and not depend directly on:

- A specific database engine (web-based SQLite is the current choice, not an assumed dependency of the domain logic)
- A specific cloud provider's managed services (Firebase, AWS ALB, AWS SNS, and the CDN are current infrastructure choices)
- Any specific frontend/mobile framework (not yet chosen)

This keeps the core business rules — Gate 1/2/3, Natural/Forced Archive, 4-category Summing, 3-model Subscription — reusable if underlying infrastructure choices change.
