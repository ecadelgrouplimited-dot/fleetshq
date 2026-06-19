# 14 — Executive / Director Panel

> **Purpose:** the whole business on one board — cross-domain KPIs, strategic reporting, business
> intelligence, risk, and forecasting. Read-mostly; the place the Director runs the company from.
> **Primary users:** Director / Executive (Super Admin read). **Status overall:** 🟡 — the existing
> compliance dashboard + scoring is the seed; cross-domain BI is 🔴.

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Executive Dashboard** | Revenue, Operations, Fleet, HR, Compliance KPIs in one view | 🟡 |
| **Strategic Reports** | Monthly / Quarterly / Annual | 🟡 |
| **Business Intelligence** | Profitability, route analysis, customer analysis | 🔴 |
| **Risk Management** | Cross-domain risk register + heatmap | 🟡 |
| **Forecasting & Growth** | Demand/revenue forecast, capacity, growth planning | 🔴 |

---

## 2. Key views

### 2.1 Executive dashboard
A single board pulling the headline KPI from each domain (drill-through to the owning panel):
- **Revenue:** period revenue, growth %, margin, outstanding (Finance `11`).
- **Operations:** shipments, on-time %, exceptions, utilisation (Dispatcher `09`).
- **Fleet:** availability, VOR, maintenance spend, MOT/PMI forecast (Fleet `10`).
- **HR:** headcount, attrition, training compliance %, absence (HR `06` / LMS `13`).
- **Compliance:** People/Fleet/Driver/Overall scores, audit-pack readiness, open risks (Compliance `12`).

Reuse the existing dashboard hero + gauges + KPI tiles; widen the data sources. Period + branch filters.

### 2.2 Strategic reports
Pre-built **monthly/quarterly/annual** packs combining the above into a board-ready report (PDF/print),
with period-over-period comparison and commentary fields.

### 2.3 Business intelligence
- **Profitability:** by service type, customer, route, vehicle, branch (revenue − allocated cost).
- **Route analysis:** cost/profit per route/lane, on-time by lane.
- **Customer analysis:** revenue concentration, retention, churn risk, lifetime value.

### 2.4 Risk management
Cross-domain **risk register/heatmap**: compliance risks (scores, expiries), operational risks (SLA,
exceptions), fleet risks (VOR, MOT cliff), people risks (driver risk, attrition), financial risks
(overdue, cash). Generalises the existing compliance risk monitoring to the whole business.

### 2.5 Forecasting & growth
Demand/revenue **forecast** from history + seasonality, capacity planning (drivers/vehicles vs.
projected load), growth scenarios. Starts simple (trendlines) and deepens later.

---

## 3. Data
Reads aggregates from all domains: `ComplianceScore, Invoice/Payment (Finance), Shipment/Job/Exception
(Ops), Vehicle/Maintenance/Fuel (Fleet), Employee/Leave/Enrolment (HR/LMS)`. A small set of
**materialised KPI/aggregate** tables or scheduled rollups powers this efficiently. See `02`.

## 4. Workflows
Mostly consumption: view → filter → drill → export → schedule a report. Set targets/thresholds that feed
alerts.

## 5. Alerts
KPI off-target (revenue, on-time %, compliance score, cash), risk threshold breached, forecast variance,
month/quarter-end report ready.

## 6. Permissions
Director/Executive read across all panels (+ targets/thresholds write); Super Admin read. No editing of
operational records here — it's an intelligence layer. (`01`)

## 7. MVP vs later
- **MVP (P4):** executive dashboard with whatever domains are live (compliance + ops + fleet first),
  monthly report, basic risk register.
- **Later:** full BI (profitability/route/customer), forecasting, scenario planning, scheduled
  board-pack delivery, anomaly detection.

## 8. Notes
This panel is only as rich as the domains feeding it — it grows as P1–P3 land. Build the **KPI/rollup
service** once (a generalisation of the existing ComplianceScore engine) so every domain plugs in.

---

*End of the panel set. Back to the [spec index](README.md) · or the [vision & architecture](00-product-vision-and-architecture.md).*
