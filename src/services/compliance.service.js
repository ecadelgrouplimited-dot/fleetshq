const prisma = require('../config/database');
const { daysUntil } = require('../utils/dateHelpers');
const logger = require('../utils/logger');

const WEIGHTS = {
  people: parseFloat(process.env.SCORE_WEIGHT_PEOPLE) || 0.35,
  fleet: parseFloat(process.env.SCORE_WEIGHT_FLEET) || 0.35,
  driver: parseFloat(process.env.SCORE_WEIGHT_DRIVER) || 0.30,
};

const clamp = (n) => Math.max(0, Math.min(100, n));

const calcPeopleScore = async () => {
  let score = 100;
  const details = {};

  const employees = await prisma.employee.findMany({
    where: { employmentStatus: 'active' },
    include: { documents: { select: { documentType: true, expiryDate: true } }, sponsoredWorker: true },
  });

  const required = ['contract', 'passport', 'right_to_work'];
  let missingDocs = 0, expiredDocs = 0, sponsorAlerts = 0;

  for (const emp of employees) {
    const types = emp.documents.map(d => d.documentType);
    const missing = required.filter(r => !types.includes(r));
    missingDocs += missing.length;

    const expired = emp.documents.filter(d => d.expiryDate && daysUntil(d.expiryDate) < 0);
    expiredDocs += expired.length;

    if (emp.sponsoredWorker) {
      const visaDays = daysUntil(emp.sponsoredWorker.visaExpiryDate);
      if (visaDays !== null && visaDays <= 14) sponsorAlerts++;
    }
  }

  score -= missingDocs * 2;
  score -= expiredDocs * 3;
  score -= sponsorAlerts * 10;

  details.totalEmployees = employees.length;
  details.missingDocuments = missingDocs;
  details.expiredDocuments = expiredDocs;
  details.sponsorAlerts = sponsorAlerts;

  return { score: clamp(score), details };
};

const calcFleetScore = async () => {
  let score = 100;
  const details = {};

  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'sold' } },
    select: { id: true, nextPmiDate: true, motExpiryDate: true, status: true },
  });

  let pmiOverdue = 0, motCritical = 0;
  for (const v of vehicles) {
    if (v.nextPmiDate && daysUntil(v.nextPmiDate) < 0) pmiOverdue++;
    if (v.motExpiryDate && daysUntil(v.motExpiryDate) <= 14) motCritical++;
  }

  const openDangerous = await prisma.defectCase.count({
    where: { severity: 'dangerous', status: { not: 'signed_off' } },
  });
  const openSerious = await prisma.defectCase.count({
    where: { severity: 'serious', status: { not: 'signed_off' } },
  });

  score -= pmiOverdue * 15;
  score -= motCritical * 10;
  score -= openDangerous * 15;
  score -= openSerious * 5;

  details.totalVehicles = vehicles.length;
  details.pmiOverdue = pmiOverdue;
  details.motCritical = motCritical;
  details.openDangerousDefects = openDangerous;
  details.openSeriousDefects = openSerious;

  return { score: clamp(score), details };
};

const calcDriverScore = async () => {
  let score = 100;
  const details = {};

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const drivers = await prisma.employee.findMany({
    where: { isDriver: true, employmentStatus: 'active' },
    include: {
      trainingRecords: { where: { trainingType: 'induction', status: { not: 'completed' } } },
    },
  });

  const incompleteInduction = drivers.filter(d => {
    const daysSinceStart = Math.floor((Date.now() - new Date(d.startDate)) / 86400000);
    return daysSinceStart > 28 && d.trainingRecords.length > 0;
  }).length;

  const missedChecks = await prisma.alert.count({
    where: { alertType: 'missed_check', isResolved: false },
  });

  const cpcExpiring = await prisma.alert.count({
    where: { alertType: 'cpc_expiry', severity: 'critical', isResolved: false },
  });

  score -= incompleteInduction * 5;
  score -= missedChecks * 3;
  score -= cpcExpiring * 8;

  details.totalDrivers = drivers.length;
  details.incompleteInduction = incompleteInduction;
  details.missedChecks = missedChecks;
  details.cpcExpiring = cpcExpiring;

  return { score: clamp(score), details };
};

const calculateAndStore = async () => {
  const [people, fleet, driver] = await Promise.all([calcPeopleScore(), calcFleetScore(), calcDriverScore()]);
  const overall = clamp(
    people.score * WEIGHTS.people + fleet.score * WEIGHTS.fleet + driver.score * WEIGHTS.driver
  );

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Scores are per-tenant per-day. Resolve the tenant from the request/cron
  // context (falls back to the platform tenant for legacy callers).
  const { getTenantId, DEFAULT_TENANT_ID } = require('../utils/tenantContext');
  const tenantId = getTenantId() || DEFAULT_TENANT_ID;

  await prisma.complianceScore.upsert({
    where: { tenantId_scoreDate: { tenantId, scoreDate: today } },
    update: { peopleScore: people.score, fleetScore: fleet.score, driverScore: driver.score,
      overallScore: overall, peopleDetails: people.details, fleetDetails: fleet.details, driverDetails: driver.details },
    create: { tenantId, scoreDate: today, peopleScore: people.score, fleetScore: fleet.score,
      driverScore: driver.score, overallScore: overall, peopleDetails: people.details,
      fleetDetails: fleet.details, driverDetails: driver.details },
  });

  logger.info(`Compliance scores — People: ${people.score} Fleet: ${fleet.score} Driver: ${driver.score} Overall: ${overall}`);
  return { people: people.score, fleet: fleet.score, driver: driver.score, overall };
};

module.exports = { calculateAndStore };
