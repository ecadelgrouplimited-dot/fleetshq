# Dashboard Redesign — Findings & Planned Adjustments

> **Source of truth:** 11 client-supplied design mockups in `docs/New/` (WhatsApp images, 2026-06-22)
> plus the `Fleet.HQ` marketing infographic (out of scope for now — landing page deferred).
> **Scope of this pass:** dashboards only. Public/landing site is explicitly deferred.
> **Author:** Claude · **Date:** 2026-06-22 · **Status:** findings + plan (no code changes yet)

---

## 1. Executive summary

The client has reviewed the live platform and is happy with it overall, but wants the **dashboards to
feel richer and more visual**. Their words: *"we just text data, no much data, vehicles have no pictures."*

Decoded, that feedback is three things:

1. **Imagery is missing.** The mockups lean heavily on **vehicle photographs** (truck thumbnails in the
   fleet register, maintenance, and defect cards) and **driver avatars** (everywhere — risk tables,
   scorecards, holiday requests, task assignees). Our app currently has **neither** — vehicles have no
   image field at all, and people are shown as coloured initials.
2. **Density & "data-richness" is lower than the mockups.** The mockups pack each screen with a **KPI strip
   (6–9 cards) carrying trend deltas** (`↑ 5 vs yesterday`, `+12% vs last month`), **side rails** (Critical
   Alerts / Quick Actions / My Tasks), **mini-tables with avatars + sparklines + colour-coded status**, and
   **multiple charts per screen**. Several of our screens are comparatively sparse.
3. **The visual register is different.** The mockups are a **light, clean, enterprise-SaaS** look branded
   **"256 COMPLIANCE HUB"** with a shield logo. Our current dashboard leads with a **dark navy "command
   centre" hero gradient**. The bones are close; the styling and information architecture differ.

The important honest finding: **not all 11 mockups are restyles of what we have.** Roughly half map to
existing panels (restyle + enrich). The other half — **Incident Management, Workforce Planning & Holidays
(rota), Tachograph Analytics, AdBlue, Driver-Risk scorecards, Compliance Tasks** — are **net-new panels that
need new database models** before any UI can be real. This document separates the two clearly so we can give
the client a quick visible win (the main dashboard + fleet register) without pretending the deeper panels are
"just styling."

---

## 2. The mockup design language (decoded once, applied everywhere)

Every mockup shares one consistent system. Capturing it here so each screen doesn't re-litigate it.

| Element | Mockup pattern | Current app |
|---|---|---|
| **Shell** | Dark slate sidebar, **light** content canvas (`#f7f8fa`), white cards, soft shadows | Same shell, but dashboard body leads with a dark navy gradient hero |
| **Brand** | "256 **COMPLIANCE HUB**" + shield logo, blue/red accent | "256 Logistics" wordmark |
| **Top bar** | Page title + grey subtitle · global search · bell w/ count badge · help · **company switcher** · date/period picker | Title/subtitle + search present; no per-page date picker; switcher exists |
| **KPI strip** | 6–9 compact cards: tinted icon, **big number**, label, **trend delta vs prior period**, `View X →` link | 3–4 cards, icon + number + sub-line; **no trend deltas**, no per-card link footer |
| **Avatars** | Real circular **driver photos** in every people table/list | Coloured initials only |
| **Vehicle imagery** | **Truck thumbnail photo** on register rows + vehicle detail header + defect cards | None — no image field exists |
| **Tables** | Avatar/thumbnail cell · monospace reg · **colour-coded expiry dates** (red=expired, amber=soon, green=ok) · status pills · inline **sparkline trend** · row actions (view/⋯) | Tables are clean but text-only; no thumbnails, no inline sparklines |
| **Right rail** | Persistent **Critical Alerts** (counts), **Quick Actions** grid, **My Tasks** | Dashboard has an alerts column; most inner panels have no rail |
| **Charts** | Doughnut **gauges** w/ centre label, **distribution doughnuts**, **trend lines**, **sparklines** in cards | Gauge + radar + bars present on main dashboard; sparse elsewhere |
| **Workflow steppers** | Horizontal numbered **process steppers** (defect workflow, investigation, task workflow) | Not used |
| **Status semantics** | Consistent green/amber/red + blue/purple, always paired with a text label | Already consistent (good — keep) |

**Design tokens already in place that we reuse:** `--success/--warning/--danger`, `--card`, `--surface-2`,
`--border`, badge classes, `stat-card`/`stat-icon` colour variants, the doughnut-gauge helper
(`drawGauge`) on the dashboard, Chart.js v4. We are **not** starting from scratch — we extend the existing
design system.

---

## 3. Cross-cutting data-model gaps (the real blockers)

These are the foundations the look-and-feel depends on. Most are small migrations; two are large.

| # | Gap | Needed for | Effort | Notes |
|---|-----|-----------|--------|-------|
| **DM-1** | `Vehicle.imageUrl` (+ optional `thumbnailUrl`) | Fleet register, maintenance header, defect cards | **S** | Add column; upload via existing multer/S3 path used for documents; default silhouette when null |
| **DM-2** | `Employee.photoUrl` (avatar) | Every people table/list/scorecard | **S** | Add column; upload on employee form; initials fallback (keep current as fallback) |
| **DM-3** | Trend/delta values for KPI cards | Every KPI strip (`↑ 5 vs yesterday`) | **S–M** | Compute "prior period" counts in each route; no schema change, just queries |
| **DM-4** | `Trailer` model | Fleet register "Total Trailers", trailer MOT/compliance | **M** | New entity mirroring a subset of Vehicle; first-class in mockups |
| **DM-5** | `ComplianceTask` model (+ subtasks, evidence, assignee, due, status) | Compliance Tasks panel | **M** | Net-new panel; backs M6 |
| **DM-6** | `Incident` model (+ evidence, statements, investigation steps, claim value) | Incident Management panel | **L** | Net-new panel; backs M9; richest data model of the set |
| **DM-7** | Driver-risk models: `Infringement`, `Debrief`, `LicencePoints`, `DriverScore` | Driver Risk list + profile | **M–L** | `driver-risk.ejs` exists but is computed/placeholder; mockups need real records |
| **DM-8** | `AdBlueLog` (or extend `FuelLog` with adBlue fields) | Fuel & AdBlue panel | **S–M** | FuelLog exists; AdBlue is tracked separately in mockup |
| **DM-9** | Rota / `Shift` + `AgencyDriver` models | Workforce Planning & Holidays (rota planner) | **L** | `LeaveRequest` exists; rota grid + agency cover are net-new |
| **DM-10** | Tachograph models (`TachoRecord`, `TachoInfringement`) | Tachograph Analytics | **M** | Net-new; lower priority |

**Image storage note:** we already upload vehicle *documents* and defect *photos* through multer + the
existing storage service, so vehicle/driver imagery rides the same rails — no new infrastructure, just a
column + a form field + a sensible placeholder asset.

---

## 4. Per-dashboard findings (current → imagined)

Each mockup is graded **Restyle** (we have the screen + data, mostly CSS/markup), **Enrich** (we have the
screen but need new data/sections), or **New build** (needs a new data model first).

### M0 — Main Dashboard  · `dashboard/index.ejs`  · **Restyle + Enrich** 🟢 priority 1
*Mockup: `...10.34.45.jpeg`*

- **Now:** dark navy gradient hero with a gauge; 4 KPI cards (no deltas); Operations Pulse, Risk Mix
  doughnut, Compliance Matrix radar, Defect Pressure, Risk Hotspots, Live Alerts, Open Defects table.
- **Imagined:** light canvas; **row of 5 cards** — Overall Compliance gauge `86% ↑8% from last month` ·
  Drivers `45 / 3 actions` · Vehicles `32 / 5 actions` · **Trailers `18 / 2 actions`** · Compliance Alerts
  `12 open` (red). Then **"Compliance Overview"** = 8 icon tiles (MOT Due, PMI Due, Insurance Due, Road Tax
  Due, Driver Licence Due, CPC Due, Tacho Infringements, Training Due). Then **Compliance Trend** line (6
  months), **Top Risk Drivers** (avatars + infringement count + risk bar), **Upcoming Tasks**, and an
  **Alerts & Notifications** rail.
- **Adjustments:**
  1. Replace the dark hero with the **5-card top row** (gauge card + Drivers/Vehicles/Trailers/Alerts).
     Add trend deltas (DM-3). Trailers card needs DM-4 (or show "—" until trailers ship).
  2. Add the **8-tile "Compliance Overview"** grid — most counts already exist (MOT/PMI/insurance/road-tax
     from `Vehicle`, licence/CPC/training from `Employee`/`TrainingRecord`); Tacho Infringements needs DM-10
     (placeholder until then).
  3. Keep the existing **Compliance Trend** line (we have `ComplianceScore` history) and **Top Risk Drivers**
     (needs avatars DM-2; risk score DM-7 or interim heuristic).
  4. Convert "Upcoming Tasks" to read from `ComplianceTask` (DM-5) — until then, drive from existing alerts.
- **Verdict:** the single highest-value change. ~70% achievable now with restyle + DM-2/DM-3; trailers and
  tasks degrade gracefully.

### M1 — Fleet Register  · `vehicles/index.ejs` + `vehicles/show.ejs`  · **Restyle + Enrich** 🟢 priority 2
*Mockup: `...10.34.42 (1).jpeg`*

- **Now:** vehicle list with filters + paginated table; vehicle detail page with tabs.
- **Imagined:** **8-card KPI strip** (Total Vehicles, Total Trailers, MOT Due, Insurance Due, Road Tax Due,
  Tacho Cal Due, Open Defects, Maintenance Due); register table with **vehicle thumbnail**, monospace reg,
  type, depot, **colour-coded expiry columns**, open-defect count badge, status pill, row actions; right rail
  **Compliance Alerts** + **My Tasks**; selected-vehicle detail card with **truck photo**, VIN/O-licence/gross
  weight/assigned driver and a deep tab set (MOT, Insurance, Road Tax, Tacho, VSC, Plating, Defects,
  Maintenance, Documents, Audit Trail).
- **Adjustments:** add KPI strip (counts exist); add thumbnail column (DM-1); colour-code expiry dates
  (data exists — pure presentation); add the right rail; enrich the detail header with the truck photo.
  "Depot/Type/Trailers" need DM-4 + a `depot` field (check `Branch`).
- **Verdict:** strong restyle candidate; the photo (DM-1) is what the client most wants to see here.

### M2 — Maintenance & PMI  · `vehicles/pmi-planner.ejs`  · **Enrich** 🟡 priority 4
*Mockup: `...10.34.43.jpeg`*

- **Now:** PMI planner exists.
- **Imagined:** vehicle header w/ **truck photo** + MOT/PMI/Insurance mini-cards; **Maintenance Planner**
  (Week/Month/Timeline) with scheduled work; Upcoming Items; Open Defects; **Maintenance Spend** bar chart;
  Quick Actions; **Maintenance Certificates** row.
- **Adjustments:** photo (DM-1); spend chart (we have `Expense`/maintenance categories); planner timeline is
  the bigger lift (scheduling model). Certificates map to `VehicleDocument`.
- **Verdict:** partial now (photo + spend chart + certs), planner timeline later.

### M3 — Daily Checks & Defects  · `checks/index.ejs` + `defects/*`  · **Restyle + Enrich** 🟢 priority 3
*Mockup: `...10.34.46.jpeg`*

- **Now:** checks list, defects list/detail with photo upload (we DO have `DefectPhoto`).
- **Imagined:** **6 KPI cards** (Checked Today, Awaiting Check, Open Defects, Vehicles VOR, Defects w/ Photos,
  TM Reviews Pending); "Today's Vehicle Check Status" table w/ driver avatar + result pill; **Open Defects
  cards with vehicle thumbnail + defect photo count**; **Transport Manager Review** queue w/ "Review Now";
  **7-step Defect Workflow stepper**; **Recent Defect Photos gallery** (real images — we have these!); Nil
  Defect stats; Defect Categories list.
- **Adjustments:** KPI strip (counts exist); avatars (DM-2); vehicle thumbnails (DM-1); the **photo gallery
  is fully buildable now** (DefectPhoto exists) — quick visual win; add the workflow stepper (presentational).
- **Verdict:** lots achievable immediately because defect photos already exist; this is a good "pictures"
  win to show the client early.

### M4 — Driver Risk (list)  · `driver-risk.ejs`  · **New build (data)** 🟠 priority 6
*Mockup: `...10.34.44 (1).jpeg`*

- **Now:** a `driver-risk.ejs` view exists but is computed/heuristic — no real infringement/debrief records.
- **Imagined:** 6 KPI cards; risk table (avatar, **risk score circle**, level badge, infringements, points,
  accidents, last debrief); **Risk Score Distribution** doughnut; **Driver Scorecard Top 5**; infringements &
  debriefs lists; **Licence Points** bars; **Accident History** doughnut; risk trend line; insights.
- **Adjustments:** needs DM-7 (Infringement/Debrief/LicencePoints/DriverScore) + DM-2 avatars. Styling is
  straightforward once data exists.
- **Verdict:** restyle is cheap, but it's hollow without the data models — schedule the model work first.

### M5 — Driver Risk (profile)  · (new sub-view of driver-risk)  · **New build (data)** 🟠 priority 7
*Mockup: `...10.34.44.jpeg`*

- Individual driver scorecard: avatar, licence/CPC/DVLA, **performance gauge 72**, deep tabs (Infringements,
  Debriefs, Licence Points, Accidents, Performance, Improvement Plans, **Letters** w/ generated debrief
  letter PDF, Training, Audit Trail), performance trend, **Driver League Table**.
- **Adjustments:** depends entirely on DM-7; the **debrief-letter PDF** reuses our existing PDF tooling.
- **Verdict:** follows M4; biggest "wow" for an HR/compliance manager but data-heavy.

### M6 — Compliance Tasks  · (new)  · **New build (data)** 🟠 priority 5
*Mockup: `...10.34.45 (1).jpeg`*

- **Imagined:** 6 KPI cards; tasks table (title, category, priority, due, **assignee avatar**, status); **Task
  Status** doughnut; Tasks by Category; My Assigned Tasks; Critical Deadlines; **Task Details w/ subtasks +
  evidence upload**; Evidence thumbnails; **Task Workflow stepper**.
- **Adjustments:** needs DM-5 (`ComplianceTask` + subtasks + evidence). This is the connective tissue behind
  "Upcoming Tasks" on the main dashboard and "My Tasks" rails elsewhere — **building it unlocks several other
  screens**, so despite being new it's high-leverage (hence priority 5, ahead of driver-risk).
- **Verdict:** new build, but the best ROI of the "new" panels because so many rails reference tasks.

### M7 — Fuel & AdBlue  · `fleet/fuel.ejs`  · **Enrich** 🟡 priority 8
*Mockup: `...10.34.42.jpeg`*

- **Now:** fuel logging + 30-day spend chart + recent fill-ups (shipped recently).
- **Imagined:** 7 KPI cards inc. **AdBlue spend/used** + **Fuel Efficiency gauge**; Fleet Fuel Performance
  table w/ **per-vehicle MPG sparklines**; **Fuel Theft Detection** alerts; Driver Fuel/AdBlue performance;
  AdBlue doughnut; **Fuel Purchase Map** (UK map w/ pins); Fuel Cost Analytics; theft investigations.
- **Adjustments:** AdBlue (DM-8); MPG sparklines (compute from FuelLog); theft heuristics + map are larger.
- **Verdict:** we have the fuel base; AdBlue + theft detection + map are incremental.

### M8 — Finance & Business  · `finance/overview.ejs`  · **Enrich** 🟡 priority 9
*Mockup: `...10.34.43 (1).jpeg`*

- **Now:** revenue/expense/P&L cards, 30-day revenue chart, expenses-by-category, VAT, ledgers.
- **Imagined:** 7 KPI cards **each with a sparkline**; Revenue Overview (W/M/Y toggle); **Costs Breakdown
  doughnut**; Profitability Overview; **Cashflow Forecast** line; **Vehicle Profitability** + **Driver
  Profitability** tables; Expense Management grid; Purchase/Sales **Ledgers**; **Payroll Overview** doughnut.
- **Adjustments:** sparklines + costs doughnut + W/M/Y toggle are quick; per-vehicle/per-driver profitability
  needs cost allocation logic; payroll needs a payroll source (currently none).
- **Verdict:** good incremental enrichment of an already-solid screen.

### M9 — Incident Management  · (new)  · **New build (data)** 🔴 priority 10
*Mockup: `...10.34.41.jpeg`*

- **Imagined:** 8 KPI cards; incidents table w/ tabs (Accidents/Near Misses/Vehicle Damage/H&S/Claims);
  **incident detail** w/ key actions checklist; **Evidence Gallery** (photos); **Incident Timeline**;
  **Investigation Workflow** stepper; Open Investigations; **Claims Value** chart; **Driver/Witness
  Statements**; **Root Cause Analysis**; **Corrective Actions**.
- **Adjustments:** the largest new model (DM-6). High value for insurance/claims but a project in itself.
- **Verdict:** schedule as its own milestone; not part of the quick dashboard pass.

### M10 — Workforce Planning & Holidays  · `hr/overview.ejs` + `hr/leave.ejs`  · **New build (data)** 🔴 priority 11
*Mockup: `...10.34.41 (1).jpeg`*

- **Now:** leave management + HR overview exist.
- **Imagined:** 7 KPI cards (Available/Working/On Holiday/Sick/In Training/**Agency Drivers**/Shortage Risk);
  **Driver Rota Planner** (weekly Mon–Sun shift grid: Day/Night/Rest); Holiday Requests; **Holiday Balances**
  bars; Driver Availability; **Driver Hours Forecasting**; **Agency Drivers** w/ cost; Upcoming Events.
- **Adjustments:** holiday side is mostly present (`LeaveRequest`) and can be enriched now; the **rota planner
  + agency cover + hours forecasting** are net-new (DM-9) and substantial.
- **Verdict:** split — enrich holidays now, rota planner as a later milestone.

---

## 5. Planned adjustments — phased

The client asked for "a few adjustments, especially on the dashboard" and to "focus on dashboards first."
The plan front-loads **visible, low-risk wins** and defers the heavy new-model panels into clearly-labelled
milestones.

### Phase A — Foundations (unblocks the look the client wants)  · ~S/M  ✅ DONE 2026-06-22
- ✅ **DM-1** `Vehicle.imageStorageKey` + authenticated upload (`POST /fleet/:id/photo`) + serve
  (`GET /fleet/:id/photo`) + truck-silhouette placeholder. Upload control on the vehicle profile page.
- ✅ **DM-2** `Employee.photoStorageKey` + `POST`/`GET /employees/:id/photo` + initials fallback. Upload
  control on the employee profile page (HR/director only).
- ✅ **Shared helpers** in `src/utils/uiHelpers.js`, wired as view locals: `avatar()`, `vehicleThumb()`,
  `kpiDelta()` (with `invert` for down-is-good metrics), `expiryDate()`/`expiryClass()` (colour-coded),
  `sparkline()`. CSS in `app.css` (`.ui-avatar`, `.ui-vthumb`, `.ui-delta`, `.ui-date-*`, `.ui-spark`).
- ✅ **Demonstration wiring**: employees list now uses photo-aware avatars; fleet list now shows vehicle
  thumbnails. Verified end-to-end in the browser (upload → store → serve → display; RBAC + CSRF enforced).
- ⏳ **DM-3** trend deltas: helper (`kpiDelta`) is built; wiring the prior-period queries into each KPI
  route lands with the per-panel restyle in **Phase B** (where the KPI strips are actually rebuilt).

> Migration: `20260622092020_phase_a_entity_images` (two nullable columns — additive, backward-compatible).

### Phase B — Restyle the panels we already have  · ~M  (the "few adjustments" the client means)
Decisions confirmed 2026-06-22: **branding = "256 Compliance Hub" + shield**, **default theme = light**
(dark stays a toggle), **Trailers card hidden** until a Trailer model exists.

- ✅ **Global shell** DONE 2026-06-22: rebrand to "256 Compliance Hub"; light is now the default theme.
- ✅ **M0 Main dashboard** DONE 2026-06-22: light KPI row (gauge w/ month delta + Drivers/Vehicles/Alerts
  with real "needs attention" counts) + 8-tile Compliance Overview (MOT/PMI/Insurance/Road Tax/Tacho/CPC/
  RTW-Visa/Training, all from real data) + Compliance Trend line + Alerts feed + Operations Pulse + Open
  Defects. Trailers omitted per decision. Verified light+dark, deployed.
- ✅ **M1 Fleet register** DONE 2026-06-22: 8-card KPI strip (Total/VOR/MOT/Insurance/Road Tax/Tacho/PMI/
  Open Defects) + vehicle thumbnails (Phase A) + Road Tax & Tacho columns w/ colour-coded badges. Verified,
  deployed.
- ✅ **M3 Daily checks & defects** DONE 2026-06-22: 6-card KPI strip, 7-step defect-workflow stepper,
  open-defect cards w/ vehicle thumbnails + photo counts, **recent defect photo gallery** (served via the
  authenticated photo route), driver avatars + vehicle thumbnails in the check-status table. Role-aware.
- ✅ **M8 Finance** DONE 2026-06-22: 30-day sparklines on Revenue/Expenses/Net-P&L KPI cards + Costs
  Breakdown doughnut beside the category bars.
- ✅ **M7 Fuel** DONE 2026-06-22: Fuel Efficiency gauge (fleet-avg MPG vs 12 MPG benchmark) + Fleet Fuel
  Performance table (per-vehicle MPG from odometer deltas, cost/mile, MPG-trend sparklines, status band).
  AdBlue still deferred to DM-8.

**Phase B complete** (2026-06-22). Remaining mockups (M2 Maintenance enrich, M4/M5 Driver Risk, M6 Compliance
Tasks, M9 Incidents, M10 Rota) need new data models — they belong to Phases C–E.

### Phase C — High-leverage new model  · ~M
- **DM-5 Compliance Tasks (M6)**: build the model + panel. Unlocks "Upcoming Tasks"/"My Tasks" rails across
  the app — do this before driver-risk because more screens depend on it.

### Phase D — Driver Risk  · ~M/L
- **DM-7** infringement/debrief/points/score models → **M4 list** + **M5 profile** (incl. debrief-letter PDF).

### Phase E — Larger standalone milestones (scheduled separately, not "dashboard polish")
- **DM-4 Trailers** (then wire Trailer counts into M0/M1).
- **DM-8 AdBlue + theft + fuel map** (M7 completion).
- **DM-9 Rota planner + agency + hours forecast** (M10 completion).
- **DM-6 Incident Management** (M9) — its own project.
- **DM-10 Tachograph Analytics**.

---

## 6. What we can show the client fastest

If the goal is to answer *"it's just text, no pictures"* quickly, the highest-impact, lowest-risk sequence is:

1. **Vehicle photos (DM-1)** + **driver avatars (DM-2)** — directly addresses "vehicles have no pictures."
2. **Defect photo gallery (M3)** — we already store defect photos; surfacing them is almost free and looks
   immediately "data-rich."
3. **Main dashboard restyle (M0)** — the screen everyone opens first; the 5-card row + 8-tile grid + avatars
   reads as a different, denser product without new data models.
4. **Fleet register thumbnails + colour-coded expiry (M1)** — turns the most-used operational table visual.

That gives a convincing "before/after" in **Phase A + the M0/M1/M3 slices of Phase B** without touching the
heavy new-model work.

---

## 7. Open decisions for the client

1. **Branding:** adopt **"256 Compliance Hub" + shield logo** as shown, or keep "256 Logistics"? (Affects
   sidebar header + top bar across every screen.)
2. **Light vs dark hero:** the mockups drop our dark navy dashboard hero for a light KPI row. Confirm we move
   fully light (we keep dark *mode* as the toggle, but the default becomes the light mockup look).
3. **Vehicle/driver images:** who supplies them? Options: (a) upload per record, (b) a generic truck
   silhouette + initials until real photos are added. We'll ship (b) as the fallback regardless.
4. **Trailers:** are trailers a real entity the client manages (the mockups say 18 trailers), or should the
   Trailers card be hidden until that's confirmed?
5. **Scope confirmation:** are the **new panels** (Incident Mgmt, Rota Planner, Driver-Risk records,
   Tachograph) in scope for this engagement, or is "dashboards first" strictly the **restyle of existing
   screens** (Phases A–B)? This determines whether we schedule Phases C–E.

---

## 8. Effort summary

| Phase | Content | Rough effort | New DB models? |
|------|---------|-------------|----------------|
| A | Image fields, avatars, KPI deltas, shared partials | S–M | imageUrl/photoUrl columns only |
| B | Restyle M0, M1, M3, M7(partial), M8 | M | none |
| C | Compliance Tasks (M6) | M | yes (ComplianceTask) |
| D | Driver Risk list + profile (M4/M5) | M–L | yes (Infringement/Debrief/Points/Score) |
| E | Trailers, AdBlue, Rota, Incidents, Tacho | L (each) | yes (one per panel) |

**Recommendation:** get sign-off on **Phases A + B** as "the dashboard adjustments," ship them as a visible
update, then treat C–E as separately-scheduled milestones with the client choosing the order.
