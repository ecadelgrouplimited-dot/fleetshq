# 00 — Product Vision & Architecture

> **Status of this document:** authoritative. Read this first. Everything else in `docs/spec/` expands a slice of it.

---

## 1. What 256 Logistics is now

**256 Logistics is a UK logistics operations platform** — one system that runs a courier/haulage
business end to end: customers book and track shipments, dispatchers allocate work, drivers run
pickups and deliveries, the fleet is maintained, staff are hired/trained/paid, the books are kept,
and the operator stays compliant with the DVSA, the Home Office, and the Traffic Commissioner.

It is **not** "a compliance app with extras." Compliance is one panel of ten. The platform's spine is
the **shipment lifecycle** (quote → book → allocate → pick up → deliver → invoice → settle), with
fleet, people, finance, learning, and compliance wrapped around it.

### Positioning statement

> 256 Logistics is an all-in-one operations platform for UK logistics operators — combining customer
> booking, dispatch, driver delivery, fleet maintenance, HR, finance, learning, and DVSA/Home-Office
> compliance in one role-based system, with a public marketing site and full light/dark theming.

### Why this exists (the job to be done)

A growing UK operator today stitches together: a booking/courier tool, a tracking tool, spreadsheets
for the fleet, BrightHR-style HR, a separate LMS, accounting software, and a folder of compliance
evidence. They don't reconcile. 256 Logistics replaces that stack with **one source of truth** where a
shipment, the driver who carried it, the vehicle it rode in, the training that driver holds, the
invoice it generated, and the compliance evidence it created are all the **same** connected records.

---

## 2. Scope — the platform map

A **public site** sits in front of authentication. Behind login, the app resolves the signed-in user
to one or more **role panels**. There are **ten panels**:

```
                          ┌──────────────────────────────────────────────┐
   PUBLIC SITE  ─────────▶│  Loading · Hero · Mission/Vision · About ·    │
   (pre-login)            │  Services · Contact · Footer   (light/dark)   │
                          └──────────────────────────────────────────────┘
                                         │  sign in
                                         ▼
   ┌───────────────────────────── ROLE PANELS (10) ─────────────────────────────┐
   │                                                                             │
   │  1 Super Admin      tenancy, users, company settings, pricing, system cfg   │
   │  2 HR               employees, recruitment, onboarding, leave, payroll,     │
   │                     training, performance                                   │
   │  3 Client Portal    booking, quotes, tracking, invoices, support           │
   │  4 Driver           jobs, routes, pickup, delivery/POD, incidents, earnings │
   │  5 Dispatcher/Ops   live shipments & drivers, allocation, routing, exceptions│
   │  6 Fleet Manager    vehicles, maintenance, fuel, asset tracking            │
   │  7 Finance          revenue, invoicing, payments, accounting               │
   │  8 Compliance&Safety driver+vehicle compliance, incidents, audit (existing) │
   │  9 LMS              courses, content, assessments, certification, analytics │
   │ 10 Executive/Director cross-domain KPIs, strategic reports, BI, forecasting │
   │                                                                             │
   └─────────────────────────────────────────────────────────────────────────────┘
```

Each panel has its own document (`05`–`14`). The public site is `04`.

### The shipment is the spine

Most panels are different lenses on the **same shipment lifecycle**:

```
 Client Portal     Dispatcher/Ops        Driver            Finance
 ───────────       ──────────────        ──────            ───────
 Quote      ─────▶ Accept & price
 Book       ─────▶ Allocate driver+vehicle ─▶ Accept job
                   Plan route             ─▶ Navigate
                                          ─▶ Pickup (scan/photo)
                   Track (live)  ◀─────────  Deliver (signature/OTP/POD)
                   Exceptions    ◀─────────  Incident report
 Track/POD  ◀────────────────────────────── Delivered
 Invoice    ◀───────────────────────────────────────────── Invoice & settle
```

Fleet Manager keeps the **vehicles** that move shipments roadworthy; HR + LMS keep the **drivers**
qualified; Compliance & Safety proves both to regulators; Super Admin configures the tenant; Executive
reads the whole board.

---

## 3. Domains (data + capability)

Eight domains underpin the ten panels. Panels are **views**; domains are **where the data and rules
live**. (Detailed in `02-data-model-and-domains.md`.)

| Domain | Owns | Primary panels |
|--------|------|----------------|
| **Identity & Tenancy** | users, roles, permissions, company/branch settings, branding, system config | Super Admin |
| **Shipments / Orders** | quotes, bookings, parcels, status, tracking events, POD | Client, Dispatcher, Driver |
| **Operations / Dispatch** | jobs, allocation, routes, stops, exceptions, comms | Dispatcher, Driver |
| **Fleet** | vehicles, maintenance, fuel, inspections, asset tracking | Fleet Manager, Compliance |
| **People (HR)** | employees, recruitment, onboarding, leave, payroll, performance | HR, Super Admin |
| **Finance** | invoices, payments, refunds, driver pay, accounting | Finance, Client |
| **Learning (LMS)** | courses, content, assessments, certificates | LMS, HR, Driver |
| **Compliance & Evidence** | driver/vehicle compliance, incidents, audit packs, sign-offs | Compliance, Executive |

Pricing & Services (rates, zones, weight, surcharges, service types) is configured in **Super Admin**
and consumed by **Shipments** (quoting) and **Finance** (invoicing).

---

## 4. What already exists (and how it folds in)

The current deployed app (`256logisticsltd.com`) is a **compliance hub MVP**. It is not thrown away —
it becomes the seed of several panels. Mapping today's modules onto the platform:

| Today (live app) | Folds into |
|------------------|------------|
| People & Compliance, Sponsored Workers | **HR panel** (employees, onboarding, RTW) + **Compliance** (sponsorship) |
| Training & Competency, Toolbox Talks, Policy acknowledgements | **LMS panel** + **Compliance** (driver competence) |
| Fleet & Roadworthiness, PMI Planner | **Fleet Manager panel** + **Compliance** (vehicle compliance) |
| Daily Checks, Defects & VOR | **Compliance & Safety panel** + **Driver panel** (vehicle checks) |
| Driver Risk | **Compliance & Safety panel** |
| Audit Evidence Centre, Reports | **Compliance panel** + **Executive/Reports** |
| Dashboard | **Executive/Director** + per-panel dashboards |
| User Management, Settings, Migration | **Super Admin panel** |
| Public landing, login, privacy (cinematic + ECADEL) | **Public site** (`04`) — keep and extend |

**Net-new** (no current code): Shipments/Orders, Client Portal, Dispatcher/Operations, Driver delivery
flow (pickup/POD/incidents), Finance/invoicing, Pricing engine, Fuel management, Recruitment, Leave,
Payroll, full LMS authoring/assessments.

> So roughly **40% of the platform's surface has a head start** in the existing build (people, fleet,
> compliance, training, audit, admin shell, public site); **~60% is net-new** (the entire courier
> operations + finance + client-facing side).

---

## 5. Technical architecture

Continue on the **proven, deployed stack** rather than restart — it already runs, is hardened, and the
team knows it. (Hardening posture: `docs/PRODUCTION_READINESS.md`.)

- **Runtime:** Node.js 20, **Express**.
- **Views:** server-rendered **EJS** for admin/staff panels (fast to build, SEO-fine for the public
  site). Heavy-interaction surfaces (live dispatch map, driver app) may layer in islands of richer
  client JS where needed; evaluate per-panel, don't rewrite the whole app into an SPA.
- **Data:** **PostgreSQL 16** via **Prisma**. Existing models (User, Employee, SponsoredWorker,
  Vehicle, WalkAroundCheck, DefectCase, VorRecord, TrainingRecord, ToolboxTalk, Alert, AuditLog,
  ComplianceScore…) are extended, not replaced. New domains add new models.
- **Auth:** existing JWT cookie sessions + per-account lockout + CSRF + CSP (already shipped). Extend
  the role model from a single role to **panel-scoped roles** (see `01`).
- **Theming:** **light/dark across the entire app** is a first-class requirement (`03`). Implement via
  CSS custom properties + a `data-theme` attribute and a persisted user preference.
- **Files:** private document storage behind auth (already in place for compliance docs); extend to
  shipment POD images, fuel receipts, etc.
- **Integrations (later phases):** payment gateways, email/SMS providers, mapping/navigation,
  telematics — all configured in **Super Admin → System Configuration**.
- **Driver experience:** the Driver panel must be **mobile-first** (used on the road). MVP = responsive
  web; a native/PWA wrapper is a later phase.

### Cross-cutting services (build once, reuse everywhere)

- **Notifications** (in-app + email + SMS) — one service, many triggers.
- **Audit log** — every consequential action (already exists; extend coverage).
- **Compliance & KPI scoring** — already exists for compliance; generalise for cross-domain KPIs.
- **Document/media store** — one upload/serve pipeline with access control.
- **Pricing engine** — rate cards → quote → invoice line items.
- **Reporting/export** — shared report + CSV/PDF export framework.

---

## 6. Phased build roadmap

Docs come first (this set). Then build in dependency order — **identity & shell → the shipment spine →
the surrounding domains → intelligence**. Each phase is shippable.

> Sequencing note: the **public site, light/dark theming, Super-Admin shell, and role model** are
> prerequisites for everything, so they lead. The **shipment lifecycle** is the product's core value,
> so it comes immediately after. Compliance/Fleet/HR already have a head start and slot in alongside.

| Phase | Theme | Delivers | Leans on existing? |
|-------|-------|----------|--------------------|
| **P0** | Foundations | Public site refresh, **light/dark theming**, panel-scoped roles & nav shell, Super Admin (users/company settings) | 🟡 extends shell + public site |
| **P1** | Shipment spine (MVP core) | Pricing/services config, Client booking + quotes, Dispatcher allocation + tracking, Driver job→pickup→delivery→POD, basic invoicing | 🔴 mostly new |
| **P2** | Fleet & Compliance | Fleet Manager (vehicles/maintenance/fuel), Compliance & Safety panel, daily vehicle checks tied to driver jobs | 🟢 large head start |
| **P3** | People & Learning | HR (employees/onboarding/leave/payroll/performance), LMS (courses/assessments/certs) | 🟡 training/HR head start |
| **P4** | Money & Insight | Finance (full accounting, driver pay, refunds), Executive/Director BI, cross-domain KPIs & forecasting | 🟡 scoring head start |
| **P5** | Advanced | Telematics, tacho integration, native driver app, payment-gateway live, advanced routing/optimisation | 🔴 new |

The earlier compliance doc's "MVP 5 core areas" (employee records, RTW/sponsor, training+signatures,
vehicle profiles+PMI, daily checks/defects/VOR) all live in **P2–P3** and are largely **🟢 Built**.

---

## 7. Non-negotiables / principles

1. **One source of truth.** A shipment, driver, vehicle, invoice, and evidence record are connected,
   never duplicated across tools.
2. **Role-scoped by default.** Users see their panel(s) and only the data their role allows (`01`).
3. **Light & dark everywhere.** Theming is a platform requirement, not a nicety (`03`).
4. **Public-first.** The marketing site renders before login and sells the platform (`04`).
5. **Audit everything consequential.** Who did what, when — across all domains.
6. **Compliance is evidence, not paperwork.** Every operational action that has regulatory weight
   produces reusable audit evidence automatically.
7. **Mobile-first where it's used on the move** (Driver panel; Client tracking).
8. **Build on what's live.** Extend the deployed stack; preserve the hardening already done.
9. **Crafted & managed by ECADEL GROUP** — the maker's signature stays across public surfaces.

---

## 8. Open decisions for the client (surface, don't assume)

These genuinely change the build and should be confirmed as specs are turned into work:

- **Single-tenant vs. multi-tenant.** Super Admin's "Company Settings / Branch Management" implies one
  operator with branches (single-tenant, multi-branch). If 256 intends to **sell this to other
  operators** (SaaS, multi-tenant), that changes data isolation, billing, and onboarding. *Assumption:
  single operator, multi-branch for MVP; multi-tenant as a later option.*
- **Payments scope for MVP** — take card payments live, or invoice-only at first?
- **Mapping/telematics providers** — which navigation + tracking vendors?
- **Driver app** — responsive web for MVP, native later? *Assumed yes.*

These are tracked in each relevant panel doc under "Open questions."

---

*Next: [01 — Roles & Permissions](01-roles-and-permissions.md)*
