# 08 — Driver Panel

> **Purpose:** the driver's working app for the day — accept jobs, navigate, collect, deliver with
> proof, report incidents, do the vehicle check, see earnings, and complete e-learning. **Mobile-first**
> (used on the road).
> **Primary users:** Driver. **Status overall:** 🔴 New for delivery flow; 🟢 vehicle checks exist.

---

## 1. Navigation & screens (mobile-first)

| Section | Screens | Status |
|---------|---------|--------|
| **Dashboard** | Today's assigned jobs, route summary, earnings, notifications | 🔴 |
| **Job Management** | Accept/reject jobs, customer details, instructions | 🔴 |
| **Route Management** | Navigation, traffic, stop management, ordering | 🔴 |
| **Pickup** | Scan parcels, photos, notes, confirm collection | 🔴 |
| **Delivery** | Signature, **OTP**, proof of delivery (photo), notes | 🔴 |
| **Incident Reporting** | Damage, missing parcels, breakdowns, delays | 🔴 |
| **Vehicle Checks** | Daily walk-around check, raise defect | 🟢 |
| **Earnings** | Per-job earnings, period totals, statements | 🔴 |
| **E-Learning** | Assigned courses, take + sign, certificates | 🟡 (→ LMS `13`) |
| **Profile** | Own details, documents, licence/CPC/tacho status | 🟢🟡 |

---

## 2. Key views

### 2.1 Start-of-shift → Vehicle check (🟢, integrate)
On clock-on, the driver must complete the **daily walk-around check** for the assigned vehicle (the
existing checklist: tyres, lights, brakes, steering, mirrors, screen/wipers, horn, plates, bodywork,
fuel/AdBlue, warning lights, tacho, load security, leaks, coupling, fifth wheel, mudguards, reflectors).
Captures driver, reg, datetime, location, mileage, nil-defect or defects, photos, signature. **A
dangerous defect blocks job acceptance** until resolved/VOR. (Reuse existing WalkAroundCheck; gate
dispatch on it.)

### 2.2 Dashboard & jobs
List of today's **jobs** (allocated by Dispatcher `09`): pickup/delivery, time windows, customer +
instructions. **Accept/reject** (reject reasons feed exceptions). Map summary of the route.

### 2.3 Route & navigation
Ordered **stops**; open turn-by-turn (deep-link to maps or in-app), traffic-aware ETA, re-order on the
fly, mark stop arrived/complete.

### 2.4 Pickup
At pickup: **scan** parcels (barcode), photo the goods, notes, confirm collection → fires `collected`
tracking event.

### 2.5 Delivery + POD (the proof)
At delivery: capture **recipient name + signature** (signature pad) and/or **OTP** sent to the
recipient, plus a **photo** proof and notes → fires `delivered` event + writes **POD**. Failed delivery
→ reason + reschedule/return.

### 2.6 Incident reporting
Report **damage / missing parcel / breakdown / delay** with photos and notes → creates an **Exception**
(Dispatcher sees it) and, where relevant, links a vehicle **Defect** or **Incident** (Compliance).

### 2.7 Earnings
Per-job earnings, daily/weekly totals, statements (from DriverPayment in Finance `11`).

### 2.8 E-learning & profile
Assigned **courses** (induction, H&S, etc.) with take + digital sign-off (LMS `13`); profile shows own
documents and **licence/CPC/tacho expiry** status.

---

## 3. Data
`Job, Route, Stop, Shipment, Parcel, TrackingEvent, POD, Exception, WalkAroundCheck, DefectCase,
DriverPayment, Enrolment/Certificate, Employee(self)`. See `02`.

## 4. Workflows
Clock-on → vehicle check → accept jobs → navigate → pickup(scan) → deliver(POD) → close; incident at any
point → exception. Each step emits tracking events the Client + Dispatcher see live.

## 5. Alerts (to the driver)
New job assigned, job changed/cancelled, route update, document expiring (licence/CPC/tacho), course
due, missed check reminder, message from dispatch.

## 6. Permissions
Driver = **self only**: own jobs, route, earnings, profile, training, and the **currently assigned
vehicle's** check/defects. No other driver/customer data. (`01`)

## 7. MVP vs later
- **MVP (P1–P2):** jobs list + accept, pickup (scan/photo), delivery (signature/OTP/photo POD),
  incident report, vehicle check (have it), basic earnings, profile.
- **Later:** in-app turn-by-turn, live traffic, offline mode, native/PWA app, gamified performance.

## 8. Open questions
- **Native app vs. responsive web** for MVP (assumed responsive web first, native later, per `00`).
- OTP delivery channel (SMS/email) + provider (Super Admin config).
- Offline capture needed for poor-signal areas in MVP? *(Assume later.)*

*Next: [09 — Dispatcher / Operations Panel](09-panel-dispatcher-operations.md)*
