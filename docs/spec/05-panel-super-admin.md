# 05 — Super Admin Panel

> **Purpose:** configure and govern the whole platform — the tenant, its users, its commercial rules,
> and its system integrations. The control room *behind* the operation.
> **Primary users:** Super Admin (Director may have read access). **Status overall:** 🟡 (User
> Management + Settings exist today; most config is 🔴 new).

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Dashboard** | Company / Revenue / Fleet overview, Active Shipments, Customer & Driver stats, Compliance & Training status, KPI monitoring | 🟡 |
| **User & Access** | Users (CRUD), Roles, Permissions, Access logs, Security policies | 🟡 |
| **Company Settings** | Company profile, Branches, Operating hours, Service areas, Time zones, Branding | 🔴 |
| **Pricing & Services** | Delivery rates, Zone pricing, Weight pricing, Fuel surcharges, Promotions, Service types | 🔴 |
| **System Configuration** | API settings, Notifications, Integrations, Payment gateways, Email, SMS | 🔴 |
| **Reports & Analytics** | Financial, Operational, Fleet, Compliance, LMS reports | 🟡 |

---

## 2. Key views

### 2.1 Admin dashboard
KPI tiles + charts pulling cross-domain: total revenue (period), active shipments now, fleet
availability (active/VOR), customers, drivers on-shift, compliance score, training completion, plus
system health (integrations up/down). Drill-through to the owning panel. (Reuse the existing dashboard
hero + gauge + KPI patterns.)

### 2.2 User & Access Management
- **Users:** list (search/filter by role/branch/status), create/edit/deactivate, assign **roles[]** +
  **branches[]**, reset password, force-logout. (Today's User Management + create-from-employee is the
  seed.)
- **Roles & Permissions:** view the role→permission matrix (`01`); toggle grants; create custom roles
  (later).
- **Access logs:** auth events, admin actions (from AuditLog) — searchable.
- **Security policies:** password policy, lockout thresholds, session length, 2FA toggle (later),
  IP allow-list (later). Several already exist as env/config; surface them here.

### 2.3 Company Settings
- **Company profile:** legal name, O-licence number, addresses, contacts, logo.
- **Branch management:** add/edit branches; assign users/vehicles to branches.
- **Operating hours / time zones / service areas:** drive dispatch windows + pricing zones.
- **Branding:** logo, accent colour, email/invoice header — themable per company.

### 2.4 Pricing & Services
The commercial rule engine consumed by quoting (`07`) and invoicing (`11`):
- **Service types** (same-day, next-day, economy, pallet, courier, returns…).
- **Delivery rates / zone pricing / weight pricing** matrices.
- **Fuel surcharges** (% or fixed), waiting/oversize surcharges.
- **Promotions** (codes, % / fixed, validity, eligibility).
- Versioned with effective dates; preview "what would this quote cost".

### 2.5 System Configuration
- **API settings** (keys, webhooks), **Notifications** (which events → email/SMS/in-app),
  **Integrations** (mapping, telematics, accounting export), **Payment gateways** (Stripe/etc keys,
  test/live), **Email service** (SMTP — already wired), **SMS service** (provider keys).
- Secrets stored securely (never in views); test buttons to validate each integration.

### 2.6 Reports & Analytics
Cross-domain report launcher (Financial, Operational, Fleet, Compliance, LMS) — links into each panel's
reports and the Executive BI (`14`). Export CSV/PDF.

---

## 3. Data
`Company, Branch, User(+roles+branches), Role/Permission, ServiceType, RateCard, ZonePricing,
WeightPricing, Surcharge, Promotion, ServiceArea/Zone, SystemConfig, AuditLog`. See `02`.

## 4. Workflows
- Onboard a new user → assign roles/branches → welcome email (notification service).
- Publish a pricing change → effective-dated → audit-logged → live for new quotes.
- Configure an integration → test → enable.

## 5. Alerts
Integration failures, security events (repeated lockouts, new admin), expiring API keys/certs, pricing
effective-date reminders.

## 6. Permissions
Super Admin full; Director/Executive read. No other role enters this panel. (`01`)

## 7. MVP vs later
- **MVP (P0):** Users + roles/branches, Company profile + branches, **Service types + basic rates**,
  Email/SMS config, Branding. (Pricing must exist for the shipment spine.)
- **Later:** custom roles, advanced security (2FA/IP), payment-gateway live, full integration suite,
  advanced analytics.

## 8. Open questions
- Single-tenant multi-branch vs. multi-tenant SaaS (see `00 §8`) — biggest driver of this panel's depth.
- Which payment gateway + accounting export for MVP?

*Next: [06 — HR Panel](06-panel-hr.md)*
