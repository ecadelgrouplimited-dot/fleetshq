require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DOMAIN = 'fleetshq.com';
const CONFIRM = 'fleetshq-live-test';
const ID_PREFIX = 'live-test-';
const REF_TAG = 'LIVETEST';

const emails = [
  'test.platform@fleetshq.com', 'test.director@fleetshq.com', 'test.transport@fleetshq.com',
  'test.operations@fleetshq.com', 'test.hr@fleetshq.com', 'test.fleet@fleetshq.com',
  'test.finance@fleetshq.com', 'test.trainer@fleetshq.com', 'test.driver1@fleetshq.com',
  'test.driver2@fleetshq.com', 'test.garage@fleetshq.com', 'test.client@fleetshq.com',
  // older generation of this script, in case it's still around
  `test.driver@${DOMAIN}`,
];

const byId = { id: { startsWith: ID_PREFIX } };
const byEmployeeId = { employeeId: { startsWith: ID_PREFIX } };
const byDriverId = { driverId: { startsWith: ID_PREFIX } };

async function main() {
  if (process.env.CONFIRM_LIVE_TEST_SEED !== CONFIRM) {
    throw new Error(`Set CONFIRM_LIVE_TEST_SEED=${CONFIRM} to remove live-domain demo data.`);
  }

  // Deleted in FK-safe order: children before the parents they reference.
  await prisma.toolboxTalkAssignment.deleteMany({ where: byEmployeeId });
  await prisma.toolboxTalk.deleteMany({ where: byId });
  await prisma.courseEnrolment.deleteMany({ where: byEmployeeId });
  await prisma.course.deleteMany({ where: byId });
  await prisma.trainingRecord.deleteMany({ where: byEmployeeId });
  await prisma.leaveRequest.deleteMany({ where: byId });
  await prisma.employeeShift.deleteMany({ where: byId });
  await prisma.driverDebrief.deleteMany({ where: byId });
  await prisma.driverInfringement.deleteMany({ where: byId });
  await prisma.driverRiskProfile.deleteMany({ where: byDriverId });
  await prisma.vorRecord.deleteMany({ where: byId });
  await prisma.defectCase.deleteMany({ where: { referenceNumber: { startsWith: `DEF-${REF_TAG}-` } } });
  await prisma.walkAroundCheck.deleteMany({ where: byId });
  await prisma.sponsoredWorker.deleteMany({ where: byEmployeeId });
  await prisma.job.deleteMany({ where: byId });
  await prisma.invoice.deleteMany({ where: { number: { startsWith: `INV-${REF_TAG}-` } } });
  await prisma.shipment.deleteMany({ where: byId });
  await prisma.expense.deleteMany({ where: byId });
  await prisma.customer.deleteMany({ where: byId });
  await prisma.alert.deleteMany({ where: byId });
  await prisma.complianceTask.deleteMany({ where: byId });
  await prisma.fuelLog.deleteMany({ where: byId });
  await prisma.adBlueLog.deleteMany({ where: byId });
  await prisma.vehicle.deleteMany({ where: byId });
  await prisma.trailer.deleteMany({ where: byId });
  // Users reference Employee (employeeId), so they must go before Employee.
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.employee.deleteMany({ where: byId });

  console.log('Temporary live-domain FLEETSHQ demo data removed.');
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
