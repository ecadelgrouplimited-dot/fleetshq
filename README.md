# FLEET.HQ (formerly 256 Logistics)

> A full **UK logistics operations platform** — booking, dispatch, driver delivery, fleet, HR, finance,
> learning, and DVSA/Home-Office compliance in one role-based system, with a public marketing site and
> light/dark theming.

> **⚠️ Vision update (2026-06-19).** 256 Logistics has grown from a compliance hub into a complete
> logistics platform. **The authoritative specification now lives in [`docs/spec/`](docs/spec/README.md)** —
> start there. The earlier compliance-only docs remain as depth references for the compliance/HR/fleet
> domains but no longer define overall scope.

---

## What it is

256 Logistics runs a courier/haulage business end to end. The **shipment lifecycle** is the spine
(quote → book → allocate → pick up → deliver → invoice → settle), with fleet, people, finance, learning,
and compliance wrapped around it. See [`docs/spec/00-product-vision-and-architecture.md`](docs/spec/00-product-vision-and-architecture.md).

## The ten panels

| # | Panel | What it does |
|---|-------|--------------|
| 1 | [Super Admin](docs/spec/05-panel-super-admin.md) | Users, company/branches, pricing, integrations, config |
| 2 | [HR](docs/spec/06-panel-hr.md) | Employees, recruitment, onboarding (RTW), leave, payroll, performance |
| 3 | [Client Portal](docs/spec/07-panel-client-portal.md) | Booking, quotes, tracking, invoices, support |
| 4 | [Driver](docs/spec/08-panel-driver.md) | Jobs, routes, pickup, delivery/POD, incidents, earnings, e-learning |
| 5 | [Dispatcher / Operations](docs/spec/09-panel-dispatcher-operations.md) | Live ops, allocation, routing, exceptions, comms |
| 6 | [Fleet Manager](docs/spec/10-panel-fleet-manager.md) | Vehicles, maintenance, fuel, asset tracking |
| 7 | [Finance](docs/spec/11-panel-finance.md) | Revenue, invoicing, payments, accounting |
| 8 | [Compliance & Safety](docs/spec/12-panel-compliance-safety.md) | Driver/vehicle compliance, incidents, audit *(largely built)* |
| 9 | [LMS](docs/spec/13-panel-lms.md) | Courses, content, assessments, certification, analytics |
| 10 | [Executive / Director](docs/spec/14-panel-executive.md) | Cross-domain KPIs, strategic reports, BI, forecasting |

Plus the [public marketing site](docs/spec/04-public-site.md) (pre-login) and platform-wide
[light/dark theming](docs/spec/03-design-system-and-theming.md).

## Where the current app fits

The deployed app (`fleetshq.com`) is a **compliance hub MVP** — it becomes the **Compliance &
Safety** panel and seeds parts of HR, Fleet, and LMS. Roughly 40% of the platform has a head start;
~60% (the courier operations + finance + client-facing side) is net-new. See the
[phased roadmap](docs/spec/00-product-vision-and-architecture.md#6-phased-build-roadmap).

---

## Tech Stack

- **Runtime:** Node.js 20 · **Framework:** Express · **Views:** EJS (+ richer client islands where needed)
- **Database:** PostgreSQL 16 · **ORM:** Prisma
- **Auth:** JWT cookie sessions, per-account lockout, CSRF, CSP (hardened — see `docs/PRODUCTION_READINESS.md`)
- **Theming:** CSS custom properties + `data-theme` (light/dark across the whole app)
- **Files:** private document/media store behind auth · **Jobs:** node-cron · **Email/SMS:** Nodemailer + SMS provider · **Logging:** Winston

## Quick Start

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev          # http://localhost:3000
```

---

## Documentation

**Authoritative spec set → [`docs/spec/`](docs/spec/README.md)** (read in numbered order).

| Earlier doc | Status |
|-------------|--------|
| `docs/PRODUCTION_READINESS.md` | ✅ Current — live-app hardening/ops posture, carries forward |
| `docs/PROJECT_OVERVIEW.md`, `MODULES_SPECIFICATION.md`, `MVP_FEATURES.md`, `DATABASE_SCHEMA.md`, `API_SPECIFICATION.md`, `USER_ROLES_PERMISSIONS.md`, `DEVELOPMENT_ROADMAP.md`, `TECHNICAL_ARCHITECTURE.md`, `DESIGN_COVERAGE_ANALYSIS.md`, `READINESS_ANALYSIS.md` | ⚠️ Superseded for scope by `docs/spec/`; useful as compliance-domain depth |
| `docs/256 Logistics Compliance App Design.pdf` | Initial (compliance-only) vision — depth reference |
| `docs/UK Logistics Platform structure MVP.pdf` | Source of the current platform vision |

---

## Built & managed by

**ECADEL GROUP LIMITED** — [ecadelgroup.com](https://ecadelgroup.com). The soul architects behind
256 Logistics.
