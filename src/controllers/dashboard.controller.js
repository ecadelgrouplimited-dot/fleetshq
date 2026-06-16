const prisma = require('../config/database');
const { ok } = require('../utils/responseHelper');

exports.summary = async (req, res, next) => {
  try {
    const [
      totalEmployees, sponsoredCount, activeVehicles, vorVehicles, totalVehicles,
      openDefects, alerts, latestScore, todayChecks, pendingToolbox,
    ] = await Promise.all([
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.employee.count({ where: { employmentStatus: 'active', isSponsored: true } }),
      prisma.vehicle.count({ where: { status: 'active' } }),
      prisma.vehicle.count({ where: { status: 'vor' } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' } } }),
      prisma.defectCase.count({ where: { status: { not: 'signed_off' } } }),
      prisma.alert.findMany({
        where: { isResolved: false },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        take: 15,
      }),
      prisma.complianceScore.findFirst({ orderBy: { scoreDate: 'desc' } }),
      prisma.walkAroundCheck.count({ where: { checkDate: { gte: today() } } }),
      prisma.toolboxTalk.count({ where: { managerSignedOff: false } }),
    ]);

    // Specific alert counts
    const alertCounts = {
      rightToWorkDue: alerts.filter(a => a.alertType === 'right_to_work_due').length,
      visaExpiry: alerts.filter(a => a.alertType === 'visa_expiry').length,
      contractsMissing: alerts.filter(a => a.alertType === 'induction_incomplete').length,
      trainingOverdue: alerts.filter(a => ['cpc_expiry', 'induction_incomplete'].includes(a.alertType)).length,
      cpcExpiry: alerts.filter(a => a.alertType === 'cpc_expiry').length,
      pmiDue: alerts.filter(a => a.alertType === 'pmi_due').length,
      motExpiry: alerts.filter(a => a.alertType === 'mot_expiry').length,
      missedChecks: alerts.filter(a => a.alertType === 'missed_check').length,
      licenceChecksDue: alerts.filter(a => a.alertType === 'licence_check_due').length,
    };

    const score = latestScore || await require('../services/compliance.service').calculateAndStore();

    return ok(res, {
      people: {
        totalEmployees,
        sponsoredWorkers: sponsoredCount,
        rightToWorkDue: alertCounts.rightToWorkDue,
        visaExpiryAlerts: alertCounts.visaExpiry,
        contractsMissing: alertCounts.contractsMissing,
      },
      safety: {
        trainingOverdue: alertCounts.trainingOverdue,
        cpcExpiryAlerts: alertCounts.cpcExpiry,
        toolboxTalksPending: pendingToolbox,
      },
      fleet: {
        totalVehicles,
        activeVehicles,
        vehiclesVor: vorVehicles,
        pmiDueSoon: alertCounts.pmiDue,
        motExpiryAlerts: alertCounts.motExpiry,
        openDefects,
      },
      driverRisk: {
        missedWalkAroundChecks: alertCounts.missedChecks,
        licenceChecksDue: alertCounts.licenceChecksDue,
        todayChecksSubmitted: todayChecks,
      },
      complianceScore: {
        people: Number(score.peopleScore ?? score.people),
        fleet: Number(score.fleetScore ?? score.fleet),
        driver: Number(score.driverScore ?? score.driver),
        overall: Number(score.overallScore ?? score.overall),
      },
      alerts: alerts.slice(0, 10).map(a => ({
        id: a.id,
        type: a.alertType,
        severity: a.severity,
        message: a.message,
        entityType: a.entityType,
        entityId: a.entityId,
        daysUntil: a.daysUntil,
      })),
    });
  } catch (e) { next(e); }
};

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
