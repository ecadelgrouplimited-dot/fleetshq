const router = require('express').Router();
const cookieParser = require('cookie-parser');
const prisma = require('../config/database');
const { verify } = require('../config/jwt');
const { daysUntil, formatDate } = require('../utils/dateHelpers');
const { TRAINING_LABELS, CHECK_ITEM_LABELS, CHECK_ITEMS } = require('../utils/constants');

router.use(cookieParser());

// Web auth middleware
const webAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect('/login');
  const payload = verify(token);
  if (!payload) return res.redirect('/login');
  req.user = payload;
  res.locals.user = payload;
  res.locals.formatDate = formatDate;
  res.locals.daysUntil = daysUntil;
  next();
};

// ── Auth Pages ─────────────────────────────────────────
router.get('/login', (req, res) => {
  const token = req.cookies?.token;
  if (token && verify(token)) return res.redirect('/');
  res.render('auth/login', { title: 'Login', error: null });
});

router.post('/login', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { sign } = require('../config/jwt');
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase().trim() } });
    if (!user || !user.isActive) return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });

    const token = sign({ id: user.id, role: user.role, email: user.email,
      name: `${user.firstName} ${user.lastName}`, employeeId: null });

    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
    res.redirect('/');
  } catch (e) {
    res.render('auth/login', { title: 'Login', error: 'Login failed. Please try again.' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// ── Dashboard ──────────────────────────────────────────
router.get('/', webAuth, async (req, res) => {
  try {
    const [totalEmp, sponsoredCount, totalVehicles, activeVehicles, vorVehicles,
      openDefects, alerts, latestScore, missedChecks, pendingToolbox, recentDefects] = await Promise.all([
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.employee.count({ where: { employmentStatus: 'active', isSponsored: true } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' } } }),
      prisma.vehicle.count({ where: { status: 'active' } }),
      prisma.vehicle.count({ where: { status: 'vor' } }),
      prisma.defectCase.count({ where: { status: { not: 'signed_off' } } }),
      prisma.alert.findMany({ where: { isResolved: false }, orderBy: [{ severity: 'asc' },{ createdAt: 'desc' }], take: 12 }),
      prisma.complianceScore.findFirst({ orderBy: { scoreDate: 'desc' } }),
      prisma.alert.count({ where: { alertType: 'missed_check', isResolved: false } }),
      prisma.toolboxTalk.count({ where: { managerSignedOff: false } }),
      prisma.defectCase.findMany({
        where: { status: { not: 'signed_off' } },
        include: { vehicle: { select: { registration: true } } },
        orderBy: { reportedAt: 'desc' }, take: 5,
      }),
    ]);

    const score = latestScore || { peopleScore: 88, fleetScore: 76, driverScore: 82, overallScore: 82 };
    const alertGroups = {
      critical: alerts.filter(a => a.severity === 'critical'),
      warning: alerts.filter(a => a.severity === 'warning'),
      notice: alerts.filter(a => a.severity === 'notice'),
    };

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: { totalEmp, sponsoredCount, totalVehicles, activeVehicles, vorVehicles, openDefects, missedChecks, pendingToolbox },
      score: { people: Number(score.peopleScore), fleet: Number(score.fleetScore),
        driver: Number(score.driverScore), overall: Number(score.overallScore) },
      alerts, alertGroups, recentDefects,
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Employees ──────────────────────────────────────────
router.get('/employees', webAuth, async (req, res) => {
  try {
    const { search, status = 'active', department, type = '' } = req.query;
    const where = {};
    if (status) where.employmentStatus = status;
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (type === 'drivers') where.isDriver = true;
    if (type === 'sponsored') where.isSponsored = true;
    if (search) where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { jobTitle: { contains: search, mode: 'insensitive' } },
    ];

    const [employees, departments] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          documents: { select: { documentType: true, expiryDate: true } },
          drivingVehicle: { select: { registration: true } },
        },
        orderBy: { fullName: 'asc' },
      }),
      prisma.employee.findMany({ select: { department: true }, distinct: ['department'], orderBy: { department: 'asc' } }),
    ]);

    const required = ['contract', 'passport', 'right_to_work'];
    let enriched = employees.map(e => ({
      ...e,
      missingDocs: required.filter(r => !e.documents.find(d => d.documentType === r)).length,
    }));
    if (type === 'missing_docs') enriched = enriched.filter(e => e.missingDocs > 0);

    res.render('employees/index', { title: 'People & Compliance', employees: enriched,
      departments: departments.map(d => d.department), filters: { search, status, department, type } });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/employees/new', webAuth, async (req, res) => {
  const managers = await prisma.employee.findMany({ where: { employmentStatus: 'active' },
    select: { id: true, fullName: true, jobTitle: true }, orderBy: { fullName: 'asc' } });
  const vehicles = await prisma.vehicle.findMany({ where: { status: 'active', assignedDriverId: null },
    select: { id: true, registration: true, make: true, model: true } });
  res.render('employees/form', { title: 'Add Employee', employee: null, managers, vehicles, errors: [] });
});

router.get('/employees/:id/edit', webAuth, async (req, res) => {
  try {
    const [emp, managers] = await Promise.all([
      prisma.employee.findUnique({ where: { id: req.params.id } }),
      prisma.employee.findMany({ where: { employmentStatus: 'active', id: { not: req.params.id } },
        select: { id: true, fullName: true, jobTitle: true }, orderBy: { fullName: 'asc' } }),
    ]);
    if (!emp) return res.redirect('/employees');
    res.render('employees/edit', { title: `Edit — ${emp.fullName}`, emp, managers, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/employees/:id', webAuth, async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        documents: { orderBy: { createdAt: 'desc' } },
        trainingRecords: { orderBy: { trainingType: 'asc' } },
        acknowledgements: { orderBy: { signedAt: 'desc' } },
        drivingVehicle: true,
        lineManager: { select: { id: true, fullName: true } },
        sponsoredWorker: { include: { changes: { orderBy: { createdAt: 'desc' } } } },
      },
    });
    if (!emp) return res.redirect('/employees');

    const { TRAINING_TYPES } = require('../utils/constants');
    const existingTraining = Object.fromEntries(emp.trainingRecords.map(r => [r.trainingType, r]));
    const trainingMatrix = TRAINING_TYPES.map(type => ({
      trainingType: type, label: TRAINING_LABELS[type],
      ...(existingTraining[type] || { status: 'not_started', completedDate: null, expiryDate: null }),
    }));
    const completionPercent = Math.round(
      (trainingMatrix.filter(t => t.status === 'completed').length / TRAINING_TYPES.length) * 100
    );

    res.render('employees/show', { title: emp.fullName, emp, trainingMatrix, completionPercent,
      daysUntil, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Sponsored Workers ──────────────────────────────────
router.get('/sponsored-workers', webAuth, async (req, res) => {
  try {
    const workers = await prisma.sponsoredWorker.findMany({
      include: {
        employee: { select: { id: true, fullName: true, jobTitle: true, department: true, employmentStatus: true } },
        changes: { where: { reportedToHomeOffice: false } },
      },
      orderBy: { employee: { fullName: 'asc' } },
    });
    res.render('sponsored/index', { title: 'Sponsored Workers', workers,
      daysUntil, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Training & Competency ──────────────────────────────
router.get('/training', webAuth, async (req, res) => {
  try {
    const drivers = await prisma.employee.findMany({
      where: { isDriver: true, employmentStatus: 'active' },
      include: { trainingRecords: true },
      orderBy: { fullName: 'asc' },
    });

    const { TRAINING_TYPES } = require('../utils/constants');
    const enriched = drivers.map(d => {
      const completed = d.trainingRecords.filter(r => r.status === 'completed').length;
      return { ...d, completionPercent: Math.round((completed / TRAINING_TYPES.length) * 100) };
    });

    const talks = await prisma.toolboxTalk.findMany({
      include: { issuedBy: { select: { firstName: true, lastName: true } },
        assignments: { select: { signedAt: true } } },
      orderBy: { dateIssued: 'desc' }, take: 10,
    });

    res.render('training/index', { title: 'Training & Competency', drivers: enriched,
      talks: talks.map(t => ({ ...t, totalSigned: t.assignments.filter(a => a.signedAt).length })), formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Fleet & Roadworthiness ─────────────────────────────
router.get('/fleet', webAuth, async (req, res) => {
  try {
    const { status = '', due = '' } = req.query;
    const where = {};
    if (status) where.status = status;
    else where.status = { not: 'sold' };

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        assignedDriver: { select: { fullName: true } },
        defects: { where: { status: { not: 'signed_off' } }, select: { id: true, severity: true } },
        checks: { orderBy: { checkDate: 'desc' }, take: 1 },
      },
      orderBy: { registration: 'asc' },
    });

    let enriched = vehicles.map(v => ({
      ...v,
      motDays: daysUntil(v.motExpiryDate),
      insuranceDays: daysUntil(v.insuranceExpiryDate),
      pmiDays: daysUntil(v.nextPmiDate),
      lastCheckDate: v.checks[0]?.checkDate || null,
    }));

    if (due === 'pmi_overdue') enriched = enriched.filter(v => v.pmiDays !== null && v.pmiDays < 0);
    if (due === 'pmi_due_14') enriched = enriched.filter(v => v.pmiDays !== null && v.pmiDays >= 0 && v.pmiDays <= 14);
    if (due === 'mot_due_30') enriched = enriched.filter(v => v.motDays !== null && v.motDays >= 0 && v.motDays <= 30);
    if (due === 'open_defects') enriched = enriched.filter(v => v.defects.length > 0);
    if (due === 'unassigned') enriched = enriched.filter(v => !v.assignedDriver);

    res.render('vehicles/index', { title: 'Fleet & Roadworthiness', vehicles: enriched, filters: { status, due }, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Add Vehicle (must be before /fleet/:id) ───────────────
router.get('/fleet/new', webAuth, async (req, res) => {
  try {
    const drivers = await prisma.employee.findMany({
      where: { isDriver: true, employmentStatus: 'active' },
      select: { id: true, fullName: true }, orderBy: { fullName: 'asc' },
    });
    res.render('vehicles/form', { title: 'Add Vehicle', vehicle: null, drivers, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/fleet/:id/edit', webAuth, async (req, res) => {
  try {
    const [vehicle, drivers] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: req.params.id } }),
      prisma.employee.findMany({
        where: { isDriver: true, employmentStatus: 'active' },
        select: { id: true, fullName: true },
        orderBy: { fullName: 'asc' },
      }),
    ]);
    if (!vehicle) return res.redirect('/fleet');
    res.render('vehicles/form', { title: `Edit ${vehicle.registration}`, vehicle, drivers, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/fleet/pmi-planner', webAuth, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { not: 'sold' } },
      include: { assignedDriver: { select: { fullName: true } } },
      orderBy: { nextPmiDate: 'asc' },
    });
    const enriched = vehicles.map(v => ({ ...v, pmiDays: daysUntil(v.nextPmiDate) }));
    res.render('vehicles/pmi-planner', { title: 'PMI Planner', vehicles: enriched, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/fleet/:id', webAuth, async (req, res) => {
  try {
    const v = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        assignedDriver: { select: { id: true, fullName: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        defects: { include: { reportedBy: { select: { fullName: true } } }, orderBy: { reportedAt: 'desc' }, take: 10 },
        checks: { include: { driver: { select: { fullName: true } }, items: true }, orderBy: { checkDate: 'desc' }, take: 7 },
        vorRecords: { orderBy: { takenOffRoadDate: 'desc' }, take: 5 },
      },
    });
    if (!v) return res.redirect('/fleet');
    res.render('vehicles/show', { title: `Vehicle ${v.registration}`, vehicle: v, formatDate, daysUntil });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Daily Checks ───────────────────────────────────────
router.get('/checks', webAuth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [checks, missed] = await Promise.all([
      prisma.walkAroundCheck.findMany({
        include: {
          vehicle: { select: { registration: true } },
          driver: { select: { fullName: true } },
          items: true,
        },
        orderBy: [{ checkDate: 'desc' }, { submittedAt: 'desc' }],
        take: 30,
      }),
      prisma.vehicle.findMany({
        where: { status: 'active', assignedDriverId: { not: null } },
        include: {
          assignedDriver: { select: { fullName: true } },
          checks: { where: { checkDate: { gte: today } }, select: { id: true } },
        },
      }),
    ]);

    const missedVehicles = missed.filter(v => v.checks.length === 0);
    res.render('checks/index', { title: 'Daily Checks', checks, missedVehicles, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/checks/new', webAuth, async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: 'active' },
    select: { id: true, registration: true, make: true, model: true },
    orderBy: { registration: 'asc' },
  });
  res.render('checks/form', { title: 'Daily Walk-Around Check', vehicles, CHECK_ITEMS, CHECK_ITEM_LABELS });
});

// ── Defects ────────────────────────────────────────────
router.get('/defects', webAuth, async (req, res) => {
  try {
    const { status, severity } = req.query;
    const where = {};
    if (status) where.status = status;
    else where.status = { not: 'signed_off' };
    if (severity) where.severity = severity;

    const defects = await prisma.defectCase.findMany({
      where,
      include: {
        vehicle: { select: { registration: true } },
        reportedBy: { select: { fullName: true } },
      },
      orderBy: [{ severity: 'desc' }, { reportedAt: 'desc' }],
    });

    const enriched = defects.map(d => ({
      ...d, daysOpen: Math.floor((Date.now() - new Date(d.reportedAt)) / 86400000),
    }));
    res.render('defects/index', { title: 'Defects & VOR', defects: enriched, formatDate, filters: { status, severity } });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/defects/:id', webAuth, async (req, res) => {
  try {
    const d = await prisma.defectCase.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        reportedBy: { select: { fullName: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
        finalSignoffBy: { select: { firstName: true, lastName: true } },
        photos: true,
      },
    });
    if (!d) return res.redirect('/defects');
    const daysOpen = Math.floor((Date.now() - new Date(d.reportedAt)) / 86400000);
    res.render('defects/show', { title: `Defect ${d.referenceNumber}`, defect: d, daysOpen, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── VOR ─────────────────────────────────────────────
router.get('/vor', webAuth, async (req, res) => {
  try {
    const [active, history] = await Promise.all([
      prisma.vorRecord.findMany({
        where: { actualReturnDate: null },
        include: {
          vehicle: { select: { registration: true, make: true, model: true } },
          authorisedBy: { select: { firstName: true, lastName: true } },
          defectCase: { select: { referenceNumber: true, severity: true } },
        },
        orderBy: { takenOffRoadDate: 'desc' },
      }),
      prisma.vorRecord.findMany({
        where: { actualReturnDate: { not: null } },
        include: { vehicle: { select: { registration: true } }, authorisedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { takenOffRoadDate: 'desc' }, take: 15,
      }),
    ]);

    const enriched = active.map(r => ({
      ...r, daysOffRoad: Math.floor((Date.now() - new Date(r.takenOffRoadDate)) / 86400000),
    }));
    res.render('vor/index', { title: 'VOR Management', active: enriched, history, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Driver Risk ────────────────────────────────────────
router.get('/driver-risk', webAuth, async (req, res) => {
  try {
    const drivers = await prisma.employee.findMany({
      where: { isDriver: true, employmentStatus: 'active' },
      include: {
        trainingRecords: { where: { trainingType: 'cpc' } },
        drivingVehicle: { select: { registration: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    const enriched = await Promise.all(drivers.map(async (d) => {
      const missedChecks = await prisma.alert.count({
        where: { alertType: 'missed_check', entityId: d.drivingVehicleId || '', isResolved: false },
      });
      const cpc = d.trainingRecords[0];
      return {
        ...d,
        cpcExpiry: cpc?.expiryDate || null,
        cpcDays: cpc?.expiryDate ? daysUntil(cpc.expiryDate) : null,
        missedChecks,
        riskLevel: missedChecks > 2 ? 'high' : missedChecks > 0 ? 'medium' : 'low',
      };
    }));

    res.render('driver-risk', { title: 'Driver Risk', drivers: enriched, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Reports ────────────────────────────────────────────
const csvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const sendCsv = (res, filename, headers, rows) => {
  const csv = [headers.map(csvValue).join(',')]
    .concat(rows.map(row => headers.map(header => csvValue(row[header])).join(',')))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
};

router.get('/reports/export/:type', webAuth, async (req, res) => {
  try {
    const { type } = req.params;
    if (type === 'staff') {
      const rows = await prisma.employee.findMany({ orderBy: { fullName: 'asc' } });
      return sendCsv(res, '256-logistics-staff.csv',
        ['fullName', 'email', 'phone', 'jobTitle', 'department', 'employmentStatus', 'isDriver', 'isSponsored', 'startDate'],
        rows.map(r => ({ ...r, startDate: formatDate(r.startDate) })));
    }
    if (type === 'fleet') {
      const rows = await prisma.vehicle.findMany({ include: { assignedDriver: { select: { fullName: true } } }, orderBy: { registration: 'asc' } });
      return sendCsv(res, '256-logistics-fleet.csv',
        ['registration', 'make', 'model', 'year', 'status', 'assignedDriver', 'motExpiryDate', 'insuranceExpiryDate', 'nextPmiDate'],
        rows.map(r => ({ ...r, assignedDriver: r.assignedDriver?.fullName || '', motExpiryDate: formatDate(r.motExpiryDate), insuranceExpiryDate: formatDate(r.insuranceExpiryDate), nextPmiDate: formatDate(r.nextPmiDate) })));
    }
    if (type === 'defects') {
      const rows = await prisma.defectCase.findMany({ include: { vehicle: { select: { registration: true } }, reportedBy: { select: { fullName: true } } }, orderBy: { reportedAt: 'desc' } });
      return sendCsv(res, '256-logistics-defects.csv',
        ['referenceNumber', 'vehicle', 'reportedBy', 'severity', 'status', 'defectCategory', 'reportedAt', 'description'],
        rows.map(r => ({ ...r, vehicle: r.vehicle.registration, reportedBy: r.reportedBy.fullName, reportedAt: formatDate(r.reportedAt) })));
    }
    if (type === 'sponsored') {
      const rows = await prisma.sponsoredWorker.findMany({ include: { employee: { select: { fullName: true, email: true, employmentStatus: true } } }, orderBy: { employee: { fullName: 'asc' } } });
      return sendCsv(res, '256-logistics-sponsored-workers.csv',
        ['employee', 'email', 'cosNumber', 'socCode', 'sponsoredJobTitle', 'salaryOnCos', 'actualSalary', 'visaExpiryDate', 'rightToWorkFollowupDate', 'employmentStatus'],
        rows.map(r => ({ ...r, employee: r.employee.fullName, email: r.employee.email, visaExpiryDate: formatDate(r.visaExpiryDate), rightToWorkFollowupDate: formatDate(r.rightToWorkFollowupDate), employmentStatus: r.employee.employmentStatus })));
    }
    if (type === 'right-to-work') {
      const rows = await prisma.employee.findMany({ include: { documents: true, sponsoredWorker: true }, orderBy: { fullName: 'asc' } });
      return sendCsv(res, '256-logistics-right-to-work.csv',
        ['fullName', 'email', 'employmentStatus', 'rightToWorkDocument', 'rightToWorkExpiry', 'visaExpiryDate', 'followUpDate'],
        rows.map(r => {
          const rtw = r.documents.find(d => d.documentType === 'right_to_work');
          return { fullName: r.fullName, email: r.email, employmentStatus: r.employmentStatus, rightToWorkDocument: rtw?.fileName || 'Missing', rightToWorkExpiry: formatDate(rtw?.expiryDate), visaExpiryDate: formatDate(r.sponsoredWorker?.visaExpiryDate), followUpDate: formatDate(r.sponsoredWorker?.rightToWorkFollowupDate) };
        }));
    }
    if (type === 'document-expiry') {
      const rows = await prisma.employeeDocument.findMany({ include: { employee: { select: { fullName: true, email: true } } }, orderBy: { expiryDate: 'asc' } });
      return sendCsv(res, '256-logistics-document-expiry.csv',
        ['employee', 'email', 'documentType', 'fileName', 'expiryDate', 'daysRemaining'],
        rows.map(r => ({ employee: r.employee.fullName, email: r.employee.email, documentType: r.documentType, fileName: r.fileName, expiryDate: formatDate(r.expiryDate), daysRemaining: daysUntil(r.expiryDate) })));
    }
    if (type === 'pmi') {
      const rows = await prisma.vehicle.findMany({ include: { documents: true }, orderBy: { nextPmiDate: 'asc' } });
      return sendCsv(res, '256-logistics-pmi-planner.csv',
        ['registration', 'status', 'lastPmiDate', 'nextPmiDate', 'pmiDaysRemaining', 'pmiSheets', 'brakeTests'],
        rows.map(r => ({ registration: r.registration, status: r.status, lastPmiDate: formatDate(r.lastPmiDate), nextPmiDate: formatDate(r.nextPmiDate), pmiDaysRemaining: daysUntil(r.nextPmiDate), pmiSheets: r.documents.filter(d => d.documentType === 'pmi_sheet').length, brakeTests: r.documents.filter(d => d.documentType === 'brake_test').length })));
    }
    if (type === 'vor') {
      const rows = await prisma.vorRecord.findMany({ include: { vehicle: { select: { registration: true } }, authorisedBy: { select: { firstName: true, lastName: true } } }, orderBy: { takenOffRoadDate: 'desc' } });
      return sendCsv(res, '256-logistics-vor-history.csv',
        ['vehicle', 'takenOffRoadDate', 'actualReturnDate', 'reason', 'repairGarage', 'authorisedBy', 'managerSignoffAt'],
        rows.map(r => ({ vehicle: r.vehicle.registration, takenOffRoadDate: formatDate(r.takenOffRoadDate), actualReturnDate: formatDate(r.actualReturnDate), reason: r.reason, repairGarage: r.repairGarage || '', authorisedBy: `${r.authorisedBy.firstName} ${r.authorisedBy.lastName}`, managerSignoffAt: formatDate(r.managerSignoffAt) })));
    }
    if (type === 'daily-checks') {
      const rows = await prisma.walkAroundCheck.findMany({ include: { vehicle: { select: { registration: true } }, driver: { select: { fullName: true } }, items: true }, orderBy: { checkDate: 'desc' }, take: 500 });
      return sendCsv(res, '256-logistics-daily-checks.csv',
        ['checkDate', 'vehicle', 'driver', 'mileage', 'nilDefect', 'defectItems', 'submittedAt'],
        rows.map(r => ({ checkDate: formatDate(r.checkDate), vehicle: r.vehicle.registration, driver: r.driver.fullName, mileage: r.mileage, nilDefect: r.nilDefect, defectItems: r.items.filter(i => i.status === 'defect_found').length, submittedAt: r.submittedAt.toISOString() })));
    }
    if (type === 'training') {
      const rows = await prisma.trainingRecord.findMany({ include: { employee: { select: { fullName: true, email: true } } }, orderBy: [{ employee: { fullName: 'asc' } }, { trainingType: 'asc' }] });
      return sendCsv(res, '256-logistics-training-records.csv',
        ['employee', 'email', 'trainingType', 'status', 'completedDate', 'expiryDate', 'trainerName'],
        rows.map(r => ({ employee: r.employee.fullName, email: r.employee.email, trainingType: r.trainingType, status: r.status, completedDate: formatDate(r.completedDate), expiryDate: formatDate(r.expiryDate), trainerName: r.trainerName || '' })));
    }
    return res.status(404).render('error', { title: 'Not Found', message: 'Report export not found.', code: 404 });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/reports', webAuth, async (req, res) => {
  try {
    const [employees, sponsored, vehicles, vor, defects, criticalAlerts, trainingIncomplete, missedChecks] = await Promise.all([
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.employee.count({ where: { employmentStatus: 'active', isSponsored: true } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' } } }),
      prisma.vehicle.count({ where: { status: 'vor' } }),
      prisma.defectCase.count({ where: { status: { not: 'signed_off' } } }),
      prisma.alert.count({ where: { severity: 'critical', isResolved: false } }),
      prisma.alert.count({ where: { alertType: 'induction_incomplete', isResolved: false } }),
      prisma.alert.count({ where: { alertType: 'missed_check', isResolved: false } }),
    ]);
    res.render('reports/index', {
      title: 'Reports',
      stats: { employees, sponsored, vehicles, vor, defects, criticalAlerts, trainingIncomplete, missedChecks },
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── User Management ─────────────────────────────────────
router.get('/audit-evidence', webAuth, async (req, res) => {
  try {
    const [employees, sponsored, missingRtw, missingContracts, openDefects, activeVor, pmiOverdue, criticalAlerts, unsignedToolbox, recentAudit] = await Promise.all([
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.sponsoredWorker.count(),
      prisma.employee.count({ where: { documents: { none: { documentType: 'right_to_work' } } } }),
      prisma.employee.count({ where: { documents: { none: { documentType: 'contract' } } } }),
      prisma.defectCase.count({ where: { status: { not: 'signed_off' } } }),
      prisma.vorRecord.count({ where: { actualReturnDate: null } }),
      prisma.vehicle.count({ where: { nextPmiDate: { lt: new Date() }, status: { not: 'sold' } } }),
      prisma.alert.count({ where: { severity: 'critical', isResolved: false } }),
      prisma.toolboxTalk.count({ where: { managerSignedOff: false } }),
      prisma.auditLog.findMany({ include: { user: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    const folders = [
      { name: 'Home Office Sponsor Licence Audit', owner: 'HR Manager', score: Math.max(0, Math.round(100 - ((missingRtw + missingContracts) / Math.max(employees, 1)) * 50)), actions: missingRtw + missingContracts, exports: ['/reports/export/staff', '/reports/export/sponsored', '/reports/export/right-to-work', '/reports/export/document-expiry'] },
      { name: 'DVSA Maintenance Investigation', owner: 'Transport Manager', score: Math.max(0, Math.round(100 - ((openDefects + activeVor + pmiOverdue) / Math.max((openDefects + activeVor + pmiOverdue + 10), 1)) * 100)), actions: openDefects + activeVor + pmiOverdue, exports: ['/reports/export/fleet', '/reports/export/pmi', '/reports/export/defects', '/reports/export/vor', '/reports/export/daily-checks'] },
      { name: 'Traffic Commissioner Evidence File', owner: 'Director', score: Math.max(0, 100 - (criticalAlerts * 5)), actions: criticalAlerts, exports: ['/reports/export/fleet', '/reports/export/defects', '/reports/export/training'] },
      { name: 'Driver Disciplinary File', owner: 'Operations Manager', score: Math.max(0, 100 - (unsignedToolbox * 10)), actions: unsignedToolbox, exports: ['/reports/export/training', '/reports/export/daily-checks'] },
      { name: 'Insurance Claim Evidence', owner: 'Transport Manager', score: activeVor || openDefects ? 82 : 100, actions: activeVor + openDefects, exports: ['/reports/export/defects', '/reports/export/vor'] },
      { name: 'Employment Dispute', owner: 'HR Manager', score: missingContracts ? 78 : 100, actions: missingContracts, exports: ['/reports/export/staff', '/reports/export/document-expiry'] },
    ];

    res.render('audit-evidence/index', { title: 'Audit Evidence Centre', folders, recentAudit, stats: { employees, sponsored, missingRtw, missingContracts, openDefects, activeVor, pmiOverdue, criticalAlerts, unsignedToolbox }, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/settings', webAuth, async (req, res) => {
  try {
    if (req.user.role !== 'director') return res.redirect('/');
    res.render('settings/index', {
      title: 'Settings',
      config: {
        domain: '256logisticsltd.com',
        database: 'PostgreSQL',
        storage: process.env.STORAGE_TYPE || 'local',
        uploads: process.env.LOCAL_UPLOAD_DIR || './uploads',
        alertFrom: process.env.ALERT_FROM_EMAIL || 'alerts@256logisticsltd.com',
        criticalDays: process.env.ALERT_CRITICAL_DAYS || 7,
        warningDays: process.env.ALERT_WARNING_DAYS || 14,
        noticeDays: process.env.ALERT_NOTICE_DAYS || 30,
      },
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/users', webAuth, async (req, res) => {
  try {
    if (req.user.role !== 'director') return res.redirect('/');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, firstName: true, lastName: true,
        isActive: true, lastLoginAt: true },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });
    res.render('users/index', { title: 'User Management', users, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/migration', webAuth, async (req, res) => {
  try {
    if (req.user.role !== 'director') return res.redirect('/');
    const [employees, users, vehicles] = await Promise.all([
      prisma.employee.count(),
      prisma.user.count(),
      prisma.vehicle.count(),
    ]);
    res.render('migration/index', { title: 'Migration Center', counts: { employees, users, vehicles } });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

module.exports = router;
