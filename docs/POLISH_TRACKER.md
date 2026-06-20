# Polish & Quality Tracker

> **Purpose:** Track every polish, UX improvement, and quality assurance item across the 256 Logistics
> platform — from pixel-level design to accessibility to security hygiene. Each item links to its
> panel, has a priority, and tracks status.
>
> **Spec audit completed:** 2026-06-20 · Phases 0–4 built · Phase 5 deferred.
> **Legend:** 🔴 critical · 🟡 important · 🟢 nice-to-have · ✅ done · 🔨 in progress · ⬜ planned

---

## Executive summary — spec vs. built

| Phase | Status | Gaps remaining (deferred to Phase 5+) |
|-------|--------|---------------------------------------|
| P0 — Foundations | ✅ Complete | — |
| P1 — Shipment spine | ✅ Complete | Payment gateway (D3 decision), refunds workflow |
| P2 — Fleet & Compliance | ✅ Complete | Garage portal (external login), telematics |
| P3 — People & Learning | ✅ Complete | Recruitment pipeline, payroll engine, performance appraisals |
| P4 — Money & Insight | ✅ Complete | BI drill-through, forecasting, strategic report PDFs |
| P5 — Advanced | ⬜ Deferred | Native driver app, live payments, routing optimisation, tacho/telematics |

---

## Section 1 — Security & CSP 🔴

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| S-01 | `scriptSrcAttr: 'unsafe-inline'` added to helmet to unblock all `onclick=` handlers | 🔴 | ✅ done 2026-06-20 | Consistent with existing `scriptSrc: 'unsafe-inline'` |
| S-02 | Users page: all `onclick=` → `addEventListener` IIFE | 🔴 | ✅ done 2026-06-20 | Was silently broken; `\n`-in-template-literal root cause fixed too |
| S-03 | **Sweep remaining pages for `onclick=` and migrate to `addEventListener`** | 🟡 | ⬜ planned | Files: `employees/show.ejs`, `employees/form.ejs`, `employees/edit.ejs`, `vehicles/show.ejs`, `vehicles/form.ejs`, `driver/jobs.ejs`, `checks/form.ejs`, `vor/index.ejs`, `defects/show.ejs`, `migration/index.ejs`, `dashboard/driver.ejs` |
| S-04 | Long-term: implement nonce-based CSP (remove `unsafe-inline` from both scriptSrc + scriptSrcAttr) | 🟢 | ⬜ planned | Requires nonce injected per-request via middleware + passed to all `<script>` tags |
| S-05 | Verify `updateMany` / `deleteMany` are tenant-scoped in Prisma middleware | 🔴 | ⬜ planned | Bulk operations are a common leak vector |
| S-06 | Add `User.tenantId` column so user accounts are tenant-isolated at DB level | 🟡 | ⬜ planned | Currently users are isolated by session context only |
| S-07 | HMAC-sign public shipment tracking references | 🟢 | ⬜ planned | Current UUIDs are hard to guess; HMAC adds defence in depth |
| S-08 | File/document storage keys: add tenant prefix, verify in serve endpoint | 🟡 | ⬜ planned | Keys are UUID-based now — not guessable but not cryptographically bound |

---

## Section 2 — Mobile & responsive 🟡

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| M-01 | Driver jobs page — full mobile first pass | 🔴 | ⬜ planned | Used on the road; POD modal + signature pad must work on phone |
| M-02 | Walk-around check form — mobile first (each item tap-to-toggle) | 🟡 | ⬜ planned | `toggleItem` uses onclick; items must be large hit targets (≥44px) |
| M-03 | Dispatch board — mobile view | 🟡 | ⬜ planned | Kanban columns need horizontal scroll or stacked layout on mobile |
| M-04 | Finance overview — stat-grid stacks cleanly on 375px | 🟡 | ⬜ planned | Grid collapses; `cat-bar` chart readable at small widths |
| M-05 | Executive BI — KPI grid on mobile | 🟡 | ⬜ planned | 3-column FINANCIAL/OPERATIONS/PEOPLE grids need to collapse |
| M-06 | LMS (course catalogue + assign form) — mobile | 🟡 | ⬜ planned | Multi-select checkboxes for employees need mobile-friendly layout |
| M-07 | HR overview — tables scroll correctly on mobile | 🟡 | ⬜ planned | Ensure `.table-wrap` is on all tables |
| M-08 | Client portal shipment detail timeline — reads on mobile | 🟡 | ⬜ planned | Timeline component → single column |
| M-09 | Invoice list — amount + action columns visible on 375px | 🟡 | ⬜ planned | May need to hide secondary columns |
| M-10 | All modal overlays close on outside-click (mobile UX) | 🟢 | ⬜ planned | Add `modal-overlay` click handler: if `e.target === overlay` → close |
| M-11 | Input zoom prevention — add `touch-action: manipulation` + font-size ≥16px on all form inputs | 🟡 | ⬜ planned | Safari zooms in on focus if font-size < 16px |

---

## Section 3 — Dark mode completeness 🟡

All new Phase 3–4 pages should be verified in both themes. Hard-coded colours are a bug.

| # | Page | Priority | Status | Notes |
|---|------|----------|--------|-------|
| D-01 | `/finance` — overview page | 🟡 | ⬜ check | VAT grid, cat-bar colours, `#f8fafc` in chart (hardcoded?) |
| D-02 | `/finance/expenses` — log form | 🟡 | ⬜ check | `background:#f8fafc` on readonly User field in reset modal → use token |
| D-03 | `/executive` — KPI board | 🟡 | ⬜ check | Watchlist alert `.alert-item` colours |
| D-04 | `/hr` — overview | 🟡 | ⬜ check | Quick-link grid hover states |
| D-05 | `/leave` — leave management | 🟡 | ⬜ check | Badge colours, approval form |
| D-06 | `/lms` — tabs, cards | 🟡 | ⬜ check | Tab active/inactive states |
| D-07 | `/my-learning` — cert chip | 🟡 | ⬜ check | `cert-chip` background |
| D-08 | All `<style>` blocks in EJS views — audit for hard-coded `#hex` colours | 🟡 | ⬜ planned | Global grep for `#[0-9a-f]{3,6}` inside `<style>` blocks in views |

---

## Section 4 — UX & polish, per page 🟡

### 4.1 Global / shell

| # | Item | Priority | Status |
|---|------|----------|--------|
| G-01 | Navigation active state: some pages don't highlight the correct sidebar link | 🟡 | ⬜ planned |
| G-02 | Empty states: every list page must have an illustrated empty state + helpful CTA | 🟡 | ⬜ audit needed |
| G-03 | Loading states: async action buttons should show spinner and disable during fetch | 🟡 | ⬜ planned |
| G-04 | Toast messages: confirm they appear for all POST/PUT/DELETE success paths | 🟡 | ⬜ audit needed |
| G-05 | Form validation: required field highlighting before submit (client-side) | 🟡 | ⬜ planned |
| G-06 | Pagination: all list pages that could grow large (employees, vehicles, shipments, invoices) need pagination or infinite scroll | 🔴 | ⬜ planned |
| G-07 | Search: live search works on users page; ensure all list pages have at least a filter | 🟡 | ⬜ audit needed |
| G-08 | `<title>` tags: all pages set a meaningful `<title>` (already done via layout `title` variable) | 🟢 | ✅ done |
| G-09 | Favicon: server returns 404 for `/favicon.ico` | 🟡 | ⬜ planned — add `/public/favicon.ico` |
| G-10 | Page-level error boundaries: 500 errors show a friendly error page, not a stack trace | 🔴 | ⬜ check — `src/views/error.ejs` exists; verify it's wired |
| G-11 | `\n` in EJS template literals: any `\n` inside a JS string literal inside a backtick body must be `\\n` | 🔴 | ⬜ sweep all views |
| G-12 | Panel switcher UI: verify it renders correctly for multi-role users and routes correctly | 🟡 | ⬜ check |

### 4.2 Dashboard (`/`)

| # | Item | Priority | Status |
|---|------|----------|--------|
| DA-01 | Chart.js charts: verify they pick up theme colours on dark mode toggle without page reload | 🟡 | ⬜ check |
| DA-02 | Compliance gauge animates on first view (in-viewport) | 🟡 | ⬜ check |
| DA-03 | KPI tiles: link each tile to the owning panel (drill-through) | 🟢 | ⬜ planned |

### 4.3 Employee management (`/employees`)

| # | Item | Priority | Status |
|---|------|----------|--------|
| EM-01 | Employee list: add column sort (name, status, start date) | 🟢 | ⬜ planned |
| EM-02 | Employee show: document upload modal uses `onclick=` (blocked by CSP until S-03 done) | 🔴 | ⬜ migrate onclick→addEventListener |
| EM-03 | Employee show: employment history timeline (spec 06 §2.1) | 🟡 | ⬜ planned |
| EM-04 | Employee form: client-side validation before `submitEmployee()` call | 🟡 | ⬜ planned |
| EM-05 | Employee show: link to leave requests, course enrolments, driver jobs (connected records) | 🟡 | ⬜ planned |

### 4.4 Vehicles & Fleet

| # | Item | Priority | Status |
|---|------|----------|--------|
| FL-01 | Vehicle show: document upload modal uses `onclick=` | 🔴 | ⬜ migrate |
| FL-02 | Fleet overview: `table-wrap` on all tables (mobile scroll) | 🟡 | ⬜ check |
| FL-03 | Fuel log: chart of fuel spend over time (30-day trend line) | 🟢 | ⬜ planned |
| FL-04 | PMI planner: due-date colour coding (red = overdue, amber = 30 days, green = ok) | 🟡 | ⬜ check |

### 4.5 Compliance & Safety

| # | Item | Priority | Status |
|---|------|----------|--------|
| CO-01 | Defect show: `signOff()` onclick= blocked | 🔴 | ⬜ migrate |
| CO-02 | VOR index: `returnVehicle()` / `confirmReturn()` onclick= blocked | 🔴 | ⬜ migrate |
| CO-03 | Walk-around check form: `clearSig()`, `setAll()`, `toggleItem()`, `submitCheck()` onclick= blocked | 🔴 | ⬜ migrate |
| CO-04 | Compliance overview: verify all alert-item colours work in dark mode | 🟡 | ⬜ check |

### 4.6 Driver panel

| # | Item | Priority | Status |
|---|------|----------|--------|
| DR-01 | Driver jobs: `openPod()` / `closePod()` onclick= blocked | 🔴 | ⬜ migrate |
| DR-02 | Driver dashboard: `signToolboxTalk()` onclick= blocked | 🔴 | ⬜ migrate |
| DR-03 | POD signature pad: works on touch (mobile) | 🔴 | ⬜ verify on mobile |
| DR-04 | Driver jobs: large, thumb-friendly action buttons (≥44px tap targets) | 🟡 | ⬜ check |
| DR-05 | Driver jobs: offline-resilient (shows last-known state if connectivity drops) | 🟢 | ⬜ future (Phase 5) |

### 4.7 HR, Leave & LMS

| # | Item | Priority | Status |
|---|------|----------|--------|
| HR-01 | HR overview: quick-link grid — verify icons render in dark mode | 🟡 | ⬜ check |
| HR-02 | Leave management: calendar view of team leave (who's off when) | 🟢 | ⬜ planned |
| HR-03 | Leave management: accrual balance display (days remaining) | 🟡 | ⬜ planned |
| LM-01 | LMS: course completion progress bar per enrolment | 🟡 | ⬜ planned |
| LM-02 | LMS: certificate download as PDF | 🟡 | ⬜ planned |
| LM-03 | LMS: course validity expiry reminder alert (email/in-app) | 🟡 | ⬜ planned |
| LM-04 | My Learning: mark-complete confirmation toast | 🟡 | ⬜ check |

### 4.8 Finance

| # | Item | Priority | Status |
|---|------|----------|--------|
| FI-01 | Finance overview: revenue chart (30-day bar chart) | 🟡 | ⬜ planned |
| FI-02 | Expense log: bulk delete / bulk categorise | 🟢 | ⬜ planned |
| FI-03 | Invoices: PDF generation + email to client | 🟡 | ⬜ planned (Phase 5) |
| FI-04 | Invoices: overdue badge + send overdue reminder | 🟡 | ⬜ planned |
| FI-05 | Finance overview: outstanding receivables click-through to invoice list filtered by unpaid | 🟢 | ⬜ planned |
| FI-06 | Expense form: VAT auto-calc (20% of amount) on tab from Amount field | 🟢 | ⬜ planned |

### 4.9 Executive BI

| # | Item | Priority | Status |
|---|------|----------|--------|
| EX-01 | Executive: Watchlist — link each alert to the relevant panel (drill-through) | 🟡 | ⬜ planned |
| EX-02 | Executive: compliance score gauge (reuse existing gauge from dashboard) | 🟡 | ⬜ planned |
| EX-03 | Executive: revenue sparkline (trend over 7/30 days) | 🟢 | ⬜ planned |
| EX-04 | Executive: period filter (MTD / QTD / YTD / custom) | 🟢 | ⬜ planned |

### 4.10 Public site

| # | Item | Priority | Status |
|---|------|----------|--------|
| PB-01 | Public site: favicon — served correctly (G-09 above) | 🟡 | ⬜ planned |
| PB-02 | Public site: OG/Twitter meta tags for social sharing | 🟢 | ⬜ planned |
| PB-03 | Public site: sitemap.xml | 🟢 | ⬜ planned |
| PB-04 | Contact form: rate-limit per IP (currently no limit) | 🟡 | ⬜ planned |
| PB-05 | Public tracking: `robots.txt` with `Disallow: /track` | 🟢 | ⬜ planned |

### 4.11 User Management (`/users`)

| # | Item | Priority | Status |
|---|------|----------|--------|
| US-01 | All onclick= removed; addEventListener IIFE wired | 🔴 | ✅ done 2026-06-20 |
| US-02 | `\n` in template literal CSV string fixed | 🔴 | ✅ done 2026-06-20 |
| US-03 | Password strength indicator on reset + create password fields | 🟢 | ⬜ planned |
| US-04 | Force-logout (revoke all sessions for a user) | 🟡 | ⬜ planned |
| US-05 | Access log view (last N login events per user) | 🟡 | ⬜ planned |

---

## Section 5 — Accessibility (WCAG AA) 🟡

| # | Item | Priority | Status |
|---|------|----------|--------|
| A-01 | Focus-visible rings: all interactive elements have `:focus-visible` outline | 🟡 | ⬜ audit |
| A-02 | Keyboard navigation: tab order makes sense on all forms and modals | 🟡 | ⬜ audit |
| A-03 | Modal: focus trap when modal is open; Escape key closes | 🟡 | ⬜ planned |
| A-04 | Tables: `<th scope="col">` on all data tables | 🟡 | ⬜ audit |
| A-05 | Images: all `<img>` have meaningful `alt` text (or `alt=""` for decorative) | 🟡 | ⬜ audit |
| A-06 | Colour contrast: all text/bg pairs pass AA in both themes | 🟡 | ⬜ audit with contrast checker |
| A-07 | Form errors: associate error messages with inputs via `aria-describedby` | 🟡 | ⬜ planned |
| A-08 | Status badges: don't rely on colour alone (add text label — already done) | 🟢 | ✅ done |
| A-09 | Touch targets ≥40px on Driver panel and mobile views | 🔴 | ⬜ planned |
| A-10 | `prefers-reduced-motion`: verify animation guards are in place | 🟡 | ⬜ audit |

---

## Section 6 — Performance 🟢

| # | Item | Priority | Status |
|---|------|----------|--------|
| P-01 | Database indexes: ensure all `WHERE tenantId = ?` queries have a covering index | 🟡 | ⬜ audit `@@index([tenantId])` in schema |
| P-02 | N+1 queries: audit `findMany` calls that loop and query — use `include` or batch | 🟡 | ⬜ audit |
| P-03 | Image optimisation: employee/vehicle photos served at display size, not original | 🟢 | ⬜ planned |
| P-04 | `chart.js` sourcemap fetch blocked by CSP `connect-src 'self'` (cosmetic console error) | 🟢 | ⬜ add `https://cdn.jsdelivr.net` to `connectSrc` or pin a non-sourcemap build |
| P-05 | Static asset caching headers (CSS/JS/images) | 🟡 | ⬜ check nginx config |
| P-06 | Large list pages (employees with 500+ records): add server-side pagination | 🔴 | ⬜ planned |

---

## Section 7 — Spec gaps (deferred features, not Phase 5)

These items are in the spec (Phases 0–4) but were scoped as "Later" in the MVP decisions:

| # | Spec section | Item | Effort |
|---|-------------|------|--------|
| SP-01 | 06 HR | Recruitment pipeline (kanban: vacancy → application → interview → hire) | L |
| SP-02 | 06 HR | Payroll support layer (salary records, driver earnings, pay run export) | M |
| SP-03 | 06 HR | Performance appraisals + driver ratings | M |
| SP-04 | 06 HR | Employee employment history timeline | S |
| SP-05 | 06 HR | Driver onboarding checklist (structured flow with RTW + document collection) | M |
| SP-06 | 07 Client | Multi-user client accounts (org + members) | M |
| SP-07 | 11 Finance | Refunds workflow | S |
| SP-08 | 11 Finance | Driver pay runs (aggregate earnings → export) | M |
| SP-09 | 11 Finance | Accounting export (Xero/QuickBooks/CSV) | M |
| SP-10 | 12 Compliance | Garage portal (external garage login, scoped fleet view) | M |
| SP-11 | 14 Executive | Strategic report PDFs (monthly/quarterly/annual) | M |
| SP-12 | 14 Executive | BI drill-through (profitability by route/customer) | L |
| SP-13 | 14 Executive | Risk register / heatmap | M |
| SP-14 | 14 Executive | Forecasting + capacity planning | L |
| SP-15 | 05 Super Admin | Roles & permissions matrix UI (view/edit the 01 matrix in-app) | M |
| SP-16 | 05 Super Admin | Branding per tenant (logo, accent, email header) | M |
| SP-17 | 03 Design | `prefers-color-scheme` default (system theme on first visit) | S |
| SP-18 | 03 Design | Compact density toggle for data-heavy ops screens | S |

---

## Section 8 — Production deployment checklist

Before promoting to multi-tenant production:

| # | Item | Status |
|---|------|--------|
| PR-01 | Multi-tenancy test guide completed (see `MULTI_TENANCY_TEST_GUIDE.md`) | ⬜ |
| PR-02 | All SC-01 → SC-21 tenant isolation scenarios pass | ⬜ |
| PR-03 | Rotate all secrets (DB password, JWT secret, CSRF secret, SMTP credentials) | ⬜ |
| PR-04 | VPS SSH: root login disabled, key-only auth restored after password phase | ⬜ |
| PR-05 | `prisma migrate deploy` run for `20260620113448_money_insight` migration | ⬜ |
| PR-06 | pm2 restart after deploy | ⬜ |
| PR-07 | Health check passes: `https://256logisticsltd.com/health` → `{ status: "ok", db: "ok" }` | ⬜ |
| PR-08 | Dark + light theme verified on production on every panel | ⬜ |
| PR-09 | Mobile smoke test: login → driver jobs → POD flow on a real phone | ⬜ |
| PR-10 | Backup schedule active (`pg_dump` cron + remote copy) | ⬜ |
| PR-11 | Error monitoring in place (pm2-logrotate + log review) | ⬜ |
| PR-12 | Rate limiting verified: 6 failed logins → account lockout | ⬜ |

---

## Changelog

| Date | Item | Done by |
|------|------|---------|
| 2026-06-20 | S-01: `scriptSrcAttr: 'unsafe-inline'` added to helmet CSP | Claude |
| 2026-06-20 | S-02 + US-01 + US-02: Users page onclick→addEventListener + `\n` template literal fix | Claude |
| 2026-06-20 | Document created — spec vs. built audit complete | Claude |
