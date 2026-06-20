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
| S-03 | Sweep remaining pages for `onclick=` and migrate to `addEventListener` | 🟢 | ⬜ planned | Not broken (S-01 covers); files: `employees/show`, `vehicles/show`, `vor/index`, `defects/show` |
| S-04 | Long-term: nonce-based CSP (remove `unsafe-inline` from scriptSrc + scriptSrcAttr) | 🟢 | ⬜ planned | Requires per-request nonce middleware + all `<script>` tags |
| S-05 | Verify `updateMany` / `deleteMany` are tenant-scoped in Prisma middleware | 🔴 | ⬜ planned | Bulk operations are a common leak vector |
| S-06 | Add `User.tenantId` column so user accounts are tenant-isolated at DB level | 🟡 | ⬜ planned | Currently isolated by session context only |
| S-07 | HMAC-sign public shipment tracking references | 🟢 | ⬜ planned | UUIDs are hard to guess; HMAC adds defence in depth |
| S-08 | File/document storage keys: add tenant prefix, verify in serve endpoint | 🟡 | ⬜ planned | Keys are UUID-based now — not guessable but not cryptographically bound |

---

## Section 2 — Mobile & responsive 🟡

| # | Item | Priority | Status | Notes |
|---|------|----------|--------|-------|
| M-01 | Driver jobs page — full mobile first pass | 🔴 | ✅ done 2026-06-20 | POD modal + job-actions full-width; `job-top` flex col on ≤500px |
| M-02 | Walk-around check form — mobile first | 🟡 | ✅ done 2026-06-20 | Touch targets wired; `toggleItem` converted to addEventListener |
| M-03 | Dispatch board — mobile view | 🟡 | ⬜ planned | Kanban columns need horizontal scroll or stacked layout on mobile |
| M-04 | Finance overview — stat-grid stacks cleanly on 375px | 🟡 | ⬜ check | Grid collapses; `cat-bar` chart readable at small widths |
| M-05 | Executive BI — KPI grid on mobile | 🟡 | ⬜ check | 3-column grids need to collapse |
| M-06 | LMS — mobile | 🟡 | ⬜ check | Multi-select checkboxes for employees need mobile-friendly layout |
| M-07 | HR overview — tables scroll correctly on mobile | 🟡 | ⬜ check | Ensure `.table-wrap` is on all tables |
| M-08 | Client portal shipment detail timeline — reads on mobile | 🟡 | ⬜ planned | Timeline component → single column |
| M-09 | Invoice list — amount + action columns visible on 375px | 🟡 | ⬜ planned | May need to hide secondary columns |
| M-10 | All modal overlays close on outside-click (mobile UX) | 🟢 | ✅ done 2026-06-20 | Global backdrop-click handler added to `app.js` |
| M-11 | Input zoom prevention — font-size ≥16px on all form inputs | 🟡 | ✅ done 2026-06-21 | `form-control` base font-size set to 16px in app.css |

---

## Section 3 — Dark mode completeness 🟡

| # | Page | Priority | Status | Notes |
|---|------|----------|--------|-------|
| D-01 | `/finance` overview | 🟡 | ✅ done 2026-06-21 | `.vat-value.green` → `var(--success)`; card/chart backgrounds fixed |
| D-02 | `/finance/expenses` | 🟡 | ⬜ check | `background:#f8fafc` on readonly User field in reset modal |
| D-03 | `/executive` KPI board | 🟡 | ⬜ check | `.alert-item` background, watchlist colours |
| D-04 | `/hr` overview | 🟡 | ⬜ check | Quick-link grid hover states |
| D-05 | `/leave` management | 🟡 | ✅ done 2026-06-21 | Reject button border; approve/reject colours use CSS vars |
| D-06 | `/lms` tabs, cards | 🟡 | ⬜ check | Tab active/inactive states |
| D-07 | `/my-learning` cert chip | 🟡 | ⬜ check | `cert-chip` background |
| D-08 | Global hex-color sweep across all EJS views | 🟡 | ✅ done 2026-06-21 | 27 files swept; CSS vars for all status colours, card backgrounds, hover states |
| D-09 | Chart.js charts pick up dark mode on theme toggle (no page reload) | 🟡 | ✅ done 2026-06-21 | `themeChange` custom event fires; charts re-coloured in-place |
| D-10 | System `prefers-color-scheme` applied on first visit | 🟡 | ✅ done 2026-06-21 | Cookie set to `dark`/`light` on first load if no preference saved |

---

## Section 4 — UX & polish, per page 🟡

### 4.1 Global / shell

| # | Item | Priority | Status |
|---|------|----------|--------|
| G-01 | Navigation active state: sidebar highlights correct link | 🟡 | ✅ done 2026-06-21 |
| G-02 | Empty states: every list page has illustrated empty state + CTA | 🟡 | ⬜ audit needed |
| G-03 | Loading states: async action buttons show spinner + disable during fetch | 🟡 | ✅ done 2026-06-20 | `setButtonLoading()` + global `form[method="post"]` handler |
| G-04 | Toast messages: confirm they appear for all POST/PUT/DELETE success paths | 🟡 | ⬜ audit needed |
| G-05 | Form validation: required field highlighting before submit (client-side) | 🟡 | ✅ done 2026-06-21 | Global `:invalid` + submit-attempted class in `app.js` |
| G-06 | Pagination: list pages that grow large need pagination | 🔴 | ⬜ planned | employees, vehicles, shipments, invoices |
| G-07 | Search: live search on all list pages | 🟡 | ⬜ audit needed |
| G-08 | `<title>` tags: all pages set meaningful `<title>` | 🟢 | ✅ done |
| G-09 | Favicon | 🟡 | ✅ done 2026-06-20 | SVG favicon + `theme-color` meta |
| G-10 | Page-level error boundaries: 500 shows friendly page, not stack trace | 🔴 | ✅ done 2026-06-21 | `error.ejs` verified wired in `server.js`; stack trace hidden in prod |
| G-11 | `\n` in EJS template literals must be `\\n` — sweep all views | 🔴 | ✅ done 2026-06-21 | Grep confirms no raw `\n` inside JS strings in EJS backtick bodies |
| G-12 | Panel switcher UI: verify multi-role users route correctly | 🟡 | ⬜ check |

### 4.2 Dashboard (`/`)

| # | Item | Priority | Status |
|---|------|----------|--------|
| DA-01 | Chart.js charts: pick up theme colours on dark mode toggle without page reload | 🟡 | ✅ done 2026-06-21 |
| DA-02 | Compliance gauge animates on first view (in-viewport) | 🟡 | ⬜ check |
| DA-03 | KPI tiles: link each tile to the owning panel (drill-through) | 🟢 | ⬜ planned |

### 4.3 Employee management (`/employees`)

| # | Item | Priority | Status |
|---|------|----------|--------|
| EM-01 | Employee list: add column sort (name, status, start date) | 🟢 | ⬜ planned |
| EM-02 | Employee show: document upload modal (onclick= → addEventListener) | 🔴 | ⬜ planned | onclick= works via S-01; migration is cleanup only |
| EM-03 | Employee show: employment history timeline | 🟡 | ⬜ planned |
| EM-04 | Employee form: client-side validation before submit | 🟡 | ✅ done 2026-06-21 | Global G-05 covers all forms |
| EM-05 | Employee show: link to leave requests, course enrolments, driver jobs | 🟡 | ⬜ planned |

### 4.4 Vehicles & Fleet

| # | Item | Priority | Status |
|---|------|----------|--------|
| FL-01 | Vehicle show: document upload modal onclick= → addEventListener | 🔴 | ⬜ planned | onclick= works via S-01; migration is cleanup |
| FL-02 | Fleet overview: `table-wrap` on all tables (mobile scroll) | 🟡 | ⬜ check |
| FL-03 | Fuel log: chart of fuel spend over time (30-day trend line) | 🟢 | ⬜ planned |
| FL-04 | PMI planner: due-date colour coding | 🟡 | ✅ done 2026-06-21 | `var(--danger)`, `var(--warning)`, `var(--warning-bg)` |

### 4.5 Compliance & Safety

| # | Item | Priority | Status |
|---|------|----------|--------|
| CO-01 | Defect show: `signOff()` onclick= | 🔴 | ⬜ planned | Works via S-01; migration is cleanup |
| CO-02 | VOR index: `returnVehicle()` / `confirmReturn()` onclick= | 🔴 | ⬜ planned | Works via S-01; migration is cleanup |
| CO-03 | Walk-around check form: all onclick= → addEventListener | 🔴 | ✅ done 2026-06-20 | `clearSigBtn`, `setAllOkBtn`, `submitCheckBtn` wired |
| CO-04 | Compliance overview: alert-item colours in dark mode | 🟡 | ✅ done 2026-06-21 | Sweep covered; `var(--card)`, `var(--surface-2)` |

### 4.6 Driver panel

| # | Item | Priority | Status |
|---|------|----------|--------|
| DR-01 | Driver jobs: `openPod()` / `closePod()` → addEventListener | 🔴 | ✅ done 2026-06-20 | IIFE wired; `body.modal-open`, focus trap, setButtonLoading |
| DR-02 | Driver dashboard: `signToolboxTalk()` onclick= | 🔴 | ✅ done 2026-06-21 | addEventListener IIFE; sign button loading state |
| DR-03 | POD signature pad: works on touch (mobile) | 🔴 | ⬜ verify on device | Canvas touch events present; needs real-device smoke test |
| DR-04 | Driver jobs: large, thumb-friendly action buttons (≥44px tap targets) | 🟡 | ✅ done 2026-06-20 | `@media (pointer: coarse)` min-height 44px globally |
| DR-05 | Driver jobs: offline-resilient | 🟢 | ⬜ future (Phase 5) |

### 4.7 HR, Leave & LMS

| # | Item | Priority | Status |
|---|------|----------|--------|
| HR-01 | HR overview: quick-link grid — verify icons render in dark mode | 🟡 | ⬜ check |
| HR-02 | Leave management: calendar view of team leave | 🟢 | ⬜ planned |
| HR-03 | Leave management: accrual balance display (days remaining) | 🟡 | ⬜ planned |
| LM-01 | LMS: course completion progress bar per enrolment | 🟡 | ⬜ planned |
| LM-02 | LMS: certificate download as PDF | 🟡 | ⬜ planned |
| LM-03 | LMS: course validity expiry reminder alert | 🟡 | ⬜ planned |
| LM-04 | My Learning: mark-complete confirmation toast | 🟡 | ⬜ check |

### 4.8 Finance

| # | Item | Priority | Status |
|---|------|----------|--------|
| FI-01 | Finance overview: revenue chart (30-day bar chart) | 🟡 | ✅ done 2026-06-21 | Bar chart wired; colours update on dark mode toggle |
| FI-02 | Expense log: bulk delete / bulk categorise | 🟢 | ⬜ planned |
| FI-03 | Invoices: PDF generation + email to client | 🟡 | ⬜ planned (Phase 5) |
| FI-04 | Invoices: overdue badge + send overdue reminder | 🟡 | ✅ done 2026-06-21 | Badge on list + show page; PATCH `/api/v1/invoices/:id/remind` |
| FI-05 | Finance overview: outstanding receivables click-through to unpaid invoice list | 🟢 | ✅ done 2026-06-21 | Receivables tile links to `/invoices?status=sent` |
| FI-06 | Expense form: VAT auto-calc (20% of amount) on tab from Amount field | 🟢 | ✅ done 2026-06-21 | `blur` on amount field fills VAT amount input |

### 4.9 Executive BI

| # | Item | Priority | Status |
|---|------|----------|--------|
| EX-01 | Executive: Watchlist — link each alert to the relevant panel | 🟡 | ✅ done 2026-06-21 | Alert rows are `<a>` links; href mapped per alert type |
| EX-02 | Executive: compliance score gauge (reuse existing gauge from dashboard) | 🟡 | ⬜ planned |
| EX-03 | Executive: revenue sparkline (trend over 7/30 days) | 🟢 | ⬜ planned |
| EX-04 | Executive: period filter (MTD / QTD / YTD / custom) | 🟢 | ⬜ planned |

### 4.10 Public site

| # | Item | Priority | Status |
|---|------|----------|--------|
| PB-01 | Public site: favicon served correctly | 🟡 | ✅ done 2026-06-20 | SVG favicon linked in main.ejs |
| PB-02 | Public site: OG/Twitter meta tags for social sharing | 🟢 | ⬜ planned |
| PB-03 | Public site: sitemap.xml | 🟢 | ⬜ planned |
| PB-04 | Contact form: rate-limit per IP | 🟡 | ✅ done 2026-06-21 | 5 req/min per IP on `POST /contact` |
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
| A-01 | Focus-visible rings: all interactive elements have `:focus-visible` outline | 🟡 | ✅ done 2026-06-20 | Global `:focus-visible` rule in app.css; mouse clicks no ring |
| A-02 | Keyboard navigation: tab order makes sense on all forms and modals | 🟡 | ⬜ audit |
| A-03 | Modal: focus trap when modal is open; Escape key closes | 🟡 | ✅ done 2026-06-20 | Global ESC + backdrop-click handler in `app.js`; first input focused on open |
| A-04 | Tables: `<th scope="col">` on all data tables | 🟡 | ⬜ audit |
| A-05 | Images: all `<img>` have meaningful `alt` text | 🟡 | ⬜ audit |
| A-06 | Colour contrast: all text/bg pairs pass AA in both themes | 🟡 | ⬜ audit with contrast checker |
| A-07 | Form errors: associate error messages with inputs via `aria-describedby` | 🟡 | ⬜ planned |
| A-08 | Status badges: don't rely on colour alone (add text label) | 🟢 | ✅ done |
| A-09 | Touch targets ≥44px on Driver panel and mobile views | 🔴 | ✅ done 2026-06-20 | `@media (pointer: coarse)` min-height 44px in app.css |
| A-10 | `prefers-reduced-motion`: verify animation guards are in place | 🟡 | ✅ done 2026-06-21 | `@media (prefers-reduced-motion: reduce)` disables CSS animations |

---

## Section 6 — Performance 🟢

| # | Item | Priority | Status |
|---|------|----------|--------|
| P-01 | Database indexes: ensure all `WHERE tenantId = ?` queries have a covering index | 🟡 | ⬜ audit |
| P-02 | N+1 queries: audit `findMany` calls that loop and query | 🟡 | ⬜ audit |
| P-03 | Image optimisation: photos served at display size | 🟢 | ⬜ planned |
| P-04 | `chart.js` sourcemap fetch CSP `connect-src` | 🟢 | ✅ done 2026-06-20 | `https://cdn.jsdelivr.net` added to `connectSrc` |
| P-05 | Static asset caching headers (CSS/JS/images) | 🟡 | ⬜ check nginx config |
| P-06 | Large list pages: server-side pagination | 🔴 | ⬜ planned |

---

## Section 7 — Spec gaps (deferred features, not Phase 5)

| # | Spec section | Item | Effort |
|---|-------------|------|--------|
| SP-01 | 06 HR | Recruitment pipeline | L |
| SP-02 | 06 HR | Payroll support layer | M |
| SP-03 | 06 HR | Performance appraisals + driver ratings | M |
| SP-04 | 06 HR | Employee employment history timeline | S |
| SP-05 | 06 HR | Driver onboarding checklist | M |
| SP-06 | 07 Client | Multi-user client accounts | M |
| SP-07 | 11 Finance | Refunds workflow | S |
| SP-08 | 11 Finance | Driver pay runs | M |
| SP-09 | 11 Finance | Accounting export (Xero/QuickBooks/CSV) | M |
| SP-10 | 12 Compliance | Garage portal | M |
| SP-11 | 14 Executive | Strategic report PDFs | M |
| SP-12 | 14 Executive | BI drill-through | L |
| SP-13 | 14 Executive | Risk register / heatmap | M |
| SP-14 | 14 Executive | Forecasting + capacity planning | L |
| SP-15 | 05 Super Admin | Roles & permissions matrix UI | M |
| SP-16 | 05 Super Admin | Branding per tenant | M |
| SP-17 | 03 Design | `prefers-color-scheme` default on first visit | S | ✅ done 2026-06-21 |
| SP-18 | 03 Design | Compact density toggle | S |

---

## Section 8 — Production deployment checklist

| # | Item | Status |
|---|------|--------|
| PR-01 | Multi-tenancy test guide completed | ⬜ |
| PR-02 | All SC-01 → SC-21 tenant isolation scenarios pass | ⬜ |
| PR-03 | Rotate all secrets (DB password, JWT secret, CSRF secret, SMTP) | ⬜ |
| PR-04 | VPS SSH: root login disabled, key-only auth restored | ⬜ |
| PR-05 | `prisma migrate deploy` run for `20260620113448_money_insight` | ⬜ |
| PR-06 | pm2 restart after deploy | ⬜ |
| PR-07 | Health check: `https://256logisticsltd.com/health` → `{ status: "ok", db: "ok" }` | ⬜ |
| PR-08 | Dark + light theme verified on production on every panel | ⬜ |
| PR-09 | Mobile smoke test: login → driver jobs → POD flow on a real phone | ⬜ |
| PR-10 | Backup schedule active (`pg_dump` cron + remote copy) | ⬜ |
| PR-11 | Error monitoring in place (pm2-logrotate + log review) | ⬜ |
| PR-12 | Rate limiting verified: 6 failed logins → account lockout | ⬜ |

---

## Changelog

| Date | Item | Done by |
|------|------|---------|
| 2026-06-21 | D-08/D-09/D-10: Full dark mode sweep (27 files); Chart.js theme toggle; prefers-color-scheme | Claude |
| 2026-06-21 | M-11: Input font-size 16px (prevent iOS zoom); A-10: prefers-reduced-motion guard | Claude |
| 2026-06-21 | G-01: Nav active state fix; G-05: Client-side required field validation | Claude |
| 2026-06-21 | G-10: Error boundary verified; G-11: `\n` sweep confirmed clean | Claude |
| 2026-06-21 | FI-01: Revenue chart; FI-04: Invoice overdue badge + remind; FI-05: receivables link; FI-06: VAT auto-calc | Claude |
| 2026-06-21 | DR-02: `signToolboxTalk` onclick→addEventListener; EX-01: Watchlist alert links | Claude |
| 2026-06-21 | PB-04: Contact form rate-limit; FL-04: PMI colour-coding | Claude |
| 2026-06-20 | S-01: `scriptSrcAttr: 'unsafe-inline'` added to helmet CSP | Claude |
| 2026-06-20 | S-02 + US-01 + US-02: Users page onclick→addEventListener + `\n` template literal fix | Claude |
| 2026-06-20 | G-09/PB-01: SVG favicon + theme-color meta | Claude |
| 2026-06-20 | P-04: Chart.js CDN added to CSP connectSrc | Claude |
| 2026-06-20 | G-03: `setButtonLoading()` + global form submit spinner | Claude |
| 2026-06-20 | A-01: Global :focus-visible ring; A-03: Modal ESC + backdrop-click; A-09: 44px touch targets | Claude |
| 2026-06-20 | M-10: Modal outside-click close (global handler in app.js) | Claude |
| 2026-06-20 | DR-01: POD modal onclick→addEventListener IIFE | Claude |
| 2026-06-20 | CO-03: Walk-around check form onclick→addEventListener | Claude |
| 2026-06-20 | Document created — spec vs. built audit complete | Claude |
