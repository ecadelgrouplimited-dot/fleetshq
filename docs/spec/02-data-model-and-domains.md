# 02 — Data Model & Domains

> The entities behind the panels, grouped by domain, with relationships and a reuse map against the
> **existing Prisma schema**. This is a conceptual model to build the schema from — not the final
> migration. Existing models are marked 🟢; extend-needed 🟡; net-new 🔴.

---

## 1. Existing models (today's `prisma/schema.prisma`)

`User, Employee, SponsoredWorker, SponsoredWorkerChange, EmployeeDocument, TrainingRecord,
PolicyAcknowledgement, ToolboxTalk, ToolboxTalkAssignment, Vehicle, VehicleDocument, WalkAroundCheck,
WalkAroundCheckItem, DefectCase, DefectPhoto, VorRecord, AuditLog, Alert, ComplianceScore.`

These cover **People (partial), Fleet (partial), Compliance, Learning (partial)**. The platform adds
the **Shipments, Operations, Finance** domains and fills out **People, Fleet, Learning**.

---

## 2. Domain: Identity & Tenancy

> **MULTI-TENANT (decision D2, [DECISIONS.md](DECISIONS.md)).** `Tenant` is the top of the hierarchy.
> **Every domain table carries `tenantId`** and is scoped by it in a global query layer — no query may
> cross tenants except platform-admin tooling. Existing live rows back-fill into a **default tenant**.
> Hierarchy: `Tenant ─< Company/Branch ─< (Users, Vehicles, Shipments, Invoices, Courses, …)`.
> A simple operator = one Tenant with one Company.

| Entity | Status | Key fields | Relationships |
|--------|--------|-----------|----------------|
| **Tenant** | 🔴 | name, slug, plan/subscription, status (active/suspended/trial), branding defaults, created | has many Company, User; owns ALL domain data |
| **Company** | 🔴 | tenantId, name, legal name, O-licence number, registered address, branding (logo, colours), operating hours, timezone | belongs to Tenant; has many Branch, User |
| **Branch** | 🔴 | name, address, service areas, hours | belongs to Company; has Users, Vehicles, Shipments |
| **User** | 🟡 | email, passwordHash, **roles[]**, **branchIds[]**, status, lockout fields, theme preference | belongs to Company/Branch; may link to Employee/Driver/Client |
| **Role / Permission** | 🟡 | role enum (extended), permission grants | many-to-many User↔Role |
| **AuditLog** | 🟢 | actor, action, entity, entityId, before/after, ts | polymorphic |
| **SystemConfig** | 🔴 | API keys, notification settings, integration configs, payment-gateway, email/SMS provider | singleton per Company |
| **ServiceArea / Zone** | 🔴 | name, polygon/postcode set | used by pricing + dispatch |

---

## 3. Domain: Pricing & Services

| Entity | Status | Key fields |
|--------|--------|-----------|
| **ServiceType** | 🔴 | name (same-day, next-day, economy, pallet, courier), SLA, base rules |
| **RateCard** | 🔴 | service type, effective dates, currency |
| **ZonePricing** | 🔴 | origin zone, destination zone, price |
| **WeightPricing** | 🔴 | weight band, price/multiplier |
| **Surcharge** | 🔴 | fuel surcharge %, waiting time, congestion, oversize |
| **Promotion** | 🔴 | code, discount, validity, eligibility |

> The **pricing engine** turns (service type + zones + weight + surcharges + promo) → a **quote** with
> line items, reused at invoice time.

---

## 4. Domain: Shipments / Orders (the spine)

| Entity | Status | Key fields | Relationships |
|--------|--------|-----------|----------------|
| **Customer / ClientOrg** | 🔴 | name, billing address, account terms, members[] | has Users (client), Shipments, Invoices, Addresses |
| **Address** | 🔴 | label, contact, line1/2, city, postcode, geo | in Customer address book; pickup/dropoff on Shipment |
| **Quote** | 🔴 | customer, service type, origin, destination, weight/dims, price breakdown, status (draft/accepted/expired) | → Shipment when accepted |
| **Shipment / Order** | 🔴 | ref, customer, service type, pickup addr, delivery addr, parcels[], status, SLA/ETA, assigned job | has Parcels, TrackingEvents, Job, Invoice |
| **Parcel / Item** | 🔴 | description, weight, dims, barcode, value, fragile/hazmat flags | belongs to Shipment |
| **TrackingEvent** | 🔴 | shipment, type (booked, allocated, collected, in-transit, out-for-delivery, delivered, exception), ts, location, actor | belongs to Shipment |
| **ProofOfDelivery (POD)** | 🔴 | shipment, signature image, OTP verified, photo, recipient name, ts, geo | belongs to Shipment/Job |
| **ReturnBooking** | 🔴 | original shipment, reason, status | links Shipment |

---

## 5. Domain: Operations / Dispatch

| Entity | Status | Key fields | Relationships |
|--------|--------|-----------|----------------|
| **Job** | 🔴 | shipment(s), assigned driver, assigned vehicle, status (offered/accepted/rejected/en-route/done), planned route | links Shipment, Driver, Vehicle, Route |
| **Route / RoutePlan** | 🔴 | job/driver, ordered stops, distance, est time | has Stops |
| **Stop** | 🔴 | route, sequence, address, type (pickup/dropoff), window, status | belongs to Route |
| **Exception** | 🔴 | shipment/job, type (delay, damage, missing, breakdown, failed-delivery), severity, status, resolution | links Shipment/Job |
| **Message / Comm** | 🔴 | thread, sender, recipient(s), body, channel | comms centre |

---

## 6. Domain: Fleet

| Entity | Status | Key fields | Relationships |
|--------|--------|-----------|----------------|
| **Vehicle** | 🟢🟡 | reg, VIN, make/model, year, O-licence disc, MOT/road-tax/insurance/tacho-calibration expiry, PMI interval + last/next, mileage, status (Active/VOR/Sold/Hired/Awaiting Repair), capacity | assigned Driver; has Maintenance, Fuel, Checks, Defects |
| **VehicleDocument** | 🟢 | type, file, expiry | belongs to Vehicle |
| **MaintenanceRecord** | 🟡 | type (PMI/service/repair/brake-test/tacho-cal), date, provider, cost, sheets, outcome | belongs to Vehicle; may link Defect, Garage |
| **PmiSchedule** | 🟡 (in app logic) | vehicle, interval, next due, booked, status | derived/planned |
| **WalkAroundCheck** + **Items** | 🟢 | driver, vehicle, datetime, location, mileage, items[], nil-defect, photos, signature | belongs to Vehicle/Driver; may spawn Defect |
| **DefectCase** + **Photos** | 🟢 | vehicle, driver, category, severity, allow-continue, VOR decision, review, repair, invoice, sign-off | belongs to Vehicle |
| **VorRecord** | 🟢 | off-road date, reason, authoriser, garage, est/actual return, evidence, sign-off | belongs to Vehicle |
| **FuelLog** | 🔴 | vehicle, driver, date, litres, cost, odometer, fuel card, efficiency | belongs to Vehicle |
| **Asset** | 🔴 | trailers/equipment, tracking | optional |
| **Garage / Provider** | 🔴 | name, contact, assigned defects/PMIs | external user scope |

---

## 7. Domain: People (HR)

| Entity | Status | Key fields | Relationships |
|--------|--------|-----------|----------------|
| **Employee** | 🟢🟡 | full profile (name, DOB, address, contact, **emergency contact, next of kin**, job title, dept, start date, status, hours, salary, location, line manager, assigned vehicle) | links User, Documents, Training, Leave, Payroll |
| **EmployeeDocument** | 🟢 | contract, offer, JD, passport, RTW, licence, CPC, tacho card, proof of address, NI, payroll, disciplinary, appraisal, termination | belongs to Employee |
| **SponsoredWorker** + **Change** | 🟢 | CoS number, SOC code, sponsored title, CoS vs actual salary/hours, visa expiry, RTW + follow-up dates, absence, change records | belongs to Employee |
| **Vacancy / Application** | 🔴 | role, status, candidate, screening, interview, outcome | recruitment |
| **OnboardingTask** | 🔴 | employee/candidate, checklist (docs, ID, RTW, background), status | onboarding |
| **LeaveRequest** | 🔴 | employee, type (annual/sick/emergency), dates, status, approver | belongs to Employee |
| **PayrollRecord** | 🔴 | employee, period, base, overtime, bonuses, deductions, driver earnings link | belongs to Employee |
| **Appraisal / PerformanceReview** | 🔴 | employee, period, KPIs, rating, improvement plan | belongs to Employee |

---

## 8. Domain: Finance

| Entity | Status | Key fields | Relationships |
|--------|--------|-----------|----------------|
| **Invoice** | 🔴 | customer, shipment(s), line items, subtotal, VAT, total, status, due date | belongs to Customer; lines from pricing |
| **Payment** | 🔴 | invoice, amount, method, gateway ref, status, date | belongs to Invoice |
| **Refund** | 🔴 | payment, amount, reason, status | belongs to Payment |
| **DriverPayment** | 🔴 | driver, period, jobs/earnings, deductions, status | links Driver, Jobs |
| **Expense** | 🔴 | category, amount, supplier, date, vehicle?/branch? | accounting |
| **LedgerEntry / AccountingPeriod** | 🔴 | VAT, P&L, cash flow aggregates | reports |

---

## 9. Domain: Learning (LMS)

| Entity | Status | Key fields | Relationships |
|--------|--------|-----------|----------------|
| **Course** | 🟡 | title, category, modules, target roles, mandatory?, validity period | has Lessons, Assessments, Enrolments |
| **Lesson / Content** | 🔴 | course, type (video/doc/slide/text), body/media, order | belongs to Course |
| **Assessment / Quiz** | 🔴 | course, questions, pass mark | belongs to Course |
| **Enrolment / Progress** | 🟡 | user, course, status, progress %, score, completion date | links User↔Course |
| **Certificate** | 🔴 | user, course, issued, expiry, renewal | belongs to Enrolment |
| **TrainingRecord** | 🟢 | existing matrix records | maps to Enrolment/Certificate |
| **PolicyAcknowledgement** | 🟢 | user, policy, signed, ts | digital sign-off |
| **ToolboxTalk** + **Assignment** | 🟢 | topic, date, assigned, signed, sign-off | safety briefings |

> Existing `TrainingRecord/PolicyAcknowledgement/ToolboxTalk` are the **competence-evidence** layer; the
> LMS adds the **authoring + delivery + assessment** layer that produces them.

---

## 10. Domain: Compliance & Evidence

| Entity | Status | Key fields |
|--------|--------|-----------|
| **DriverRiskScore** | 🟡 | driver, weighted factors (infringements, missed checks, defects, accidents, speeding, points, late training, breaches), score, band |
| **DriverDebrief** | 🔴 | driver, issue, date, explanation, manager comments, corrective training, signature, follow-up |
| **Incident** | 🔴 | type, parties, vehicle, shipment, severity, investigation, evidence |
| **EvidenceFolder** | 🟡 | type (Home Office, DVSA, Traffic Commissioner, Insurance, Accident, Employment, Disciplinary), contents, completeness % |
| **SignOff** | 🟡 | record ref, role, signer, ts |
| **ComplianceScore** | 🟢 | people/fleet/driver/overall, computed |
| **AuditPack** | 🟡 | type (Home Office / DVSA), generated contents, status % |
| **Alert** | 🟢 | type, severity, entity, due, resolved — generalise to all domains |

---

## 11. Key relationships (the spine, simplified)

```
Customer ─< Shipment ─< Parcel
Shipment ─< TrackingEvent
Shipment ─1 Job >─ Driver(User/Employee)
Job ─1 Vehicle
Job ─< Stop (Route)
Shipment ─1 POD
Shipment ─< Invoice >─ Payment >─ Refund
Vehicle ─< Maintenance / Fuel / WalkAroundCheck / DefectCase / VorRecord
Driver  ─< WalkAroundCheck / DriverRiskScore / Enrolment / DriverPayment / Debrief
Employee ─1 User ; Employee ─< Document / Leave / Payroll / Appraisal ; Employee ─1 SponsoredWorker
Course ─< Lesson / Assessment ; Course ─< Enrolment >─ User ; Enrolment ─1 Certificate
Company ─< Branch ─< (Users, Vehicles, Shipments)
Everything → AuditLog ; Due-dates/thresholds → Alert ; Aggregates → ComplianceScore / KPIs
```

---

## 12. Build guidance

- **Migrate additively.** Keep existing tables; add new domains as new tables/migrations. Don't
  rename/repurpose live tables under load.
- **Introduce `Tenant` + `Company`/`Branch` first** (P0). Add `tenantId` to existing tables, back-fill
  every live row into a **default tenant**, then enforce tenant scoping in middleware/Prisma. Tenant
  isolation is a hard security boundary — add tests that prove one tenant cannot read another's data.
- **Driver identity:** a Driver is an `Employee` with a `User` login and driver-specific fields; jobs
  reference the user. Avoid a separate parallel "driver" table.
- **POD/media** reuse the existing private document pipeline.
- **Soft-delete + audit** on consequential entities (shipments, invoices, employee records).

*Next: [03 — Design System & Theming](03-design-system-and-theming.md)*
