# FLEET HQ — Seeded Demo & Test Accounts

All seeded demo accounts share the same default password:

- **Default Demo Password (Local & Live Demo Accounts):** `Demo2024!`

---

## 1. Local Demo Accounts (`@fleetshq.local`)
Seeded via `npm run seed:local` ([`scripts/seed-local-test-users.js`](../scripts/seed-local-test-users.js) and [`scripts/lib/demoData.js`](../scripts/lib/demoData.js)).

| Role | Email | Password | Full Name | Linked Employee ID | Access & Dashboard View |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin / Platform** | `platform@fleetshq.local` | `Demo2024!` | Platform Admin | — | Full platform, Super Admin, Executive BI, all compliance & HR modules |
| **Director** | `director@fleetshq.local` | `Demo2024!` | David Reynolds | `local-emp-office-006` | Full company director dashboard, HR, Home Office, DVSA, Finance, Settings |
| **Transport Manager** | `transport@fleetshq.local` | `Demo2024!` | Caroline Nampijja | `local-emp-driver-006` | DVSA & Operator Compliance, Fleet, PMI, Drivers, Sponsored Workers, Operations |
| **Operations Manager** | `operations@fleetshq.local` | `Demo2024!` | Tom Fletcher | `local-emp-office-003` | Operations, Dispatch & Allocation, Shipments, Rota, Fleet, People |
| **HR Manager** | `hr@fleetshq.local` | `Demo2024!` | Grace Adeyemi | `local-emp-office-001` | People & HR, Employment & HR Hub, Sponsored Workers, Right to Work, Leave, Training |
| **Fleet Manager** | `fleet@fleetshq.local` | `Demo2024!` | Liam O'Connor | `local-emp-office-004` | Vehicle & Trailer Registers, PMI Planner, Defects & VOR, Fuel & AdBlue |
| **Finance Officer** | `finance@fleetshq.local` | `Demo2024!` | Priya Shah | `local-emp-office-002` | Finance Overview, Invoicing & Costs, Expenses, People overview |
| **Trainer** | `trainer@fleetshq.local` | `Demo2024!` | Sarah Whitfield | `local-emp-office-005` | Training & Competency Hub, Courses, Audit Evidence, People |
| **HGV Driver 1** | `driver1@fleetshq.local` | `Demo2024!` | Mulindwa Denis | `local-emp-driver-001` | Driver Dashboard, My Jobs, My Profile, My Training, Daily Walkaround Checks, My Defects |
| **HGV Driver 2** | `driver2@fleetshq.local` | `Demo2024!` | Adaeze Okafor | `local-emp-driver-007` | Driver Dashboard, My Jobs, My Profile, My Training, Daily Walkaround Checks, My Defects |
| **Garage / Workshop** | `garage@fleetshq.local` | `Demo2024!` | Garage Bay | — | Fleet Maintenance, PMI Planner, Walkaround Checks, Defects & VOR |
| **Client Portal** | `client@fleetshq.local` | `Demo2024!` | Retail Client | — | Client Portal, Book a Shipment, Shipments Tracking |

---

## 2. Live-Domain Demo Accounts (`@fleetshq.com`)
Seeded via `npm run seed:live-test` ([`scripts/seed-live-test-users.js`](../scripts/seed-live-test-users.js)).

| Role | Email | Password | Full Name | Linked Employee ID |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin (System)** | `director@fleetshq.com` | `Demo2024!` | System Administrator | — |
| **Super Admin (Demo)** | `test.platform@fleetshq.com` | `Demo2024!` | Platform Admin | — |
| **Director** | `test.director@fleetshq.com` | `Demo2024!` | David Reynolds | `live-test-emp-office-006` |
| **Transport Manager** | `test.transport@fleetshq.com` | `Demo2024!` | Caroline Nampijja | `live-test-emp-driver-006` |
| **Operations Manager** | `test.operations@fleetshq.com` | `Demo2024!` | Tom Fletcher | `live-test-emp-office-003` |
| **HR Manager** | `test.hr@fleetshq.com` | `Demo2024!` | Grace Adeyemi | `live-test-emp-office-001` |
| **Fleet Manager** | `test.fleet@fleetshq.com` | `Demo2024!` | Liam O'Connor | `live-test-emp-office-004` |
| **Finance Officer** | `test.finance@fleetshq.com` | `Demo2024!` | Priya Shah | `live-test-emp-office-002` |
| **Trainer** | `test.trainer@fleetshq.com` | `Demo2024!` | Sarah Whitfield | `live-test-emp-office-005` |
| **HGV Driver 1** | `test.driver1@fleetshq.com` | `Demo2024!` | Mulindwa Denis | `live-test-emp-driver-001` |
| **HGV Driver 2** | `test.driver2@fleetshq.com` | `Demo2024!` | Adaeze Okafor | `live-test-emp-driver-007` |
| **Test Driver** | `test.driver@fleetshq.com` | `Demo2024!` | Test Driver | — |
| **Garage / Workshop** | `test.garage@fleetshq.com` | `Demo2024!` | Garage Bay | — |
| **Client Portal** | `test.client@fleetshq.com` | `Demo2024!` | Retail Client | — |

---

## 3. Seeded Employees & Sponsored Workers
The demo seed (`scripts/lib/demoData.js`) populates **17 employees** (10 dedicated drivers + 7 office/management staff, including 2 Home Office Sponsored Workers):

### Drivers (`Transport` Department)
1. **Mulindwa Denis** — HGV Driver (`Birmingham`) — Assigned Vehicle: `NU66 XVB` (DAF XF)
2. **Pardeep Brar** — Driver (`Linehaul`) — Assigned Vehicle: `FN16 EVK` (Volvo FH)
3. **Jashanjot Singh** — Driver (`Collections`) — Assigned Vehicle: `BW18 PWL` (Scania R450)
4. **Nimal Perera** — Driver (`Multi-drop`) — Assigned Vehicle: `MX68 KFK` (Mercedes Actros)
5. **Julius Kavuma** — Relief Driver (`Relief Pool`) — Assigned Vehicle: `YX18 VHG` (DAF CF)
6. **Adaeze Okafor** — HGV Driver (`Manchester`) — Assigned Vehicle: `PN20 LTY` (Ford Cargo)
7. **Marek Nowak** — Driver (`Linehaul`) — Assigned Vehicle: `LD70 XZS` (Renault T High)
8. **Kwame Boateng** — Driver (`Collections`) — Assigned Vehicle: `BX21 ABC` (Iveco S-Way)
9. **Fatima Al-Sayed** — Driver (`Multi-drop`) — **Sponsored Worker** (`CoS: C1234567`, SOC `8214`) — Assigned Vehicle: `KX19 DEF` (Volvo FM)
10. **Viktor Petrov** — HGV Driver (`Birmingham`) — **Sponsored Worker** (`CoS: C7654321`, SOC `8214`) — Assigned Vehicle: `GN22 GHI` (DAF XG)

### Office & Management Staff
11. **Caroline Nampijja** — Transport Manager (`Operations`)
12. **Grace Adeyemi** — HR Manager (`HR`)
13. **Priya Shah** — Finance Officer (`Finance`)
14. **Tom Fletcher** — Operations Manager (`Operations`)
15. **Liam O'Connor** — Fleet Manager (`Fleet`)
16. **Sarah Whitfield** — Trainer (`HR`)
17. **David Reynolds** — Director (`Executive`)

---

## 4. Re-seeding Commands

- **Seed / Refresh Local Demo Data:**
  ```bash
  npm run seed:local
  ```
- **Seed / Refresh Live-Domain Demo Data (`@fleetshq.com`):**
  ```bash
  CONFIRM_LIVE_TEST_SEED=fleetshq-live-test LIVE_TEST_PASSWORD='Demo2024!Demo' npm run seed:live-test
  ```
- **Clean Up Live-Domain Demo Data:**
  ```bash
  CONFIRM_LIVE_TEST_SEED=fleetshq-live-test npm run seed:live-test:cleanup
  ```
