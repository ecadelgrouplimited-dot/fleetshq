require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DEFAULT_TENANT_ID } = require('../src/utils/tenantContext');

const prisma = new PrismaClient();
const PASSWORD = process.env.LOCAL_TEST_PASSWORD || 'Demo2024!';
const tenantId = DEFAULT_TENANT_ID;
const USER_DOMAIN = 'fleetshq.local';

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

const mondayOfThisWeek = () => {
  const d = dateOnly(new Date());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

async function upsertEmployee(data) {
  return prisma.employee.upsert({
    where: { id: data.id },
    update: data,
    create: data,
  });
}

async function upsertUser({ email, firstName, lastName, role, roles, employeeId = null, passwordHash }) {
  return prisma.user.upsert({
    where: { email },
    update: { tenantId, firstName, lastName, role, roles, employeeId, passwordHash, isActive: true, mustChangePassword: false },
    create: { tenantId, email, firstName, lastName, role, roles, employeeId, passwordHash, isActive: true, mustChangePassword: false },
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run local test seed in production.');
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await prisma.user.updateMany({
    where: {
      email: {
        in: [
          `driver@${USER_DOMAIN}`,
          'platform@256logisticsltd.com',
          'director@256logisticsltd.com',
          'transport@256logisticsltd.com',
          'operations@256logisticsltd.com',
          'hr@256logisticsltd.com',
          'fleet@256logisticsltd.com',
          'finance@256logisticsltd.com',
          'driver@256logisticsltd.com',
          'driver1@256logisticsltd.com',
        ],
      },
    },
    data: { isActive: false, employeeId: null },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: { name: 'FLEETSHQ Local', status: 'active' },
    create: { id: tenantId, name: 'FLEETSHQ Local', slug: 'default', plan: 'growth', status: 'active' },
  });

  const company = await prisma.company.upsert({
    where: { id: 'local-company-001' },
    update: { tenantId, name: 'FLEETSHQ Operations', legalName: 'FLEETSHQ Ltd', operatorLicenceNumber: 'OF1234567', timezone: 'Europe/London' },
    create: { id: 'local-company-001', tenantId, name: 'FLEETSHQ Operations', legalName: 'FLEETSHQ Ltd', operatorLicenceNumber: 'OF1234567', timezone: 'Europe/London' },
  });

  await prisma.branch.upsert({
    where: { id: 'local-branch-001' },
    update: { tenantId, companyId: company.id, name: 'Main Operating Centre', address: 'Unit 8, Logistics Park, Birmingham' },
    create: { id: 'local-branch-001', tenantId, companyId: company.id, name: 'Main Operating Centre', address: 'Unit 8, Logistics Park, Birmingham' },
  });

  const drivers = [
    ['emp-driver-001', 'Mulindwa Denis', `mulindwa.denis@${USER_DOMAIN}`, 'HGV Driver', 'Birmingham'],
    ['emp-driver-002', 'Pardeep Brar', `pardeep.brar@${USER_DOMAIN}`, 'Driver', 'Linehaul'],
    ['emp-driver-003', 'Jashanjot Singh', `jashanjot.singh@${USER_DOMAIN}`, 'Driver', 'Collections'],
    ['emp-driver-004', 'Nimal Perera', `nimal.perera@${USER_DOMAIN}`, 'Driver', 'Multi-drop'],
    ['emp-driver-005', 'Julius Relief', `julius.relief@${USER_DOMAIN}`, 'Relief Driver', 'Relief Pool'],
    ['emp-driver-006', 'Caroline Nampijja', `caroline.nampijja@${USER_DOMAIN}`, 'Transport Manager', 'Office'],
  ];

  const employeeRecords = [];
  for (const [id, fullName, email, jobTitle, workLocation] of drivers) {
    employeeRecords.push(await upsertEmployee({
      id, tenantId, fullName, email, jobTitle, workLocation,
      dateOfBirth: daysFromNow(-12000),
      homeAddress: 'Local demo address',
      phone: '07000000000',
      department: jobTitle.includes('Manager') ? 'Operations' : 'Transport',
      startDate: daysFromNow(-900),
      employmentStatus: 'active',
      contractedHours: '40.00',
      salary: jobTitle.includes('Manager') ? '42000.00' : '34000.00',
      isDriver: true,
      isSponsored: false,
    }));
  }

  const users = [
    [`platform@${USER_DOMAIN}`, 'Platform', 'Admin', 'super_admin', ['super_admin', 'director'], null],
    [`director@${USER_DOMAIN}`, 'FLEETSHQ', 'Director', 'director', ['director'], null],
    [`transport@${USER_DOMAIN}`, 'Transport', 'Manager', 'transport_manager', ['transport_manager'], null],
    [`operations@${USER_DOMAIN}`, 'Operations', 'Manager', 'operations_manager', ['operations_manager'], null],
    [`hr@${USER_DOMAIN}`, 'HR', 'Manager', 'hr_manager', ['hr_manager'], null],
    [`fleet@${USER_DOMAIN}`, 'Fleet', 'Manager', 'fleet_manager', ['fleet_manager'], null],
    [`finance@${USER_DOMAIN}`, 'Finance', 'Officer', 'finance_officer', ['finance_officer'], null],
    [`driver1@${USER_DOMAIN}`, 'Mulindwa', 'Denis', 'driver', ['driver'], 'emp-driver-001'],
  ];
  for (const [email, firstName, lastName, role, roles, employeeId] of users) {
    await upsertUser({ email, firstName, lastName, role, roles, employeeId, passwordHash });
  }

  const vehicles = [
    ['veh-001', 'NU66 XVB', 'VINLOCAL001', 'DAF', 'XF', 2020, 'emp-driver-001', 'active', 98400],
    ['veh-002', 'FN16 EVK', 'VINLOCAL002', 'Volvo', 'FH', 2019, 'emp-driver-002', 'active', 112300],
    ['veh-003', 'BW18 PWL', 'VINLOCAL003', 'Scania', 'R450', 2021, 'emp-driver-003', 'vor', 87550],
    ['veh-004', 'MX68 KFK', 'VINLOCAL004', 'Mercedes', 'Actros', 2022, 'emp-driver-004', 'active', 64120],
  ];
  for (const [id, registration, vinNumber, make, model, year, assignedDriverId, status, currentMileage] of vehicles) {
    await prisma.vehicle.upsert({
      where: { registration },
      update: { tenantId, vinNumber, make, model, year, assignedDriverId, status, currentMileage, motExpiryDate: daysFromNow(90), insuranceExpiryDate: daysFromNow(45), roadTaxExpiryDate: daysFromNow(120), tachoCalibrExpiry: daysFromNow(70), lastPmiDate: daysFromNow(-21), nextPmiDate: daysFromNow(14) },
      create: { id, tenantId, registration, vinNumber, make, model, year, assignedDriverId, status, currentMileage, motExpiryDate: daysFromNow(90), insuranceExpiryDate: daysFromNow(45), roadTaxExpiryDate: daysFromNow(120), tachoCalibrExpiry: daysFromNow(70), lastPmiDate: daysFromNow(-21), nextPmiDate: daysFromNow(14) },
    });
  }

  const trailers = [
    ['TRL-001', 'Schmitz', 'Curtainsider', 2021, 'active', 80, 95, 18],
    ['TRL-002', 'Krone', 'Box', 2020, 'active', 20, 40, 10],
    ['TRL-003', 'Dennison', 'Flatbed', 2019, 'vor', -4, 30, -2],
  ];
  for (const [registration, make, model, year, status, motDays, insuranceDays, pmiDays] of trailers) {
    await prisma.trailer.upsert({
      where: { registration },
      update: { tenantId, make, model, year, status, motExpiryDate: daysFromNow(motDays), insuranceExpiryDate: daysFromNow(insuranceDays), nextPmiDate: daysFromNow(pmiDays) },
      create: { tenantId, registration, make, model, year, status, motExpiryDate: daysFromNow(motDays), insuranceExpiryDate: daysFromNow(insuranceDays), nextPmiDate: daysFromNow(pmiDays) },
    });
  }

  const weekStart = mondayOfThisWeek();
  const statuses = ['assigned', 'assigned', 'assigned', 'assigned', 'rest_day', 'relief_cover', 'on_site'];
  for (let e = 0; e < employeeRecords.length; e++) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const status = i >= 5 ? 'rest_day' : statuses[(e + i) % statuses.length];
      await prisma.employeeShift.upsert({
        where: { id: `local-shift-${e + 1}-${i + 1}` },
        update: { tenantId, employeeId: employeeRecords[e].id, vehicleId: vehicles[e % vehicles.length][0], shiftDate: date, status, startTime: status === 'rest_day' ? null : '06:00', endTime: status === 'rest_day' ? null : '16:00', routeLabel: status === 'assigned' ? `${vehicles[e % vehicles.length][1]} -> ${vehicles[(e + 1) % vehicles.length][1]}` : null, location: status === 'on_site' ? 'Operating Centre' : null },
        create: { id: `local-shift-${e + 1}-${i + 1}`, tenantId, employeeId: employeeRecords[e].id, vehicleId: vehicles[e % vehicles.length][0], shiftDate: date, status, startTime: status === 'rest_day' ? null : '06:00', endTime: status === 'rest_day' ? null : '16:00', routeLabel: status === 'assigned' ? `${vehicles[e % vehicles.length][1]} -> ${vehicles[(e + 1) % vehicles.length][1]}` : null, location: status === 'on_site' ? 'Operating Centre' : null, createdById: 'local-seed' },
      });
    }
  }

  for (let i = 0; i < 18; i++) {
    const vehicle = vehicles[i % vehicles.length];
    await prisma.fuelLog.upsert({
      where: { id: `local-fuel-${i + 1}` },
      update: { tenantId, vehicleId: vehicle[0], loggedDate: daysFromNow(-i), litres: String(180 + (i % 5) * 22), cost: String(270 + (i % 5) * 35), odometer: vehicle[8] + i * 220, createdById: 'local-seed' },
      create: { id: `local-fuel-${i + 1}`, tenantId, vehicleId: vehicle[0], loggedDate: daysFromNow(-i), litres: String(180 + (i % 5) * 22), cost: String(270 + (i % 5) * 35), odometer: vehicle[8] + i * 220, createdById: 'local-seed' },
    });
    await prisma.adBlueLog.upsert({
      where: { id: `local-adblue-${i + 1}` },
      update: { tenantId, vehicleId: vehicle[0], loggedDate: daysFromNow(-i), litres: String(28 + (i % 4) * 6), cost: String(24 + (i % 4) * 5), odometer: vehicle[8] + i * 220, createdById: 'local-seed' },
      create: { id: `local-adblue-${i + 1}`, tenantId, vehicleId: vehicle[0], loggedDate: daysFromNow(-i), litres: String(28 + (i % 4) * 6), cost: String(24 + (i % 4) * 5), odometer: vehicle[8] + i * 220, createdById: 'local-seed' },
    });
  }

  const customer = await prisma.customer.upsert({
    where: { id: 'local-customer-001' },
    update: { tenantId, name: 'FLEETSHQ Retail Account', email: `ops@${USER_DOMAIN}` },
    create: { id: 'local-customer-001', tenantId, name: 'FLEETSHQ Retail Account', email: `ops@${USER_DOMAIN}` },
  });
  await prisma.invoice.upsert({
    where: { number: 'INV-LOCAL-001' },
    update: { tenantId, customerId: customer.id, status: 'issued', subtotal: '52000.00', vat: '10400.00', total: '62400.00', dueDate: daysFromNow(21) },
    create: { tenantId, number: 'INV-LOCAL-001', customerId: customer.id, status: 'issued', subtotal: '52000.00', vat: '10400.00', total: '62400.00', dueDate: daysFromNow(21) },
  });
  for (const [id, category, description, amount] of [
    ['local-exp-001', 'fuel', 'Monthly fuel purchases', '12800.00'],
    ['local-exp-002', 'maintenance', 'PMI and repairs', '6300.00'],
    ['local-exp-003', 'wages', 'Driver payroll allocation', '18400.00'],
  ]) {
    await prisma.expense.upsert({
      where: { id },
      update: { tenantId, category, description, amount, vatAmount: '0.00', expenseDate: dateOnly(new Date()), recordedById: 'local-seed' },
      create: { id, tenantId, category, description, amount, vatAmount: '0.00', expenseDate: dateOnly(new Date()), recordedById: 'local-seed' },
    });
  }

  await prisma.complianceScore.upsert({
    where: { tenantId_scoreDate: { tenantId, scoreDate: dateOnly(new Date()) } },
    update: { peopleScore: '87.00', fleetScore: '83.00', driverScore: '91.00', overallScore: '87.00', peopleDetails: {}, fleetDetails: {}, driverDetails: {} },
    create: { tenantId, scoreDate: dateOnly(new Date()), peopleScore: '87.00', fleetScore: '83.00', driverScore: '91.00', overallScore: '87.00', peopleDetails: {}, fleetDetails: {}, driverDetails: {} },
  });

  for (const [id, title, priority, dueDays, assigneeId] of [
    ['local-task-001', 'Review driver infringements', 'critical', 0, 'emp-driver-004'],
    ['local-task-002', 'Book PMI for MX68 KFK', 'high', 1, 'emp-driver-006'],
    ['local-task-003', 'Update training records', 'medium', 4, 'emp-driver-006'],
  ]) {
    await prisma.complianceTask.upsert({
      where: { id },
      update: { tenantId, title, priority, dueDate: daysFromNow(dueDays), assigneeId, status: 'not_started', category: 'vehicle_compliance', createdById: 'local-seed' },
      create: { id, tenantId, title, priority, dueDate: daysFromNow(dueDays), assigneeId, status: 'not_started', category: 'vehicle_compliance', createdById: 'local-seed' },
    });
  }

  for (const [id, alertType, severity, entityType, entityId, entityName, message, daysUntil] of [
    ['local-alert-001', 'pmi_due', 'warning', 'vehicle', 'veh-004', 'MX68 KFK', 'PMI due in 3 days', 3],
    ['local-alert-002', 'mot_expiry', 'critical', 'vehicle', 'veh-003', 'BW18 PWL', 'MOT expired', -2],
    ['local-alert-003', 'cpc_expiry', 'warning', 'employee', 'emp-driver-002', 'Pardeep Brar', 'Driver CPC expiring soon', 7],
  ]) {
    await prisma.alert.upsert({
      where: { id },
      update: { tenantId, alertType, severity, entityType, entityId, entityName, message, daysUntil, isResolved: false },
      create: { id, tenantId, alertType, severity, entityType, entityId, entityName, message, daysUntil, isResolved: false },
    });
  }

  console.log('Local FLEETSHQ test users ready:');
  users.forEach(([email]) => console.log(`- ${email} / ${PASSWORD}`));
  console.log(`Tenant: ${tenant.name}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
