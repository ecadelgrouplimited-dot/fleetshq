# Build Progress Tracker

> Living status of the platform build. Updated as work lands. Phases per
> [00 §6](00-product-vision-and-architecture.md#6-phased-build-roadmap); decisions in
> [DECISIONS.md](DECISIONS.md). Legend: ✅ done · 🔨 in progress · ⏳ next · ⬜ planned.

**Now:** Phase 0 — Foundations. **Decisions:** multi-tenant SaaS · invoice-only · P0 start.

---

## Phase 0 — Foundations 🔨

| ID | Item | Status | Notes |
|----|------|--------|-------|
| P0.1 | **Light/dark theming** across the app (tokens, toggle, no-flash, persistence) | ✅ | Dark token set + shell/dashboard/table coverage; topbar sun/moon toggle; cookie+localStorage; theme-aware Chart text. *Follow-ups: per-chart grid colours; public pages get the toggle in P0.4.* |
| P0.2 | **Tenant foundation** (Tenant model, `tenantId` on tables, default-tenant back-fill, scoping middleware + isolation tests) | 🔨 | Careful, additive migration on live DB — next |
| P0.3 | **Panel-scoped roles + nav shell + panel switcher** (extend role model to 10 panels) | ⬜ | |
| P0.4 | **Public marketing site** (home/about/mission/services/contact/footer + loading + theme toggle) | ⬜ | Extends existing `/welcome` |
| P0.5 | **Super Admin** (platform tenant mgmt + per-tenant users/company/branches) | ⬜ | |

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
