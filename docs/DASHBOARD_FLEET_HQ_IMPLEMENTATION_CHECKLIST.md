# FLEET HQ Dashboard Implementation Checklist

> Companion to `docs/DASHBOARD_FLEET_HQ_UPGRADE_PLAN.md`  
> Use this as the working checklist when implementation starts.

## Pre-Implementation

- [x] Trailer scope: build live backend module, no placeholder card.
- [x] AdBlue scope: build live backend module, no placeholder card.
- [x] Rota scope: real model plus create flow first; edit/delete next.
- [x] Dashboard title and sidebar naming: keep Dashboard, align visible branding to FLEET HQ.
- [x] Default week/date behaviour: current tenant-local week, with previous/next/today controls.

## Pass A: Visual Dashboard Rebuild

- [x] Add dashboard-specific shell/topbar controls.
- [x] Rework `src/views/dashboard/index.ejs` into the mockup structure.
- [ ] Build top KPI row:
  - [x] Compliance gauge.
  - [x] Drivers card.
  - [x] Vehicles card.
  - [x] Trailer handling.
  - [x] Alerts card.
- [x] Build rota panel with responsive horizontal grid.
- [x] Build right rail:
  - [x] Recent alerts.
  - [x] Upcoming tasks.
- [x] Build bottom cards:
  - [x] Fuel overview.
  - [x] AdBlue handling.
  - [x] Finance overview.
  - [x] Fleet availability.
- [x] Reuse existing FLEET HQ logo assets.
- [x] Preserve dark-mode readability.

## Pass B: Live Data Wiring

- [x] Add route aggregations in `src/routes/web.routes.js`.
- [x] Feed KPI cards from live counts.
- [x] Feed alert rail from decorated alerts.
- [x] Feed task rail from ComplianceTask.
- [x] Feed fuel card from FuelLog.
- [x] Feed finance card from Invoice and Expense.
- [x] Feed fleet availability from Vehicle status.
- [x] Feed rota from EmployeeShift, LeaveRequest, and Job data.

## Pass C: Rota Model

- [x] Add rota enum/model to `prisma/schema.prisma`.
- [x] Create migration.
- [x] Generate Prisma client.
- [x] Add create/update/delete routes.
- [x] Add Add Rota form/modal.
- [x] Add filters by employee, role, location, and shift type.
- [x] Add seed data for demo/dev.

## Optional Pass D: Trailer Module

- [x] Add Trailer model.
- [x] Add trailer compliance fields.
- [x] Add trailer route/view.
- [x] Wire dashboard Trailer KPI to real data.

## Optional Pass E: AdBlue Module

- [x] Add AdBlueLog or extend FuelLog.
- [x] Add logging UI.
- [x] Add dashboard AdBlue totals.
- [x] Add top consumers.

## Pass F: Local Test Users and Demo Data

- [x] Add local-only seed script separate from production seed.
- [x] Create test users for director, transport manager, operations, HR, fleet, finance, and driver.
- [x] Seed dashboard data: drivers, vehicles, trailers, rota shifts, fuel, AdBlue, tasks, alerts.
- [x] Document local credentials.

Local command:

```bash
npm run seed:local
```

Local credentials:

| Role | Email | Password |
|---|---|---|
| Platform Super Admin | `platform@fleetshq.local` | `Demo2024!` |
| Director | `director@fleetshq.local` | `Demo2024!` |
| Transport Manager | `transport@fleetshq.local` | `Demo2024!` |
| Operations Manager | `operations@fleetshq.local` | `Demo2024!` |
| HR Manager | `hr@fleetshq.local` | `Demo2024!` |
| Fleet Manager | `fleet@fleetshq.local` | `Demo2024!` |
| Finance Officer | `finance@fleetshq.local` | `Demo2024!` |
| Driver | `driver1@fleetshq.local` | `Demo2024!` |

Temporary live-domain test users:

```bash
CONFIRM_LIVE_TEST_SEED=fleetshq-live-test LIVE_TEST_PASSWORD='set-a-temporary-password' npm run seed:live-test
CONFIRM_LIVE_TEST_SEED=fleetshq-live-test npm run seed:live-test:cleanup
```

Live-domain emails created by the script:

| Role | Email |
|---|---|
| Platform Super Admin | `test.platform@fleetshq.com` |
| Director | `test.director@fleetshq.com` |
| Transport Manager | `test.transport@fleetshq.com` |
| Operations Manager | `test.operations@fleetshq.com` |
| HR Manager | `test.hr@fleetshq.com` |
| Fleet Manager | `test.fleet@fleetshq.com` |
| Finance Officer | `test.finance@fleetshq.com` |
| Driver | `test.driver@fleetshq.com` |

## Verification

- [x] Run `npm test` - 17 suites / 79 tests passing.
- [x] Run `npm run lint` - passes with existing warnings in `web.routes.js` and `import.service.js`.
- [ ] Manually inspect dashboard at desktop width.
- [ ] Manually inspect dashboard at tablet/mobile width.
- [ ] Check light and dark modes.
- [ ] Confirm no text overlaps in rota cells or KPI cards.
- [x] Confirm all links go to existing live routes.
- [x] Confirm no fake values are shown as real data.
