# Build Progress Tracker

> Living status of the platform build. Updated as work lands. Phases per
> [00 §6](00-product-vision-and-architecture.md#6-phased-build-roadmap); decisions in
> [DECISIONS.md](DECISIONS.md). Legend: ✅ done · 🔨 in progress · ⏳ next · ⬜ planned.

**Now:** Phases 0–4 complete → next is Phase 5 (Advanced). **Decisions:** multi-tenant SaaS · invoice-only · P0 start.

---

## Phase 0 — Foundations ✅

| ID | Item | Status | Notes |
|----|------|--------|-------|
| P0.1 | **Light/dark theming** across the app (tokens, toggle, no-flash, persistence) | ✅ | Dark token set + shell/dashboard/table coverage; topbar sun/moon toggle; cookie+localStorage; theme-aware Chart text. *Follow-ups: per-chart grid colours; public pages get the toggle in P0.4.* |
| P0.2 | **Tenant foundation** (Tenant model, `tenantId` on tables, default-tenant back-fill, scoping middleware + isolation tests) | ✅ | Tenant/Company/Branch schema; default tenant back-fill; AsyncLocalStorage tenant context; Prisma query scoping; JWT tenant propagation; isolation test. |
| P0.3 | **Panel-scoped roles + nav shell + panel switcher** (extend role model to 10 panels) | ✅ | Extended role enum; `roles[]` + `branchIds[]`; centralized RBAC panel mapping; multi-role JWT/session auth; panel switcher; user role assignment UI; tests. |
| P0.4 | **Public marketing site** (home/about/mission/services/contact/footer + loading + theme toggle) | ✅ | Public home/services/about/contact/track routes; lead capture; loading screen; public theme toggle; footer; route tests. |
| P0.5 | **Super Admin** (platform tenant mgmt + per-tenant users/company/branches) | ✅ | `/super-admin` control room; platform tenant provisioning/status; company profile; branches; branch-aware users; service types/rates; system config; director read-only access. |

## Phase 1 — Shipment spine (MVP core) ✅
| ID | Item | Status | Notes |
|----|------|--------|-------|
| P1.1 | Shipment domain + pricing | ✅ | Customer/Shipment/Parcel/TrackingEvent/Job/ProofOfDelivery/Invoice models (additive migration, tenant-scoped); pricing engine (base + mileage + overweight + VAT). |
| P1.2 | Client portal | ✅ | `/portal` dashboard, `/book` with live AJAX quote, `/shipments` list + filters, `/shipments/:id` detail with timeline + price breakdown. |
| P1.3 | Dispatch | ✅ | `/dispatch` board — unallocated queue, allocate driver+vehicle (Job), in-motion view, status transitions. |
| P1.4 | Driver | ✅ | `/driver/jobs` — accept, collect, deliver with POD (recipient/signature/notes) modal; driver-scoped. |
| P1.5 | Invoicing + public tracking | ✅ | Generate invoice from delivered shipment (idempotent), `/invoices` list + mark-paid; public `/track` wired to real shipment references with live timeline. |

End-to-end verified (book → allocate → collect → in-transit → out-for-delivery → deliver/POD → invoice → public track). 46/46 tests pass.

## Phase 2 — Fleet & Compliance ✅
| ID | Item | Status | Notes |
|----|------|--------|-------|
| P2.1 | Fuel management | ✅ | `FuelLog` model (additive migration, tenant-scoped); `/fleet/fuel` log + list + month spend/litres/£-per-L. |
| P2.2 | Fleet Manager overview | ✅ | `/fleet/overview` panel home: active/VOR, open defects, fuel spend, and a 30-day MOT/PMI/insurance/road-tax/tacho due table. Fleet panel home. |
| P2.3 | Compliance & Safety overview | ✅ | `/compliance` panel home: People/Fleet/Driver/Overall scores, alert counts, defects/VOR/RTW-at-risk, visa watch + live alert feed. Compliance panel home. |
| P2.4 | Checks tied to driver jobs | ✅ | Driver job cards show today's walk-around-check status for the allocated vehicle + "Do check" link; `/checks/new?vehicle=` preselects the job's vehicle. |

The pre-existing compliance hub (vehicles, PMI, checks, defects, VOR, driver risk, audit, scoring) is re-housed under the Fleet + Compliance panels. 46/46 tests pass.

## Phase 3 — People & Learning ✅
| ID | Item | Status | Notes |
|----|------|--------|-------|
| P3.1 | Leave management | ✅ | `LeaveRequest` model (type/status/days/approver); self-service `/leave` request form; HR approval/rejection decision; role-gated (HR panel roles can see all + decide; any employee with linked record can self-serve). |
| P3.2 | HR overview dashboard | ✅ | `/hr` panel home: total/active headcount, leave pending, on-leave-today, training completions, overdue training, RTW/visa at-risk; pending leave approval table; overdue enrolments table; RTW watch list; quick-link grid. HR panel home updated (`/hr`). |
| P3.3 | LMS: courses, enrolment, certificates | ✅ | `Course` + `CourseEnrolment` models (8 seeded courses: Induction, H&S, Manual Handling, Road Safety, GDPR, Cybersecurity, Dangerous Goods, Customer Service); `/lms` admin — tabbed course catalogue (mandatory/optional, validity, enrolment count), assign multi-course to multi-employee (or assign-all), enrolment table with mark-complete; certificate generation (`CERT-YYYY-NNNN`) + expiry tracking; `/my-learning` learner self-service (to-complete list, open course, mark complete, cert display). LMS panel home updated (`/lms`). |

## Phase 4 — Money & Insight ✅
| ID | Item | Status | Notes |
|----|------|--------|-------|
| P4.1 | Expense tracking | ✅ | `Expense` model (9 categories: fuel/maintenance/wages/insurance/admin/rent/utilities/marketing/other; amount, VAT, supplier, date, notes; tenant-scoped, additive migration); `/finance/expenses` — log-expense form + date/category/amount filter + expense log table with totals. Finance panel home updated (`/finance`). |
| P4.2 | Finance overview dashboard | ✅ | `/finance` panel home: revenue (MTD/YTD), expenses (MTD/YTD), net P&L, outstanding receivables; unpaid-invoices table (mark-paid shortcut); expenses-by-category CSS bar chart; recent-expenses table; VAT summary (output VAT YTD). All figures live from DB. |
| P4.3 | Executive BI dashboard | ✅ | `/executive` panel home: 18-query Promise.all pulling cross-domain KPIs — Financial (revenue/expenses/P&L MTD+YTD, invoice count), Operations (shipments total/MTD/in-transit, fleet utilisation, compliance score, open defects), People (active employees, training completion %, pending leave, on-leave-today, RTW-at-risk); dynamic Watchlist alerts; quick-nav links to each domain. Executive panel home updated (`/executive`). |

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
- **2026-06-20** — ✅ **Phase 3 — People & Learning** shipped: leave management (`LeaveRequest` model, `/leave` self-service + HR approval queue); HR overview dashboard (`/hr` panel home — headcount, leave, training completions, RTW watch, overdue training, quick-link grid); full LMS (`Course` + `CourseEnrolment` models, 8 seeded courses, `/lms` admin with tabbed catalogue/assign/enrolments/new-course, multi-course multi-employee assignment, certificate generation CERT-YYYY-NNNN, `/my-learning` learner self-service). Nav wired (HR Overview, Leave, LMS links under People section). Panel homes updated (hr → `/hr`, lms → `/lms`).
- **2026-06-20** — ✅ **Phase 2 — fleet & compliance** shipped: fuel management (`FuelLog` model + `/fleet/fuel` logging & cost dashboard); Fleet Manager overview (`/fleet/overview` — availability, VOR, defects, fuel, 30-day compliance-date table); Compliance & Safety overview (`/compliance` — scores, alert counts, risk strip, visa watch, alert feed); daily vehicle checks tied to driver jobs (per-job check status + preselected check). Panel homes updated (fleet → overview, compliance → overview). 46/46 tests pass; verified live-style end-to-end.
- **2026-06-20** — ✅ **Phase 1 — shipment spine** shipped: new shipment domain (Customer, Shipment, Parcel, TrackingEvent, Job, ProofOfDelivery, Invoice — additive migration, tenant-scoped) + pricing engine; client portal (dashboard, book with live quote, shipment list + detail/timeline); dispatch board (allocate driver+vehicle, status board); driver flow (accept/collect/deliver + POD); invoicing (generate from delivered, mark paid); public `/track` wired to real shipments. Full lifecycle verified end-to-end; 46/46 tests pass.
- **2026-06-20** — ✨ **Polish pass.** Redesigned the public site to a premium standard (ambient cinematic field, operations-console hero with floating status chips, stats count-up, scroll-reveal, "how it works" flow, gold ECADEL credit band, richer footer) across all 5 pages in light + dark — verified both themes. Fixed Super Admin broken CSS variables (`--card-bg`/`--surface`/`--success-soft` → real theme tokens). Phase 0 complete; 42/42 tests pass.
- **2026-06-20** — ✅ **Phase 4 — Money & Insight** shipped: expense tracking (`Expense` model + `/finance/expenses` — log, filter, totals); finance overview dashboard (`/finance` — revenue/expenses/P&L MTD+YTD, outstanding receivables, unpaid-invoices quick-pay, expenses-by-category bar chart, VAT summary); executive BI dashboard (`/executive` — 18-query cross-domain KPI board covering Financial/Operations/People with live Watchlist alerts). Nav wired (Finance section: Finance Overview, Expenses, Invoices, Executive BI). Additive migration `20260620113448_money_insight` (ExpenseCategory enum + Expense table). Expense added to tenant-scoped models.
