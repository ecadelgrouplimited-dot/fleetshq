const prisma = require('../config/database');
const { daysUntil, alertSeverity } = require('../utils/dateHelpers');
const logger = require('../utils/logger');

const buildMsg = (label, reg, days) => {
  if (days < 0) return `${reg} ${label} is OVERDUE by ${Math.abs(days)} days`;
  if (days === 0) return `${reg} ${label} is due TODAY`;
  return `${reg} ${label} due in ${days} day${days === 1 ? '' : 's'}`;
};

const generateAlerts = async () => {
  const alerts = [];

  // ── Fleet alerts ─────────────────────────────────────
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'sold' } },
    select: { id: true, registration: true, motExpiryDate: true, insuranceExpiryDate: true,
      tachoCalibrExpiry: true, nextPmiDate: true, status: true },
  });

  for (const v of vehicles) {
    const checks = [
      { field: v.nextPmiDate, label: 'PMI', type: 'pmi_due' },
      { field: v.motExpiryDate, label: 'MOT', type: 'mot_expiry' },
      { field: v.insuranceExpiryDate, label: 'Insurance', type: 'insurance_expiry' },
      { field: v.tachoCalibrExpiry, label: 'Tacho Calibration', type: 'tacho_calibration' },
    ];
    for (const c of checks) {
      if (!c.field) continue;
      const days = daysUntil(c.field);
      const sev = alertSeverity(days);
      if (sev) alerts.push({ alertType: c.type, severity: sev, entityType: 'vehicle', entityId: v.id,
        entityName: v.registration, message: buildMsg(c.label, v.registration, days), daysUntil: days });
    }
  }

  // Open dangerous defects (always critical)
  const dangerousDefects = await prisma.defectCase.findMany({
    where: { severity: 'dangerous', status: { not: 'signed_off' } },
    include: { vehicle: { select: { registration: true } } },
  });
  for (const d of dangerousDefects) {
    alerts.push({ alertType: 'open_defect', severity: 'critical', entityType: 'defect', entityId: d.id,
      entityName: d.vehicle.registration, message: `${d.vehicle.registration} has an open DANGEROUS defect: ${d.referenceNumber}`, daysUntil: null });
  }

  // ── People alerts ─────────────────────────────────────
  const sponsored = await prisma.sponsoredWorker.findMany({
    include: { employee: { select: { id: true, fullName: true, employmentStatus: true } } },
  });
  for (const w of sponsored) {
    if (w.employee.employmentStatus !== 'active') continue;
    const visaDays = daysUntil(w.visaExpiryDate);
    const rtwDays = daysUntil(w.rightToWorkFollowupDate);
    const visaSev = alertSeverity(visaDays);
    const rtwSev = alertSeverity(rtwDays);
    if (visaSev) alerts.push({ alertType: 'visa_expiry', severity: visaSev, entityType: 'employee',
      entityId: w.employee.id, entityName: w.employee.fullName,
      message: `${w.employee.fullName} — Visa expires in ${visaDays} days`, daysUntil: visaDays });
    if (rtwSev) alerts.push({ alertType: 'right_to_work_due', severity: rtwSev, entityType: 'employee',
      entityId: w.employee.id, entityName: w.employee.fullName,
      message: `${w.employee.fullName} — Right to Work follow-up due in ${rtwDays} days`, daysUntil: rtwDays });
  }

  // ── Driver alerts ─────────────────────────────────────
  const cpcRecords = await prisma.trainingRecord.findMany({
    where: { trainingType: 'cpc', expiryDate: { not: null } },
    include: { employee: { select: { id: true, fullName: true, employmentStatus: true } } },
  });
  for (const r of cpcRecords) {
    if (r.employee.employmentStatus !== 'active') continue;
    const days = daysUntil(r.expiryDate);
    const sev = alertSeverity(days);
    if (sev) alerts.push({ alertType: 'cpc_expiry', severity: sev, entityType: 'employee',
      entityId: r.employee.id, entityName: r.employee.fullName,
      message: `${r.employee.fullName} — CPC expires in ${days} days`, daysUntil: days });
  }

  // Missed daily checks (active vehicles with assigned drivers, no check today)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const activeVehicles = await prisma.vehicle.findMany({
    where: { status: 'active', assignedDriverId: { not: null } },
    include: {
      assignedDriver: { select: { id: true, fullName: true } },
      checks: { where: { checkDate: { gte: today } }, select: { id: true } },
    },
  });
  for (const v of activeVehicles) {
    if (v.checks.length === 0) {
      alerts.push({ alertType: 'missed_check', severity: 'warning', entityType: 'vehicle',
        entityId: v.id, entityName: v.registration,
        message: `${v.registration} — No daily check submitted today (driver: ${v.assignedDriver.fullName})`, daysUntil: 0 });
    }
  }

  return alerts;
};

const runAlertJob = async () => {
  try {
    logger.info('Running daily alert calculations...');
    const alerts = await generateAlerts();

    // Clear today's unresolved alerts and re-insert fresh ones
    await prisma.alert.deleteMany({ where: { isResolved: false } });

    if (alerts.length > 0) {
      await prisma.alert.createMany({ data: alerts, skipDuplicates: true });
    }

    logger.info(`Alert job complete — ${alerts.length} alerts generated`);

    // Email the digest to the ops inbox (director, cc alerts) when anything is open.
    if (alerts.length > 0) {
      const { sendMail, opsRecipients } = require('./mail.service');
      const emailTemplates = require('./emailTemplates');
      const counts = alerts.reduce((c, a) => { c[a.severity] = (c[a.severity] || 0) + 1; return c; }, {});
      const rank = { critical: 0, warning: 1, notice: 2 };
      const items = [...alerts].sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3));
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/London' });
      await sendMail({ ...opsRecipients(), ...emailTemplates.alertDigest({ dateStr, counts, items }) });
    }

    // Calculate and store compliance score
    const { calculateAndStore } = require('./compliance.service');
    await calculateAndStore();
  } catch (e) {
    logger.error('Alert job failed:', e);
  }
};

module.exports = { runAlertJob, generateAlerts };
