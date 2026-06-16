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
    const { search, status = 'active', department } = req.query;
    const where = {};
    if (status) where.employmentStatus = status;
    if (department) where.department = { contains: department, mode: 'insensitive' };
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
    const enriched = employees.map(e => ({
      ...e,
      missingDocs: required.filter(r => !e.documents.find(d => d.documentType === r)).length,
    }));

    res.render('employees/index', { title: 'People & Compliance', employees: enriched,
      departments: departments.map(d => d.department), filters: { search, status, department } });
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
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { not: 'sold' } },
      include: {
        assignedDriver: { select: { fullName: true } },
        defects: { where: { status: { not: 'signed_off' } }, select: { id: true, severity: true } },
        checks: { orderBy: { checkDate: 'desc' }, take: 1 },
      },
      orderBy: { registration: 'asc' },
    });

    const enriched = vehicles.map(v => ({
      ...v,
      motDays: daysUntil(v.motExpiryDate),
      insuranceDays: daysUntil(v.insuranceExpiryDate),
      pmiDays: daysUntil(v.nextPmiDate),
      lastCheckDate: v.checks[0]?.checkDate || null,
    }));

    res.render('vehicles/index', { title: 'Fleet & Roadworthiness', vehicles: enriched, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Add Vehicle (must be before /fleet/:id) ───────────────
router.get('/fleet/new', webAuth, async (req, res) => {
  try {
    const drivers = await prisma.employee.findMany({
      where: { isDriver: true, employmentStatus: 'active' },
      select: { id: true, fullName: true }, orderBy: { fullName: 'asc' },
    });
    res.render('vehicles/form', { title: 'Add Vehicle', drivers, formatDate });
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
router.get('/reports', webAuth, async (req, res) => {
  res.render('reports/index', { title: 'Reports' });
});

// ── User Management ─────────────────────────────────────
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

module.exports = router;
