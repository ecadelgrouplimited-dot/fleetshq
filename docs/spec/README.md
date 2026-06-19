# 256 Logistics Platform — Specification Set

> **Authoritative product specification.** This `docs/spec/` set defines the **current** vision of
> 256 Logistics: a full **UK logistics operations platform**. It supersedes the earlier
> compliance-only documents in `docs/` (see [Reconciliation](#reconciliation-with-earlier-docs)).

**Source of truth:** `docs/UK Logistics Platform structure MVP.pdf` (scope) + `docs/256 Logistics Compliance App Design.pdf` (depth for the compliance/HR/fleet-compliance domains).
**Domain already owned:** `256logisticsltd.com`. **Name stays "256 Logistics".**

---

## How to read this set

Documents are numbered by build/read order. Start at `00`. Each **panel** document follows the
same template so they are predictable to build from:

1. **Purpose & primary users** — what the panel is for, which roles live in it.
2. **Navigation & screens** — the left-nav items and the screens behind each.
3. **Key views & layout** — per screen: layout, components, what's on it.
4. **Data captured** — fields and records (feeds the data-model doc).
5. **Workflows** — the actions and state machines.
6. **Alerts & notifications** — what this panel raises.
7. **Reports & exports** — what it can produce.
8. **Permissions** — who can see/do what (cross-refs `01`).
9. **MVP vs. later** — what ships in phase 1 vs. deferred.
10. **Current status** — `Built` / `Partial` / `New` against today's codebase.

## Status legend

| Tag | Meaning |
|-----|---------|
| 🟢 **Built** | Exists in the current deployed app, reusable largely as-is. |
| 🟡 **Partial** | Some of it exists; needs extension to meet this spec. |
| 🔴 **New** | Does not exist yet; net-new build. |

---

## The documents

| # | Document | Scope |
|---|----------|-------|
| 00 | [Product Vision & Architecture](00-product-vision-and-architecture.md) | The whole platform: vision, the 10-panel map, domains, tech, phased roadmap |
| 01 | [Roles & Permissions](01-roles-and-permissions.md) | Every role, panel access, permission matrix |
| 02 | [Data Model & Domains](02-data-model-and-domains.md) | Entities across all domains, relationships, reuse of existing models |
| 03 | [Design System & Theming](03-design-system-and-theming.md) | Tokens, **light/dark theme**, components, public vs. app language |
| 04 | [Public Site / Landing](04-public-site.md) | Loading, hero, mission/vision, about, services, contact, footer |
| 05 | [Super Admin Panel](05-panel-super-admin.md) | Tenancy, users, company settings, pricing, system config, analytics |
| 06 | [HR Panel](06-panel-hr.md) | Employees, recruitment, onboarding, leave, payroll, training, performance |
| 07 | [Client Portal](07-panel-client-portal.md) | Booking, quotes, tracking, invoices, support |
| 08 | [Driver Panel](08-panel-driver.md) | Jobs, routes, pickup/delivery, POD, incidents, earnings, e-learning |
| 09 | [Dispatcher / Operations Panel](09-panel-dispatcher-operations.md) | Live ops, allocation, route planning, exceptions, comms |
| 10 | [Fleet Manager Panel](10-panel-fleet-manager.md) | Vehicles, maintenance, fuel, asset tracking, utilization |
| 11 | [Finance Panel](11-panel-finance.md) | Revenue/expense, invoicing, payments, accounting, reports |
| 12 | [Compliance & Safety Panel](12-panel-compliance-safety.md) | Driver/vehicle compliance, incidents, audit (the existing hub) |
| 13 | [LMS Panel](13-panel-lms.md) | Courses, content, assessments, certification, analytics |
| 14 | [Executive / Director Panel](14-panel-executive.md) | Cross-domain KPIs, strategic reports, BI, forecasting |

---

## Reconciliation with earlier docs

The earlier documents in `docs/` (`MODULES_SPECIFICATION.md`, `MVP_FEATURES.md`,
`PROJECT_OVERVIEW.md`, `DATABASE_SCHEMA.md`, `API_SPECIFICATION.md`, `USER_ROLES_PERMISSIONS.md`,
`DEVELOPMENT_ROADMAP.md`, `TECHNICAL_ARCHITECTURE.md`, `DESIGN_COVERAGE_ANALYSIS.md`,
`READINESS_ANALYSIS.md`) describe the **earlier, narrower compliance-hub vision**. They remain useful
as depth references for the compliance/HR/fleet-compliance domains, but **`docs/spec/` is now the
authoritative source for scope and structure.** Each superseded doc carries a banner pointing here.

`docs/PRODUCTION_READINESS.md` remains valid — it tracks the hardening/ops posture of the live app,
which carries forward into the platform.
