require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { DEFAULT_TENANT_ID } = require('../src/utils/tenantContext');
const { seedDemoData } = require('./lib/demoData');

const prisma = new PrismaClient();
const DOMAIN = 'fleetshq.com';
const CONFIRM = 'fleetshq-live-test';
const PASSWORD = process.env.LIVE_TEST_PASSWORD;

async function main() {
  if (process.env.CONFIRM_LIVE_TEST_SEED !== CONFIRM) {
    throw new Error(`Set CONFIRM_LIVE_TEST_SEED=${CONFIRM} to create live-domain test data.`);
  }
  if (!PASSWORD || PASSWORD.length < 12) {
    throw new Error('Set LIVE_TEST_PASSWORD to a temporary password with at least 12 characters.');
  }

  const { tenantName, users } = await seedDemoData({
    prisma,
    tenantId: DEFAULT_TENANT_ID,
    domain: DOMAIN,
    loginPrefix: 'test.',
    password: PASSWORD,
    idPrefix: 'live-test',
    bootstrapTenant: false, // never touch the real Tenant/Company/Branch rows
    strictOwnership: true, // abort rather than risk overwriting a real vehicle/trailer
  });

  console.log('\nTemporary live-domain FLEETSHQ demo data ready.');
  console.log(`Tenant: ${tenantName}\n`);
  console.log('Logins (all share the same password):');
  console.log(`  Password: ${PASSWORD}\n`);
  users.forEach(({ email, firstName, lastName, role }) => console.log(`  - ${email.padEnd(30)} ${role.padEnd(20)} ${firstName} ${lastName}`));
  console.log('\nRemove everything after the review with:');
  console.log(`  CONFIRM_LIVE_TEST_SEED=${CONFIRM} npm run seed:live-test:cleanup`);
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
