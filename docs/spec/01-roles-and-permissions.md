# 01 — Roles & Permissions

> Defines who exists, which panel(s) they enter, and what they can see/do. Cross-referenced by every
> panel doc. Builds on the existing role model (`Director, Transport Manager, HR Manager, Operations
> Manager, Driver, Garage`) and **extends it to the platform's ten panels**.

---

## 1. Principles

1. **Panel = workspace.** A role grants entry to one **home panel** and a defined slice of data.
2. **Least privilege.** Default deny; grant explicitly per module action.
3. **A user may hold multiple roles** (e.g. an Operations Manager who also dispatches). The app shows a
   **panel switcher** when a user has more than one.
4. **Director/Executive sees across panels read-mostly**; Super Admin configures the system but is not
   the day-to-day operator.
5. **Customers and external garages are users too** — scoped to their own portal only.
6. **Every consequential action is audit-logged** with actor, target, timestamp.

---

## 2. Roles

| Role | Home panel | One-line definition |
|------|-----------|----------------------|
| **Super Admin** | Super Admin | Configures the tenant: users, company/branches, pricing, integrations. |
| **Director / Executive** | Executive | Owns the business; cross-domain KPIs + strategy, read-mostly. |
| **HR Manager** | HR | People lifecycle: hire, onboard, leave, payroll support, performance. |
| **Dispatcher / Operations Manager** | Dispatcher/Ops | Allocates shipments to drivers/vehicles, runs live ops. |
| **Fleet Manager** | Fleet Manager | Keeps vehicles roadworthy, maintained, fuelled, tracked. |
| **Finance Officer** | Finance | Invoicing, payments, refunds, driver pay, accounting. |
| **Compliance Officer / Transport Manager** | Compliance & Safety | Proves driver + vehicle compliance; owns audit packs. |
| **Trainer / LMS Admin** | LMS | Authors courses, assessments, certifications; monitors completion. |
| **Driver** | Driver | Runs jobs: pickup, deliver, POD, incidents, vehicle checks, e-learning. |
| **Client / Customer** | Client Portal | Books, tracks, pays, raises support. External user. |
| **Garage / Maintenance Provider** | (scoped Fleet view) | External: assigned defects, PMI uploads, repair evidence, invoices. |

> **Mapping from today's app:** `Director→Director/Executive`, `Transport Manager→Compliance Officer/
> Transport Manager` (+ Fleet), `HR Manager→HR Manager`, `Operations Manager→Dispatcher/Operations`,
> `Driver→Driver`, `Garage→Garage`. New roles: **Super Admin, Fleet Manager, Finance Officer,
> Trainer/LMS Admin, Client**.

---

## 3. Panel access matrix

`F` = full (manage), `R` = read/limited, `—` = no access, `S` = self/own records only,
`scoped` = only records assigned to them.

| Role ↓ \ Panel → | SuperAdmin | Exec | HR | Client | Driver | Dispatch | Fleet | Finance | Compliance | LMS |
|---|---|---|---|---|---|---|---|---|---|---|
| **Super Admin** | F | R | R | — | — | R | R | R | R | R |
| **Director/Executive** | R | F | R | — | — | R | R | R | R | R |
| **HR Manager** | — | — | F | — | — | — | — | R* | R | R |
| **Dispatcher/Ops** | — | — | — | — | — | F | R | — | R | — |
| **Fleet Manager** | — | — | — | — | — | R | F | R* | R | — |
| **Finance Officer** | — | R | R* | — | — | — | R* | F | — | — |
| **Compliance/Transport Mgr** | — | — | R | — | — | R | F | — | F | R |
| **Trainer/LMS Admin** | — | — | R | — | — | — | — | — | R | F |
| **Driver** | — | — | S | — | F(self) | — | — | S | S | S |
| **Client/Customer** | — | — | — | F(self) | — | — | — | S | — | — |
| **Garage/Maintenance** | — | — | — | — | — | — | scoped | scoped | scoped | — |

`*` limited to the cross-over they need (e.g. HR sees payroll inputs from Finance; Finance sees driver
earnings from Fleet/Ops; Fleet Manager sees their maintenance spend in Finance).

---

## 4. Module-action permissions (representative)

Per panel doc carries its own table; these are the load-bearing ones.

### Shipments / Orders
| Action | Client | Dispatcher | Driver | Finance | Exec |
|--------|--------|-----------|--------|---------|------|
| Create quote / booking | F (own) | F | — | — | — |
| Allocate driver+vehicle | — | F | — | — | — |
| Update shipment status | — | F | F (own jobs) | — | — |
| Capture POD | — | — | F (own jobs) | — | — |
| View tracking | F (own) | F | F (own) | R | R |
| Raise/handle exception | R (own) | F | F (own) | — | — |
| Invoice shipment | — | — | — | F | R |

### Fleet & Vehicle compliance
| Action | Fleet Mgr | Compliance | Driver | Garage |
|--------|-----------|-----------|--------|--------|
| Manage vehicle profile | F | R | — | — |
| Book/record PMI, MOT | F | R | — | upload (scoped) |
| Daily walk-around check | R | R | F (assigned vehicle) | — |
| Raise defect | R | R | F | — |
| VOR decision / return sign-off | R | F | — | evidence only |
| Fuel logs | F | — | F (own) | — |

### People & Learning
| Action | HR | Trainer | Driver | Compliance |
|--------|----|---------|--------|-----------|
| Manage employee record | F | — | S (view) | R |
| Recruitment / onboarding | F | — | — | R (RTW) |
| Approve leave | F | — | request (S) | — |
| Assign course | F | F | — | R |
| Take course / assessment | — | — | S | — |
| Issue/track certificate | F | F | S (view) | R |
| RTW / sponsor compliance | F | — | — | F |

### Finance
| Action | Finance | Client | Exec | Driver |
|--------|---------|--------|------|--------|
| Raise/adjust invoice | F | view (own) | R | — |
| Take/record payment | F | pay (own) | R | — |
| Refund | F | request (own) | R | — |
| Driver payments | F | — | R | view (own) |
| Accounting (VAT/P&L/cashflow) | F | — | R | — |

---

## 5. Special access rules

- **Driver self-scope:** a driver sees only their own jobs, earnings, profile, checks, training, and
  the **vehicle currently assigned** to them. Never another driver's data.
- **Client self-scope:** a client sees only their own bookings, shipments, invoices, addresses, and
  tickets. Multi-user client accounts (a company with several bookers) supported via a client-org with
  member users.
- **Garage scoped access:** an external garage logs in to a **stripped Fleet view** showing only
  defects/PMI **assigned to that garage**, with upload-only rights for evidence and invoices.
- **Branch scoping (multi-branch):** non-executive roles can be limited to one or more **branches**;
  Super Admin assigns branch membership. Executive/Super Admin see all branches.
- **Sign-off authority:** certain records require named **management sign-off** (Director, Transport
  Manager, HR Manager, Operations Manager, Fleet Manager) — carried over from the compliance design and
  generalised. Sign-offs are audit-logged and feed audit packs.

---

## 6. Implementation notes

- Extend the current single-`role` field to support **multiple roles per user** + optional **branch
  membership**. Keep the existing enum values; add the new roles.
- Centralise authorisation in middleware: `requirePanel(panel)`, `requireRole(...)`,
  `requireScope('own'|'branch'|'assigned')`. The existing `authorize()` / `requireRoles()` middleware
  is the seed.
- The nav shell renders only the panels a user may enter, plus a **panel switcher** for multi-role
  users (the existing sidebar is the basis).
- Permission checks happen server-side on every mutation; the UI hides what a role can't do but never
  relies on hiding for security.

---

## 7. Open questions

- Final **branch model**: are drivers/vehicles owned by a branch, or shared in a pool?
- Do **clients** get sub-accounts/roles (admin booker vs. viewer) in MVP, or later?
- Is **Transport Manager** distinct from **Fleet Manager**, or the same person wearing both panels?
  *(Assumption: distinct roles, often the same user holding both.)*

*Next: [02 — Data Model & Domains](02-data-model-and-domains.md)*
