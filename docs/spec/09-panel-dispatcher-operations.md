# 09 — Dispatcher / Operations Panel

> **Purpose:** run the live operation — turn incoming bookings into allocated, routed, tracked jobs;
> watch shipments and drivers in real time; handle exceptions. The nerve centre between Client and Driver.
> **Primary users:** Dispatcher / Operations Manager. **Status overall:** 🔴 New.

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Operations Dashboard** | Today's load, on-time %, unallocated, exceptions, drivers on-shift | 🔴 |
| **Live Shipments** | Board/map of all in-flight shipments by status | 🔴 |
| **Live Drivers** | Map + list of drivers, location, status, capacity | 🔴 |
| **Fleet Overview** | Vehicles available/in-use/VOR (read from Fleet) | 🟡 |
| **Shipment Management** | Queue, detail, edit, prioritise | 🔴 |
| **Driver Allocation** | Assign shipments → driver+vehicle (board/drag) | 🔴 |
| **Route Planning** | Build/optimise multi-stop routes | 🔴 |
| **Fleet Tracking** | Live GPS, geofence, ETA | 🔴 |
| **Exception Management** | Delays, failed deliveries, breakdowns, damage | 🔴 |
| **Communication Centre** | Message drivers/customers, broadcast | 🔴 |
| **Operational Reporting** | KPI monitoring, SLA, productivity | 🔴 |

---

## 2. Key views

### 2.1 Operations dashboard
Live tiles: shipments today (booked/collected/out/delivered), **unallocated** count, **active
exceptions**, drivers on-shift vs. available, fleet availability, on-time % so far. Everything is a
drill-through to act.

### 2.2 Allocation board (the core)
A board/map to turn the **unallocated queue** into **jobs**:
- Left: unallocated shipments (priority, window, area).
- Right: drivers/vehicles with current load + capacity + location.
- **Assign** by drag or action → creates a **Job**, sets driver+vehicle, fires `allocated`, notifies
  the driver (`08`). Respects driver onboarding/availability (HR `06`) and vehicle status (Fleet `10`).

### 2.3 Route planning
Group a driver's stops into an ordered **route** (manual now; optimisation later), with windows,
distance, ETA; push to the driver's Route screen.

### 2.4 Live shipments & drivers (map)
Real-time map + list: shipment pins by status, driver pins by location/status, geofences for depots/
zones, ETAs. Theme-aware map tiles (`03`).

### 2.5 Exception management
Queue of exceptions (from drivers/customers/system): delay, failed delivery, damage, missing,
breakdown. Each has severity, owner, actions (reassign, reschedule, contact, escalate), resolution +
audit. Feeds Client tracking + Compliance incidents where relevant.

### 2.6 Communication centre
Message a driver, a customer, or broadcast (e.g. weather/route closure). Threaded; ties to shipment/job
context.

### 2.7 Operational reporting
On-time delivery %, first-time delivery %, exceptions by type, jobs/driver, utilisation, SLA breaches —
period + branch filters; export.

---

## 3. Data
`Shipment, Job, Route, Stop, Exception, Vehicle (read), Driver/Employee (read), Message, TrackingEvent`.
See `02`.

## 4. Workflows
Unallocated→allocate(job)→route→dispatch→track→deliver/exception→close. Reassign on exception.
Everything emits tracking events + audit.

## 5. Alerts (to dispatch)
New booking unallocated past threshold, SLA at risk, driver rejected/late, exception raised, vehicle
went VOR mid-shift, driver document blocking allocation.

## 6. Permissions
Dispatcher/Ops full; Fleet/Compliance read live ops; Executive read. Drivers/customers don't enter.
(`01`)

## 7. MVP vs later
- **MVP (P1):** queue + **manual allocation** to driver+vehicle, basic route (ordered stops), live
  status board, exception list, message-a-driver, on-time reporting.
- **Later:** live GPS map, route **optimisation**, automated allocation suggestions, geofencing,
  capacity/load planning, SLA automation.

## 8. Open questions
- **Telematics/GPS source** for live driver location (phone GPS vs. vehicle telematics) — MVP likely
  phone GPS from the driver app.
- Route optimisation in-house vs. a routing API — *(API later; manual MVP).*

*Next: [10 — Fleet Manager Panel](10-panel-fleet-manager.md)*
