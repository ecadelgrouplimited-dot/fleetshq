require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DOMAIN = 'fleetshq.com';
const CONFIRM = 'fleetshq-live-test';

const emails = [
  `test.platform@${DOMAIN}`,
  `test.director@${DOMAIN}`,
  `test.transport@${DOMAIN}`,
  `test.operations@${DOMAIN}`,
  `test.hr@${DOMAIN}`,
  `test.fleet@${DOMAIN}`,
  `test.finance@${DOMAIN}`,
  `test.driver@${DOMAIN}`,
];

async function main() {
  if (process.env.CONFIRM_LIVE_TEST_SEED !== CONFIRM) {
    throw new Error(`Set CONFIRM_LIVE_TEST_SEED=${CONFIRM} to remove live-domain test users.`);
  }

  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.employee.deleteMany({ where: { id: 'live-test-driver-001' } });

  console.log('Temporary live-domain FLEETSHQ test users removed.');
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
