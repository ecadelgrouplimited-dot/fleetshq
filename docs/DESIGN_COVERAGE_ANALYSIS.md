> **⚠️ SUPERSEDED FOR SCOPE (2026-06-19).** 256 Logistics is now a full logistics platform. The authoritative specification lives in [`docs/spec/`](spec/README.md). This document predates the platform vision and remains only as a **depth reference** for the compliance/HR/fleet-compliance domains.

# 256 Logistics Design Coverage Analysis

Generated: 2026-06-16

## Source Reviewed

- `docs/256 Logistics Compliance App Design.pdf`
- Existing project modules, routes, views, Prisma schema, migrations and tests

## Completed Coverage

### Core Platform

- PostgreSQL-backed Prisma persistence is configured for `logistics_256_db`.
- Web login uses secure HTTP-only cookie auth for server-rendered pages.
- API authentication now accepts valid bearer tokens or the login cookie, fixing user creation failures caused by missing frontend bearer tokens.
- The purchased production domain has been standardised to `256logisticsltd.com`.

### People and Compliance

- Employee register with view, create, edit, status filter, department filter, type filter and instant in-page search.
- Employee profile pages show personal details, role, driver status, documents, training, sponsored-worker details and compliance completion.
- User management supports director-only access and instant search.
- Sponsored worker register includes CoS, SOC, visa, Right to Work follow-up, salary match and unreported-change visibility with instant search.

### Fleet and Roadworthiness

- Fleet register with vehicle create, view, edit, status filter, compliance filter and instant search.
- Vehicle profile pages show compliance dates, documents, assigned driver, defects, checks and VOR history.
- PMI planner highlights overdue and due-soon maintenance.
- Daily checks workflow includes missed-check monitoring, check submission and instant search across recent checks.
- Defect register includes severity/status filtering, case details, days open, VOR indication and instant search.
- VOR management includes active VOR list, return-to-service action and searchable active/history tables.

### Training and Driver Risk

- Driver training matrix tracks induction completion and toolbox talks.
- Driver risk page combines CPC expiry, missed checks, assigned vehicle and risk level with instant search.

### Evidence, Reporting and Migration

- Audit Evidence Centre has been implemented for Home Office, DVSA, Traffic Commissioner, disciplinary, insurance and employment-dispute evidence packs.
- CSV export packs now cover staff, sponsored workers, Right to Work, document expiry, fleet, PMI, defects, VOR, daily checks and training.
- Migration Center supports CSV-based imports for users, employees and vehicles to ease move-in from spreadsheets.
- Reports page exposes all export packs from the UI.

### Administration and Operations

- Settings page exposes production domain, database type, upload storage, alert sender and threshold configuration.
- Readiness and technical documentation exist under `docs/`.
- Automated tests and linting are available through `npm.cmd test` and `npm.cmd run lint`.

## Remaining Future Enhancements

The current application is ready for operational use, but these items remain good next-stage upgrades:

- Document upload storage should be moved from local disk to durable production object storage before multi-user live deployment.
- Email/SMS reminders should be connected to a production provider for automated expiry alerts.
- Role-by-role permissions can be made more granular at route/action level once real staff workflows are confirmed.
- Evidence packs can later be exported as zipped bundles or PDFs, not only CSV report evidence.
- Realtime multi-user updates can be added with WebSockets once the hosted environment is chosen.

## Readiness Summary

The app now covers the main design intent: people compliance, sponsored workers, fleet compliance, PMI, checks, defects, VOR, training, driver risk, audit evidence, reporting, migration and admin settings. The most important UX gaps from the design review were closed by adding management pages, visible navigation, instant search/filtering and exportable evidence packs.
