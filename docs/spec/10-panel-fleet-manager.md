# 10 — Fleet Manager Panel

> **Purpose:** keep the fleet roadworthy, maintained, fuelled, and well-utilised. The DVSA-facing
> operational half of fleet (the regulatory/evidence half lives in Compliance `12`).
> **Primary users:** Fleet Manager (Transport Manager + Garage scoped; Dispatcher/Finance read).
> **Status overall:** 🟢🟡 — strong head start (vehicle profiles, docs, PMI logic, defects, VOR exist);
> fuel + asset tracking + utilisation are 🔴.

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Vehicle Management** | Registration, profile, insurance, MOT, capacity, status | 🟢🟡 |
| **Maintenance Management** | Services, repairs, inspections (PMI), history | 🟡 |
| **PMI Planner** | Due / overdue / booked / completed, missing sheets | 🟢 |
| **Fuel Management** | Fuel logs, costs, efficiency | 🔴 |
| **Asset Tracking** | Trailers/equipment, utilisation | 🔴 |
| **Reports** | Fleet utilisation, maintenance spend, availability | 🟡 |

---

## 2. Key views

### 2.1 Vehicle profile (🟢, extend)
The existing full profile (reg, VIN, make/model, year, O-licence disc, MOT/road-tax/insurance/tacho-cal
expiry, PMI interval + last/next, mileage, assigned driver, status: Active/VOR/Sold/Hired/Awaiting
Repair) + **capacity** (weight/volume) for dispatch. Document vault for vehicle docs already exists.

### 2.2 Maintenance management (🟡, extend)
Record + track **PMI sheets, brake tests, MOT certs, service/repair invoices, tyre reports, tacho-cal
certs, safety inspection sheets, roadside inspections, prohibition notices, rectification evidence**.
Each record: type, date, **provider/garage**, cost, outcome, files. History per vehicle. Links to the
**Garage portal** (external upload, scoped) and to **Defects** (`12`).

### 2.3 PMI planner (🟢)
Already strong: next due, overdue, booked, completed, vehicles without a PMI date, missing inspection
sheets, missing brake tests. Keep; surface as a planner/calendar.

### 2.4 Fuel management (🔴)
Fuel logs (date, litres, cost, odometer, fuel card, driver), cost trends, **efficiency (mpg/£ per
mile)**, anomalies (possible fuel theft — ties to a toolbox-talk topic). Per-vehicle + fleet rollups.

### 2.5 Asset tracking (🔴)
Trailers, tail-lifts, equipment — register, assignment, inspection, **utilisation** (in-use vs. idle).

### 2.6 Reports
Fleet availability (active/VOR/maintenance), utilisation %, maintenance spend by vehicle/period, MOT/PMI
forecast, fuel efficiency — export.

---

## 3. Data
`Vehicle, VehicleDocument, MaintenanceRecord, PmiSchedule, FuelLog, Asset, Garage, DefectCase (ref),
VorRecord (ref)`. See `02`.

## 4. Workflows
Add vehicle→schedule PMI→book→complete(sheet)→evidence; assign garage→external upload→sign-off; log
fuel→efficiency; VOR/return (with Compliance). All audit-logged; expiries feed alerts.

## 5. Alerts
PMI due/overdue, MOT/insurance/road-tax/tacho-cal expiring, missing inspection sheet/brake test, vehicle
VOR, prohibition notice recorded, fuel anomaly, asset inspection due. (Vehicle expiry alerts largely
exist.)

## 6. Permissions
Fleet Manager full; Transport Manager/Compliance read+evidence; **Garage scoped** (assigned defects/PMI,
upload only); Dispatcher reads availability/capacity; Finance reads spend. (`01`)

## 7. MVP vs later
- **MVP (P2):** vehicle profiles + docs (have), PMI planner (have), maintenance records + garage upload,
  fuel logs, availability/capacity for dispatch.
- **Later:** asset tracking, telematics-fed mileage/diagnostics, predictive maintenance, automated PMI
  booking, fuel-card integration.

## 8. Open questions
- **Telematics integration** for live mileage/diagnostics — provider + phase.
- Is Fleet Manager separate from Transport Manager, or the same user across Fleet + Compliance panels?
  *(Often the same person; both panels available.)*

*Next: [11 — Finance Panel](11-panel-finance.md)*
