require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { DEFAULT_TENANT_ID } = require('../src/utils/tenantContext');
const { seedDemoData } = require('./lib/demoData');

const prisma = new PrismaClient();
const PASSWORD = process.env.LOCAL_TEST_PASSWORD || 'Demo2024!';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run local test seed in production — use `npm run seed:live-test` instead.');
  }

  // Retire accounts from older generations of this seed so re-runs don't
  // leave orphaned logins around.
  await prisma.user.updateMany({
    where: {
      email: {
        in: [
          'driver@fleetshq.local',
          'platform@256logisticsltd.com', 'director@256logisticsltd.com', 'transport@256logisticsltd.com',
          'operations@256logisticsltd.com', 'hr@256logisticsltd.com', 'fleet@256logisticsltd.com',
          'finance@256logisticsltd.com', 'driver@256logisticsltd.com', 'driver1@256logisticsltd.com',
        ],
      },
    },
    data: { isActive: false, employeeId: null },
  });

  const { tenantName, users } = await seedDemoData({
    prisma,
    tenantId: DEFAULT_TENANT_ID,
    domain: 'fleetshq.local',
    loginPrefix: '',
    password: PASSWORD,
    idPrefix: 'local',
    bootstrapTenant: true,
    strictOwnership: false, // this DB is routinely shared with prisma/seed.js's own demo fleet
  });

  console.log('\nLocal FLEETSHQ test data ready.');
  console.log(`Tenant: ${tenantName}\n`);
  console.log('Logins (all share the same password):');
  console.log(`  Password: ${PASSWORD}\n`);
  users.forEach(({ email, firstName, lastName, role }) => console.log(`  - ${email.padEnd(28)} ${role.padEnd(20)} ${firstName} ${lastName}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
