const router = require('express').Router();
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');
const { verify } = require('../config/jwt');
const { UPLOAD_DIR } = require('../config/storage');
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

const hasRole = (user, roles) => roles.includes(user.role);

const requireRoles = (...roles) => (req, res, next) => {
  if (hasRole(req.user, roles)) return next();
  return res.status(403).render('error', {
    title: 'Access denied',
    message: 'Your account does not have permission to access this area.',
    code: 403,
  });
};

const peopleRoles = ['director', 'transport_manager', 'hr_manager', 'operations_manager'];
const fleetRoles = ['director', 'transport_manager', 'operations_manager'];
const transportRoles = ['director', 'transport_manager'];
const hrRoles = ['director', 'hr_manager'];
const evidenceRoles = ['director', 'transport_manager', 'hr_manager'];
const reportsRoles = ['director', 'transport_manager', 'hr_manager', 'operations_manager'];

const exportRoles = {
  staff: peopleRoles,
  sponsored: hrRoles,
  'right-to-work': hrRoles,
  'document-expiry': hrRoles,
  fleet: fleetRoles,
  pmi: fleetRoles,
  defects: fleetRoles,
  vor: fleetRoles,
  'daily-checks': fleetRoles,
  training: ['director', 'transport_manager', 'hr_manager'],
};

const documentKinds = {
  'employee-document': 'employee-document',
  'vehicle-document': 'vehicle-document',
  'defect-photo': 'defect-photo',
};

const getPreviewType = (mimeType, fileName) => {
  const mime = (mimeType || '').toLowerCase();
  const ext = path.extname(fileName || '').toLowerCase();
  if (mime === 'application/pdf' || ext === '.pdf') return 'pdf';
  if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
  return 'download';
};

const inferMimeType = (fileName) => {
  const ext = path.extname(fileName || '').toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
};

const getAbsoluteStoragePath = (storageKey) => path.resolve(process.cwd(), storageKey);

const loadDocumentRecord = async (kind, id, user) => {
  if (kind === documentKinds['employee-document']) {
    const doc = await prisma.employeeDocument.findUnique({
      where: { id },
      include: { employee: { select: { id: true, fullName: true } } },
    });
    if (!doc) throw new Error('not_found');
    const canView = hasRole(user, peopleRoles) || (user.role === 'driver' && user.employeeId === doc.employeeId);
    if (!canView) throw new Error('forbidden');
    return {
      id: doc.id,
      title: doc.fileName,
      subtitle: `${doc.employee.fullName} - ${doc.documentType.replace(/_/g, ' ')}`,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      storageKey: doc.storageKey,
      backHref: `/employees/${doc.employeeId}`,
      meta: [
        ['Owner', doc.employee.fullName],
        ['Document Type', doc.documentType.replace(/_/g, ' ')],
        ['Expiry', formatDate(doc.expiryDate)],
        ['Uploaded', formatDate(doc.createdAt)],
      ],
    };
  }

  if (kind === documentKinds['vehicle-document']) {
    const doc = await prisma.vehicleDocument.findUnique({
      where: { id },
      include: { vehicle: { select: { id: true, registration: true, make: true, model: true } } },
    });
    if (!doc) throw new Error('not_found');
    if (!hasRole(user, fleetRoles)) throw new Error('forbidden');
    return {
      id: doc.id,
      title: doc.fileName,
      subtitle: `${doc.vehicle.registration} - ${doc.documentType.replace(/_/g, ' ')}`,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      storageKey: doc.storageKey,
      backHref: `/fleet/${doc.vehicleId}`,
      meta: [
        ['Vehicle', doc.vehicle.registration],
        ['Document Type', doc.documentType.replace(/_/g, ' ')],
        ['Document Date', formatDate(doc.documentDate)],
        ['Expiry', formatDate(doc.expiryDate)],
      ],
    };
  }

  if (kind === documentKinds['defect-photo']) {
    const photo = await prisma.defectPhoto.findUnique({
      where: { id },
      include: {
        defectCase: {
          select: {
            id: true,
            referenceNumber: true,
            reportedById: true,
            vehicle: { select: { registration: true } },
          },
        },
      },
    });
    if (!photo) throw new Error('not_found');
    const canView = hasRole(user, fleetRoles) || (user.role === 'driver' && user.employeeId === photo.defectCase.reportedById);
    if (!canView) throw new Error('forbidden');
    return {
      id: photo.id,
      title: photo.fileName,
      subtitle: `${photo.defectCase.referenceNumber} - ${photo.defectCase.vehicle?.registration || 'Defect photo'}`,
      fileName: photo.fileName,
      mimeType: inferMimeType(photo.fileName),
      storageKey: photo.storageKey,
      backHref: `/defects/${photo.defectCaseId}`,
      meta: [
        ['Defect', photo.defectCase.referenceNumber],
        ['Vehicle', photo.defectCase.vehicle?.registration || '-'],
        ['Uploaded', formatDate(photo.createdAt)],
      ],
    };
  }

  throw new Error('not_found');
};

const formatAlertTypeLabel = (alertType) => ({
  pmi_due: 'PMI Due',
  mot_expiry: 'MOT Expiry',
  insurance_expiry: 'Insurance Expiry',
  tacho_calibration: 'Tacho Calibration',
  visa_expiry: 'Visa Expiry',
  right_to_work_due: 'Right to Work Due',
  cpc_expiry: 'CPC Expiry',
  missed_check: 'Missed Check',
  open_defect: 'Open Defect',
  induction_incomplete: 'Induction Incomplete',
  toolbox_unsigned: 'Toolbox Talk',
  policy_unsigned: 'Policy Sign-off',
  licence_check_due: 'Licence Check Due',
}[alertType] || alertType.replace(/_/g, ' '));

const decorateAlert = async (alert, user) => {
  const base = {
    ...alert,
    typeLabel: formatAlertTypeLabel(alert.alertType),
    href: '/reports',
    actionLabel: 'Open reports',
    preview: [],
  };

  if (alert.alertType === 'open_defect') {
    const defect = await prisma.defectCase.findFirst({
      where: alert.entityType === 'defect'
        ? { id: alert.entityId }
        : { vehicleId: alert.entityId, status: { not: 'signed_off' } },
      include: {
        vehicle: { select: { registration: true } },
      },
      orderBy: [{ severity: 'desc' }, { reportedAt: 'desc' }],
    });

    if (!defect) return base;

    return {
      ...base,
      href: `/defects/${defect.id}`,
      actionLabel: 'Open defect case',
      preview: [
        defect.referenceNumber,
        defect.vehicle?.registration || 'Vehicle',
        defect.status.replace(/_/g, ' '),
      ],
    };
  }

  if (alert.entityType === 'employee') {
    const employee = await prisma.employee.findUnique({
      where: { id: alert.entityId },
      include: {
        sponsoredWorker: { select: { visaExpiryDate: true, rightToWorkFollowupDate: true } },
        trainingRecords: {
          where: { trainingType: 'cpc' },
          select: { expiryDate: true, status: true },
          take: 1,
        },
      },
    });

    if (!employee) return base;

    const canOpenEmployee = hasRole(user, peopleRoles) || (user.role === 'driver' && user.employeeId === employee.id);
    const cpcRecord = employee.trainingRecords[0];
    const preview = [
      employee.jobTitle,
      employee.department,
    ];

    if (alert.alertType === 'visa_expiry' && employee.sponsoredWorker?.visaExpiryDate) {
      preview.push(`Visa ${formatDate(employee.sponsoredWorker.visaExpiryDate)}`);
    }
    if (alert.alertType === 'right_to_work_due' && employee.sponsoredWorker?.rightToWorkFollowupDate) {
      preview.push(`RTW ${formatDate(employee.sponsoredWorker.rightToWorkFollowupDate)}`);
    }
    if (alert.alertType === 'cpc_expiry' && cpcRecord?.expiryDate) {
      preview.push(`CPC ${formatDate(cpcRecord.expiryDate)}`);
    }

    const shouldOpenTraining = ['cpc_expiry', 'toolbox_unsigned', 'policy_unsigned', 'induction_incomplete'].includes(alert.alertType);

    return {
      ...base,
      href: shouldOpenTraining ? '/training' : canOpenEmployee ? `/employees/${employee.id}` : '/training',
      actionLabel: shouldOpenTraining ? 'Open training' : canOpenEmployee ? 'Open employee' : 'Open training',
      preview,
    };
  }

  if (alert.entityType === 'vehicle') {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: alert.entityId },
      include: {
        assignedDriver: { select: { fullName: true } },
        checks: {
          include: { items: true },
          orderBy: [{ checkDate: 'desc' }, { submittedAt: 'desc' }],
          take: 1,
        },
      },
    });

    if (!vehicle) return base;

    const canOpenFleet = hasRole(user, fleetRoles);
    const lastCheck = vehicle.checks[0];
    const preview = [
      vehicle.registration,
      vehicle.assignedDriver?.fullName || 'No assigned driver',
      vehicle.status.replace(/_/g, ' '),
    ];

    if (alert.alertType === 'missed_check' && lastCheck?.id) {
      preview.push(`Last check ${formatDate(lastCheck.checkDate)}`);
      return {
        ...base,
        href: canOpenFleet ? `/checks/${lastCheck.id}` : '/checks',
        actionLabel: canOpenFleet ? 'Open last check' : 'Open checks',
        preview,
      };
    }

    if ((alert.alertType === 'pmi_due' || alert.alertType === 'mot_expiry' || alert.alertType === 'insurance_expiry' || alert.alertType === 'tacho_calibration') && canOpenFleet) {
      return {
        ...base,
        href: `/fleet/${vehicle.id}`,
        actionLabel: 'Open vehicle',
        preview,
      };
    }
  }

  if (alert.alertType === 'toolbox_unsigned' || alert.alertType === 'policy_unsigned' || alert.alertType === 'induction_incomplete') {
    return {
      ...base,
      href: '/training',
      actionLabel: 'Open training',
    };
  }

  return base;
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
    const user = await prisma.user.findUnique({
      where: { email: email?.toLowerCase().trim() },
      include: { employee: { select: { id: true } } },
    });
    if (!user || !user.isActive) return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });

    const token = sign({ id: user.id, role: user.role, email: user.email,
      name: `${user.firstName} ${user.lastName}`, employeeId: user.employee?.id || null });

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

router.get('/documents/:kind/:id', webAuth, async (req, res) => {
  try {
    const doc = await loadDocumentRecord(req.params.kind, req.params.id, req.user);
    const previewType = getPreviewType(doc.mimeType, doc.fileName);
    res.render('documents/viewer', {
      title: 'Document Viewer',
      document: {
        ...doc,
        previewType,
        contentHref: `/documents/${req.params.kind}/${req.params.id}/content`,
        downloadHref: `/documents/${req.params.kind}/${req.params.id}/download`,
      },
    });
  } catch (e) {
    if (e.message === 'forbidden') {
      return res.status(403).render('error', { title: 'Access denied', message: 'You do not have permission to view this document.', code: 403 });
    }
    return res.status(404).render('error', { title: 'Not found', message: 'The requested document could not be found.', code: 404 });
  }
});

router.get('/documents/:kind/:id/content', webAuth, async (req, res) => {
  try {
    const doc = await loadDocumentRecord(req.params.kind, req.params.id, req.user);
    const absolutePath = getAbsoluteStoragePath(doc.storageKey);
    if (!absolutePath.startsWith(path.resolve(process.cwd(), UPLOAD_DIR)) || !fs.existsSync(absolutePath)) {
      return res.status(404).render('error', { title: 'Not found', message: 'The requested document file is not available.', code: 404 });
    }
    if (doc.mimeType) res.type(doc.mimeType);
    return res.sendFile(absolutePath);
  } catch (e) {
    if (e.message === 'forbidden') {
      return res.status(403).render('error', { title: 'Access denied', message: 'You do not have permission to view this document.', code: 403 });
    }
    return res.status(404).render('error', { title: 'Not found', message: 'The requested document could not be found.', code: 404 });
  }
});

router.get('/documents/:kind/:id/download', webAuth, async (req, res) => {
  try {
    const doc = await loadDocumentRecord(req.params.kind, req.params.id, req.user);
    const absolutePath = getAbsoluteStoragePath(doc.storageKey);
    if (!absolutePath.startsWith(path.resolve(process.cwd(), UPLOAD_DIR)) || !fs.existsSync(absolutePath)) {
      return res.status(404).render('error', { title: 'Not found', message: 'The requested document file is not available.', code: 404 });
    }
    return res.download(absolutePath, doc.fileName);
  } catch (e) {
    if (e.message === 'forbidden') {
      return res.status(403).render('error', { title: 'Access denied', message: 'You do not have permission to download this document.', code: 403 });
    }
    return res.status(404).render('error', { title: 'Not found', message: 'The requested document could not be found.', code: 404 });
  }
});

// ── Dashboard ──────────────────────────────────────────
router.get('/', webAuth, async (req, res) => {
  try {
    if (req.user.role === 'driver') {
      const employeeId = req.user.employeeId;
      if (!employeeId) {
        return res.status(403).render('error', {
          title: 'Access denied',
          message: 'Your driver account is not linked to an employee record.',
          code: 403,
        });
      }

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          drivingVehicle: {
            select: {
              id: true,
              registration: true,
              make: true,
              model: true,
              status: true,
              currentMileage: true,
              motExpiryDate: true,
              nextPmiDate: true,
              insuranceExpiryDate: true,
              tachoCalibrExpiry: true,
            },
          },
          trainingRecords: true,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const alertEntityIds = [employeeId, req.user.id];
      if (employee?.drivingVehicle?.id) alertEntityIds.push(employee.drivingVehicle.id);

      const [rawAlerts, checks, defects, talks, activityChecks] = await Promise.all([
        prisma.alert.findMany({
          where: { isResolved: false, entityId: { in: alertEntityIds } },
          orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
          take: 10,
        }),
        prisma.walkAroundCheck.findMany({
          where: { driverId: employeeId },
          include: { vehicle: { select: { id: true, registration: true } }, items: true, defects: { select: { id: true } } },
          orderBy: [{ checkDate: 'desc' }, { submittedAt: 'desc' }],
          take: 8,
        }),
        prisma.defectCase.findMany({
          where: { reportedById: employeeId },
          include: { vehicle: { select: { registration: true } } },
          orderBy: { reportedAt: 'desc' },
          take: 8,
        }),
        prisma.toolboxTalk.findMany({
          include: {
            assignments: { where: { employeeId }, select: { signedAt: true } },
            issuedBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { dateIssued: 'desc' },
          take: 8,
        }),
        prisma.walkAroundCheck.findMany({
          where: { driverId: employeeId, checkDate: { gte: sevenDaysAgo } },
          select: { id: true, checkDate: true, nilDefect: true },
          orderBy: { checkDate: 'asc' },
        }),
      ]);

      const alerts = await Promise.all(rawAlerts.map((alert) => decorateAlert(alert, req.user)));
      const { TRAINING_TYPES } = require('../utils/constants');
      const trainingCompleted = employee?.trainingRecords?.filter((r) => r.status === 'completed').length || 0;
      const trainingExpired = employee?.trainingRecords?.filter((r) => r.status === 'expired').length || 0;
      const trainingInProgress = employee?.trainingRecords?.filter((r) => r.status === 'in_progress').length || 0;
      const trainingTotal = TRAINING_TYPES.length;
      const trainingCompletion = trainingTotal ? Math.round((trainingCompleted / trainingTotal) * 100) : 0;
      const trainingNotStarted = Math.max(trainingTotal - (trainingCompleted + trainingExpired + trainingInProgress), 0);
      const pendingTalks = talks.filter((talk) => !talk.assignments[0]?.signedAt);
      const todayCheck = checks.find((check) => new Date(check.checkDate).getTime() >= today.getTime()) || null;
      const vehicleCompliance = employee?.drivingVehicle ? [
        { label: 'MOT', value: formatDate(employee.drivingVehicle.motExpiryDate), days: daysUntil(employee.drivingVehicle.motExpiryDate) },
        { label: 'PMI', value: formatDate(employee.drivingVehicle.nextPmiDate), days: daysUntil(employee.drivingVehicle.nextPmiDate) },
        { label: 'Insurance', value: formatDate(employee.drivingVehicle.insuranceExpiryDate), days: daysUntil(employee.drivingVehicle.insuranceExpiryDate) },
        { label: 'Tacho', value: formatDate(employee.drivingVehicle.tachoCalibrExpiry), days: daysUntil(employee.drivingVehicle.tachoCalibrExpiry) },
      ].map((item) => ({
        ...item,
        tone: item.days === null ? 'slate' : item.days < 0 ? 'red' : item.days <= 14 ? 'amber' : 'green',
        helper: item.days === null ? 'No date recorded' : item.days < 0 ? `${Math.abs(item.days)} day(s) overdue` : `${item.days} day(s) remaining`,
      })) : [];
      const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + index);
        const match = activityChecks.find((check) => new Date(check.checkDate).toDateString() === date.toDateString());
        return {
          label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
          date,
          submitted: Boolean(match),
          nilDefect: Boolean(match?.nilDefect),
        };
      });
      const readinessScore = Math.max(0, Math.min(100,
        100
        - (pendingTalks.length * 8)
        - (alerts.filter((alert) => alert.severity === 'critical').length * 10)
        - (defects.filter((defect) => defect.status !== 'signed_off').length * 6)
        - (todayCheck ? 0 : 12)
      ));

      return res.render('dashboard/driver', {
        title: 'My Dashboard',
        employee,
        alerts,
        checks,
        defects,
        todayCheck,
        activity: lastSevenDays,
        pendingTalks,
        vehicleCompliance,
        talks: talks.map((talk) => ({ ...talk, signed: Boolean(talk.assignments[0]?.signedAt) })),
        stats: {
          readinessScore,
          trainingCompletion,
          trainingCompleted,
          trainingInProgress,
          trainingExpired,
          trainingNotStarted,
          openDefects: defects.filter((d) => d.status !== 'signed_off').length,
          checksSubmitted: checks.length,
          checksThisWeek: activityChecks.length,
          pendingTalks: pendingTalks.length,
          unresolvedAlerts: alerts.length,
        },
        formatDate,
      });
    }

    const [totalEmp, sponsoredCount, totalVehicles, activeVehicles, vorVehicles,
      openDefects, rawAlerts, latestScore, missedChecks, pendingToolbox, recentDefects] = await Promise.all([
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

    const alerts = await Promise.all(rawAlerts.map((alert) => decorateAlert(alert, req.user)));
    const score = latestScore || await require('../services/compliance.service').calculateAndStore();
    const alertGroups = {
      critical: alerts.filter(a => a.severity === 'critical'),
      warning: alerts.filter(a => a.severity === 'warning'),
      notice: alerts.filter(a => a.severity === 'notice'),
    };

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: { totalEmp, sponsoredCount, totalVehicles, activeVehicles, vorVehicles, openDefects, missedChecks, pendingToolbox },
      score: { people: Number(score.peopleScore ?? score.people), fleet: Number(score.fleetScore ?? score.fleet),
        driver: Number(score.driverScore ?? score.driver), overall: Number(score.overallScore ?? score.overall) },
      alerts, alertGroups, recentDefects,
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Employees ──────────────────────────────────────────
router.get('/employees', webAuth, requireRoles(...peopleRoles), async (req, res) => {
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

router.get('/employees/new', webAuth, requireRoles(...hrRoles), async (req, res) => {
  const managers = await prisma.employee.findMany({ where: { employmentStatus: 'active' },
    select: { id: true, fullName: true, jobTitle: true }, orderBy: { fullName: 'asc' } });
  const vehicles = await prisma.vehicle.findMany({ where: { status: 'active', assignedDriverId: null },
    select: { id: true, registration: true, make: true, model: true } });
  res.render('employees/form', { title: 'Add Employee', employee: null, managers, vehicles, errors: [] });
});

router.get('/employees/:id/edit', webAuth, requireRoles(...hrRoles), async (req, res) => {
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
    const canViewAllEmployees = hasRole(req.user, peopleRoles);
    if (!canViewAllEmployees && !(req.user.role === 'driver' && req.user.employeeId === req.params.id)) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'You can only view your own employee profile.',
        code: 403,
      });
    }

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
router.get('/sponsored-workers', webAuth, requireRoles(...evidenceRoles), async (req, res) => {
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
    if (req.user.role === 'driver') {
      if (!req.user.employeeId) {
        return res.status(403).render('error', { title: 'Access denied', message: 'Your driver account is not linked to an employee record.', code: 403 });
      }
      const driver = await prisma.employee.findUnique({
        where: { id: req.user.employeeId },
        include: { trainingRecords: true },
      });
      if (!driver) {
        return res.status(403).render('error', { title: 'Access denied', message: 'Your driver record could not be found.', code: 403 });
      }
      const talks = await prisma.toolboxTalk.findMany({
        include: { assignments: { where: { employeeId: req.user.employeeId }, select: { signedAt: true } } },
        orderBy: { dateIssued: 'desc' },
        take: 10,
      });
      const { TRAINING_TYPES } = require('../utils/constants');
      const completed = driver.trainingRecords.filter((r) => r.status === 'completed').length;
      return res.render('training/index', {
        title: 'My Training',
        drivers: [{ ...driver, completionPercent: Math.round((completed / TRAINING_TYPES.length) * 100) }],
        talks: talks.map((t) => ({ ...t, totalSigned: t.assignments.filter((a) => a.signedAt).length, assignments: t.assignments })),
        formatDate,
      });
    }

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
router.get('/fleet', webAuth, requireRoles(...fleetRoles), async (req, res) => {
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
router.get('/fleet/new', webAuth, requireRoles(...transportRoles), async (req, res) => {
  try {
    const drivers = await prisma.employee.findMany({
      where: { isDriver: true, employmentStatus: 'active' },
      select: { id: true, fullName: true }, orderBy: { fullName: 'asc' },
    });
    res.render('vehicles/form', { title: 'Add Vehicle', vehicle: null, drivers, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/fleet/:id/edit', webAuth, requireRoles(...transportRoles), async (req, res) => {
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

router.get('/fleet/pmi-planner', webAuth, requireRoles(...fleetRoles), async (req, res) => {
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

router.get('/fleet/:id', webAuth, requireRoles(...fleetRoles), async (req, res) => {
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
    const checkWhere = req.user.role === 'driver' && req.user.employeeId
      ? { driverId: req.user.employeeId }
      : {};
    const [checks, missed] = await Promise.all([
      prisma.walkAroundCheck.findMany({
        where: checkWhere,
        include: {
          vehicle: { select: { id: true, registration: true } },
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

    const missedVehicles = req.user.role === 'driver' ? [] : missed.filter(v => v.checks.length === 0);
    res.render('checks/index', { title: 'Daily Checks', checks, missedVehicles, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/checks/new', webAuth, async (req, res) => {
  if (req.user.role === 'driver' && !req.user.employeeId) {
    return res.status(403).render('error', { title: 'Access denied', message: 'Your driver account is not linked to an employee record.', code: 403 });
  }
  const vehicles = await prisma.vehicle.findMany({
    where: req.user.role === 'driver' && req.user.employeeId
      ? { status: 'active', assignedDriverId: req.user.employeeId }
      : { status: 'active' },
    select: { id: true, registration: true, make: true, model: true },
    orderBy: { registration: 'asc' },
  });
  res.render('checks/form', { title: 'Daily Walk-Around Check', vehicles, CHECK_ITEMS, CHECK_ITEM_LABELS });
});

// ── Defects ────────────────────────────────────────────
router.get('/checks/:id', webAuth, async (req, res) => {
  try {
    const check = await prisma.walkAroundCheck.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        driver: { select: { id: true, fullName: true, jobTitle: true } },
        items: true,
        defects: {
          select: { id: true, referenceNumber: true, severity: true, status: true },
          orderBy: { reportedAt: 'desc' },
        },
      },
    });
    if (!check) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'The requested daily check could not be found.',
        code: 404,
      });
    }
    if (req.user.role === 'driver' && req.user.employeeId !== check.driverId) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'You can only view your own daily checks.',
        code: 403,
      });
    }
    res.render('checks/show', { title: `Daily Check ${formatDate(check.checkDate)}`, check, formatDate, CHECK_ITEM_LABELS });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/defects', webAuth, async (req, res) => {
  try {
    const { status, severity } = req.query;
    const where = {};
    if (status) where.status = status;
    else where.status = { not: 'signed_off' };
    if (severity) where.severity = severity;
    if (req.user.role === 'driver' && req.user.employeeId) where.reportedById = req.user.employeeId;

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
    if (req.user.role === 'driver' && req.user.employeeId !== d.reportedById) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'You can only view defects you reported.',
        code: 403,
      });
    }
    const daysOpen = Math.floor((Date.now() - new Date(d.reportedAt)) / 86400000);
    res.render('defects/show', { title: `Defect ${d.referenceNumber}`, defect: d, daysOpen, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── VOR ─────────────────────────────────────────────
router.get('/vor', webAuth, requireRoles(...fleetRoles), async (req, res) => {
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
router.get('/driver-risk', webAuth, requireRoles(...fleetRoles), async (req, res) => {
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

const reportCatalog = {
  staff: {
    name: 'Staff List',
    pack: 'Home Office',
    description: 'Employee, role, department, status and contact details.',
  },
  sponsored: {
    name: 'Sponsored Workers',
    pack: 'Home Office',
    description: 'CoS, SOC, salary, visa and Right to Work follow-up dates.',
  },
  'right-to-work': {
    name: 'Right to Work',
    pack: 'Home Office',
    description: 'RTW documents, visa expiry dates and follow-up actions.',
  },
  'document-expiry': {
    name: 'Document Expiry',
    pack: 'Home Office',
    description: 'Expiring passports, contracts, licences and compliance documents.',
  },
  fleet: {
    name: 'Fleet Register',
    pack: 'DVSA',
    description: 'Vehicle, driver, MOT, insurance, PMI and status records.',
  },
  pmi: {
    name: 'PMI Planner',
    pack: 'DVSA',
    description: 'Maintenance intervals, overdue PMI records and brake test evidence.',
  },
  defects: {
    name: 'Defect Register',
    pack: 'DVSA',
    description: 'Defect references, vehicles, severity, status and descriptions.',
  },
  vor: {
    name: 'VOR History',
    pack: 'DVSA',
    description: 'Off-road dates, repair garages, return-to-service and sign-off records.',
  },
  'daily-checks': {
    name: 'Daily Checks',
    pack: 'DVSA',
    description: 'Walk-around checks, nil defects, mileage and reported defect counts.',
  },
  training: {
    name: 'Training Records',
    pack: 'People',
    description: 'Driver induction, CPC, toolbox talk and expiry tracking exports.',
  },
};

const buildReportData = async (type) => {
  if (type === 'staff') {
    const rows = await prisma.employee.findMany({ orderBy: { fullName: 'asc' } });
    return {
      filename: '256-logistics-staff.csv',
      headers: ['fullName', 'email', 'phone', 'jobTitle', 'department', 'employmentStatus', 'isDriver', 'isSponsored', 'startDate'],
      exportRows: rows.map((r) => ({ ...r, startDate: formatDate(r.startDate) })),
      columns: ['Employee', 'Role', 'Department', 'Status', 'Contact', 'Start'],
      tableRows: rows.map((r) => [r.fullName, r.jobTitle, r.department, r.employmentStatus.replace(/_/g, ' '), `${r.email}\n${r.phone || '-'}`, formatDate(r.startDate)]),
      summary: [
        ['Active Staff', rows.length],
        ['Drivers', rows.filter((r) => r.isDriver).length],
        ['Sponsored', rows.filter((r) => r.isSponsored).length],
        ['Departments', new Set(rows.map((r) => r.department)).size],
      ],
    };
  }
  if (type === 'fleet') {
    const rows = await prisma.vehicle.findMany({ include: { assignedDriver: { select: { fullName: true } } }, orderBy: { registration: 'asc' } });
    return {
      filename: '256-logistics-fleet.csv',
      headers: ['registration', 'make', 'model', 'year', 'status', 'assignedDriver', 'motExpiryDate', 'insuranceExpiryDate', 'nextPmiDate'],
      exportRows: rows.map((r) => ({ ...r, assignedDriver: r.assignedDriver?.fullName || '', motExpiryDate: formatDate(r.motExpiryDate), insuranceExpiryDate: formatDate(r.insuranceExpiryDate), nextPmiDate: formatDate(r.nextPmiDate) })),
      columns: ['Vehicle', 'Assigned Driver', 'Status', 'MOT', 'Insurance', 'PMI'],
      tableRows: rows.map((r) => [`${r.registration}\n${r.make} ${r.model}`, r.assignedDriver?.fullName || '-', r.status.replace(/_/g, ' '), formatDate(r.motExpiryDate), formatDate(r.insuranceExpiryDate), formatDate(r.nextPmiDate)]),
      summary: [
        ['Fleet Records', rows.length],
        ['Active', rows.filter((r) => r.status === 'active').length],
        ['VOR', rows.filter((r) => r.status === 'vor').length],
        ['PMI Overdue', rows.filter((r) => daysUntil(r.nextPmiDate) !== null && daysUntil(r.nextPmiDate) < 0).length],
      ],
    };
  }
  if (type === 'defects') {
    const rows = await prisma.defectCase.findMany({ include: { vehicle: { select: { registration: true } }, reportedBy: { select: { fullName: true } } }, orderBy: { reportedAt: 'desc' } });
    return {
      filename: '256-logistics-defects.csv',
      headers: ['referenceNumber', 'vehicle', 'reportedBy', 'severity', 'status', 'defectCategory', 'reportedAt', 'description'],
      exportRows: rows.map((r) => ({ ...r, vehicle: r.vehicle.registration, reportedBy: r.reportedBy.fullName, reportedAt: formatDate(r.reportedAt) })),
      columns: ['Reference', 'Vehicle', 'Reported By', 'Severity', 'Status', 'Category', 'Reported'],
      tableRows: rows.map((r) => [r.referenceNumber, r.vehicle.registration, r.reportedBy.fullName, r.severity, r.status.replace(/_/g, ' '), r.defectCategory, formatDate(r.reportedAt)]),
      summary: [
        ['Open Defects', rows.filter((r) => r.status !== 'signed_off').length],
        ['Dangerous', rows.filter((r) => r.severity === 'dangerous' && r.status !== 'signed_off').length],
        ['Serious', rows.filter((r) => r.severity === 'serious' && r.status !== 'signed_off').length],
        ['Signed Off', rows.filter((r) => r.status === 'signed_off').length],
      ],
    };
  }
  if (type === 'sponsored') {
    const rows = await prisma.sponsoredWorker.findMany({ include: { employee: { select: { fullName: true, email: true, employmentStatus: true } } }, orderBy: { employee: { fullName: 'asc' } } });
    return {
      filename: '256-logistics-sponsored-workers.csv',
      headers: ['employee', 'email', 'cosNumber', 'socCode', 'sponsoredJobTitle', 'salaryOnCos', 'actualSalary', 'visaExpiryDate', 'rightToWorkFollowupDate', 'employmentStatus'],
      exportRows: rows.map((r) => ({ ...r, employee: r.employee.fullName, email: r.employee.email, visaExpiryDate: formatDate(r.visaExpiryDate), rightToWorkFollowupDate: formatDate(r.rightToWorkFollowupDate), employmentStatus: r.employee.employmentStatus })),
      columns: ['Employee', 'CoS', 'SOC', 'Role', 'Visa Expiry', 'RTW Follow-up', 'Status'],
      tableRows: rows.map((r) => [r.employee.fullName, r.cosNumber, r.socCode, r.sponsoredJobTitle, formatDate(r.visaExpiryDate), formatDate(r.rightToWorkFollowupDate), r.employee.employmentStatus.replace(/_/g, ' ')]),
      summary: [
        ['Sponsored Workers', rows.length],
        ['Visa <= 30 Days', rows.filter((r) => daysUntil(r.visaExpiryDate) !== null && daysUntil(r.visaExpiryDate) <= 30).length],
        ['RTW Due <= 30 Days', rows.filter((r) => daysUntil(r.rightToWorkFollowupDate) !== null && daysUntil(r.rightToWorkFollowupDate) <= 30).length],
        ['Active', rows.filter((r) => r.employee.employmentStatus === 'active').length],
      ],
    };
  }
  if (type === 'right-to-work') {
    const rows = await prisma.employee.findMany({ include: { documents: true, sponsoredWorker: true }, orderBy: { fullName: 'asc' } });
    const reportRows = rows.map((r) => {
      const rtw = r.documents.find((d) => d.documentType === 'right_to_work');
      return {
        fullName: r.fullName,
        email: r.email,
        employmentStatus: r.employmentStatus,
        rightToWorkDocument: rtw?.fileName || 'Missing',
        rightToWorkExpiry: formatDate(rtw?.expiryDate),
        visaExpiryDate: formatDate(r.sponsoredWorker?.visaExpiryDate),
        followUpDate: formatDate(r.sponsoredWorker?.rightToWorkFollowupDate),
      };
    });
    return {
      filename: '256-logistics-right-to-work.csv',
      headers: ['fullName', 'email', 'employmentStatus', 'rightToWorkDocument', 'rightToWorkExpiry', 'visaExpiryDate', 'followUpDate'],
      exportRows: reportRows,
      columns: ['Employee', 'Status', 'RTW Document', 'RTW Expiry', 'Visa Expiry', 'Follow-up'],
      tableRows: reportRows.map((r) => [r.fullName, r.employmentStatus.replace(/_/g, ' '), r.rightToWorkDocument, r.rightToWorkExpiry || '-', r.visaExpiryDate || '-', r.followUpDate || '-']),
      summary: [
        ['Employees Reviewed', reportRows.length],
        ['Missing RTW', reportRows.filter((r) => r.rightToWorkDocument === 'Missing').length],
        ['Follow-up Scheduled', reportRows.filter((r) => r.followUpDate && r.followUpDate !== '-').length],
        ['Visa Records', reportRows.filter((r) => r.visaExpiryDate && r.visaExpiryDate !== '-').length],
      ],
    };
  }
  if (type === 'document-expiry') {
    const rows = await prisma.employeeDocument.findMany({ include: { employee: { select: { fullName: true, email: true } } }, orderBy: { expiryDate: 'asc' } });
    const reportRows = rows.map((r) => ({ employee: r.employee.fullName, email: r.employee.email, documentType: r.documentType, fileName: r.fileName, expiryDate: formatDate(r.expiryDate), daysRemaining: daysUntil(r.expiryDate) }));
    return {
      filename: '256-logistics-document-expiry.csv',
      headers: ['employee', 'email', 'documentType', 'fileName', 'expiryDate', 'daysRemaining'],
      exportRows: reportRows,
      columns: ['Employee', 'Document Type', 'File', 'Expiry Date', 'Days Remaining'],
      tableRows: reportRows.map((r) => [r.employee, r.documentType.replace(/_/g, ' '), r.fileName, r.expiryDate || '-', r.daysRemaining ?? '-']),
      summary: [
        ['Tracked Documents', reportRows.length],
        ['Expired', reportRows.filter((r) => r.daysRemaining !== null && r.daysRemaining < 0).length],
        ['Due <= 30 Days', reportRows.filter((r) => r.daysRemaining !== null && r.daysRemaining >= 0 && r.daysRemaining <= 30).length],
        ['No Expiry', reportRows.filter((r) => !r.expiryDate).length],
      ],
    };
  }
  if (type === 'pmi') {
    const rows = await prisma.vehicle.findMany({ include: { documents: true }, orderBy: { nextPmiDate: 'asc' } });
    const reportRows = rows.map((r) => ({ registration: r.registration, status: r.status, lastPmiDate: formatDate(r.lastPmiDate), nextPmiDate: formatDate(r.nextPmiDate), pmiDaysRemaining: daysUntil(r.nextPmiDate), pmiSheets: r.documents.filter((d) => d.documentType === 'pmi_sheet').length, brakeTests: r.documents.filter((d) => d.documentType === 'brake_test').length }));
    return {
      filename: '256-logistics-pmi-planner.csv',
      headers: ['registration', 'status', 'lastPmiDate', 'nextPmiDate', 'pmiDaysRemaining', 'pmiSheets', 'brakeTests'],
      exportRows: reportRows,
      columns: ['Vehicle', 'Status', 'Last PMI', 'Next PMI', 'Days Remaining', 'Evidence'],
      tableRows: reportRows.map((r) => [r.registration, r.status.replace(/_/g, ' '), r.lastPmiDate || '-', r.nextPmiDate || '-', r.pmiDaysRemaining ?? '-', `${r.pmiSheets} PMI sheets / ${r.brakeTests} brake tests`]),
      summary: [
        ['Vehicles Planned', reportRows.length],
        ['PMI Overdue', reportRows.filter((r) => r.pmiDaysRemaining !== null && r.pmiDaysRemaining < 0).length],
        ['Due <= 14 Days', reportRows.filter((r) => r.pmiDaysRemaining !== null && r.pmiDaysRemaining >= 0 && r.pmiDaysRemaining <= 14).length],
        ['Evidence Gaps', reportRows.filter((r) => r.pmiSheets === 0 || r.brakeTests === 0).length],
      ],
    };
  }
  if (type === 'vor') {
    const rows = await prisma.vorRecord.findMany({ include: { vehicle: { select: { registration: true } }, authorisedBy: { select: { firstName: true, lastName: true } } }, orderBy: { takenOffRoadDate: 'desc' } });
    const reportRows = rows.map((r) => ({ vehicle: r.vehicle.registration, takenOffRoadDate: formatDate(r.takenOffRoadDate), actualReturnDate: formatDate(r.actualReturnDate), reason: r.reason, repairGarage: r.repairGarage || '', authorisedBy: `${r.authorisedBy.firstName} ${r.authorisedBy.lastName}`, managerSignoffAt: formatDate(r.managerSignoffAt) }));
    return {
      filename: '256-logistics-vor-history.csv',
      headers: ['vehicle', 'takenOffRoadDate', 'actualReturnDate', 'reason', 'repairGarage', 'authorisedBy', 'managerSignoffAt'],
      exportRows: reportRows,
      columns: ['Vehicle', 'Taken Off Road', 'Returned', 'Reason', 'Repair Garage', 'Authorised By'],
      tableRows: reportRows.map((r) => [r.vehicle, r.takenOffRoadDate, r.actualReturnDate || 'Still off road', r.reason, r.repairGarage || '-', r.authorisedBy]),
      summary: [
        ['VOR Records', reportRows.length],
        ['Active VOR', reportRows.filter((r) => !r.actualReturnDate).length],
        ['Returned', reportRows.filter((r) => r.actualReturnDate).length],
        ['With Garage', reportRows.filter((r) => r.repairGarage).length],
      ],
    };
  }
  if (type === 'daily-checks') {
    const rows = await prisma.walkAroundCheck.findMany({ include: { vehicle: { select: { registration: true } }, driver: { select: { fullName: true } }, items: true }, orderBy: { checkDate: 'desc' }, take: 500 });
    const reportRows = rows.map((r) => ({ checkDate: formatDate(r.checkDate), vehicle: r.vehicle.registration, driver: r.driver.fullName, mileage: r.mileage, nilDefect: r.nilDefect, defectItems: r.items.filter((i) => i.status === 'defect_found').length, submittedAt: r.submittedAt.toISOString() }));
    return {
      filename: '256-logistics-daily-checks.csv',
      headers: ['checkDate', 'vehicle', 'driver', 'mileage', 'nilDefect', 'defectItems', 'submittedAt'],
      exportRows: reportRows,
      columns: ['Date', 'Vehicle', 'Driver', 'Mileage', 'Result', 'Defects'],
      tableRows: reportRows.map((r) => [r.checkDate, r.vehicle, r.driver, `${r.mileage.toLocaleString()} mi`, r.nilDefect ? 'Nil defect' : r.defectItems > 0 ? 'Defects reported' : 'Pass', r.defectItems]),
      summary: [
        ['Checks Loaded', reportRows.length],
        ['Nil Defect', reportRows.filter((r) => r.nilDefect).length],
        ['With Defects', reportRows.filter((r) => r.defectItems > 0).length],
        ['Distinct Drivers', new Set(reportRows.map((r) => r.driver)).size],
      ],
    };
  }
  if (type === 'training') {
    const rows = await prisma.trainingRecord.findMany({ include: { employee: { select: { fullName: true, email: true } } }, orderBy: [{ employee: { fullName: 'asc' } }, { trainingType: 'asc' }] });
    const reportRows = rows.map((r) => ({ employee: r.employee.fullName, email: r.employee.email, trainingType: r.trainingType, status: r.status, completedDate: formatDate(r.completedDate), expiryDate: formatDate(r.expiryDate), trainerName: r.trainerName || '' }));
    return {
      filename: '256-logistics-training-records.csv',
      headers: ['employee', 'email', 'trainingType', 'status', 'completedDate', 'expiryDate', 'trainerName'],
      exportRows: reportRows,
      columns: ['Employee', 'Training Type', 'Status', 'Completed', 'Expiry', 'Trainer'],
      tableRows: reportRows.map((r) => [r.employee, TRAINING_LABELS[r.trainingType] || r.trainingType.replace(/_/g, ' '), r.status.replace(/_/g, ' '), r.completedDate || '-', r.expiryDate || '-', r.trainerName || '-']),
      summary: [
        ['Training Records', reportRows.length],
        ['Completed', reportRows.filter((r) => r.status === 'completed').length],
        ['Expired', reportRows.filter((r) => r.status === 'expired').length],
        ['In Progress', reportRows.filter((r) => r.status === 'in_progress').length],
      ],
    };
  }

  return null;
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
    if (!exportRoles[type] || !hasRole(req.user, exportRoles[type])) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'Your account does not have permission to export this report.',
        code: 403,
      });
    }
    const report = await buildReportData(type);
    if (report) return sendCsv(res, report.filename, report.headers, report.exportRows);
    return res.status(404).render('error', { title: 'Not Found', message: 'Report export not found.', code: 404 });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/reports/:type', webAuth, async (req, res) => {
  try {
    const { type } = req.params;
    if (!reportCatalog[type] || !exportRoles[type] || !hasRole(req.user, exportRoles[type])) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'Your account does not have permission to view this report.',
        code: 403,
      });
    }
    const report = await buildReportData(type);
    if (!report) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'The requested report could not be found.',
        code: 404,
      });
    }
    res.render('reports/show', {
      title: reportCatalog[type].name,
      report: {
        ...reportCatalog[type],
        type,
        ...report,
        generatedAt: new Date(),
        rowCount: report.tableRows.length,
        exportHref: `/reports/export/${type}`,
      },
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/reports', webAuth, requireRoles(...reportsRoles), async (req, res) => {
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
router.get('/audit-evidence', webAuth, requireRoles(...evidenceRoles), async (req, res) => {
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

router.get('/settings', webAuth, requireRoles('director'), async (req, res) => {
  try {
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

router.get('/users', webAuth, requireRoles('director'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, firstName: true, lastName: true,
        isActive: true, lastLoginAt: true },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });
    res.render('users/index', { title: 'User Management', users, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/migration', webAuth, requireRoles('director'), async (req, res) => {
  try {
    const [employees, users, vehicles] = await Promise.all([
      prisma.employee.count(),
      prisma.user.count(),
      prisma.vehicle.count(),
    ]);
    res.render('migration/index', { title: 'Migration Center', counts: { employees, users, vehicles } });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

module.exports = router;
