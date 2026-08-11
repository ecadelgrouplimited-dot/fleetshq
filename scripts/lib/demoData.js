// Shared demo-dataset generator used by both scripts/seed-local-test-users.js
// (fresh local dev DB) and scripts/seed-live-test-users.js (production DB, for
// client review). Every record this creates carries an explicit, prefixed id
// (`${idPrefix}-...`) so a matching cleanup script can remove it precisely —
// see scripts/cleanup-live-test-users.js.
//
// Safety: this module never touches the Tenant/Company/Branch rows unless
// `bootstrapTenant` is true (local only) — on a live DB those already hold
// real business data. It also refuses to overwrite a Vehicle/Trailer whose
// registration collides with a pre-existing row that isn't one of ours
// (recognised by its VIN/id prefix), rather than silently upserting into it.

const bcrypt = require('bcryptjs');

const daysFromNow = (n) => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};
const dateOnly = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const timeOnly = (hh, mm) => new Date(Date.UTC(1970, 0, 1, hh, mm, 0));
const mondayOfThisWeek = () => {
  const d = dateOnly(new Date());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};
const money = (n) => n.toFixed(2);
const pick = (arr, i) => arr[i % arr.length];
const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.');

/**
 * @param {object} opts
 * @param {import('@prisma/client').PrismaClient} opts.prisma
 * @param {string} opts.tenantId
 * @param {string} opts.domain        e.g. 'fleetshq.local' or 'fleetshq.com'
 * @param {string} [opts.loginPrefix] e.g. '' locally, 'test.' on the live domain
 * @param {string} opts.password      plaintext password shared by every seeded login
 * @param {string} opts.idPrefix      e.g. 'local' or 'live-test' — namespaces every id
 * @param {boolean} opts.bootstrapTenant  create Tenant/Company/Branch (local dev only)
 * @param {boolean} [opts.strictOwnership] on a registration collision: true = abort loudly
 *   (live — never risk touching a real vehicle/trailer); false = adopt whatever id the
 *   existing row has (local dev DBs are routinely shared with other seed scripts).
 */
async function seedDemoData({ prisma, tenantId, domain, loginPrefix = '', password, idPrefix, bootstrapTenant, strictOwnership = true }) {
  const id = (suffix) => `${idPrefix}-${suffix}`;
  const vinTag = `VIN${idPrefix.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
  const emailFor = (name) => `${loginPrefix}${slug(name)}@${domain}`;

  const passwordHash = await bcrypt.hash(password, 10);

  async function upsertEmployee(data) {
    return prisma.employee.upsert({ where: { id: data.id }, update: data, create: data });
  }
  async function upsertUser({ email, firstName, lastName, role, roles, employeeId = null }) {
    return prisma.user.upsert({
      where: { email },
      update: { tenantId, firstName, lastName, role, roles, employeeId, passwordHash, isActive: true, mustChangePassword: false, lockedUntil: null, failedLoginAttempts: 0 },
      create: { tenantId, email, firstName, lastName, role, roles, employeeId, passwordHash, isActive: true, mustChangePassword: false },
    });
  }

  let tenant;
  if (bootstrapTenant) {
    tenant = await prisma.tenant.upsert({
      where: { slug: 'default' },
      update: { name: 'FLEETSHQ Local', status: 'active' },
      create: { id: tenantId, name: 'FLEETSHQ Local', slug: 'default', plan: 'growth', status: 'active' },
    });
    const company = await prisma.company.upsert({
      where: { id: id('company-001') },
      update: { tenantId, name: 'FLEETSHQ Operations', legalName: 'FLEETSHQ Ltd', operatorLicenceNumber: 'OF1234567', timezone: 'Europe/London' },
      create: { id: id('company-001'), tenantId, name: 'FLEETSHQ Operations', legalName: 'FLEETSHQ Ltd', operatorLicenceNumber: 'OF1234567', timezone: 'Europe/London' },
    });
    await prisma.branch.upsert({
      where: { id: id('branch-001') },
      update: { tenantId, companyId: company.id, name: 'Main Operating Centre', address: 'Unit 8, Logistics Park, Birmingham' },
      create: { id: id('branch-001'), tenantId, companyId: company.id, name: 'Main Operating Centre', address: 'Unit 8, Logistics Park, Birmingham' },
    });
  } else {
    tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error(`Tenant ${tenantId} was not found — refusing to seed demo data without bootstrapping it.`);
  }

  // ── EMPLOYEES ──────────────────────────────────────────────────────
  const DRIVERS = [
    { key: 'emp-driver-001', fullName: 'Mulindwa Denis', jobTitle: 'HGV Driver', workLocation: 'Birmingham' },
    { key: 'emp-driver-002', fullName: 'Pardeep Brar', jobTitle: 'Driver', workLocation: 'Linehaul' },
    { key: 'emp-driver-003', fullName: 'Jashanjot Singh', jobTitle: 'Driver', workLocation: 'Collections' },
    { key: 'emp-driver-004', fullName: 'Nimal Perera', jobTitle: 'Driver', workLocation: 'Multi-drop' },
    { key: 'emp-driver-005', fullName: 'Julius Kavuma', jobTitle: 'Relief Driver', workLocation: 'Relief Pool' },
    { key: 'emp-driver-007', fullName: 'Adaeze Okafor', jobTitle: 'HGV Driver', workLocation: 'Manchester' },
    { key: 'emp-driver-008', fullName: 'Marek Nowak', jobTitle: 'Driver', workLocation: 'Linehaul' },
    { key: 'emp-driver-009', fullName: 'Kwame Boateng', jobTitle: 'Driver', workLocation: 'Collections' },
    { key: 'emp-driver-010', fullName: 'Fatima Al-Sayed', jobTitle: 'Driver', workLocation: 'Multi-drop', isSponsored: true },
    { key: 'emp-driver-011', fullName: 'Viktor Petrov', jobTitle: 'HGV Driver', workLocation: 'Birmingham', isSponsored: true },
  ];
  const OFFICE = [
    { key: 'emp-driver-006', fullName: 'Caroline Nampijja', jobTitle: 'Transport Manager', department: 'Operations', workLocation: 'Office', salary: '42000.00' },
    { key: 'emp-office-001', fullName: 'Grace Adeyemi', jobTitle: 'HR Manager', department: 'HR', workLocation: 'Office', salary: '41000.00' },
    { key: 'emp-office-002', fullName: 'Priya Shah', jobTitle: 'Finance Officer', department: 'Finance', workLocation: 'Office', salary: '38000.00' },
    { key: 'emp-office-003', fullName: 'Tom Fletcher', jobTitle: 'Operations Manager', department: 'Operations', workLocation: 'Office', salary: '40000.00' },
    { key: 'emp-office-004', fullName: "Liam O'Connor", jobTitle: 'Fleet Manager', department: 'Fleet', workLocation: 'Workshop', salary: '39500.00' },
    { key: 'emp-office-005', fullName: 'Sarah Whitfield', jobTitle: 'Trainer', department: 'HR', workLocation: 'Office', salary: '34500.00' },
    { key: 'emp-office-006', fullName: 'David Reynolds', jobTitle: 'Director', department: 'Executive', workLocation: 'Office', salary: '68000.00' },
  ];
  const employeeRecords = [];
  let empOffset = 0;
  for (const e of DRIVERS) {
    employeeRecords.push(await upsertEmployee({
      id: id(e.key), tenantId, fullName: e.fullName, email: emailFor(e.fullName),
      jobTitle: e.jobTitle, workLocation: e.workLocation, department: 'Transport',
      dateOfBirth: daysFromNow(-11000 - empOffset++ * 300), homeAddress: 'Demo address (seeded)', phone: '07000000000',
      startDate: daysFromNow(-900 - empOffset * 15), employmentStatus: 'active', contractedHours: '40.00',
      salary: e.jobTitle.includes('Manager') ? '36000.00' : '34000.00',
      isDriver: true, isSponsored: !!e.isSponsored,
    }));
  }
  const driverRecords = employeeRecords.slice();
  const officeRecords = [];
  for (const e of OFFICE) {
    const rec = await upsertEmployee({
      id: id(e.key), tenantId, fullName: e.fullName, email: emailFor(e.fullName),
      jobTitle: e.jobTitle, workLocation: e.workLocation, department: e.department,
      dateOfBirth: daysFromNow(-13000 - empOffset++ * 300), homeAddress: 'Demo address (seeded)', phone: '07000000001',
      startDate: daysFromNow(-1400 - empOffset * 20), employmentStatus: 'active', contractedHours: '40.00', salary: e.salary,
      isDriver: e.key === 'emp-driver-006', isSponsored: false,
    });
    officeRecords.push(rec);
    if (e.key === 'emp-driver-006') employeeRecords.push(rec); // Caroline also drives — keeps her in the rota
  }
  const allEmployees = [...driverRecords, ...officeRecords];

  // ── SPONSORED WORKERS ────────────────────────────────────────────────
  await prisma.sponsoredWorker.upsert({
    where: { employeeId: id('emp-driver-010') },
    update: { tenantId, cosNumber: 'C1234567', socCode: '8214', sponsoredJobTitle: 'HGV Driver', salaryOnCos: '26000.00', actualSalary: '27500.00', contractedHours: '40.00', workLocation: 'Multi-drop', visaExpiryDate: daysFromNow(45), rightToWorkCheckDate: daysFromNow(-300), rightToWorkFollowupDate: daysFromNow(50) },
    create: { tenantId, employeeId: id('emp-driver-010'), cosNumber: 'C1234567', socCode: '8214', sponsoredJobTitle: 'HGV Driver', salaryOnCos: '26000.00', actualSalary: '27500.00', contractedHours: '40.00', workLocation: 'Multi-drop', visaExpiryDate: daysFromNow(45), rightToWorkCheckDate: daysFromNow(-300), rightToWorkFollowupDate: daysFromNow(50) },
  });
  await prisma.sponsoredWorker.upsert({
    where: { employeeId: id('emp-driver-011') },
    update: { tenantId, cosNumber: 'C7654321', socCode: '8214', sponsoredJobTitle: 'HGV Driver', salaryOnCos: '26500.00', actualSalary: '28000.00', contractedHours: '40.00', workLocation: 'Birmingham', visaExpiryDate: daysFromNow(220), rightToWorkCheckDate: daysFromNow(-200), rightToWorkFollowupDate: daysFromNow(230) },
    create: { tenantId, employeeId: id('emp-driver-011'), cosNumber: 'C7654321', socCode: '8214', sponsoredJobTitle: 'HGV Driver', salaryOnCos: '26500.00', actualSalary: '28000.00', contractedHours: '40.00', workLocation: 'Birmingham', visaExpiryDate: daysFromNow(220), rightToWorkCheckDate: daysFromNow(-200), rightToWorkFollowupDate: daysFromNow(230) },
  });

  // ── USERS (logins) ───────────────────────────────────────────────────
  const roleAccounts = [
    { role: 'super_admin', roles: ['super_admin', 'director'], firstName: 'Platform', lastName: 'Admin', employeeKey: null, loginSlug: 'platform' },
    { role: 'director', roles: ['director'], firstName: 'David', lastName: 'Reynolds', employeeKey: 'emp-office-006', loginSlug: 'director' },
    { role: 'transport_manager', roles: ['transport_manager'], firstName: 'Caroline', lastName: 'Nampijja', employeeKey: 'emp-driver-006', loginSlug: 'transport' },
    { role: 'operations_manager', roles: ['operations_manager'], firstName: 'Tom', lastName: 'Fletcher', employeeKey: 'emp-office-003', loginSlug: 'operations' },
    { role: 'hr_manager', roles: ['hr_manager'], firstName: 'Grace', lastName: 'Adeyemi', employeeKey: 'emp-office-001', loginSlug: 'hr' },
    { role: 'fleet_manager', roles: ['fleet_manager'], firstName: 'Liam', lastName: "O'Connor", employeeKey: 'emp-office-004', loginSlug: 'fleet' },
    { role: 'finance_officer', roles: ['finance_officer'], firstName: 'Priya', lastName: 'Shah', employeeKey: 'emp-office-002', loginSlug: 'finance' },
    { role: 'trainer', roles: ['trainer'], firstName: 'Sarah', lastName: 'Whitfield', employeeKey: 'emp-office-005', loginSlug: 'trainer' },
    { role: 'driver', roles: ['driver'], firstName: 'Mulindwa', lastName: 'Denis', employeeKey: 'emp-driver-001', loginSlug: 'driver1' },
    { role: 'driver', roles: ['driver'], firstName: 'Adaeze', lastName: 'Okafor', employeeKey: 'emp-driver-007', loginSlug: 'driver2' },
    { role: 'garage', roles: ['garage'], firstName: 'Garage', lastName: 'Bay', employeeKey: null, loginSlug: 'garage' },
    { role: 'client', roles: ['client'], firstName: 'Retail', lastName: 'Client', employeeKey: null, loginSlug: 'client' },
  ];
  const userByEmail = {};
  const users = [];
  for (const a of roleAccounts) {
    const email = `${loginPrefix}${a.loginSlug}@${domain}`;
    const employeeId = a.employeeKey ? id(a.employeeKey) : null;
    const user = await upsertUser({ email, firstName: a.firstName, lastName: a.lastName, role: a.role, roles: a.roles, employeeId });
    userByEmail[email] = user;
    users.push({ email, firstName: a.firstName, lastName: a.lastName, role: a.role });
  }
  const uid = (slugKey) => userByEmail[`${loginPrefix}${slugKey}@${domain}`].id;

  // ── VEHICLES ─────────────────────────────────────────────────────────
  const VEHICLES = [
    { key: 'veh-001', reg: 'NU66 XVB', make: 'DAF', model: 'XF', year: 2020, driverKey: 'emp-driver-001', status: 'active', mileage: 98400, mot: 90, ins: 45, tax: 120, tacho: 70, pmiLast: -21, pmiNext: 14 },
    { key: 'veh-002', reg: 'FN16 EVK', make: 'Volvo', model: 'FH', year: 2019, driverKey: 'emp-driver-002', status: 'active', mileage: 112300, mot: 60, ins: 200, tax: 300, tacho: 150, pmiLast: -10, pmiNext: 32 },
    { key: 'veh-003', reg: 'BW18 PWL', make: 'Scania', model: 'R450', year: 2021, driverKey: 'emp-driver-003', status: 'vor', mileage: 87550, mot: -2, ins: 30, tax: 90, tacho: 40, pmiLast: -40, pmiNext: -4 },
    { key: 'veh-004', reg: 'MX68 KFK', make: 'Mercedes', model: 'Actros', year: 2022, driverKey: 'emp-driver-004', status: 'active', mileage: 64120, mot: 90, ins: 45, tax: 120, tacho: 70, pmiLast: -21, pmiNext: 3 },
    { key: 'veh-005', reg: 'YX18 VHG', make: 'DAF', model: 'CF', year: 2018, driverKey: 'emp-driver-005', status: 'active', mileage: 145200, mot: -19, ins: 60, tax: 200, tacho: 100, pmiLast: -15, pmiNext: 20 },
    { key: 'veh-006', reg: 'PN20 LTY', make: 'Ford', model: 'Cargo', year: 2020, driverKey: 'emp-driver-007', status: 'active', mileage: 76300, mot: 180, ins: 7, tax: 150, tacho: 90, pmiLast: -5, pmiNext: 25 },
    { key: 'veh-007', reg: 'LD70 XZS', make: 'Renault', model: 'T High', year: 2021, driverKey: 'emp-driver-008', status: 'active', mileage: 54200, mot: 150, ins: 100, tax: 250, tacho: 200, pmiLast: -2, pmiNext: 40 },
    { key: 'veh-008', reg: 'BX21 ABC', make: 'Iveco', model: 'S-Way', year: 2022, driverKey: 'emp-driver-009', status: 'active', mileage: 32100, mot: 200, ins: 130, tax: 300, tacho: 250, pmiLast: -8, pmiNext: 34 },
    { key: 'veh-009', reg: 'KX19 DEF', make: 'Volvo', model: 'FM', year: 2019, driverKey: 'emp-driver-010', status: 'active', mileage: 121000, mot: 25, ins: 80, tax: 160, tacho: 50, pmiLast: -30, pmiNext: 10 },
    { key: 'veh-010', reg: 'GN22 GHI', make: 'DAF', model: 'XG', year: 2023, driverKey: 'emp-driver-011', status: 'active', mileage: 8100, mot: 350, ins: 300, tax: 360, tacho: 300, pmiLast: -3, pmiNext: 45 },
    { key: 'veh-011', reg: 'RV17 JKL', make: 'Scania', model: 'G410', year: 2017, driverKey: null, status: 'awaiting_repair', mileage: 165400, mot: -10, ins: -5, tax: 40, tacho: 20, pmiLast: -60, pmiNext: -15 },
    { key: 'veh-012', reg: 'WF23 MNO', make: 'Mercedes', model: 'Arocs', year: 2023, driverKey: null, status: 'active', mileage: 5200, mot: 360, ins: 340, tax: 360, tacho: 330, pmiLast: -1, pmiNext: 50 },
  ];
  // upsert is keyed on the unique `registration`. If a row with that plate
  // already exists and ISN'T one of ours (vinNumber doesn't carry our tag):
  // on live, refuse outright rather than risk overwriting a real vehicle; in
  // local dev, just adopt whatever id the existing row already has (this DB
  // is routinely shared with prisma/seed.js's own demo fleet).
  for (const [i, v] of VEHICLES.entries()) {
    const existing = await prisma.vehicle.findUnique({ where: { registration: v.reg } });
    if (existing && existing.vinNumber && !existing.vinNumber.startsWith(vinTag) && strictOwnership) {
      throw new Error(`Refusing to seed demo vehicle ${v.reg} — a vehicle with that registration already exists and isn't part of this demo set (vin=${existing.vinNumber}).`);
    }
    const data = {
      tenantId, vinNumber: `${vinTag}${String(i + 1).padStart(3, '0')}`, make: v.make, model: v.model, year: v.year,
      assignedDriverId: v.driverKey ? id(v.driverKey) : null, status: v.status, currentMileage: v.mileage,
      motExpiryDate: daysFromNow(v.mot), insuranceExpiryDate: daysFromNow(v.ins), roadTaxExpiryDate: daysFromNow(v.tax),
      tachoCalibrExpiry: daysFromNow(v.tacho), lastPmiDate: daysFromNow(v.pmiLast), nextPmiDate: daysFromNow(v.pmiNext),
    };
    const row = await prisma.vehicle.upsert({ where: { registration: v.reg }, update: data, create: { id: id(v.key), registration: v.reg, ...data } });
    v.id = row.id; // real persisted id — never assume it equals id(v.key)
    v.driver = v.driverKey ? id(v.driverKey) : null;
  }
  const vehicleByReg = Object.fromEntries(VEHICLES.map((v) => [v.reg, v]));
  const vehicleByDriver = Object.fromEntries(VEHICLES.filter((v) => v.driver).map((v) => [v.driver, v]));

  // ── TRAILERS ─────────────────────────────────────────────────────────
  // Trailer refs collide much more plausibly than vehicle plates (lots of
  // fleets literally use "TRL-001"), so local and live use disjoint number
  // ranges rather than a synthetic-looking tagged registration.
  const trailerTag = idPrefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const trailerOffset = idPrefix === 'local' ? 0 : 100;
  const trailers = [
    ['trl-001', 'Schmitz', 'Curtainsider', 2021, 'active', 80, 95, 18],
    ['trl-002', 'Krone', 'Box', 2020, 'active', 20, 40, 10],
    ['trl-003', 'Dennison', 'Flatbed', 2019, 'vor', -4, 30, -2],
    ['trl-004', 'SDC', 'Curtainsider', 2022, 'active', 150, 120, 30],
    ['trl-005', 'Montracon', 'Box', 2021, 'active', 200, 180, 45],
    ['trl-006', 'Don-Bur', 'Curtainsider', 2020, 'active', 9, 60, 25],
    ['trl-007', 'Cartwright', 'Flatbed', 2018, 'awaiting_repair', -15, 10, -8],
  ];
  for (const [n, [key, make, model, year, status, motDays, insuranceDays, pmiDays]] of trailers.entries()) {
    const registration = `TRL-${String(n + 1 + trailerOffset).padStart(3, '0')}`;
    const existing = await prisma.trailer.findUnique({ where: { registration } });
    if (existing && !existing.id.startsWith(`${idPrefix}-`) && strictOwnership) {
      throw new Error(`Refusing to seed demo trailer ${registration} — already exists and isn't part of this demo set.`);
    }
    const data = { tenantId, make, model, year, status, motExpiryDate: daysFromNow(motDays), insuranceExpiryDate: daysFromNow(insuranceDays), nextPmiDate: daysFromNow(pmiDays) };
    await prisma.trailer.upsert({ where: { registration }, update: data, create: { id: id(key), registration, ...data } });
  }

  // ── EMPLOYEE ROTA (current week) ────────────────────────────────────
  const weekStart = mondayOfThisWeek();
  const statuses = ['assigned', 'assigned', 'assigned', 'assigned', 'rest_day', 'relief_cover', 'on_site'];
  for (let e = 0; e < employeeRecords.length; e++) {
    const driverVehicle = vehicleByDriver[employeeRecords[e].id];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const status = i >= 5 ? 'rest_day' : statuses[(e + i) % statuses.length];
      const nextVehicle = pick(VEHICLES, e + 1);
      const fallbackVehicle = pick(VEHICLES, e);
      const shiftId = id(`shift-${e + 1}-${i + 1}`);
      const shiftData = { tenantId, employeeId: employeeRecords[e].id, vehicleId: driverVehicle?.id || fallbackVehicle.id, shiftDate: date, status, startTime: status === 'rest_day' ? null : '06:00', endTime: status === 'rest_day' ? null : '16:00', routeLabel: status === 'assigned' ? `${(driverVehicle || fallbackVehicle).reg} -> ${nextVehicle.reg}` : null, location: status === 'on_site' ? 'Operating Centre' : null };
      await prisma.employeeShift.upsert({ where: { id: shiftId }, update: shiftData, create: { id: shiftId, ...shiftData, createdById: id('seed') } });
    }
  }

  // ── LEAVE REQUESTS ───────────────────────────────────────────────────
  const leaveRows = [
    ['leave-001', 'emp-driver-002', 'annual', 10, 12, 3, 'pending'],
    ['leave-002', 'emp-driver-008', 'annual', 20, 24, 5, 'pending'],
    ['leave-003', 'emp-office-001', 'sick', -1, 1, 2, 'pending'],
    ['leave-004', 'emp-driver-003', 'annual', -2, 2, 5, 'approved'],
    ['leave-005', 'emp-driver-009', 'annual', -30, -25, 5, 'approved'],
    ['leave-006', 'emp-office-003', 'annual', 5, 9, 5, 'approved'],
  ];
  for (const [key, employeeKey, type, startDays, endDays, days, status] of leaveRows) {
    const data = { tenantId, employeeId: id(employeeKey), type, startDate: dateOnly(daysFromNow(startDays)), endDate: dateOnly(daysFromNow(endDays)), days: String(days), status, approverId: status === 'approved' ? uid('transport') : null, decidedAt: status === 'approved' ? daysFromNow(startDays - 3) : null };
    await prisma.leaveRequest.upsert({ where: { id: id(key) }, update: data, create: { id: id(key), ...data } });
  }

  // ── TRAINING RECORDS (per driver) ───────────────────────────────────
  for (const [i, driver] of driverRecords.entries()) {
    const cpcExpiry = i < 2 ? daysFromNow(20) : daysFromNow(280 + i * 12);
    const rows = [
      { trainingType: 'induction', status: 'completed', completedDate: daysFromNow(-800), expiryDate: null },
      { trainingType: 'cpc', status: 'completed', completedDate: daysFromNow(-400), expiryDate: cpcExpiry },
      { trainingType: 'tachograph', status: 'completed', completedDate: daysFromNow(-200), expiryDate: daysFromNow(500) },
    ];
    for (const r of rows) {
      const data = { tenantId, employeeId: driver.id, trainingType: r.trainingType, status: r.status, completedDate: r.completedDate, expiryDate: r.expiryDate, trainerName: 'Sarah Whitfield' };
      await prisma.trainingRecord.upsert({ where: { employeeId_trainingType: { employeeId: driver.id, trainingType: r.trainingType } }, update: data, create: data });
    }
  }

  // ── COURSES + ENROLMENTS ────────────────────────────────────────────
  const courses = [
    ['course-001', 'Company Induction', 'Onboarding', true, null],
    ['course-002', 'Manual Handling', 'Health & Safety', true, 24],
    ['course-003', 'Fire Safety Awareness', 'Health & Safety', true, 12],
    ['course-004', 'Drivers CPC Refresher', 'Compliance', true, 60],
    ['course-005', 'Health & Safety Essentials', 'Health & Safety', true, 24],
    ['course-006', 'Load Security', 'Operations', false, null],
  ];
  for (const [i, [key, title, category, mandatory, validityMonths]] of courses.entries()) {
    await prisma.course.upsert({
      where: { id: id(key) },
      update: { tenantId, title, category, mandatory, validityMonths, sortOrder: i },
      create: { id: id(key), tenantId, title, category, mandatory, validityMonths, sortOrder: i },
    });
  }
  for (const [ei, employee] of allEmployees.entries()) {
    for (const [ci, [key]] of courses.slice(0, 4).entries()) {
      const courseId = id(key);
      const cycle = (ei + ci) % 6;
      const status = cycle === 0 ? 'assigned' : cycle === 1 ? 'in_progress' : 'completed';
      const data = {
        tenantId, courseId, employeeId: employee.id, status,
        assignedAt: daysFromNow(-60 - ci * 10),
        completedAt: status === 'completed' ? daysFromNow(-30 - ci * 5) : null,
        assignedById: uid('hr'),
      };
      await prisma.courseEnrolment.upsert({ where: { courseId_employeeId: { courseId, employeeId: employee.id } }, update: data, create: data });
    }
  }

  // ── TOOLBOX TALKS ────────────────────────────────────────────────────
  const talks = [
    ['toolbox-001', 'Winter Driving Safety', 'Cold-weather vehicle checks and driving technique.', -10, uid('transport'), true],
    ['toolbox-002', 'Load Security Reminder', 'Correct strapping and load distribution.', -3, uid('fleet'), false],
    ['toolbox-003', 'Drivers Hours & WTD Refresher', 'Working Time Directive and tachograph rules refresher.', -1, uid('hr'), false],
  ];
  for (const [key, topic, description, issuedDaysAgo, issuedById, signedOff] of talks) {
    const talkId = id(key);
    const data = { tenantId, topic, description, dateIssued: daysFromNow(issuedDaysAgo), issuedById, managerSignedOff: signedOff, managerSignoffAt: signedOff ? daysFromNow(issuedDaysAgo + 1) : null, managerSignoffById: signedOff ? uid('transport') : null };
    await prisma.toolboxTalk.upsert({ where: { id: talkId }, update: data, create: { id: talkId, ...data } });
    for (const [di, driver] of driverRecords.entries()) {
      const signed = key === 'toolbox-001' || di % 2 === 0;
      const data2 = { tenantId, toolboxTalkId: talkId, employeeId: driver.id, signedAt: signed ? daysFromNow(issuedDaysAgo + 1) : null, signatureData: signed ? 'seed-signature' : null };
      await prisma.toolboxTalkAssignment.upsert({ where: { toolboxTalkId_employeeId: { toolboxTalkId: talkId, employeeId: driver.id } }, update: data2, create: data2 });
    }
  }

  // ── FUEL / ADBLUE LOGS (55 days back — spans this month + last month) ──
  for (let i = 0; i < 55; i++) {
    const vehicle = pick(VEHICLES, i);
    const fuelId = id(`fuel-${i + 1}`);
    await prisma.fuelLog.upsert({
      where: { id: fuelId },
      update: { tenantId, vehicleId: vehicle.id, loggedDate: daysFromNow(-i), litres: money(150 + (i % 7) * 18), cost: money((150 + (i % 7) * 18) * 1.58), odometer: vehicle.mileage + i * 40, createdById: id('seed') },
      create: { id: fuelId, tenantId, vehicleId: vehicle.id, loggedDate: daysFromNow(-i), litres: money(150 + (i % 7) * 18), cost: money((150 + (i % 7) * 18) * 1.58), odometer: vehicle.mileage + i * 40, createdById: id('seed') },
    });
    if (i % 2 === 0) {
      const adBlueId = id(`adblue-${i / 2 + 1}`);
      await prisma.adBlueLog.upsert({
        where: { id: adBlueId },
        update: { tenantId, vehicleId: vehicle.id, loggedDate: daysFromNow(-i), litres: money(22 + (i % 5) * 5), cost: money((22 + (i % 5) * 5) * 0.95), odometer: vehicle.mileage + i * 40, createdById: id('seed') },
        create: { id: adBlueId, tenantId, vehicleId: vehicle.id, loggedDate: daysFromNow(-i), litres: money(22 + (i % 5) * 5), cost: money((22 + (i % 5) * 5) * 0.95), odometer: vehicle.mileage + i * 40, createdById: id('seed') },
      });
    }
  }

  // ── WALK-AROUND CHECKS + DEFECTS + VOR ──────────────────────────────
  const defectCategories = ['Brakes', 'Lights & Indicators', 'Tyres & Wheel Nuts', 'Mirrors', 'Bodywork'];
  const defectSeverities = ['minor', 'serious', 'dangerous'];
  const defectStatuses = ['reported', 'under_review', 'repair_booked'];
  let defectN = 0;
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    for (const [di, driver] of driverRecords.entries()) {
      const vehicle = vehicleByDriver[driver.id];
      if (!vehicle) continue;
      const checkId = id(`check-${dayIdx}-${di}`);
      const hasDefect = (dayIdx + di) % 9 === 0;
      const data = {
        tenantId, vehicleId: vehicle.id, driverId: driver.id, checkDate: dateOnly(daysFromNow(-dayIdx)), checkTime: timeOnly(6, 15),
        location: 'Main Operating Centre', mileage: vehicle.mileage - dayIdx * 40, nilDefect: !hasDefect, signatureData: 'seed-signature',
      };
      const check = await prisma.walkAroundCheck.upsert({ where: { id: checkId }, update: data, create: { id: checkId, ...data } });
      if (hasDefect) {
        defectN += 1;
        const severity = pick(defectSeverities, defectN);
        const referenceNumber = `DEF-${trailerTag}-${String(defectN).padStart(3, '0')}`;
        const defectData = {
          tenantId, vehicleId: vehicle.id, reportedById: driver.id, walkAroundCheckId: check.id, reportedAt: daysFromNow(-dayIdx),
          defectCategory: pick(defectCategories, defectN), description: `${pick(defectCategories, defectN)} defect found during walk-around check.`,
          severity, vehicleAllowedToContinue: severity !== 'dangerous', status: pick(defectStatuses, defectN),
        };
        await prisma.defectCase.upsert({ where: { referenceNumber }, update: defectData, create: { referenceNumber, ...defectData } });
      }
    }
  }
  const vorVehicleId = vehicleByReg['BW18 PWL'].id;
  const vorDefect = await prisma.defectCase.findFirst({ where: { vehicleId: vorVehicleId } });
  const vorId = id('vor-001');
  await prisma.vorRecord.upsert({
    where: { id: vorId },
    update: { tenantId, vehicleId: vorVehicleId, defectCaseId: vorDefect?.id || null, takenOffRoadDate: daysFromNow(-14), reason: 'Brake system fault - awaiting parts', authorisedById: uid('fleet'), repairGarage: 'Midlands Truck Repairs', estimatedReturnDate: daysFromNow(3) },
    create: { id: vorId, tenantId, vehicleId: vorVehicleId, defectCaseId: vorDefect?.id || null, takenOffRoadDate: daysFromNow(-14), reason: 'Brake system fault - awaiting parts', authorisedById: uid('fleet'), repairGarage: 'Midlands Truck Repairs', estimatedReturnDate: daysFromNow(3) },
  });

  // ── CUSTOMERS / SHIPMENTS / JOBS ────────────────────────────────────
  const customers = [
    ['customer-001', 'Retail Solutions Ltd', 'payg'],
    ['customer-002', 'Northgate Manufacturing', 'account'],
    ['customer-003', 'Blue Ridge Wholesale', 'account'],
    ['customer-004', 'Coastal Distribution Co', 'payg'],
  ];
  for (const [key, name, accountType] of customers) {
    const custId = id(key);
    await prisma.customer.upsert({ where: { id: custId }, update: { tenantId, name, accountType, email: `ops@${name.toLowerCase().replace(/[^a-z]+/g, '')}.example` }, create: { id: custId, tenantId, name, accountType, email: `ops@${name.toLowerCase().replace(/[^a-z]+/g, '')}.example` } });
  }
  const services = ['Next Day Pallet', 'Same Day Courier', 'Multi-drop Route', 'Full Load', 'Groupage'];
  const postcodes = ['B1 1AA', 'M1 2BB', 'LS1 3CC', 'NG1 4DD', 'CV1 5EE', 'DE1 6FF'];
  const shipmentStatusFor = (i) => (i < 16 ? 'delivered' : i < 19 ? 'in_transit' : i === 19 ? 'out_for_delivery' : i < 23 ? 'collected' : 'booked');
  const shipmentAgeDays = (i) => (i < 16 ? 55 - i * 3.4 : i < 19 ? 2 - (i - 16) : i === 19 ? 0 : i < 23 ? -(i - 20) : -3);
  const shipmentRows = [];
  for (let i = 0; i < 24; i++) {
    const status = shipmentStatusFor(i);
    const collectionDate = daysFromNow(-Math.round(shipmentAgeDays(i)));
    const total = 150 + (i % 9) * 45;
    const net = total / 1.2;
    const vat = total - net;
    const shipmentId = id(`shipment-${String(i + 1).padStart(3, '0')}`);
    const custId = id(customers[i % customers.length][0]);
    const data = {
      tenantId, customerId: custId, serviceName: pick(services, i), status,
      pickupAddress: `Unit ${i + 1}, Trading Estate, ${pick(postcodes, i)}`, pickupPostcode: pick(postcodes, i),
      deliveryAddress: `Unit ${i + 5}, Business Park, ${pick(postcodes, i + 2)}`, deliveryPostcode: pick(postcodes, i + 2),
      parcelCount: 1 + (i % 4), weightKg: money(200 + (i % 6) * 150), distanceMiles: money(50 + (i % 10) * 30),
      priceNet: money(net), priceVat: money(vat), priceTotal: money(total), collectionDate,
    };
    const shipment = await prisma.shipment.upsert({ where: { id: shipmentId }, update: data, create: { id: shipmentId, reference: `SHP-${trailerTag}-${1000 + i}`, ...data } });
    shipmentRows.push({ shipment, status, collectionDate, customerId: custId, total, net, vat });

    if (['collected', 'in_transit', 'out_for_delivery', 'delivered'].includes(status)) {
      const driver = pick(driverRecords, i);
      const vehicle = vehicleByDriver[driver.id];
      const jobStatus = status === 'delivered' ? 'completed' : status === 'collected' ? 'accepted' : 'en_route';
      const jobData = { tenantId, driverId: driver.id, vehicleId: vehicle ? vehicle.id : null, status: jobStatus, allocatedById: uid('operations'), allocatedAt: collectionDate, acceptedAt: collectionDate };
      await prisma.job.upsert({ where: { shipmentId: shipment.id }, update: jobData, create: { id: id(`job-${String(i + 1).padStart(3, '0')}`), shipmentId: shipment.id, ...jobData } });
    }
  }

  // ── INVOICES ─────────────────────────────────────────────────────────
  const deliveredShipments = shipmentRows.filter((s) => s.status === 'delivered');
  for (const [i, s] of deliveredShipments.entries()) {
    const status = i < deliveredShipments.length - 3 ? 'paid' : i < deliveredShipments.length - 1 ? 'issued' : 'overdue';
    const number = `INV-${trailerTag}-S-${1000 + i}`;
    const data = {
      tenantId, number, customerId: s.customerId, shipmentId: s.shipment.id, status,
      subtotal: money(s.net), vat: money(s.vat), total: money(s.total), dueDate: new Date(s.collectionDate.getTime() + 14 * 86400000),
      issuedAt: s.collectionDate, paidAt: status === 'paid' ? new Date(s.collectionDate.getTime() + 10 * 86400000) : null,
      createdAt: s.collectionDate,
    };
    await prisma.invoice.upsert({ where: { number }, update: data, create: data });
  }
  for (let w = 0; w < 48; w++) {
    const total = 1800 + (w % 6) * 350;
    const net = total / 1.2;
    const vat = total - net;
    const createdAt = daysFromNow(-(w * 7 + 3));
    const status = w < 44 ? 'paid' : w < 47 ? 'issued' : 'overdue';
    const number = `INV-${trailerTag}-W-${1000 + w}`;
    const data = {
      tenantId, number, customerId: id(customers[w % customers.length][0]), status,
      subtotal: money(net), vat: money(vat), total: money(total), dueDate: new Date(createdAt.getTime() + 21 * 86400000),
      issuedAt: createdAt, paidAt: status === 'paid' ? new Date(createdAt.getTime() + 14 * 86400000) : null, createdAt,
    };
    await prisma.invoice.upsert({ where: { number }, update: data, create: data });
  }

  // ── EXPENSES (weekly across all categories for the past year) ──────
  const expenseCategories = ['fuel', 'maintenance', 'wages', 'insurance', 'admin', 'rent', 'utilities', 'marketing', 'other'];
  const expenseBase = { fuel: 2800, maintenance: 1200, wages: 4200, insurance: 900, admin: 300, rent: 1500, utilities: 400, marketing: 250, other: 200 };
  const expenseDesc = {
    fuel: 'Weekly fuel purchases', maintenance: 'Vehicle maintenance & repairs', wages: 'Driver payroll allocation',
    insurance: 'Fleet insurance premium', admin: 'Office & admin costs', rent: 'Depot rent', utilities: 'Utilities & telecoms',
    marketing: 'Marketing & lead generation', other: 'Miscellaneous operating costs',
  };
  let expenseN = 0;
  for (let w = 0; w < 48; w++) {
    for (let ci = 0; ci < 2; ci++) {
      expenseN += 1;
      const catOffset = (w * 2 + ci) % expenseCategories.length;
      const cat = expenseCategories[catOffset];
      const factor = 0.8 + (w % 5) * 0.1;
      const amount = expenseBase[cat] * factor;
      const expenseDate = dateOnly(daysFromNow(-(w * 7 + ci)));
      const expenseId = id(`expense-${expenseN}`);
      const data = { tenantId, category: cat, description: expenseDesc[cat], amount: money(amount), vatAmount: cat === 'wages' ? '0.00' : money(amount * 0.2), expenseDate, recordedById: uid('finance') };
      await prisma.expense.upsert({ where: { id: expenseId }, update: data, create: { id: expenseId, ...data } });
    }
  }

  // ── COMPLIANCE SCORE HISTORY (fortnightly for ~6 months, trending up) ──
  // ComplianceScore is keyed one-row-per-tenant-per-day, and on a live tenant
  // that day may already hold a REAL score written by the daily compliance
  // cron — upserting here would silently clobber real history with fake
  // numbers, with no way to recover the original. Only fabricate this trend
  // on a fresh local/bootstrapped DB; on live, leave it to the real cron
  // (the dashboard already computes a score on the fly if none exists yet).
  if (bootstrapTenant) {
    for (let p = 0; p < 12; p++) {
      const overall = 74 + p * 1.2;
      const scoreDate = dateOnly(daysFromNow(-(180 - p * 15)));
      const data = { peopleScore: money(overall + 1), fleetScore: money(overall - 3), driverScore: money(overall + 4), overallScore: money(overall), peopleDetails: {}, fleetDetails: {}, driverDetails: {} };
      await prisma.complianceScore.upsert({ where: { tenantId_scoreDate: { tenantId, scoreDate } }, update: { tenantId, scoreDate, ...data }, create: { tenantId, scoreDate, ...data } });
    }
    await prisma.complianceScore.upsert({
      where: { tenantId_scoreDate: { tenantId, scoreDate: dateOnly(new Date()) } },
      update: { peopleScore: '87.00', fleetScore: '83.00', driverScore: '91.00', overallScore: '87.00', peopleDetails: {}, fleetDetails: {}, driverDetails: {} },
      create: { tenantId, scoreDate: dateOnly(new Date()), peopleScore: '87.00', fleetScore: '83.00', driverScore: '91.00', overallScore: '87.00', peopleDetails: {}, fleetDetails: {}, driverDetails: {} },
    });
  }

  // ── COMPLIANCE TASKS ─────────────────────────────────────────────────
  const tasks = [
    ['task-001', 'Review driver infringements', 'critical', 0, 'emp-driver-004', 'driver_compliance'],
    ['task-002', 'Book PMI for MX68 KFK', 'high', 1, 'emp-office-004', 'vehicle_compliance'],
    ['task-003', 'Update training records', 'medium', 4, 'emp-office-005', 'training'],
    ['task-004', 'Renew fleet insurance schedule', 'high', 10, 'emp-office-002', 'insurance'],
    ['task-005', 'Right to work follow-up — Fatima Al-Sayed', 'critical', 20, 'emp-office-001', 'licensing'],
  ];
  for (const [key, title, priority, dueDays, assigneeKey, category] of tasks) {
    const taskId = id(key);
    const data = { tenantId, title, priority, dueDate: daysFromNow(dueDays), assigneeId: id(assigneeKey), status: 'not_started', category, createdById: id('seed') };
    await prisma.complianceTask.upsert({ where: { id: taskId }, update: data, create: { id: taskId, ...data } });
  }

  // ── ALERTS ───────────────────────────────────────────────────────────
  const alerts = [
    ['alert-001', 'pmi_due', 'warning', 'vehicle', vehicleByReg['MX68 KFK'].id, 'MX68 KFK', 'PMI due in 3 days', 3],
    ['alert-002', 'mot_expiry', 'critical', 'vehicle', vehicleByReg['BW18 PWL'].id, 'BW18 PWL', 'MOT expired', -2],
    ['alert-003', 'cpc_expiry', 'warning', 'employee', id('emp-driver-002'), 'Pardeep Brar', 'Driver CPC expiring soon', 7],
    ['alert-004', 'mot_expiry', 'critical', 'vehicle', vehicleByReg['YX18 VHG'].id, 'YX18 VHG', 'MOT expired', -19],
    ['alert-005', 'insurance_expiry', 'warning', 'vehicle', vehicleByReg['PN20 LTY'].id, 'PN20 LTY', 'Insurance expires in 7 days', 7],
    ['alert-006', 'right_to_work_due', 'warning', 'employee', id('emp-driver-010'), 'Fatima Al-Sayed', 'Right to Work check due', 24],
  ];
  for (const [key, alertType, severity, entityType, entityId, entityName, message, daysUntil] of alerts) {
    const alertId = id(key);
    const data = { tenantId, alertType, severity, entityType, entityId, entityName, message, daysUntil, isResolved: false };
    await prisma.alert.upsert({ where: { id: alertId }, update: data, create: { id: alertId, ...data } });
  }

  // ── DRIVER RISK ──────────────────────────────────────────────────────
  for (const [i, driver] of driverRecords.entries()) {
    const data = { tenantId, licenceNumber: `DL${String(100000 + i).padStart(6, '0')}`, licenceClass: 'C+E', dvlaCheckDate: daysFromNow(-60), licencePoints: [0, 0, 3, 0, 6, 0, 0, 3, 0, 0][i] || 0 };
    await prisma.driverRiskProfile.upsert({ where: { driverId: driver.id }, update: data, create: { driverId: driver.id, ...data } });
  }
  const infringements = [
    ['infringement-001', 'emp-driver-003', 'speeding', 'minor', 'open', 3, -12],
    ['infringement-002', 'emp-driver-008', 'drivers_hours', 'major', 'closed', 5, -45],
    ['infringement-003', 'emp-driver-005', 'mobile_phone', 'serious', 'open', 6, -5],
    ['infringement-004', 'emp-driver-002', 'tachograph', 'minor', 'closed', 3, -70],
  ];
  for (const [key, driverKey, type, severity, status, points, daysAgo] of infringements) {
    const driverId = id(driverKey);
    const infId = id(key);
    const data = { tenantId, driverId, type, severity, status, points, infringementDate: daysFromNow(daysAgo), vehicleId: vehicleByDriver[driverId]?.id || null, recordedById: uid('transport') };
    await prisma.driverInfringement.upsert({ where: { id: infId }, update: data, create: { id: infId, ...data } });
  }
  const debriefs = [
    ['debrief-001', 'emp-driver-003', 'coaching', -10],
    ['debrief-002', 'emp-driver-001', 'positive', -30],
  ];
  for (const [key, driverKey, outcome, daysAgo] of debriefs) {
    const debId = id(key);
    const data = { tenantId, driverId: id(driverKey), debriefDate: daysFromNow(daysAgo), outcome, conductedById: uid('transport') };
    await prisma.driverDebrief.upsert({ where: { id: debId }, update: data, create: { id: debId, ...data } });
  }

  return { tenantName: tenant.name, users };
}

module.exports = { seedDemoData };
