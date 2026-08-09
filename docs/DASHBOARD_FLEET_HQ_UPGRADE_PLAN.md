# FLEET HQ Dashboard Upgrade Plan

> Source mockup: `public/img/design/50870.jpg`  
> Date written: 2026-08-09  
> Scope requested: analyze the new client dashboard design, plan the upgrade, and document the work before implementation.

## 1. Design Read

The new client design is a light, dense transport-manager dashboard for FLEET HQ. It is not a marketing dashboard and should not be treated like one. The useful feeling is "daily operating desk": a manager lands here, sees compliance, rota coverage, urgent alerts, tasks, fuel, AdBlue, finance, and fleet availability in one scan.

The most important shift from the current app is the centre of gravity:

- Current dashboard: compliance overview, alerts, trend charts, open defects, and operational pulse.
- New mockup: compliance KPI strip at the top, an employee rota grid as the main working surface, a right-hand alerts/tasks rail, and compact operational cards along the bottom.

The app already has many foundations from earlier dashboard work: light theme, FLEET HQ logo assets, avatars, vehicle thumbnails, compliance tasks, driver risk, fuel, finance, checks, defects, and Chart.js. The main missing piece for this exact design is real rota scheduling, with Trailers and AdBlue also requiring first-class data if the client expects those numbers to be live.

## 2. Mockup Anatomy

### Shell

- Dark navy left sidebar, fixed width, yellow active state.
- FLEET HQ logo at the top, user/status block at the bottom.
- Menu is flatter and more operations-oriented than the current grouped sidebar.
- Main content is light grey with white cards and very subtle dividers.
- Topbar includes hamburger, title/subtitle, operating-centre picker, date picker, search, notifications, help, and user menu.

### Top KPI Row

Five cards:

- Overall Compliance Score: doughnut gauge, large percentage, qualitative label, month delta, link to score breakdown.
- Drivers: total count, actions required, link.
- Vehicles: total count, actions required, link.
- Trailers: total count, actions required, link.
- Compliance Alerts: open count, link.

Current match:

- Compliance score, drivers, vehicles, alerts exist.
- Trailer entity does not appear to exist yet.
- Delta helpers exist, but dashboard data should be refreshed around the exact wording used in the design.

### Employee Rota

This is the main feature in the mockup.

- Weekly range controls.
- Previous/next arrows and Today button.
- Week / 2 Weeks / Month segmented control.
- Filters and Add Rota buttons.
- Rows are employees with avatar, name, and role.
- Columns are Monday to Sunday.
- Shift cells are colour-coded:
  - Green: assigned driving work.
  - Yellow: rest day / off.
  - Pink/red: relief / cover.
  - Blue: on-site / office / work-from-home.
  - Grey: standby.
- Footer legend and timezone note.

Current match:

- Employees and avatars exist.
- Leave management exists.
- Jobs/driver allocations exist.
- A real rota/shift model does not appear to exist. This should be a new model, not hard-coded markup.

### Right Rail

Two stacked operational lists:

- Recent Alerts: severity icon, alert title, subject, due/expiry date, "View all".
- Upcoming Tasks: icon, task title, owner/detail, due date, "View all".

Current match:

- Alert and ComplianceTask models exist.
- Existing dashboard already decorates alerts and maps upcoming tasks.
- This is mostly presentation and filtering work.

### Bottom Operational Cards

Four compact cards:

- Fuel Overview: total fuel litres, delta, mini bar chart, top consumers.
- AdBlue Overview: total AdBlue litres, delta, mini bar chart, top consumers.
- Finance Overview: total income, total expenses, net profit, donut breakdown.
- Fleet Availability: availability gauge and counts.

Current match:

- FuelLog, Expense, Invoice, and fleet status data exist.
- AdBlue does not appear to have its own model.
- Fleet availability is straightforward from Vehicle status.

## 3. Asset Plan

Use the stored assets under `public/img/`:

- Primary new dashboard reference: `public/img/design/50870.jpg`.
- Main logo candidate: `public/img/new assets/logo-fleetshq-full.png`.
- Existing logo aliases: `public/img/logo-fleetshq-full.png` and `public/img/logo-fleetshq-icon.png`.
- Background/visual assets: `public/img/new assets/bg-image.jpeg`, `public/img/new assets/design.jpeg`.
- Legacy/new logo source: `public/img/new logo/48415.jpg`.

Implementation guidance:

- Prefer the transparent PNG FLEET HQ assets for the sidebar and app shell.
- Keep existing authenticated employee and vehicle image routes.
- Do not use the design screenshot as a UI background. It is a reference only.
- Add any new placeholder images only if real route-served photos are unavailable.

## 4. Data Model Gaps

### Required for a true implementation

1. `Shift` / `EmployeeRota` model
   - Fields: employeeId, vehicleId optional, startAt, endAt, status/type, routeLabel, location, notes, createdById.
   - Needed for the main rota grid, Add Rota, filters, standby, rest day, relief cover, office/site states.

2. Rota status enum
   - Suggested values: assigned, rest_day, relief_cover, on_site, office, work_from_home, standby, leave, sick, training.

3. Trailer model
   - Needed if the Trailer KPI must be live.
   - Could be deferred and hidden, or displayed as "Coming soon" only if the client approves.

4. AdBlue model
   - Either separate `AdBlueLog`, or extend `FuelLog` with a type field.
   - Separate model is cleaner if AdBlue needs its own top consumers and spend later.

### Can be done with existing data

- Compliance score gauge.
- Driver count and driver actions.
- Vehicle count and vehicle actions.
- Compliance alerts.
- Recent alert rail.
- Upcoming task rail.
- Fuel card without AdBlue.
- Finance card.
- Fleet availability card.
- Rota-like read-only fallback using employees, leave, and driver jobs.

## 5. Implementation Phases

### Phase 0: Planning and agreement

- Confirm whether the dashboard should become the default landing page for transport managers.
- Confirm whether Employee Rota is in scope as a real module or only a visual dashboard preview.
- Confirm whether Trailer and AdBlue should be implemented now or deferred.
- Confirm default active date behaviour. The mockup says 20 May 2025, but production should default to the current tenant-local week.

### Phase 1: Visual Shell Alignment

Files likely touched:

- `src/views/layouts/main.ejs`
- `public/css/app.css`
- `src/utils/uiHelpers.js`

Work:

- Update sidebar branding to match the FLEET HQ mockup more closely.
- Add a dashboard-specific top filter strip: operating centre, date, notification count, profile block.
- Tighten spacing, card radius, shadows, and card heights to match the denser mockup.
- Add dashboard-only CSS classes rather than destabilising the entire app shell.

Risk:

- Medium, because the layout is shared across all pages. Keep global changes small and isolate dashboard-specific UI where possible.

### Phase 2: Dashboard Layout Rebuild

Files likely touched:

- `src/views/dashboard/index.ejs`
- `src/routes/web.routes.js`
- `public/css/app.css`

Work:

- Replace the current main dashboard order with:
  - top KPI row
  - main content grid with rota board and right rail
  - bottom operational cards
- Reuse existing gauge/chart logic where possible.
- Move lower-priority existing widgets below the new layout or remove only after confirming with the client.
- Keep responsive behaviour: on mobile, KPI cards stack, right rail moves below rota, and rota becomes horizontally scrollable.

Risk:

- Medium. The dashboard is heavily rendered through EJS template strings, so careful escaping and small helper functions matter.

### Phase 3: Rota MVP

Files likely touched:

- `prisma/schema.prisma`
- `prisma/migrations/*`
- `src/routes/web.routes.js`
- `src/views/dashboard/index.ejs`
- New route/view if needed: `src/views/rota/index.ejs`

Work:

- Add `EmployeeShift` or `RotaShift` model.
- Seed a small realistic rota dataset for demo environments.
- Render weekly rota from live records.
- Add filter controls and "Add Rota" workflow.
- Integrate approved leave into rota cells as leave/rest states.
- Optionally link driver jobs to rota cells where jobs exist.

Risk:

- High if made fully editable in one pass. Recommended first version: read/create/edit basic shifts, no drag-and-drop.

### Phase 4: Bottom Cards and Data Enrichment

Files likely touched:

- `src/routes/web.routes.js`
- `src/views/dashboard/index.ejs`
- `src/views/fleet/fuel.ejs`
- `prisma/schema.prisma` if AdBlue is included.

Work:

- Fuel monthly total, delta, mini bars, top consumers.
- AdBlue monthly total and top consumers if model is approved.
- Finance income/expense/profit card using current Invoice and Expense data.
- Fleet availability gauge using Vehicle statuses.

Risk:

- Low to medium. Mostly aggregation and presentation, except AdBlue.

### Phase 5: Trailers

Only do this if the client confirms trailers are real managed assets.

Work:

- Add Trailer model.
- Add trailer count, compliance action count, and trailer management route.
- Wire the KPI card to real data.

Risk:

- Medium. Trailer compliance can grow into a full fleet subdomain if not scoped carefully.

## 6. Suggested First Implementation Slice

The best first visible slice is:

1. Rebuild `dashboard/index.ejs` to match the mockup structure.
2. Use live data for compliance, drivers, vehicles, alerts, tasks, fuel, finance, and fleet availability.
3. Render an "Employee Rota" preview from active drivers, approved leave, and driver jobs.
4. Hide or mark Trailer and AdBlue as deferred unless the client confirms the new models.
5. Keep links and actions connected to existing modules.

This gives the client the look and operating feel quickly, while avoiding fake data being mistaken for completed rota/trailer/AdBlue modules.

## 7. Acceptance Checklist

- Dashboard visually matches the reference structure at desktop width.
- Sidebar uses the FLEET HQ logo assets and active state style.
- Top KPI row has the same five-card rhythm, with Trailer handled honestly.
- Employee rota is the largest panel and does not overflow incoherently.
- Right rail shows live alerts and tasks.
- Bottom cards show fuel, finance, and fleet availability from real data.
- Mobile layout is usable: no overlapping text, no broken rota controls, horizontal scroll only where intentional.
- Dark mode remains usable, even if the client-facing default is light.
- `npm test` passes.

## 8. Open Decisions

1. Should the dashboard be titled "Dashboard" or "Transport Manager Dashboard"?
2. Should "Employee Rota" become a full sidebar item now?
3. Should we add real Trailer management in this upgrade?
4. Should AdBlue be implemented as a real log now, or deferred?
5. Should the mockup's sample dates remain purely visual, or should all dates default to the current operating week?

## 9. Recommended Call

Proceed in two implementation passes:

- Pass A: visual dashboard rebuild using existing data, plus a read-only rota preview.
- Pass B: real rota model and CRUD, then optional Trailer and AdBlue modules after client sign-off.

That path gives the client the dashboard they recognise quickly, while keeping the engineering honest and maintainable.
