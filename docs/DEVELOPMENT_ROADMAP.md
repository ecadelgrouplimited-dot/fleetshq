> **⚠️ SUPERSEDED FOR SCOPE (2026-06-19).** 256 Logistics is now a full logistics platform. The authoritative specification lives in [`docs/spec/`](spec/README.md). This document predates the platform vision and remains only as a **depth reference** for the compliance/HR/fleet-compliance domains.

# Development Roadmap — 256 Logistics Compliance Hub

---

## Overview

| Phase | Name | Goal | Timeline |
|-------|------|------|---------|
| Phase 1 | MVP Demo | Win the contract | Weeks 1–6 |
| Phase 2 | Full Platform | Production launch | Weeks 7–16 |
| Phase 3 | Mobile & Integrations | Scale and automate | Weeks 17–24 |

---

## Phase 1: MVP Demo (Weeks 1–6)

**Goal:** A working, data-backed demo that convinces the client to sign the contract. Every screen must work with real seeded data. No placeholder screens.

### Sprint 1 — Weeks 1–2: Foundation

**Backend:**
- [ ] Project scaffold: Express.js app, Prisma, PostgreSQL connection
- [ ] Environment config (dotenv, `.env.example`)
- [ ] Winston logger setup
- [ ] Authentication: `POST /auth/login`, JWT sign/verify, `authenticate` middleware
- [ ] RBAC middleware with permission matrix for all 6 roles
- [ ] Audit log middleware (writes to `audit_logs` on every POST/PUT/PATCH/DELETE)
- [ ] Prisma schema: users, employees, vehicles (core tables)
- [ ] Database migration and initial seed script (test data)
- [ ] Global error handler and validation middleware (Joi)
- [ ] Health check endpoint: `GET /health`

**Frontend (basic structure):**
- [ ] HTML/CSS layout with sidebar navigation (11 menu items per spec)
- [ ] Login page with JWT auth
- [ ] Dashboard shell (cards and alert feed placeholders)

**Deliverable:** Working login → dashboard shell with auth, no broken routes.

---

### Sprint 2 — Weeks 2–3: People & Compliance (Area 1 & 2)

**Backend:**
- [ ] Prisma schema: employees, sponsored_workers, employee_documents, sponsored_worker_changes
- [ ] `GET /employees`, `POST /employees`, `GET /employees/:id`, `PUT /employees/:id`
- [ ] `PATCH /employees/:id/status` (terminate, suspend, etc.)
- [ ] `GET /sponsored-workers`, `POST /sponsored-workers`, `PUT /sponsored-workers/:id`
- [ ] `POST /sponsored-workers/:id/changes` (change event log)
- [ ] Document upload: Multer config, `POST /employees/:id/documents`, `GET /documents/:id/download`
- [ ] Alert calculations: Right to Work, visa expiry (alert.service.js)
- [ ] `GET /sponsored-workers/audit-pack-status`

**Frontend:**
- [ ] Employee list page (table, search, filters by department/status)
- [ ] Employee profile page (all fields, document list with status badges)
- [ ] Document upload UI (drag and drop, file type validation)
- [ ] Sponsored worker sub-section on employee profile
- [ ] Change event log UI (add change, view history)
- [ ] Home Office Audit Pack status page (checklist view)

**Deliverable:** Full employee CRUD with document uploads and sponsored worker tracking working end-to-end.

---

### Sprint 3 — Weeks 3–4: Training & Safety (Area 3)

**Backend:**
- [ ] Prisma schema: training_records, policy_acknowledgements, toolbox_talks, toolbox_talk_assignments
- [ ] `GET /employees/:id/training`, `PUT /employees/:id/training/:trainingType`
- [ ] `GET /employees/:id/acknowledgements`, `POST /employees/:id/acknowledgements`
- [ ] `GET /toolbox-talks`, `POST /toolbox-talks`, `GET /toolbox-talks/:id`
- [ ] `POST /toolbox-talks/:id/sign`, `POST /toolbox-talks/:id/manager-signoff`
- [ ] Training alert calculations (incomplete induction, CPC expiry, unsigned policies)

**Frontend:**
- [ ] Training matrix page (table with colour-coded status per training type)
- [ ] Training record update modal (date, trainer, certificate upload)
- [ ] Policy acknowledgement signing page (policy text + signature pad)
- [ ] Toolbox talks list and detail page
- [ ] Toolbox talk signed/unsigned staff list (live during session)

**Deliverable:** Full training matrix, digital signing, and toolbox talk records working.

---

### Sprint 4 — Weeks 4–5: Fleet, Checks & Defects (Areas 4 & 5)

**Backend:**
- [ ] Prisma schema: vehicles, vehicle_documents, walk_around_checks, walk_around_check_items, defect_cases, defect_photos, vor_records
- [ ] `GET /vehicles`, `POST /vehicles`, `GET /vehicles/:id`, `PUT /vehicles/:id`
- [ ] `PATCH /vehicles/:id/status`
- [ ] `GET /vehicles/pmi-planner`
- [ ] `POST /vehicles/:id/documents`, `GET /vehicles/:id/documents`
- [ ] `POST /checks` (with auto-defect creation logic)
- [ ] `GET /checks`, `GET /checks/:id`, `GET /checks/missed`
- [ ] `GET /defects`, `POST /defects`, `GET /defects/:id`
- [ ] `PATCH /defects/:id/status` (state machine with validation)
- [ ] `POST /defects/:id/photos`, `POST /defects/:id/final-signoff`
- [ ] `GET /vor`, `POST /vor`, `PATCH /vor/:id/return`
- [ ] Fleet alert calculations (PMI, MOT, insurance, tacho calibration)

**Frontend:**
- [ ] Vehicle list page (table with status colour coding, expiry indicators)
- [ ] Vehicle profile page (all fields, document list, recent checks, open defects)
- [ ] PMI Planner page (tabular view: overdue / due soon / booked / completed)
- [ ] Daily check submission form (full 18-item checklist with defect reporting)
- [ ] Defect list page (filterable by status, severity, vehicle)
- [ ] Defect detail page (full case timeline, photo upload, sign-off controls)
- [ ] VOR management page (active VOR list, return to service workflow)

**Deliverable:** Complete vehicle register, daily checks, defect workflow, and VOR management working end-to-end.

---

### Sprint 5 — Weeks 5–6: Dashboard, Alerts & Demo Polish

**Backend:**
- [ ] `GET /dashboard/summary` (aggregates all counts and alerts)
- [ ] Compliance scoring engine (compliance.service.js)
- [ ] Daily cron job (dailyAlerts.job.js) — runs at 06:00 UTC
- [ ] `GET /alerts` with filters
- [ ] `PATCH /alerts/:id/resolve`
- [ ] `GET /drivers/risk-summary` (basic driver risk view)
- [ ] Core reports: `GET /reports/dvsa/fleet-list`, `GET /reports/home-office/audit-pack-status`
- [ ] Full demo seed script (prisma/seed.js) — all required demo data

**Frontend:**
- [ ] Dashboard fully wired with live data (all 5 cards + alert feed)
- [ ] Compliance score gauges/bars
- [ ] Alert feed with resolve buttons
- [ ] Driver risk summary table
- [ ] Reports list page (view in browser, no PDF yet)
- [ ] User management page (Director only)

**Demo Polish:**
- [ ] Responsive layout for laptop/desktop presentation
- [ ] Empty states with helpful guidance text (not blank pages)
- [ ] Loading skeletons on data tables
- [ ] Toast notifications for save/upload/sign-off actions
- [ ] Error messages are human-readable (not raw API errors)
- [ ] All navigation links work — no 404s during demo

**Deliverable:** Fully functional demo ready for client presentation.

---

## Phase 2: Full Platform (Weeks 7–16)

**Goal:** Production-ready system. Real client data onboarding. Full compliance for live use.

### Sprint 6–7 — Weeks 7–9: Module 4 Full Build (Driver Risk)

- [ ] Driver risk score calculation engine (automated weekly scoring)
- [ ] Driver debrief record full workflow (create → driver signs → close)
- [ ] Tachograph infringement logging (manual input)
- [ ] Driver risk dashboard with ranking and trend charts
- [ ] Driver compliance alert full suite
- [ ] Corrective training assignment from debrief

### Sprint 8–9 — Weeks 9–11: Module 5 Full Build (Audit Centre)

- [ ] Evidence folder management (7 folder types, document assignment)
- [ ] Home Office Audit Pack PDF export (Puppeteer-generated)
- [ ] DVSA Audit Pack PDF export
- [ ] Audit trail full view with entity filtering and export to CSV
- [ ] Management sign-off workflow with digital signature capture
- [ ] Evidence pack completeness notifications

### Sprint 10–11 — Weeks 11–13: Advanced Reporting

- [ ] Full Home Office reports suite (7 report types)
- [ ] Full DVSA reports suite (9 report types)
- [ ] Management reports with charts (compliance score history, driver risk ranking)
- [ ] All reports exportable to PDF and CSV
- [ ] Scheduled report emails (monthly compliance summary, weekly alert digest)
- [ ] Custom date range filters on all reports

### Sprint 12 — Weeks 13–14: Garage Portal

- [ ] Garage user account creation and management
- [ ] Garage login portal (separate branded view)
- [ ] Garage sees: assigned defects, PMI jobs, upload interface
- [ ] Garage uploads: repair evidence, PMI sheets, invoices, completion notes
- [ ] Transport Manager receives notification when garage uploads
- [ ] Garage activity log (every upload recorded in audit trail)

### Sprint 13 — Weeks 14–15: Production Hardening

- [ ] Rate limiting on all API endpoints
- [ ] Request input sanitisation (prevent XSS, SQL injection)
- [ ] HTTPS enforcement
- [ ] File upload virus scanning (ClamAV integration or cloud service)
- [ ] Token refresh mechanism (prevent forced re-login during long sessions)
- [ ] Account lockout after 5 failed login attempts
- [ ] Password reset flow (email link)
- [ ] Data backup strategy (automated daily PostgreSQL dumps to S3)
- [ ] Environment-specific configs (dev / staging / production)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Load testing (ensure dashboard loads under 500ms with 50+ users)

### Sprint 14 — Weeks 15–16: Data Onboarding

- [ ] CSV bulk import for employee records
- [ ] CSV bulk import for vehicle records
- [ ] Historical training record import
- [ ] Data validation and error reporting on import
- [ ] Onboarding checklist for new company setup
- [ ] Demo-to-production data migration tooling

---

## Phase 3: Mobile App & Integrations (Weeks 17–24)

**Goal:** Put compliance tools in the hands of drivers. Automate data collection.

### Mobile App for Drivers (Weeks 17–20)

- [ ] React Native app (iOS and Android)
- [ ] Driver login with biometric option
- [ ] Digital walk-around check form (native mobile form)
- [ ] Photo capture direct from camera for defect reporting
- [ ] Push notifications for training tasks and policy signings
- [ ] Signature pad (touch-optimised)
- [ ] Offline mode with sync when connectivity restored
- [ ] Toolbox talk signing from phone

### Tachograph Integration (Weeks 20–22)

- [ ] Import tachograph analysis files (TachoScan, Optac, Tachodisc formats)
- [ ] Parse driver infringement data from imported files
- [ ] Auto-populate driver risk scores from tacho data
- [ ] Tacho infringement history per driver
- [ ] Alert when repeat infringer threshold breached

### Payroll Integration (Weeks 22–24)

- [ ] Export salary and hours data to payroll format
- [ ] Sage Payroll / Xero compatibility
- [ ] Sponsored worker salary verification cross-check (actual vs CoS declared)

### AI Compliance Alerts (Weeks 23–24)

- [ ] Pattern detection: driver showing signs of fatigue-related infringements
- [ ] Predictive PMI: vehicle likely to have defect based on mileage and history
- [ ] Anomaly detection: sponsored worker hours diverging from contracted pattern

---

## Technology Decisions by Phase

| Decision | Phase 1 | Phase 2 | Phase 3 |
|----------|---------|---------|---------|
| File storage | Local disk | AWS S3 | AWS S3 |
| Frontend | Server-rendered (EJS) or React SPA | React SPA | React SPA + React Native |
| PDF generation | None | Puppeteer | Puppeteer |
| Notifications | Console log / basic email | Nodemailer (SMTP) | Nodemailer + Push notifications |
| Search | SQL LIKE queries | PostgreSQL full-text search | PostgreSQL FTS |
| Caching | None | Redis for dashboard summary | Redis |
| CI/CD | Manual deploy | GitHub Actions | GitHub Actions |
| Hosting | VPS (Hetzner / DigitalOcean) | VPS + S3 | VPS + S3 + CDN |

---

## Demo Day Checklist

Before the client demo, verify:

- [ ] All seed data loads correctly (`npm run seed`)
- [ ] Director login works: `director@256logisticsltd.com` / `Demo2024!`
- [ ] Transport Manager login works: `transport@256logisticsltd.com` / `Demo2024!`
- [ ] Driver login works: `driver1@256logisticsltd.com` / `Demo2024!`
- [ ] Dashboard shows populated cards (not zeros)
- [ ] At least 5 alerts visible on dashboard
- [ ] Compliance scores show realistic values (75–90% range)
- [ ] Vehicle FN16 EVK shows PMI due soon alert
- [ ] One vehicle is in VOR status (red)
- [ ] At least one open defect (serious)
- [ ] At least one sponsored worker with upcoming visa expiry
- [ ] Training matrix shows mixed complete/incomplete for a driver
- [ ] Daily check can be submitted successfully from Driver login
- [ ] Defect workflow can be progressed (reported → under review → signed off)
- [ ] Document upload works (PDF)
- [ ] All navigation items are accessible — no broken links
- [ ] No console errors in browser
- [ ] No 500 errors in server logs

---

## Effort Estimates

| Area | Backend Days | Frontend Days | Total |
|------|-------------|--------------|-------|
| Foundation & Auth | 3 | 2 | 5 days |
| People & Compliance | 5 | 5 | 10 days |
| Training & Safety | 4 | 4 | 8 days |
| Fleet & Checks | 6 | 6 | 12 days |
| Defects & VOR | 4 | 4 | 8 days |
| Dashboard & Alerts | 3 | 3 | 6 days |
| Demo Seed & Polish | 2 | 3 | 5 days |
| **MVP Total** | **27** | **27** | **~54 dev days** |
| Phase 2 additions | 30 | 25 | 55 days |
| Phase 3 additions | 25 | 30 | 55 days |
| **Full Platform** | **82** | **82** | **~164 dev days** |
