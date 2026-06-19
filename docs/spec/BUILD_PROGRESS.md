# Build Progress Tracker

> Living status of the platform build. Updated as work lands. Phases per
> [00 §6](00-product-vision-and-architecture.md#6-phased-build-roadmap); decisions in
> [DECISIONS.md](DECISIONS.md). Legend: ✅ done · 🔨 in progress · ⏳ next · ⬜ planned.

**Now:** Phase 0 complete → moving to Phase 1 (shipment spine). **Decisions:** multi-tenant SaaS · invoice-only · P0 start.

---

## Phase 0 — Foundations ✅

| ID | Item | Status | Notes |
|----|------|--------|-------|
| P0.1 | **Light/dark theming** across the app (tokens, toggle, no-flash, persistence) | ✅ | Dark token set + shell/dashboard/table coverage; topbar sun/moon toggle; cookie+localStorage; theme-aware Chart text. *Follow-ups: per-chart grid colours; public pages get the toggle in P0.4.* |
| P0.2 | **Tenant foundation** (Tenant model, `tenantId` on tables, default-tenant back-fill, scoping middleware + isolation tests) | ✅ | Tenant/Company/Branch schema; default tenant back-fill; AsyncLocalStorage tenant context; Prisma query scoping; JWT tenant propagation; isolation test. |
| P0.3 | **Panel-scoped roles + nav shell + panel switcher** (extend role model to 10 panels) | ✅ | Extended role enum; `roles[]` + `branchIds[]`; centralized RBAC panel mapping; multi-role JWT/session auth; panel switcher; user role assignment UI; tests. |
| P0.4 | **Public marketing site** (home/about/mission/services/contact/footer + loading + theme toggle) | ✅ | Public home/services/about/contact/track routes; lead capture; loading screen; public theme toggle; footer; route tests. |
| P0.5 | **Super Admin** (platform tenant mgmt + per-tenant users/company/branches) | ✅ | `/super-admin` control room; platform tenant provisioning/status; company profile; branches; branch-aware users; service types/rates; system config; director read-only access. |

## Phase 1 — Shipment spine (MVP core) ⬜
Pricing/services config · Client booking + quotes · Dispatcher allocation + tracking · Driver job→pickup→delivery→POD · basic invoicing (invoice-only).

## Phase 2 — Fleet & Compliance ⬜
Fleet Manager (vehicles/maintenance/fuel) · Compliance & Safety panel (re-house existing) · vehicle checks tied to driver jobs.

## Phase 3 — People & Learning ⬜
HR (employees/onboarding/leave/payroll/performance) · LMS (courses/assessments/certs).

## Phase 4 — Money & Insight ⬜
Finance (full) · Executive/Director BI · cross-domain KPIs & forecasting.

## Phase 5 — Advanced ⬜
Telematics · tacho integration · native driver app · live card payments · routing optimisation.

---

## Changelog
- **2026-06-19** — Spec set + decisions complete. P0 build kicked off.
- **2026-06-19** — ✅ **P0.1 light/dark theming** shipped: `data-theme` token system (light+dark), no-flash first paint, topbar sun/moon toggle, persisted preference (cookie+localStorage), theme-aware Chart.js text; dark coverage swept across the app shell, dashboard, and data tables. Verified both themes; 29/29 tests pass.
- **2026-06-19** — ✅ **P0.2 tenant foundation** shipped: `Tenant`/`Company`/`Branch`, `tenantId` on existing tables with default-tenant back-fill, request tenant context + Prisma scoping, tenant-aware JWTs, and isolation tests. Verified 30/30 tests pass.
- **2026-06-19** — ✅ **P0.3 panel-scoped roles + nav shell** shipped: 10-panel role enum, multi-role `roles[]`, branch membership placeholder, centralized RBAC/panel mapping, panel switcher, multi-role user management, and focused RBAC tests. Verified 32/32 tests pass.
- **2026-06-19** — ✅ **P0.4 public marketing site** shipped: expanded `/welcome` into public home/about/services/contact/track pages, added CSRF-protected lead capture with tenant-aware `PublicLead`, loading screen, public theme toggle, footer, and route coverage. Verified 39/39 tests pass.
- **2026-06-19** — ✅ **P0.5 Super Admin** shipped: added `ServiceType`/`SystemConfig`, `/super-admin` platform control room, tenant provisioning/status tools, company/branch management, branch-aware user assignment, service rate basics, system notification/tracking config, and read-only director access. Verified 42/42 tests pass.
- **2026-06-20** — ✨ **Polish pass.** Redesigned the public site to a premium standard (ambient cinematic field, operations-console hero with floating status chips, stats count-up, scroll-reveal, "how it works" flow, gold ECADEL credit band, richer footer) across all 5 pages in light + dark — verified both themes. Fixed Super Admin broken CSS variables (`--card-bg`/`--surface`/`--success-soft` → real theme tokens). Phase 0 complete; 42/42 tests pass.
