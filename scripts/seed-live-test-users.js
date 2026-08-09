require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DEFAULT_TENANT_ID } = require('../src/utils/tenantContext');

const prisma = new PrismaClient();
const DOMAIN = 'fleetshq.com';
const CONFIRM = 'fleetshq-live-test';
const PASSWORD = process.env.LIVE_TEST_PASSWORD;

const users = [
  [`test.platform@${DOMAIN}`, 'Test', 'Platform Admin', 'super_admin', ['super_admin', 'director'], null],
  [`test.director@${DOMAIN}`, 'Test', 'Director', 'director', ['director'], null],
  [`test.transport@${DOMAIN}`, 'Test', 'Transport Manager', 'transport_manager', ['transport_manager'], null],
  [`test.operations@${DOMAIN}`, 'Test', 'Operations Manager', 'operations_manager', ['operations_manager'], null],
  [`test.hr@${DOMAIN}`, 'Test', 'HR Manager', 'hr_manager', ['hr_manager'], null],
  [`test.fleet@${DOMAIN}`, 'Test', 'Fleet Manager', 'fleet_manager', ['fleet_manager'], null],
  [`test.finance@${DOMAIN}`, 'Test', 'Finance Officer', 'finance_officer', ['finance_officer'], null],
  [`test.driver@${DOMAIN}`, 'Test', 'Driver', 'driver', ['driver'], 'live-test-driver-001'],
];

const dateFromNow = (days) => {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  if (process.env.CONFIRM_LIVE_TEST_SEED !== CONFIRM) {
    throw new Error(`Set CONFIRM_LIVE_TEST_SEED=${CONFIRM} to create live-domain test users.`);
  }
  if (!PASSWORD || PASSWORD.length < 12) {
    throw new Error('Set LIVE_TEST_PASSWORD to a temporary password with at least 12 characters.');
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: DEFAULT_TENANT_ID } });
  if (!tenant) throw new Error(`Default tenant ${DEFAULT_TENANT_ID} was not found.`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.employee.upsert({
    where: { id: 'live-test-driver-001' },
    update: {
      tenantId: DEFAULT_TENANT_ID,
      fullName: 'Test Driver',
      email: `test.driver.employee@${DOMAIN}`,
      employmentStatus: 'active',
      isDriver: true,
    },
    create: {
      id: 'live-test-driver-001',
      tenantId: DEFAULT_TENANT_ID,
      fullName: 'Test Driver',
      email: `test.driver.employee@${DOMAIN}`,
      dateOfBirth: dateFromNow(-12000),
      homeAddress: 'Temporary live test record',
      phone: '07000000000',
      jobTitle: 'Driver',
      department: 'Transport',
      startDate: dateFromNow(-30),
      employmentStatus: 'active',
      contractedHours: '40.00',
      salary: '30000.00',
      workLocation: 'Live Test',
      isDriver: true,
      isSponsored: false,
    },
  });

  for (const [email, firstName, lastName, role, roles, employeeId] of users) {
    await prisma.user.upsert({
      where: { email },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        firstName,
        lastName,
        role,
        roles,
        employeeId,
        passwordHash,
        isActive: true,
        mustChangePassword: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
      create: {
        tenantId: DEFAULT_TENANT_ID,
        email,
        firstName,
        lastName,
        role,
        roles,
        employeeId,
        passwordHash,
        isActive: true,
        mustChangePassword: false,
      },
    });
  }

  console.log('Temporary live-domain FLEETSHQ test users ready:');
  users.forEach(([email]) => console.log(`- ${email} / ${PASSWORD}`));
  console.log('Remove after testing with: CONFIRM_LIVE_TEST_SEED=fleetshq-live-test npm run seed:live-test:cleanup');
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
