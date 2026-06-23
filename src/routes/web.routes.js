const router = require('express').Router();
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');
const { verify } = require('../config/jwt');
const { DEFAULT_TENANT_ID, runWithTenant } = require('../utils/tenantContext');
const { UPLOAD_DIR, upload } = require('../config/storage');
const { daysUntil, formatDate } = require('../utils/dateHelpers');
const { TRAINING_LABELS, CHECK_ITEM_LABELS, CHECK_ITEMS, TASK_CATEGORIES, TASK_CATEGORY_LABELS, TASK_PRIORITIES, TASK_STATUSES,
  INFRINGEMENT_TYPES, INFRINGEMENT_TYPE_LABELS, INFRINGEMENT_SEVERITIES, DEBRIEF_OUTCOMES, DEBRIEF_OUTCOME_LABELS, driverRiskScore } = require('../utils/constants');
const loginLimiter = require('../middleware/loginLimiter');
const { esc } = require('../utils/escapeHtml');
const { avatar, vehicleThumb, kpiDelta, expiryClass, expiryDate, sparkline } = require('../utils/uiHelpers');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { checkPassword } = require('../utils/passwordPolicy');
const { sendMail } = require('../services/mail.service');
const { ROLE_LABELS, getUserRoles, hasAnyRole, getUserPanels, roleLabel } = require('../utils/rbac');

router.use(cookieParser());

// Web auth middleware
const webAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect('/login');
  const payload = verify(token);
  if (!payload) return res.redirect('/login');
  payload.tenantId = payload.tenantId || DEFAULT_TENANT_ID;
  payload.roles = getUserRoles(payload);
  payload.branchIds = payload.branchIds || [];
  runWithTenant(payload.tenantId, () => {
    req.user = payload;
    // First-login gate: force a password change before any app access.
    if (payload.mustChangePassword && req.path !== '/set-password' && req.path !== '/logout') {
      return res.redirect('/set-password');
    }
    res.locals.user = payload;
    res.locals.formatDate = formatDate;
    res.locals.daysUntil = daysUntil;
    res.locals.esc = esc;
    res.locals.panels = getUserPanels(payload);
    res.locals.roleLabel = roleLabel;
    // Phase A dashboard-redesign UI helpers (avatars, vehicle thumbs, KPI deltas,
    // colour-coded expiry dates, sparklines).
    res.locals.avatar = avatar;
    res.locals.vehicleThumb = vehicleThumb;
    res.locals.kpiDelta = kpiDelta;
    res.locals.expiryClass = expiryClass;
    res.locals.expiryDate = expiryDate;
    res.locals.sparkline = sparkline;
    next();
  });
};

const hasRole = (user, roles) => hasAnyRole(user, roles);

const requireRoles = (...roles) => (req, res, next) => {
  if (hasRole(req.user, roles)) return next();
  return res.status(403).render('error', {
    title: 'Access denied',
    message: 'Your account does not have permission to access this area.',
    code: 403,
  });
};

const peopleRoles = ['super_admin', 'director', 'transport_manager', 'hr_manager', 'operations_manager', 'finance_officer', 'trainer'];
const fleetRoles = ['super_admin', 'director', 'transport_manager', 'operations_manager', 'fleet_manager', 'garage'];
const transportRoles = ['super_admin', 'director', 'transport_manager', 'fleet_manager'];
const hrRoles = ['super_admin', 'director', 'hr_manager'];
const evidenceRoles = ['super_admin', 'director', 'transport_manager', 'hr_manager', 'trainer'];
const reportsRoles = ['super_admin', 'director', 'transport_manager', 'hr_manager', 'operations_manager', 'fleet_manager', 'finance_officer', 'trainer'];

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
  training: ['super_admin', 'director', 'transport_manager', 'hr_manager', 'trainer'],
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

router.post('/login', loginLimiter, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { sign } = require('../config/jwt');
  const { lockMinutesRemaining, registerFailure, registerSuccess } = require('../utils/loginGuard');
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email: email?.toLowerCase().trim() },
      include: { employee: { select: { id: true } } },
    });
    if (!user || !user.isActive) return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });

    const lockedFor = lockMinutesRemaining(user);
    if (lockedFor > 0) {
      return res.render('auth/login', { title: 'Login', error: `Account temporarily locked. Try again in ${lockedFor} minute${lockedFor !== 1 ? 's' : ''}.` });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await registerFailure(user);
      return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });
    }

    await registerSuccess(user);
    const token = sign({ id: user.id, tenantId: user.tenantId, role: user.role, roles: getUserRoles(user), branchIds: user.branchIds || [], email: user.email,
      name: `${user.firstName} ${user.lastName}`, employeeId: user.employee?.id || null, mustChangePassword: user.mustChangePassword || false });

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
    res.redirect('/');
  } catch (e) {
    res.render('auth/login', { title: 'Login', error: 'Login failed. Please try again.' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// ── First-login forced password change ───────────────────────────────
router.get('/set-password', webAuth, (req, res) => {
  res.render('auth/set-password', { title: 'Set your password', error: null, mustChange: !!req.user.mustChangePassword });
});

router.post('/set-password', webAuth, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { sign } = require('../config/jwt');
  const render = (error) => res.render('auth/set-password', { title: 'Set your password', error, mustChange: !!req.user.mustChangePassword });
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) return render('New passwords do not match.');
    const policyError = checkPassword(newPassword);
    if (policyError) return render(policyError);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.redirect('/login');
    // Verify the temporary/current password they were given.
    const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!ok) return render('Your current (temporary) password is incorrect.');
    if (await bcrypt.compare(newPassword, user.passwordHash)) return render('Choose a password different from your temporary one.');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10), mustChangePassword: false, passwordChangedAt: new Date(),
        resetTokenHash: null, resetTokenExpiry: null, failedLoginAttempts: 0, lockedUntil: null },
    });
    // Re-issue the JWT without the mustChangePassword flag so the gate clears.
    const token = sign({ id: user.id, tenantId: user.tenantId, role: user.role, roles: getUserRoles(user), branchIds: user.branchIds || [],
      email: user.email, name: `${user.firstName} ${user.lastName}`, employeeId: req.user.employeeId || null, mustChangePassword: false });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
    res.redirect('/');
  } catch (e) { return render('Could not update your password. Please try again.'); }
});

// ── Account / self-service security ──────────────────────────────────
router.get('/account', webAuth, (req, res) => {
  res.render('account/index', { title: 'My Account' });
});

// ── Forgot / reset password (public) ─────────────────────────────────
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { title: 'Reset password', sent: false });
});

router.post('/forgot-password', loginLimiter, async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  try {
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.isActive) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await prisma.user.update({ where: { id: user.id }, data: { resetTokenHash: tokenHash, resetTokenExpiry: new Date(Date.now() + 3600000) } });
        const link = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        await sendMail({
          to: email,
          subject: 'Reset your 256 Logistics password',
          text: `Reset your password using this link (valid for 1 hour):\n${link}\n\nIf you didn't request this, ignore this email.`,
          html: `<p>Reset your 256 Logistics password using the link below (valid for 1 hour):</p><p><a href="${esc(link)}">${esc(link)}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
        });
      }
    }
  } catch (e) { /* swallowed to avoid revealing whether the email exists */ }
  // Always confirm, regardless of whether the email was found.
  res.render('auth/forgot-password', { title: 'Reset password', sent: true });
});

router.get('/reset-password', (req, res) => {
  res.render('auth/reset-password', { title: 'Set a new password', token: req.query.token || '', error: null, done: false });
});

router.post('/reset-password', loginLimiter, async (req, res) => {
  const { token, password } = req.body;
  const render = (error) => res.render('auth/reset-password', { title: 'Set a new password', token: token || '', error, done: false });
  try {
    if (!token) return render('This reset link is invalid.');
    const pwError = checkPassword(password);
    if (pwError) return render(pwError);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({ where: { resetTokenHash: tokenHash, resetTokenExpiry: { gt: new Date() } } });
    if (!user) return render('This reset link is invalid or has expired. Please request a new one.');
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(password, 10), resetTokenHash: null, resetTokenExpiry: null, failedLoginAttempts: 0, lockedUntil: null },
    });
    return res.render('auth/reset-password', { title: 'Password updated', token: '', error: null, done: true });
  } catch (e) { return render('Something went wrong. Please request a new reset link.'); }
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

// ── Entity images (Phase A: vehicle photos + driver avatars) ───────────────
// Images live in the private uploads dir and are served only to authenticated
// users, like documents. Upload is fetch-based (FormData) so the CSRF header is
// present before multer parses the multipart body.
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const serveEntityImage = (storageKey, res) => {
  if (!storageKey) return res.status(404).end();
  const absolutePath = getAbsoluteStoragePath(storageKey);
  if (!absolutePath.startsWith(path.resolve(process.cwd(), UPLOAD_DIR)) || !fs.existsSync(absolutePath)) {
    return res.status(404).end();
  }
  res.set('Cache-Control', 'private, max-age=300');
  return res.sendFile(absolutePath);
};

// Vehicle photo
router.get('/fleet/:id/photo', webAuth, async (req, res) => {
  try {
    const v = await prisma.vehicle.findUnique({ where: { id: req.params.id }, select: { imageStorageKey: true } });
    return serveEntityImage(v && v.imageStorageKey, res);
  } catch (e) { return res.status(404).end(); }
});

router.post('/fleet/:id/photo', webAuth, requireRoles(...transportRoles),
  (req, res, next) => { req.uploadSubdir = `vehicles/${req.params.id}`; next(); },
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file || !IMAGE_MIME.has(req.file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Please upload a JPG, PNG or WebP image.' });
      }
      const v = await prisma.vehicle.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!v) return res.status(404).json({ success: false, error: 'Vehicle not found.' });
      const storageKey = path.relative(process.cwd(), req.file.path).split(path.sep).join('/');
      await prisma.vehicle.update({ where: { id: req.params.id }, data: { imageStorageKey: storageKey } });
      return res.json({ success: true, url: `/fleet/${req.params.id}/photo?t=${Date.now()}` });
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Could not save the photo.' });
    }
  });

// Employee avatar
router.get('/employees/:id/photo', webAuth, async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({ where: { id: req.params.id }, select: { photoStorageKey: true } });
    return serveEntityImage(emp && emp.photoStorageKey, res);
  } catch (e) { return res.status(404).end(); }
});

router.post('/employees/:id/photo', webAuth, requireRoles(...hrRoles),
  (req, res, next) => { req.uploadSubdir = `employees/${req.params.id}`; next(); },
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file || !IMAGE_MIME.has(req.file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Please upload a JPG, PNG or WebP image.' });
      }
      const emp = await prisma.employee.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!emp) return res.status(404).json({ success: false, error: 'Employee not found.' });
      const storageKey = path.relative(process.cwd(), req.file.path).split(path.sep).join('/');
      await prisma.employee.update({ where: { id: req.params.id }, data: { photoStorageKey: storageKey } });
      return res.json({ success: true, url: `/employees/${req.params.id}/photo?t=${Date.now()}` });
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Could not save the photo.' });
    }
  });

// ── Public site ────────────────────────────────────────
const renderPublicPage = (page, title, extra = {}) => (req, res) => {
  res.render('landing/index', {
    page,
    title,
    leadSent: false,
    leadError: null,
    enquiryType: req.query.type || 'general',
    trackingRef: '',
    trackingResult: null,
    ...extra,
  });
};

router.get('/welcome', renderPublicPage('home', 'FLEET.HQ — One Platform. Total Control.'));
router.get('/about', renderPublicPage('about', 'About — FLEET.HQ by 256 Logistics'));
router.get('/services', renderPublicPage('services', 'Services — FLEET.HQ by 256 Logistics'));
router.get('/quote', (req, res) => res.redirect('/contact?type=quote'));

router.get('/contact', (req, res) => {
  res.render('landing/index', {
    page: 'contact',
    title: 'Contact — FLEET.HQ by 256 Logistics',
    leadSent: req.query.sent === '1',
    leadError: null,
    enquiryType: req.query.type || 'general',
    trackingRef: '',
    trackingResult: null,
  });
});

router.post('/contact', loginLimiter, async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').toLowerCase().trim();
  const phone = (req.body.phone || '').trim();
  const company = (req.body.company || '').trim();
  const enquiryType = (req.body.enquiryType || 'general').trim();
  const message = (req.body.message || '').trim();
  const renderError = (leadError) => res.status(400).render('landing/index', {
    page: 'contact',
    title: 'Contact — FLEET.HQ by 256 Logistics',
    leadSent: false,
    leadError,
    enquiryType,
    formData: { name, email, phone, company, message },
    trackingRef: '',
    trackingResult: null,
  });

  if (!name || !email || !message) {
    return renderError('Please share your name, email, and a short message.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return renderError('Please enter a valid email address.');
  }

  try {
    await prisma.publicLead.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        enquiryType,
        message,
        sourcePath: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      },
    });

    const notificationTo = process.env.ALERT_TO_EMAIL || process.env.SMTP_FROM || 'director@256logisticsltd.com';
    await sendMail({
      to: notificationTo,
      subject: `New public enquiry: ${enquiryType}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || '-'}`,
        `Company: ${company || '-'}`,
        `Type: ${enquiryType}`,
        '',
        message,
      ].join('\n'),
      html: `<p><strong>Name:</strong> ${esc(name)}</p><p><strong>Email:</strong> ${esc(email)}</p><p><strong>Phone:</strong> ${esc(phone || '-')}</p><p><strong>Company:</strong> ${esc(company || '-')}</p><p><strong>Type:</strong> ${esc(enquiryType)}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
    });

    return res.redirect('/contact?sent=1');
  } catch (e) {
    return renderError('We could not save your enquiry. Please try again.');
  }
});

router.get('/track', async (req, res) => {
  const shipmentSvc = require('../services/shipment.service');
  const trackingRef = (req.query.ref || '').trim();
  let trackingResult = null;
  if (trackingRef) {
    const cleanRef = trackingRef.toUpperCase();
    let shipment = null;
    try {
      shipment = await prisma.shipment.findUnique({
        where: { reference: cleanRef },
        include: { events: { orderBy: { createdAt: 'asc' } }, job: { include: { } } },
      });
    } catch (e) { shipment = null; }

    if (shipment) {
      const eventByType = {};
      shipment.events.forEach((e) => { if (!eventByType[e.type]) eventByType[e.type] = e; });
      const timeline = shipmentSvc.buildTimeline(shipment, shipment.events);
      const checkpoints = timeline.map((t) => {
        const ev = eventByType[t.step];
        return {
          label: t.label,
          time: ev ? formatDate(ev.createdAt) : (t.state === 'active' ? 'In progress' : 'Pending'),
          state: t.state === 'pending' ? 'idle' : t.state,
          detail: ev?.detail || `${t.label} milestone will appear here.`,
        };
      });
      let vehicleReg = 'Assigning';
      if (shipment.job?.vehicleId) {
        try { const v = await prisma.vehicle.findUnique({ where: { id: shipment.job.vehicleId } }); if (v) vehicleReg = v.registration; } catch (e) { /* noop */ }
      }
      trackingResult = {
        reference: shipment.reference,
        status: shipmentSvc.statusLabel(shipment.status),
        service: shipment.serviceName,
        etaWindow: shipment.etaWindow || (shipment.collectionDate ? formatDate(shipment.collectionDate) : 'To be confirmed'),
        vehicle: shipment.status === 'delivered' ? 'Delivered' : vehicleReg,
        nextAction: shipment.status === 'delivered'
          ? 'This shipment has been delivered. Proof of delivery is on file.'
          : 'Operations is progressing this shipment — milestones update as it moves.',
        checkpoints,
      };
    } else {
      trackingResult = {
        reference: cleanRef,
        status: 'Not found',
        service: '—',
        etaWindow: '—',
        vehicle: '—',
        nextAction: 'We could not find that reference. Please check it, or contact the operations desk for help.',
        checkpoints: [],
      };
    }
  }
  res.render('landing/index', {
    page: 'track', title: 'Track a shipment — FLEET.HQ', leadSent: false, leadError: null,
    enquiryType: 'general', trackingRef, trackingResult,
  });
});

// Front door: unauthenticated visitors meet the landing page, not the login wall.
const landingGate = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token || !verify(token)) return res.redirect('/welcome');
  return next();
};

// ── Dashboard ──────────────────────────────────────────
router.get('/', landingGate, webAuth, async (req, res) => {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [totalEmp, sponsoredCount, totalVehicles, activeVehicles, vorVehicles,
      openDefects, rawAlerts, latestScore, missedChecks, pendingToolbox, recentDefects, weeklyChecks, weeklyDefects, alertAnalytics, openDefectAnalytics] = await Promise.all([
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
      prisma.walkAroundCheck.findMany({
        where: { checkDate: { gte: sevenDaysAgo } },
        select: { checkDate: true, nilDefect: true },
        orderBy: { checkDate: 'asc' },
      }),
      prisma.defectCase.findMany({
        where: { reportedAt: { gte: sevenDaysAgo } },
        select: { reportedAt: true, severity: true, status: true },
        orderBy: { reportedAt: 'asc' },
      }),
      prisma.alert.findMany({
        where: { isResolved: false },
        select: { alertType: true, severity: true },
      }),
      prisma.defectCase.findMany({
        where: { status: { not: 'signed_off' } },
        select: { severity: true, status: true },
      }),
    ]);

    const alerts = await Promise.all(rawAlerts.map((alert) => decorateAlert(alert, req.user)));
    const score = latestScore || await require('../services/compliance.service').calculateAndStore();

    // ── Phase B (dashboard redesign): compliance-overview tiles, 6-month trend,
    // score delta, and driver/vehicle "actions required" counts — all from real data.
    const shiftDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
    const in30 = shiftDays(30);
    const in60 = shiftDays(60);
    const pmiSoon = shiftDays(14);
    const dueTrainingWhere = { OR: [{ status: 'expired' }, { AND: [{ status: { not: 'completed' } }, { expiryDate: { lte: in30 } }] }] };
    const [motDue, insuranceDue, roadTaxDue, tachoDue, pmiDue, cpcDue, trainingDue, rtwDue,
      driverCount, vehicleActions, driverActions, priorScore, trendScores] = await Promise.all([
      prisma.vehicle.count({ where: { status: { not: 'sold' }, motExpiryDate: { lte: in30 } } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' }, insuranceExpiryDate: { lte: in30 } } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' }, roadTaxExpiryDate: { lte: in30 } } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' }, tachoCalibrExpiry: { lte: in30 } } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' }, nextPmiDate: { lte: pmiSoon } } }),
      prisma.trainingRecord.count({ where: { trainingType: 'cpc', OR: [{ status: 'expired' }, { expiryDate: { lte: in30 } }] } }),
      prisma.trainingRecord.count({ where: dueTrainingWhere }),
      prisma.sponsoredWorker.count({ where: { OR: [{ visaExpiryDate: { lte: in60 } }, { rightToWorkFollowupDate: { lte: in60 } }] } }),
      prisma.employee.count({ where: { employmentStatus: 'active', isDriver: true } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' }, OR: [
        { status: 'vor' }, { motExpiryDate: { lte: in30 } }, { insuranceExpiryDate: { lte: in30 } },
        { roadTaxExpiryDate: { lte: in30 } }, { tachoCalibrExpiry: { lte: in30 } }, { nextPmiDate: { lte: pmiSoon } } ] } }),
      prisma.employee.count({ where: { employmentStatus: 'active', isDriver: true, OR: [
        { trainingRecords: { some: dueTrainingWhere } },
        { sponsoredWorker: { OR: [{ visaExpiryDate: { lte: in60 } }, { rightToWorkFollowupDate: { lte: in60 } }] } } ] } }),
      prisma.complianceScore.findFirst({ where: { scoreDate: { lte: shiftDays(-25) } }, orderBy: { scoreDate: 'desc' } }),
      prisma.complianceScore.findMany({ where: { scoreDate: { gte: shiftDays(-185) } }, orderBy: { scoreDate: 'asc' }, select: { scoreDate: true, overallScore: true } }),
    ]);
    const tone = (n) => (n > 0 ? 'amber' : 'green');
    const complianceTiles = [
      { key: 'mot', label: 'MOT Due', count: motDue, href: '/fleet', tone: tone(motDue) },
      { key: 'pmi', label: 'PMI Due', count: pmiDue, href: '/fleet/pmi-planner', tone: tone(pmiDue) },
      { key: 'insurance', label: 'Insurance Due', count: insuranceDue, href: '/fleet', tone: tone(insuranceDue) },
      { key: 'roadtax', label: 'Road Tax Due', count: roadTaxDue, href: '/fleet', tone: tone(roadTaxDue) },
      { key: 'tacho', label: 'Tacho Calibration', count: tachoDue, href: '/fleet', tone: tone(tachoDue) },
      { key: 'cpc', label: 'CPC Due', count: cpcDue, href: '/training', tone: tone(cpcDue) },
      { key: 'rtw', label: 'RTW / Visa Due', count: rtwDue, href: '/sponsored-workers', tone: rtwDue > 0 ? 'red' : 'green' },
      { key: 'training', label: 'Training Due', count: trainingDue, href: '/training', tone: tone(trainingDue) },
    ];
    const overallNow = Number(score.overallScore ?? score.overall);
    const scoreDelta = priorScore ? overallNow - Number(priorScore.overallScore) : null;
    const complianceTrend = trendScores.map((s) => ({
      label: new Date(s.scoreDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      value: Number(s.overallScore),
    }));

    const alertGroups = {
      critical: alerts.filter(a => a.severity === 'critical'),
      warning: alerts.filter(a => a.severity === 'warning'),
      notice: alerts.filter(a => a.severity === 'notice'),
    };
    const dashboardTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + index);
      const checks = weeklyChecks.filter((item) => new Date(item.checkDate).toDateString() === date.toDateString());
      const defects = weeklyDefects.filter((item) => new Date(item.reportedAt).toDateString() === date.toDateString());
      return {
        label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        checks: checks.length,
        nilDefects: checks.filter((item) => item.nilDefect).length,
        defects: defects.length,
      };
    });
    const defectSeverity = openDefectAnalytics.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, { dangerous: 0, serious: 0, minor: 0 });
    const defectStatus = openDefectAnalytics.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    const alertTypeMap = alertAnalytics.reduce((acc, item) => {
      acc[item.alertType] = (acc[item.alertType] || 0) + 1;
      return acc;
    }, {});
    const topHotspots = Object.entries(alertTypeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([type, count]) => ({ label: formatAlertTypeLabel(type), count }));
    const chartData = {
      trend: dashboardTrend,
      alerts: {
        critical: alertGroups.critical.length,
        warning: alertGroups.warning.length,
        notice: alertGroups.notice.length,
      },
      defects: {
        dangerous: defectSeverity.dangerous || 0,
        serious: defectSeverity.serious || 0,
        minor: defectSeverity.minor || 0,
        underReview: defectStatus.under_review || 0,
        repairBooked: defectStatus.repair_booked || 0,
        reported: defectStatus.reported || 0,
      },
      hotspots: topHotspots,
    };
    const healthCards = [
      {
        label: 'People Coverage',
        value: Number(score.peopleScore ?? score.people),
        detail: `${sponsoredCount} sponsored workers tracked`,
        href: '/employees',
      },
      {
        label: 'Fleet Exposure',
        value: Number(score.fleetScore ?? score.fleet),
        detail: `${vorVehicles} VOR and ${openDefects} open defects`,
        href: '/fleet',
      },
      {
        label: 'Driver Readiness',
        value: Number(score.driverScore ?? score.driver),
        detail: `${missedChecks} missed checks and ${pendingToolbox} unsigned talks`,
        href: '/checks',
      },
    ];

    // Upcoming compliance tasks (Phase C) — next open tasks by due date.
    const upcomingRaw = await prisma.complianceTask.findMany({
      where: { status: { notIn: ['completed', 'cancelled'] } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 6,
    });
    const upcomingTasks = upcomingRaw.map((t) => ({
      id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate,
      isOverdue: t.dueDate && new Date(t.dueDate) < new Date(),
    }));

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: { totalEmp, sponsoredCount, totalVehicles, activeVehicles, vorVehicles, openDefects, missedChecks, pendingToolbox,
        driverCount, driverActions, vehicleActions },
      score: { people: Number(score.peopleScore ?? score.people), fleet: Number(score.fleetScore ?? score.fleet),
        driver: Number(score.driverScore ?? score.driver), overall: Number(score.overallScore ?? score.overall) },
      complianceTiles, complianceTrend, scoreDelta, upcomingTasks,
      alerts, alertGroups, recentDefects, chartData, healthCards,
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Employees ──────────────────────────────────────────
router.get('/employees', webAuth, requireRoles(...peopleRoles), async (req, res) => {
  try {
    const { search, status = 'active', department, type = '' } = req.query;
    const PAGE_SIZE = 25;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const where = {};
    if (status) where.employmentStatus = status;
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (type === 'drivers') where.isDriver = true;
    if (type === 'sponsored') where.isSponsored = true;
    if (search) where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { jobTitle: { contains: search, mode: 'insensitive' } },
    ];

    const [total, employees, departments] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          documents: { select: { documentType: true, expiryDate: true } },
          drivingVehicle: { select: { registration: true } },
        },
        orderBy: { fullName: 'asc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.employee.findMany({ select: { department: true }, distinct: ['department'], orderBy: { department: 'asc' } }),
    ]);

    const required = ['contract', 'passport', 'right_to_work'];
    let enriched = employees.map(e => ({
      ...e,
      missingDocs: required.filter(r => !e.documents.find(d => d.documentType === r)).length,
    }));
    if (type === 'missing_docs') enriched = enriched.filter(e => e.missingDocs > 0);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    res.render('employees/index', { title: 'People & Compliance', employees: enriched,
      departments: departments.map(d => d.department), filters: { search, status, department, type },
      page, totalPages, total });
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
    // Employees flagged as sponsored but missing their CoS/visa compliance record
    const incomplete = await prisma.employee.findMany({
      where: { isSponsored: true, sponsoredWorker: { is: null } },
      select: { id: true, fullName: true, jobTitle: true, department: true, email: true },
      orderBy: { fullName: 'asc' },
    });
    // Anyone without a sponsorship record yet (for the "add" picker)
    const eligibleEmployees = await prisma.employee.findMany({
      where: { sponsoredWorker: { is: null }, employmentStatus: { not: 'terminated' } },
      select: { id: true, fullName: true, jobTitle: true, workLocation: true, contractedHours: true, salary: true },
      orderBy: { fullName: 'asc' },
    });
    res.render('sponsored/index', { title: 'Sponsored Workers', workers, incomplete, eligibleEmployees,
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
    const PAGE_SIZE = 25;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const where = {};
    if (status) where.status = status;
    else where.status = { not: 'sold' };

    // For compliance filters we need all records to filter in-memory, then paginate
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        assignedDriver: { select: { fullName: true } },
        defects: { where: { status: { not: 'signed_off' } }, select: { id: true, severity: true } },
        checks: { orderBy: { checkDate: 'desc' }, take: 1 },
      },
      orderBy: { registration: 'asc' },
    });

    const allEnriched = vehicles.map(v => ({
      ...v,
      motDays: daysUntil(v.motExpiryDate),
      insuranceDays: daysUntil(v.insuranceExpiryDate),
      roadTaxDays: daysUntil(v.roadTaxExpiryDate),
      tachoDays: daysUntil(v.tachoCalibrExpiry),
      pmiDays: daysUntil(v.nextPmiDate),
      lastCheckDate: v.checks[0]?.checkDate || null,
    }));

    // Fleet-wide KPI strip (Phase B M1) — computed from the full status-scoped set
    // before the compliance ("due") filter narrows the table.
    const within = (days, n) => days !== null && days <= n;
    const fleetKpis = {
      total: allEnriched.length,
      vor: allEnriched.filter(v => v.status === 'vor').length,
      motDue: allEnriched.filter(v => within(v.motDays, 30)).length,
      insuranceDue: allEnriched.filter(v => within(v.insuranceDays, 30)).length,
      roadTaxDue: allEnriched.filter(v => within(v.roadTaxDays, 30)).length,
      tachoDue: allEnriched.filter(v => within(v.tachoDays, 30)).length,
      pmiDue: allEnriched.filter(v => within(v.pmiDays, 14)).length,
      openDefects: allEnriched.filter(v => v.defects.length > 0).length,
    };

    let enriched = allEnriched;
    if (due === 'pmi_overdue') enriched = enriched.filter(v => v.pmiDays !== null && v.pmiDays < 0);
    if (due === 'pmi_due_14') enriched = enriched.filter(v => v.pmiDays !== null && v.pmiDays >= 0 && v.pmiDays <= 14);
    if (due === 'mot_due_30') enriched = enriched.filter(v => v.motDays !== null && v.motDays >= 0 && v.motDays <= 30);
    if (due === 'open_defects') enriched = enriched.filter(v => v.defects.length > 0);
    if (due === 'unassigned') enriched = enriched.filter(v => !v.assignedDriver);

    const total = enriched.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const paged = enriched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    res.render('vehicles/index', { title: 'Fleet & Roadworthiness', vehicles: paged, filters: { status, due }, formatDate, page, totalPages, total, fleetKpis });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ══ PHASE 2: Fleet Manager — overview + fuel (must be before /fleet/:id) ══
const fleetMgrRoles = ['super_admin', 'director', 'transport_manager', 'operations_manager', 'fleet_manager'];
const daysBetween = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

router.get('/fleet/overview', webAuth, requireRoles(...fleetRoles), async (req, res) => {
  try {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    const [vehicles, openDefects, vorOpen, fuelMonth] = await Promise.all([
      prisma.vehicle.findMany({ where: { status: { not: 'sold' } } }),
      prisma.defectCase.count({ where: { status: { notIn: ['repaired', 'signed_off'] } } }),
      prisma.vorRecord.count({ where: { actualReturnDate: null } }),
      prisma.fuelLog.findMany({ where: { loggedDate: { gte: monthStart } } }),
    ]);
    const active = vehicles.filter((v) => v.status === 'active').length;
    const vor = vehicles.filter((v) => v.status === 'vor').length;
    const expiring = [];
    for (const v of vehicles) {
      const checks = [
        ['MOT', v.motExpiryDate], ['Insurance', v.insuranceExpiryDate],
        ['Road tax', v.roadTaxExpiryDate], ['Tacho cal.', v.tachoCalibrExpiry], ['PMI', v.nextPmiDate],
      ];
      for (const [label, date] of checks) {
        if (!date) continue;
        const d = daysBetween(date);
        if (d <= 30) expiring.push({ reg: v.registration, id: v.id, label, date, days: d });
      }
    }
    expiring.sort((a, b) => a.days - b.days);
    const fuelSpend = fuelMonth.reduce((s, f) => s + Number(f.cost), 0);
    const fuelLitres = fuelMonth.reduce((s, f) => s + Number(f.litres), 0);
    res.render('fleet/overview', {
      title: 'Fleet Overview',
      stats: { total: vehicles.length, active, vor, openDefects, vorOpen, fuelSpend, fuelLitres, fuelLogs: fuelMonth.length, ppl: fuelLitres ? fuelSpend / fuelLitres : 0 },
      expiring: expiring.slice(0, 12), formatDate, path: '/fleet/overview',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/fleet/fuel', webAuth, requireRoles(...fleetRoles), async (req, res) => {
  try {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); thirtyDaysAgo.setHours(0, 0, 0, 0);
    const [logs, vehicles, monthLogs, trendLogs] = await Promise.all([
      prisma.fuelLog.findMany({ orderBy: { loggedDate: 'desc' }, take: 60 }),
      prisma.vehicle.findMany({ where: { status: { not: 'sold' } }, select: { id: true, registration: true }, orderBy: { registration: 'asc' } }),
      prisma.fuelLog.findMany({ where: { loggedDate: { gte: monthStart } } }),
      prisma.fuelLog.findMany({ where: { loggedDate: { gte: thirtyDaysAgo } }, orderBy: { loggedDate: 'asc' } }),
    ]);
    const vehMap = Object.fromEntries(vehicles.map((v) => [v.id, v.registration]));
    const spend = monthLogs.reduce((s, f) => s + Number(f.cost), 0);
    const litres = monthLogs.reduce((s, f) => s + Number(f.litres), 0);

    // Build 30-day daily trend
    const fuelByDay = {};
    trendLogs.forEach((f) => {
      const d = new Date(f.loggedDate); d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split('T')[0];
      fuelByDay[key] = (fuelByDay[key] || 0) + Number(f.cost);
    });
    const fuelChart = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo); d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      return { label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), total: fuelByDay[key] || 0 };
    });

    // Fleet Fuel Performance (Phase B M7): per-vehicle MPG from odometer deltas,
    // with a small MPG-trend series for sparklines. UK gallon = 4.54609 L.
    const ninetyAgo = new Date(); ninetyAgo.setDate(ninetyAgo.getDate() - 90);
    const perfLogs = await prisma.fuelLog.findMany({
      where: { loggedDate: { gte: ninetyAgo }, odometer: { not: null } },
      orderBy: { loggedDate: 'asc' },
      select: { vehicleId: true, litres: true, cost: true, odometer: true },
    });
    const byVehicle = {};
    perfLogs.forEach((f) => { (byVehicle[f.vehicleId] = byVehicle[f.vehicleId] || []).push(f); });
    const fuelPerformance = Object.entries(byVehicle).map(([vehicleId, fills]) => {
      const mpgSeries = [];
      let totLitres = 0, totSpend = 0, totMiles = 0;
      for (let i = 0; i < fills.length; i++) {
        totLitres += Number(fills[i].litres);
        totSpend += Number(fills[i].cost);
        if (i > 0) {
          const miles = Number(fills[i].odometer) - Number(fills[i - 1].odometer);
          const gallons = Number(fills[i].litres) / 4.54609;
          if (miles > 0 && gallons > 0 && miles < 3000) { mpgSeries.push(miles / gallons); totMiles += miles; }
        }
      }
      const avgMpg = mpgSeries.length ? mpgSeries.reduce((s, n) => s + n, 0) / mpgSeries.length : null;
      return {
        vehicleId, registration: vehMap[vehicleId] || '—',
        litres: totLitres, spend: totSpend,
        avgMpg, mpgSeries, costPerMile: totMiles > 0 ? totSpend / totMiles : null,
      };
    }).filter(p => p.avgMpg !== null).sort((a, b) => b.avgMpg - a.avgMpg);
    const fleetMpgVals = fuelPerformance.map(p => p.avgMpg);
    const fleetAvgMpg = fleetMpgVals.length ? fleetMpgVals.reduce((s, n) => s + n, 0) / fleetMpgVals.length : null;
    // Efficiency score: scale fleet avg MPG against a 12 MPG "excellent" benchmark.
    const efficiencyScore = fleetAvgMpg !== null ? Math.max(0, Math.min(100, Math.round((fleetAvgMpg / 12) * 100))) : null;

    res.render('fleet/fuel', { title: 'Fuel Management', logs, vehicles, vehMap, totals: { spend, litres, ppl: litres ? spend / litres : 0, count: monthLogs.length }, fuelChart, fuelPerformance, fleetAvgMpg, efficiencyScore, canLog: hasRole(req.user, fleetMgrRoles), formatDate, path: '/fleet/fuel' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/fleet/fuel', webAuth, requireRoles(...fleetMgrRoles), async (req, res) => {
  try {
    const b = req.body;
    if (!b.vehicleId) return res.redirect('/fleet/fuel');
    await prisma.fuelLog.create({
      data: {
        vehicleId: b.vehicleId,
        driverId: b.driverId || null,
        loggedDate: b.loggedDate ? new Date(b.loggedDate) : new Date(),
        litres: parseFloat(b.litres) || 0,
        cost: parseFloat(b.cost) || 0,
        odometer: b.odometer ? parseInt(b.odometer, 10) : null,
        fuelCard: b.fuelCard || null,
        notes: b.notes || null,
        createdById: req.user.id,
      },
    });
    res.redirect('/fleet/fuel');
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
    const isManager = req.user.role !== 'driver';
    const [checks, missed, openDefectsCount, vorCount, defectsWithPhotos, reviewsPending, recentPhotos, openDefectCards] = await Promise.all([
      prisma.walkAroundCheck.findMany({
        where: checkWhere,
        include: {
          vehicle: { select: { id: true, registration: true, imageStorageKey: true } },
          driver: { select: { id: true, fullName: true, photoStorageKey: true } },
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
      isManager ? prisma.defectCase.count({ where: { status: { not: 'signed_off' } } }) : Promise.resolve(0),
      isManager ? prisma.vehicle.count({ where: { status: 'vor' } }) : Promise.resolve(0),
      isManager ? prisma.defectCase.count({ where: { status: { not: 'signed_off' }, photos: { some: {} } } }) : Promise.resolve(0),
      isManager ? prisma.defectCase.count({ where: { status: { in: ['reported', 'under_review'] } } }) : Promise.resolve(0),
      isManager ? prisma.defectPhoto.findMany({
        orderBy: { createdAt: 'desc' }, take: 8,
        include: { defectCase: { select: { id: true, referenceNumber: true, defectCategory: true, vehicle: { select: { registration: true } } } } },
      }) : Promise.resolve([]),
      isManager ? prisma.defectCase.findMany({
        where: { status: { not: 'signed_off' } },
        orderBy: [{ severity: 'asc' }, { reportedAt: 'desc' }], take: 6,
        include: {
          vehicle: { select: { id: true, registration: true, imageStorageKey: true } },
          reportedBy: { select: { fullName: true, photoStorageKey: true, id: true } },
          _count: { select: { photos: true } },
        },
      }) : Promise.resolve([]),
    ]);

    const missedVehicles = req.user.role === 'driver' ? [] : missed.filter(v => v.checks.length === 0);
    const checkedTodayCount = missed.filter(v => v.checks.length > 0).length;
    const kpis = {
      checkedToday: checkedTodayCount,
      fleetSize: missed.length,
      awaitingCheck: missedVehicles.length,
      openDefects: openDefectsCount,
      vor: vorCount,
      defectsWithPhotos,
      reviewsPending,
    };
    res.render('checks/index', { title: 'Daily Checks', checks, missedVehicles, kpis, recentPhotos, openDefectCards, isManager, formatDate });
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
  // A driver checking the vehicle allocated to a shipment job may not be its "assigned"
  // driver — ensure the requested vehicle is selectable.
  const preselectVehicle = req.query.vehicle || '';
  if (preselectVehicle && !vehicles.some((v) => v.id === preselectVehicle)) {
    const extra = await prisma.vehicle.findUnique({ where: { id: preselectVehicle }, select: { id: true, registration: true, make: true, model: true } });
    if (extra) vehicles.unshift(extra);
  }
  res.render('checks/form', { title: 'Daily Walk-Around Check', vehicles, preselectVehicle, CHECK_ITEMS, CHECK_ITEM_LABELS });
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
const driverRiskRoles = ['super_admin', 'director', 'transport_manager', 'operations_manager', 'fleet_manager'];

// Build per-driver risk rows (score, infringements, debriefs, points) from the
// infringement/debrief/profile tables. Shared by the list and profile views.
async function buildDriverRisk(drivers) {
  const driverIds = drivers.map(d => d.id);
  const [infringements, debriefs, profiles] = await Promise.all([
    prisma.driverInfringement.findMany({ where: { driverId: { in: driverIds } }, orderBy: { infringementDate: 'desc' } }),
    prisma.driverDebrief.findMany({ where: { driverId: { in: driverIds } }, orderBy: { debriefDate: 'desc' } }),
    prisma.driverRiskProfile.findMany({ where: { driverId: { in: driverIds } } }),
  ]);
  const profileMap = Object.fromEntries(profiles.map(p => [p.driverId, p]));
  const rows = drivers.map(d => {
    const inf = infringements.filter(i => i.driverId === d.id);
    const deb = debriefs.filter(b => b.driverId === d.id);
    const open = inf.filter(i => i.status === 'open');
    const profile = profileMap[d.id] || null;
    const licencePoints = profile ? profile.licencePoints : 0;
    const { score, band } = driverRiskScore({
      openInfringements: open.length,
      majorInfringements: open.filter(i => i.severity === 'major').length,
      seriousInfringements: open.filter(i => i.severity === 'serious').length,
      licencePoints,
    });
    return {
      id: d.id, fullName: d.fullName, photoStorageKey: d.photoStorageKey,
      jobTitle: d.jobTitle, vehicleReg: d.drivingVehicle?.registration || null,
      infringements: inf, debriefs: deb, openInfringements: open.length,
      totalInfringements: inf.length, licencePoints, profile,
      lastDebrief: deb[0]?.debriefDate || null, score, band,
    };
  });
  return { rows, infringements, debriefs };
}

router.get('/driver-risk', webAuth, requireRoles(...driverRiskRoles), async (req, res) => {
  try {
    const drivers = await prisma.employee.findMany({
      where: { isDriver: true, employmentStatus: 'active' },
      select: { id: true, fullName: true, photoStorageKey: true, jobTitle: true, drivingVehicle: { select: { registration: true } } },
      orderBy: { fullName: 'asc' },
    });
    const { rows, infringements, debriefs } = await buildDriverRisk(drivers);
    const empMap = Object.fromEntries(drivers.map(d => [d.id, d.fullName]));

    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const monthInfringements = infringements.filter(i => new Date(i.infringementDate) >= thirtyAgo);
    const distribution = { low: rows.filter(r => r.band === 'low').length, medium: rows.filter(r => r.band === 'medium').length, high: rows.filter(r => r.band === 'high').length };
    const avgScore = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
    const kpis = {
      total: rows.length,
      highRisk: distribution.high,
      activeInfringements: infringements.filter(i => i.status === 'open').length,
      withPoints: rows.filter(r => r.licencePoints > 0).length,
      debriefsMonth: debriefs.filter(b => new Date(b.debriefDate) >= thirtyAgo).length,
      avgScore,
    };
    // Infringement type breakdown this month
    const infByType = {};
    monthInfringements.forEach(i => { infByType[i.type] = (infByType[i.type] || 0) + 1; });
    const infTypeRows = Object.entries(infByType).map(([k, v]) => ({ label: INFRINGEMENT_TYPE_LABELS[k] || k, count: v })).sort((a, b) => b.count - a.count).slice(0, 6);
    const topScorecard = [...rows].sort((a, b) => b.score - a.score).slice(0, 5);
    const recentInfringements = infringements.slice(0, 8).map(i => ({ ...i, driverName: empMap[i.driverId] || '—' }));
    const recentDebriefs = debriefs.slice(0, 8).map(b => ({ ...b, driverName: empMap[b.driverId] || '—' }));
    const pointsLeaders = rows.filter(r => r.licencePoints > 0).sort((a, b) => b.licencePoints - a.licencePoints).slice(0, 6);

    const insights = [];
    if (distribution.high > 0) insights.push({ tone: 'red', text: `${distribution.high} driver${distribution.high === 1 ? '' : 's'} in the high-risk band — book debriefs.` });
    const topPoints = pointsLeaders[0];
    if (topPoints) insights.push({ tone: 'amber', text: `${topPoints.fullName} has the most licence points (${topPoints.licencePoints}).` });
    if (monthInfringements.length > 0) insights.push({ tone: 'amber', text: `${monthInfringements.length} infringement${monthInfringements.length === 1 ? '' : 's'} recorded in the last 30 days.` });
    if (insights.length === 0) insights.push({ tone: 'green', text: 'No high-risk drivers and no recent infringements — fleet is driving well.' });

    res.render('driver-risk', {
      title: 'Driver Risk', rows, kpis, distribution, avgScore, infTypeRows, topScorecard,
      recentInfringements, recentDebriefs, pointsLeaders, insights,
      infringementTypeLabels: INFRINGEMENT_TYPE_LABELS, debriefOutcomeLabels: DEBRIEF_OUTCOME_LABELS,
      formatDate, path: '/driver-risk',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/driver-risk/:id', webAuth, requireRoles(...driverRiskRoles), async (req, res) => {
  try {
    const driver = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: { id: true, fullName: true, photoStorageKey: true, jobTitle: true, startDate: true, drivingVehicle: { select: { registration: true } },
        trainingRecords: { where: { trainingType: 'cpc' }, select: { expiryDate: true } } },
    });
    if (!driver || !driver.id) return res.redirect('/driver-risk');
    const { rows } = await buildDriverRisk([driver]);
    const row = rows[0];
    // League position
    const allDrivers = await prisma.employee.findMany({ where: { isDriver: true, employmentStatus: 'active' }, select: { id: true, fullName: true, photoStorageKey: true, drivingVehicle: { select: { registration: true } } } });
    const { rows: allRows } = await buildDriverRisk(allDrivers);
    const league = [...allRows].sort((a, b) => b.score - a.score);
    const rank = league.findIndex(r => r.id === driver.id) + 1;
    // 6-month performance trend from infringements (fewer = higher score proxy)
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return d; });
    const trend = months.map(m => {
      const monthInf = row.infringements.filter(i => { const d = new Date(i.infringementDate); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); }).length;
      return { label: m.toLocaleDateString('en-GB', { month: 'short' }), score: Math.max(0, 100 - monthInf * 12) };
    });

    res.render('driver-risk-profile', {
      title: row.fullName, driver, row, league: league.slice(0, 8), rank, totalDrivers: league.length, trend,
      cpcExpiry: driver.trainingRecords[0]?.expiryDate || null,
      infringementTypes: INFRINGEMENT_TYPES, infringementTypeLabels: INFRINGEMENT_TYPE_LABELS, infringementSeverities: INFRINGEMENT_SEVERITIES,
      debriefOutcomes: DEBRIEF_OUTCOMES, debriefOutcomeLabels: DEBRIEF_OUTCOME_LABELS,
      formatDate, path: '/driver-risk',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/driver-risk/:id/infringements', webAuth, requireRoles(...driverRiskRoles), async (req, res) => {
  try {
    const { type, severity, points, infringementDate, notes } = req.body;
    await prisma.driverInfringement.create({
      data: {
        driverId: req.params.id,
        type: INFRINGEMENT_TYPES.includes(type) ? type : 'other',
        severity: INFRINGEMENT_SEVERITIES.includes(severity) ? severity : 'minor',
        points: Math.max(0, parseInt(points, 10) || 0),
        infringementDate: infringementDate ? new Date(infringementDate) : new Date(),
        notes: notes?.trim() || null,
        recordedById: req.user.id,
      },
    });
    res.redirect('/driver-risk/' + req.params.id);
  } catch (e) { res.redirect('/driver-risk/' + req.params.id); }
});

router.post('/driver-risk/infringements/:infId/close', webAuth, requireRoles(...driverRiskRoles), async (req, res) => {
  try {
    const inf = await prisma.driverInfringement.update({ where: { id: req.params.infId }, data: { status: 'closed' } });
    res.json({ success: true, driverId: inf.driverId });
  } catch (e) { res.status(500).json({ success: false }); }
});

router.post('/driver-risk/:id/debriefs', webAuth, requireRoles(...driverRiskRoles), async (req, res) => {
  try {
    const { outcome, debriefDate, notes } = req.body;
    await prisma.driverDebrief.create({
      data: {
        driverId: req.params.id,
        outcome: DEBRIEF_OUTCOMES.includes(outcome) ? outcome : 'positive',
        debriefDate: debriefDate ? new Date(debriefDate) : new Date(),
        conductedById: req.user.id,
        notes: notes?.trim() || null,
      },
    });
    res.redirect('/driver-risk/' + req.params.id);
  } catch (e) { res.redirect('/driver-risk/' + req.params.id); }
});

router.post('/driver-risk/:id/profile', webAuth, requireRoles(...driverRiskRoles), async (req, res) => {
  try {
    const { licenceNumber, licenceClass, dvlaCheckDate, licencePoints } = req.body;
    const data = {
      licenceNumber: licenceNumber?.trim() || null,
      licenceClass: licenceClass?.trim() || null,
      dvlaCheckDate: dvlaCheckDate ? new Date(dvlaCheckDate) : null,
      licencePoints: Math.max(0, parseInt(licencePoints, 10) || 0),
    };
    await prisma.driverRiskProfile.upsert({
      where: { driverId: req.params.id },
      update: data,
      create: { driverId: req.params.id, ...data },
    });
    res.redirect('/driver-risk/' + req.params.id);
  } catch (e) { res.redirect('/driver-risk/' + req.params.id); }
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

const reportBadgeTone = (pack) => (pack === 'DVSA' ? 'badge-amber' : pack === 'People' ? 'badge-blue' : 'badge-purple');

const buildAuditEvidenceWorkspace = ({ stats, recentAudit }) => {
  const folders = [
    {
      slug: 'home-office-sponsor-licence-audit',
      name: 'Home Office Sponsor Licence Audit',
      owner: 'HR Manager',
      icon: 'folder-lock',
      score: Math.max(0, Math.round(100 - ((stats.missingRtw + stats.missingContracts) / Math.max(stats.employees, 1)) * 50)),
      actions: stats.missingRtw + stats.missingContracts,
      theme: 'blue',
      reportTypes: ['staff', 'sponsored', 'right-to-work', 'document-expiry'],
      checklist: [
        { label: 'Missing Right to Work evidence', count: stats.missingRtw, href: '/employees?type=missing_docs' },
        { label: 'Missing employment contracts', count: stats.missingContracts, href: '/employees?type=missing_docs' },
        { label: 'Sponsored workers requiring review', count: stats.sponsored, href: '/sponsored-workers' },
      ],
      entityTypes: ['employee', 'sponsored_worker', 'sponsored_change', 'employee_document'],
    },
    {
      slug: 'dvsa-maintenance-investigation',
      name: 'DVSA Maintenance Investigation',
      owner: 'Transport Manager',
      icon: 'folder-wrench',
      score: Math.max(0, Math.round(100 - ((stats.openDefects + stats.activeVor + stats.pmiOverdue) / Math.max((stats.openDefects + stats.activeVor + stats.pmiOverdue + 10), 1)) * 100)),
      actions: stats.openDefects + stats.activeVor + stats.pmiOverdue,
      theme: 'amber',
      reportTypes: ['fleet', 'pmi', 'defects', 'vor', 'daily-checks'],
      checklist: [
        { label: 'Open defects requiring closure', count: stats.openDefects, href: '/defects' },
        { label: 'Vehicles currently VOR', count: stats.activeVor, href: '/vor' },
        { label: 'PMI overdue', count: stats.pmiOverdue, href: '/fleet?due=pmi_overdue' },
      ],
      entityTypes: ['vehicle', 'defect', 'vor_record', 'walk_around_check'],
    },
    {
      slug: 'traffic-commissioner-evidence-file',
      name: 'Traffic Commissioner Evidence File',
      owner: 'Director',
      icon: 'folder-briefcase',
      score: Math.max(0, 100 - (stats.criticalAlerts * 5)),
      actions: stats.criticalAlerts,
      theme: 'red',
      reportTypes: ['fleet', 'defects', 'training'],
      checklist: [
        { label: 'Critical alerts needing evidence', count: stats.criticalAlerts, href: '/' },
        { label: 'Open defects still active', count: stats.openDefects, href: '/defects' },
      ],
      entityTypes: ['defect', 'vehicle', 'training_record', 'audit_log'],
    },
    {
      slug: 'driver-disciplinary-file',
      name: 'Driver Disciplinary File',
      owner: 'Operations Manager',
      icon: 'folder-user',
      score: Math.max(0, 100 - (stats.unsignedToolbox * 10)),
      actions: stats.unsignedToolbox,
      theme: 'purple',
      reportTypes: ['training', 'daily-checks'],
      checklist: [
        { label: 'Manager sign-offs pending', count: stats.unsignedToolbox, href: '/training' },
        { label: 'Missed checks needing review', count: stats.missedChecks, href: '/checks' },
      ],
      entityTypes: ['training_record', 'walk_around_check', 'toolbox_talk'],
    },
    {
      slug: 'insurance-claim-evidence',
      name: 'Insurance Claim Evidence',
      owner: 'Transport Manager',
      icon: 'folder-shield',
      score: stats.activeVor || stats.openDefects ? 82 : 100,
      actions: stats.activeVor + stats.openDefects,
      theme: 'green',
      reportTypes: ['defects', 'vor'],
      checklist: [
        { label: 'Open defects tied to claims', count: stats.openDefects, href: '/defects' },
        { label: 'Vehicles off road', count: stats.activeVor, href: '/vor' },
      ],
      entityTypes: ['defect', 'vor_record', 'vehicle'],
    },
    {
      slug: 'employment-dispute',
      name: 'Employment Dispute',
      owner: 'HR Manager',
      icon: 'folder-docs',
      score: stats.missingContracts ? 78 : 100,
      actions: stats.missingContracts,
      theme: 'slate',
      reportTypes: ['staff', 'document-expiry'],
      checklist: [
        { label: 'Missing employment contracts', count: stats.missingContracts, href: '/employees?type=missing_docs' },
        { label: 'Staff records to review', count: stats.employees, href: '/employees' },
      ],
      entityTypes: ['employee', 'employee_document', 'audit_log'],
    },
  ].map((folder) => ({
    ...folder,
    exports: folder.reportTypes.map((type) => ({
      type,
      href: `/reports/export/${type}`,
      viewHref: `/reports/${type}`,
      name: reportCatalog[type].name,
      description: reportCatalog[type].description,
      pack: reportCatalog[type].pack,
      tone: reportBadgeTone(reportCatalog[type].pack),
    })),
    recentAudit: recentAudit.filter((log) => folder.entityTypes.includes(log.entityType)).slice(0, 10),
  }));

  return folders;
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
    const [employees, sponsored, missingRtw, missingContracts, openDefects, activeVor, pmiOverdue, criticalAlerts, unsignedToolbox, missedChecks, recentAudit] = await Promise.all([
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.sponsoredWorker.count(),
      prisma.employee.count({ where: { documents: { none: { documentType: 'right_to_work' } } } }),
      prisma.employee.count({ where: { documents: { none: { documentType: 'contract' } } } }),
      prisma.defectCase.count({ where: { status: { not: 'signed_off' } } }),
      prisma.vorRecord.count({ where: { actualReturnDate: null } }),
      prisma.vehicle.count({ where: { nextPmiDate: { lt: new Date() }, status: { not: 'sold' } } }),
      prisma.alert.count({ where: { severity: 'critical', isResolved: false } }),
      prisma.toolboxTalk.count({ where: { managerSignedOff: false } }),
      prisma.alert.count({ where: { alertType: 'missed_check', isResolved: false } }),
      prisma.auditLog.findMany({ include: { user: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    const stats = { employees, sponsored, missingRtw, missingContracts, openDefects, activeVor, pmiOverdue, criticalAlerts, unsignedToolbox, missedChecks };
    const folders = buildAuditEvidenceWorkspace({ stats, recentAudit });

    res.render('audit-evidence/index', { title: 'Audit Evidence Centre', folders, recentAudit, stats, formatDate });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/audit-evidence/:slug', webAuth, requireRoles(...evidenceRoles), async (req, res) => {
  try {
    const [employees, sponsored, missingRtw, missingContracts, openDefects, activeVor, pmiOverdue, criticalAlerts, unsignedToolbox, missedChecks, recentAudit] = await Promise.all([
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.sponsoredWorker.count(),
      prisma.employee.count({ where: { documents: { none: { documentType: 'right_to_work' } } } }),
      prisma.employee.count({ where: { documents: { none: { documentType: 'contract' } } } }),
      prisma.defectCase.count({ where: { status: { not: 'signed_off' } } }),
      prisma.vorRecord.count({ where: { actualReturnDate: null } }),
      prisma.vehicle.count({ where: { nextPmiDate: { lt: new Date() }, status: { not: 'sold' } } }),
      prisma.alert.count({ where: { severity: 'critical', isResolved: false } }),
      prisma.toolboxTalk.count({ where: { managerSignedOff: false } }),
      prisma.alert.count({ where: { alertType: 'missed_check', isResolved: false } }),
      prisma.auditLog.findMany({ include: { user: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 40 }),
    ]);

    const stats = { employees, sponsored, missingRtw, missingContracts, openDefects, activeVor, pmiOverdue, criticalAlerts, unsignedToolbox, missedChecks };
    const folders = buildAuditEvidenceWorkspace({ stats, recentAudit });
    const folder = folders.find((item) => item.slug === req.params.slug);

    if (!folder) {
      return res.status(404).render('error', {
        title: 'Evidence Folder Not Found',
        message: 'The requested audit evidence workspace could not be found.',
        code: 404,
      });
    }

    res.render('audit-evidence/show', {
      title: folder.name,
      folder,
      folders,
      stats,
      recentAudit,
      formatDate,
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

const adminWriteOnly = (req, res, next) => {
  if (hasRole(req.user, ['super_admin'])) return next();
  return res.status(403).render('error', {
    title: 'Access denied',
    message: 'Only Super Admin can change platform settings.',
    code: 403,
  });
};

const slugify = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48);

const toMoney = (value) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) return '0.00';
  return parsed.toFixed(2);
};

const listFromText = (value) => String(value || '')
  .split(/\r?\n|,/)
  .map((item) => item.trim())
  .filter(Boolean);

const ensureCompanyProfile = async () => {
  const existing = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
  if (existing) return existing;

  return prisma.company.create({
    data: {
      name: '256 Logistics',
      legalName: '256 Logistics Ltd',
      timezone: 'Europe/London',
      branding: {
        accentColor: '#2f80ed',
        publicName: '256 Logistics',
      },
    },
  });
};

// ── Platform Admin — tenant onboarding (super_admin / director) ─────────
const platformAdminOnly = (req, res, next) => {
  if (hasRole(req.user, ['super_admin', 'director'])) return next();
  return res.status(403).render('error', { title: 'Access denied', message: 'Only a platform administrator can onboard businesses.', code: 403 });
};

// Readable temporary password: letters + digits + a hyphen, e.g. "Fleet-kRtMq482".
const generateTempPassword = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  let p = 'Fleet-';
  for (let i = 0; i < 5; i++) p += letters[crypto.randomInt(letters.length)];
  for (let i = 0; i < 3; i++) p += digits[crypto.randomInt(digits.length)];
  return p;
};

const TENANT_ADMIN_ROLES = ['director', 'transport_manager', 'operations_manager', 'hr_manager'];

router.get('/platform', webAuth, platformAdminOnly, async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: { _count: { select: { users: true, companies: true, branches: true } } },
      orderBy: [{ onboardedAt: 'desc' }, { createdAt: 'desc' }],
    });
    const kpis = {
      total: tenants.length,
      active: tenants.filter(t => t.status === 'active').length,
      trial: tenants.filter(t => t.status === 'trial').length,
      suspended: tenants.filter(t => t.status === 'suspended').length,
      users: tenants.reduce((s, t) => s + t._count.users, 0),
    };
    res.render('platform/index', { title: 'Platform Admin', tenants, kpis, formatDate, path: '/platform' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/platform/onboard', webAuth, platformAdminOnly, (req, res) => {
  res.render('platform/onboard', { title: 'Onboard a business', error: null, form: {}, adminRoles: TENANT_ADMIN_ROLES, roleLabel, path: '/platform' });
});

router.post('/platform/onboard', webAuth, platformAdminOnly, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const b = req.body;
  const form = { ...b };
  const render = (error) => res.render('platform/onboard', { title: 'Onboard a business', error, form, adminRoles: TENANT_ADMIN_ROLES, roleLabel, path: '/platform' });
  try {
    const tradingName = (b.tradingName || '').trim();
    const adminEmail = (b.adminEmail || '').trim().toLowerCase();
    const adminFirst = (b.adminFirstName || '').trim();
    const adminLast = (b.adminLastName || '').trim();
    if (!tradingName) return render('Business trading name is required.');
    if (!adminFirst || !adminLast) return render("The primary admin's first and last name are required.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) return render('A valid primary admin email is required.');

    // Global email-uniqueness check (raw query bypasses tenant scoping).
    const exists = await prisma.$queryRaw`SELECT 1 FROM "User" WHERE LOWER(email) = ${adminEmail} LIMIT 1`;
    if (Array.isArray(exists) && exists.length) return render('That admin email is already in use on the platform.');

    const adminRole = TENANT_ADMIN_ROLES.includes(b.adminRole) ? b.adminRole : 'director';
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const tenant = await prisma.tenant.create({
      data: {
        name: tradingName,
        slug: slugify(b.slug || tradingName) || slugify(tradingName + '-' + Date.now()),
        plan: (b.plan || 'starter').trim(),
        status: ['active', 'trial', 'suspended'].includes(b.status) ? b.status : 'trial',
        onboardedAt: new Date(),
        primaryContactName: `${adminFirst} ${adminLast}`,
        primaryContactEmail: adminEmail,
        primaryContactPhone: b.adminPhone || null,
        notes: b.notes || null,
      },
    });

    let adminUser;
    await runWithTenant(tenant.id, async () => {
      const company = await prisma.company.create({
        data: {
          name: (b.publicName || tradingName).trim(),
          legalName: b.legalName || null,
          operatorLicenceNumber: b.operatorLicence || null,
          registeredAddress: b.registeredAddress || null,
          timezone: b.timezone || 'Europe/London',
          branding: { publicName: (b.publicName || tradingName).trim(), accentColor: b.accentColour || '#e11d2a' },
        },
      });
      const branch = await prisma.branch.create({ data: { name: b.branchName?.trim() || 'Head Office', companyId: company.id } });
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail, passwordHash, role: adminRole, roles: [adminRole],
          firstName: adminFirst, lastName: adminLast, phone: b.adminPhone || null,
          isActive: true, mustChangePassword: true, companyId: company.id, branchIds: [branch.id],
        },
      });
    });

    // Optional welcome email with credentials + first-login instructions.
    let emailed = false;
    if (b.sendEmail) {
      const loginUrl = `${req.protocol}://${req.get('host')}/login`;
      try {
        await sendMail({
          to: adminEmail,
          subject: `Welcome to FLEET.HQ — your ${tradingName} account is ready`,
          html: `<p>Hi ${esc(adminFirst)},</p>
            <p>Your <strong>${esc(tradingName)}</strong> account on FLEET.HQ has been created. Sign in and you'll be asked to set your own password on first login.</p>
            <p><strong>Sign-in:</strong> <a href="${loginUrl}">${loginUrl}</a><br>
            <strong>Email:</strong> ${esc(adminEmail)}<br>
            <strong>Temporary password:</strong> ${esc(tempPassword)}</p>
            <p>For security, this temporary password must be changed the first time you sign in.</p>
            <p>— FLEET.HQ, powered by 256 Digital Technologies</p>`,
        });
        emailed = true;
      } catch (mailErr) { emailed = false; }
    }

    return res.render('platform/onboarded', {
      title: 'Business onboarded',
      tenant, admin: adminUser, tempPassword, emailed, reset: false,
      loginUrl: `${req.protocol}://${req.get('host')}/login`,
      path: '/platform',
    });
  } catch (e) {
    if (e.code === 'P2002') return render('That admin email is already in use on the platform.');
    return render('Could not onboard the business: ' + (e.message || 'unexpected error'));
  }
});

router.post('/platform/tenants/:id/update', webAuth, platformAdminOnly, async (req, res) => {
  try {
    const data = {};
    if (req.body.plan) data.plan = req.body.plan.trim();
    if (['active', 'trial', 'suspended'].includes(req.body.status)) data.status = req.body.status;
    if (typeof req.body.notes === 'string') data.notes = req.body.notes || null;
    await prisma.tenant.update({ where: { id: req.params.id }, data });
    res.redirect('/platform');
  } catch (e) { res.redirect('/platform'); }
});

router.post('/platform/tenants/:id/reset-admin', webAuth, platformAdminOnly, async (req, res) => {
  const bcrypt = require('bcryptjs');
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
    if (!tenant) return res.redirect('/platform');
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    let admin;
    await runWithTenant(tenant.id, async () => {
      admin = await prisma.user.findFirst({ where: { email: tenant.primaryContactEmail || undefined }, orderBy: { createdAt: 'asc' } })
        || await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (admin) {
        await prisma.user.update({ where: { id: admin.id }, data: { passwordHash, mustChangePassword: true, failedLoginAttempts: 0, lockedUntil: null } });
      }
    });
    if (!admin) return res.redirect('/platform');
    return res.render('platform/onboarded', {
      title: 'Admin password reset', tenant, admin, tempPassword, emailed: false, reset: true,
      loginUrl: `${req.protocol}://${req.get('host')}/login`, path: '/platform',
    });
  } catch (e) { res.redirect('/platform'); }
});

router.get('/super-admin', webAuth, requireRoles('super_admin', 'director'), async (req, res) => {
  try {
    const [
      tenant,
      company,
      branches,
      serviceTypes,
      configRows,
      users,
      counts,
      tenants,
      recentAudit,
    ] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: req.user.tenantId } }),
      prisma.company.findFirst({ orderBy: { createdAt: 'asc' } }),
      prisma.branch.findMany({ orderBy: [{ name: 'asc' }] }),
      prisma.serviceType.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
      prisma.systemConfig.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] }),
      prisma.user.findMany({
        select: { id: true, email: true, role: true, roles: true, branchIds: true, firstName: true, lastName: true, isActive: true, lastLoginAt: true },
        orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
      }),
      Promise.all([
        prisma.user.count(),
        prisma.branch.count(),
        prisma.vehicle.count(),
        prisma.publicLead.count({ where: { isResolved: false } }),
        prisma.serviceType.count({ where: { isActive: true } }),
      ]),
      prisma.tenant.findMany({
        include: { _count: { select: { users: true, companies: true, branches: true } } },
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
      }),
      prisma.auditLog.findMany({
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const config = configRows.reduce((acc, row) => {
      acc[`${row.category}.${row.key}`] = row.value;
      return acc;
    }, {});
    const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
    res.render('super-admin/index', {
      title: 'Super Admin',
      tenant,
      company,
      branches,
      serviceTypes,
      users,
      tenants,
      recentAudit,
      roleOptions,
      config,
      canWrite: hasRole(req.user, ['super_admin']),
      stats: {
        users: counts[0],
        branches: counts[1],
        vehicles: counts[2],
        openLeads: counts[3],
        activeServices: counts[4],
      },
      saved: req.query.saved || '',
      formatDate,
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/super-admin/tenants', webAuth, adminWriteOnly, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) throw new Error('Tenant name is required');
    const slug = slugify(req.body.slug || name);
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        plan: (req.body.plan || 'starter').trim(),
        status: req.body.status || 'trial',
      },
    });
    await runWithTenant(tenant.id, async () => {
      const company = await prisma.company.create({
        data: {
          name,
          legalName: req.body.legalName || null,
          timezone: req.body.timezone || 'Europe/London',
        },
      });
      await prisma.branch.create({ data: { name: 'Main Branch', companyId: company.id } });
    });
    res.redirect('/super-admin?saved=tenant');
  } catch (e) { res.status(400).render('error', { title: 'Tenant create failed', message: e.message, code: 400 }); }
});

router.post('/super-admin/tenants/:id/status', webAuth, adminWriteOnly, async (req, res) => {
  try {
    await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: req.body.status || 'active', plan: req.body.plan || undefined },
    });
    res.redirect('/super-admin?saved=tenant-status');
  } catch (e) { res.status(400).render('error', { title: 'Tenant update failed', message: e.message, code: 400 }); }
});

router.post('/super-admin/company', webAuth, adminWriteOnly, async (req, res) => {
  try {
    const existing = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
    const data = {
      name: (req.body.name || '').trim() || '256 Logistics',
      legalName: (req.body.legalName || '').trim() || null,
      operatorLicenceNumber: (req.body.operatorLicenceNumber || '').trim() || null,
      registeredAddress: (req.body.registeredAddress || '').trim() || null,
      timezone: req.body.timezone || 'Europe/London',
      branding: {
        accentColor: req.body.accentColor || '#2f80ed',
        publicName: req.body.publicName || req.body.name || '256 Logistics',
      },
    };
    if (existing) await prisma.company.update({ where: { id: existing.id }, data });
    else await prisma.company.create({ data });
    res.redirect('/super-admin?saved=company');
  } catch (e) { res.status(400).render('error', { title: 'Company update failed', message: e.message, code: 400 }); }
});

router.post('/super-admin/branches', webAuth, adminWriteOnly, async (req, res) => {
  try {
    const company = await ensureCompanyProfile();
    await prisma.branch.create({
      data: {
        companyId: company.id,
        name: (req.body.name || '').trim(),
        address: (req.body.address || '').trim() || null,
        serviceAreas: listFromText(req.body.serviceAreas),
        hours: { summary: (req.body.hours || '').trim() || 'Standard operating hours' },
      },
    });
    res.redirect('/super-admin?saved=branch');
  } catch (e) { res.status(400).render('error', { title: 'Branch create failed', message: e.message, code: 400 }); }
});

router.post('/super-admin/branches/:id', webAuth, adminWriteOnly, async (req, res) => {
  try {
    await prisma.branch.update({
      where: { id: req.params.id },
      data: {
        name: (req.body.name || '').trim(),
        address: (req.body.address || '').trim() || null,
        serviceAreas: listFromText(req.body.serviceAreas),
        hours: { summary: (req.body.hours || '').trim() || 'Standard operating hours' },
      },
    });
    res.redirect('/super-admin?saved=branch');
  } catch (e) { res.status(400).render('error', { title: 'Branch update failed', message: e.message, code: 400 }); }
});

router.post('/super-admin/service-types', webAuth, adminWriteOnly, async (req, res) => {
  try {
    await prisma.serviceType.create({
      data: {
        name: (req.body.name || '').trim(),
        code: slugify(req.body.code || req.body.name).toUpperCase(),
        description: (req.body.description || '').trim() || null,
        baseRate: toMoney(req.body.baseRate),
        perMileRate: toMoney(req.body.perMileRate),
        sortOrder: Number(req.body.sortOrder || 0),
        isActive: req.body.isActive !== 'false',
      },
    });
    res.redirect('/super-admin?saved=service');
  } catch (e) { res.status(400).render('error', { title: 'Service create failed', message: e.message, code: 400 }); }
});

router.post('/super-admin/service-types/:id', webAuth, adminWriteOnly, async (req, res) => {
  try {
    await prisma.serviceType.update({
      where: { id: req.params.id },
      data: {
        name: (req.body.name || '').trim(),
        code: slugify(req.body.code || req.body.name).toUpperCase(),
        description: (req.body.description || '').trim() || null,
        baseRate: toMoney(req.body.baseRate),
        perMileRate: toMoney(req.body.perMileRate),
        sortOrder: Number(req.body.sortOrder || 0),
        isActive: req.body.isActive === 'true',
      },
    });
    res.redirect('/super-admin?saved=service');
  } catch (e) { res.status(400).render('error', { title: 'Service update failed', message: e.message, code: 400 }); }
});

router.post('/super-admin/system-config', webAuth, adminWriteOnly, async (req, res) => {
  try {
    const value = {
      alertFrom: req.body.alertFrom || process.env.ALERT_FROM_EMAIL || 'alerts@256logisticsltd.com',
      smtpEnabled: req.body.smtpEnabled === 'true',
      smsProvider: req.body.smsProvider || 'not_configured',
      publicTrackingEnabled: req.body.publicTrackingEnabled === 'true',
      leadNotificationsEnabled: req.body.leadNotificationsEnabled === 'true',
    };
    const existing = await prisma.systemConfig.findFirst({ where: { category: 'notifications', key: 'email_sms' } });
    if (existing) await prisma.systemConfig.update({ where: { id: existing.id }, data: { value } });
    else await prisma.systemConfig.create({ data: { category: 'notifications', key: 'email_sms', value } });
    res.redirect('/super-admin?saved=config');
  } catch (e) { res.status(400).render('error', { title: 'Config update failed', message: e.message, code: 400 }); }
});

router.get('/settings', webAuth, requireRoles('super_admin', 'director'), async (req, res) => {
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

router.get('/users', webAuth, requireRoles('super_admin', 'director'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, roles: true, branchIds: true, firstName: true, lastName: true,
        isActive: true, lastLoginAt: true },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });
    // Employees with an email but no login account yet (for "create users from employees")
    const linkedEmployeeIds = new Set((await prisma.user.findMany({ where: { employeeId: { not: null } }, select: { employeeId: true } })).map(u => u.employeeId));
    const takenEmails = new Set(users.map(u => u.email.toLowerCase()));
    const emps = await prisma.employee.findMany({
      where: { employmentStatus: { not: 'terminated' } },
      select: { id: true, fullName: true, email: true, jobTitle: true, isDriver: true },
      orderBy: { fullName: 'asc' },
    });
    const eligibleEmployees = emps.filter(e => e.email && !takenEmails.has(e.email.toLowerCase()) && !linkedEmployeeIds.has(e.id));
    const [roleOptions, branches] = [
      Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
      await prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ];
    res.render('users/index', { title: 'User Management', users, eligibleEmployees, formatDate, roleOptions, branches });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.get('/migration', webAuth, requireRoles('super_admin', 'director'), async (req, res) => {
  try {
    const [employees, users, vehicles] = await Promise.all([
      prisma.employee.count(),
      prisma.user.count(),
      prisma.vehicle.count(),
    ]);
    res.render('migration/index', { title: 'Migration Center', counts: { employees, users, vehicles } });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Privacy / GDPR ────────────────────────────────────────────────────────────

router.get('/privacy', (req, res) => {
  const token = req.cookies?.token;
  const authed = !!(token && verify(token));
  res.render('privacy/index', { title: 'Privacy Policy', authed });
});

// Data subject access request (DSAR) — director-only: export all data for one employee
router.get('/privacy/dsar', webAuth, requireRoles('super_admin', 'director', 'hr_manager'), async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      const employees = await prisma.employee.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
      return res.render('privacy/dsar', { title: 'Data Subject Access Request', employees, query: req.query });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        documents: true,
        trainingRecords: true,
        acknowledgements: true,
        checksSubmitted: true,
        defectsReported: true,
        userAccount: { select: { id: true, email: true, role: true, roles: true, createdAt: true, lastLoginAt: true } },
        sponsoredWorker: { include: { changes: true } },
      },
    });
    if (!employee) return res.render('error', { title: 'Not Found', message: 'Employee not found.', code: 404 });

    res.setHeader('Content-Disposition', `attachment; filename="dsar-${employee.id}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({ exportedAt: new Date(), employee });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// Right to erasure — director only: anonymise a leaver's personal data, preserving operational records
router.post('/privacy/erase', webAuth, requireRoles('super_admin', 'director'), async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).render('error', { title: 'Bad Request', message: 'employeeId is required', code: 400 });

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).render('error', { title: 'Not Found', message: 'Employee not found.', code: 404 });

    const anon = `[erased-${Date.now()}]`;
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        fullName: anon,
        email: null,
        phone: null,
        homeAddress: anon,
        dateOfBirth: new Date('1900-01-01'),
        nationalInsuranceNumber: null,
        passportNumber: null,
        visaNumber: null,
      },
    });

    // Remove the linked login account (no longer needed after erasure)
    await prisma.user.deleteMany({ where: { employeeId } });

    const employees = await prisma.employee.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    res.render('privacy/dsar', { title: 'Data Subject Access Request', employees, query: { erased: '1' } });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ══════════════════════════════════════════════════════════════════════
// SHIPMENT SPINE (Phase 1): quote → book → allocate → deliver → invoice
// ══════════════════════════════════════════════════════════════════════
const shipmentSvc = require('../services/shipment.service');
const pricingSvc = require('../services/pricing.service');

const portalRoles = ['super_admin', 'director', 'operations_manager', 'transport_manager', 'client'];
const dispatchRoles = ['super_admin', 'director', 'operations_manager', 'transport_manager'];
const driverJobRoles = ['super_admin', 'director', 'operations_manager', 'transport_manager', 'driver'];
const invoiceRoles = ['super_admin', 'director', 'finance_officer'];
const num = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

// ── Client portal dashboard ───────────────────────────────────────────
router.get('/portal', webAuth, requireRoles(...portalRoles), async (req, res) => {
  try {
    const [shipments, counts] = await Promise.all([
      prisma.shipment.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { customer: true, invoice: true } }),
      prisma.shipment.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
    const total = counts.reduce((s, c) => s + c._count._all, 0);
    const active = total - (byStatus.delivered || 0) - (byStatus.cancelled || 0);
    res.render('portal/dashboard', { title: 'Client Portal', shipments, stats: { total, active, delivered: byStatus.delivered || 0, outForDelivery: byStatus.out_for_delivery || 0 }, svc: shipmentSvc, formatDate, path: '/portal' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Booking form ──────────────────────────────────────────────────────
router.get('/book', webAuth, requireRoles(...portalRoles), async (req, res) => {
  try {
    const [services, customers] = await Promise.all([
      prisma.serviceType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.customer.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.render('portal/book', { title: 'Book a shipment', services, customers, formatDate, path: '/book' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Live quote (AJAX) ─────────────────────────────────────────────────
router.post('/book/quote', webAuth, requireRoles(...portalRoles), async (req, res) => {
  try {
    const svc = req.body.serviceTypeId ? await prisma.serviceType.findUnique({ where: { id: req.body.serviceTypeId } }) : null;
    if (!svc) return res.status(400).json({ error: 'Choose a service' });
    const q = pricingSvc.quote(svc, num(req.body.distanceMiles), num(req.body.weightKg));
    res.json({ ...q, service: svc.name });
  } catch (e) { res.status(500).json({ error: 'Could not price that' }); }
});

// ── Create shipment ───────────────────────────────────────────────────
router.post('/book', webAuth, requireRoles(...portalRoles), async (req, res) => {
  try {
    const b = req.body;
    if (!b.serviceTypeId || !b.pickupAddress || !b.deliveryAddress) {
      return res.status(400).render('error', { title: 'Missing details', message: 'Service, pickup and delivery address are required.', code: 400 });
    }
    let customerId = b.customerId || null;
    if (!customerId && (b.newCustomerName || '').trim()) {
      const c = await prisma.customer.create({ data: { name: b.newCustomerName.trim(), email: b.newCustomerEmail || null, phone: b.newCustomerPhone || null, createdById: req.user.id } });
      customerId = c.id;
    }
    const shipment = await shipmentSvc.createShipment({
      customerId,
      serviceTypeId: b.serviceTypeId,
      pickupContact: b.pickupContact, pickupAddress: b.pickupAddress, pickupPostcode: b.pickupPostcode,
      deliveryContact: b.deliveryContact, deliveryAddress: b.deliveryAddress, deliveryPostcode: b.deliveryPostcode,
      parcelCount: parseInt(b.parcelCount, 10) || 1,
      weightKg: num(b.weightKg), distanceMiles: num(b.distanceMiles),
      collectionDate: b.collectionDate ? new Date(b.collectionDate) : null,
      etaWindow: b.etaWindow || null, instructions: b.instructions || null,
    }, req.user.id);
    res.redirect(`/shipments/${shipment.id}`);
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Quick-create customer ─────────────────────────────────────────────
router.post('/customers', webAuth, requireRoles(...portalRoles), async (req, res) => {
  try {
    await prisma.customer.create({ data: { name: (req.body.name || '').trim(), email: req.body.email || null, phone: req.body.phone || null, billingAddress: req.body.billingAddress || null, accountType: req.body.accountType || 'payg', createdById: req.user.id } });
    res.redirect(req.body.returnTo || '/book');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Shipment list ─────────────────────────────────────────────────────
router.get('/shipments', webAuth, requireRoles(...portalRoles), async (req, res) => {
  try {
    const status = req.query.status;
    const PAGE_SIZE = 25;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const where = status ? { status } : {};
    const [total, shipments] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { customer: true, job: true, invoice: true } }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    res.render('portal/shipments', { title: 'Shipments', shipments, status: status || '', svc: shipmentSvc, formatDate, path: '/shipments', page, totalPages, total });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Shipment detail + timeline ────────────────────────────────────────
router.get('/shipments/:id', webAuth, requireRoles(...portalRoles), async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { customer: true, invoice: true, pod: true, events: { orderBy: { createdAt: 'desc' } }, job: true },
    });
    if (!shipment) return res.status(404).render('error', { title: 'Not found', message: 'Shipment not found.', code: 404 });
    let driver = null; let vehicle = null;
    if (shipment.job?.driverId) driver = await prisma.employee.findUnique({ where: { id: shipment.job.driverId }, select: { fullName: true } });
    if (shipment.job?.vehicleId) vehicle = await prisma.vehicle.findUnique({ where: { id: shipment.job.vehicleId }, select: { registration: true } });
    res.render('portal/shipment', { title: shipment.reference, shipment, driver, vehicle, svc: shipmentSvc, formatDate, canManage: hasRole(req.user, dispatchRoles), canInvoice: hasRole(req.user, invoiceRoles), path: '/shipments' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Dispatch board ────────────────────────────────────────────────────
router.get('/dispatch', webAuth, requireRoles(...dispatchRoles), async (req, res) => {
  try {
    const [unallocated, active, drivers, vehicles] = await Promise.all([
      prisma.shipment.findMany({ where: { status: 'booked' }, orderBy: { createdAt: 'asc' }, include: { customer: true } }),
      prisma.shipment.findMany({ where: { status: { in: ['allocated', 'collected', 'in_transit', 'out_for_delivery'] } }, orderBy: { updatedAt: 'desc' }, include: { customer: true, job: true } }),
      prisma.employee.findMany({ where: { isDriver: true, employmentStatus: 'active' }, orderBy: { fullName: 'asc' }, select: { id: true, fullName: true } }),
      prisma.vehicle.findMany({ where: { status: 'active' }, orderBy: { registration: 'asc' }, select: { id: true, registration: true } }),
    ]);
    // resolve driver/vehicle names for active jobs
    const empMap = Object.fromEntries(drivers.map((d) => [d.id, d.fullName]));
    const vehMap = Object.fromEntries(vehicles.map((v) => [v.id, v.registration]));
    res.render('dispatch/board', { title: 'Dispatch', unallocated, active, drivers, vehicles, empMap, vehMap, svc: shipmentSvc, formatDate, path: '/dispatch' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/dispatch/:id/allocate', webAuth, requireRoles(...dispatchRoles), async (req, res) => {
  try {
    if (!req.body.driverId || !req.body.vehicleId) return res.redirect('/dispatch');
    await shipmentSvc.allocate(req.params.id, { driverId: req.body.driverId, vehicleId: req.body.vehicleId }, req.user.id);
    res.redirect('/dispatch');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/shipments/:id/status', webAuth, requireRoles(...dispatchRoles), async (req, res) => {
  try {
    await shipmentSvc.setStatus(req.params.id, req.body.status, req.user.id);
    res.redirect(req.body.returnTo || `/shipments/${req.params.id}`);
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Driver jobs ───────────────────────────────────────────────────────
router.get('/driver/jobs', webAuth, requireRoles(...driverJobRoles), async (req, res) => {
  try {
    const where = req.user.role === 'driver' && req.user.employeeId ? { driverId: req.user.employeeId } : {};
    const jobs = await prisma.job.findMany({
      where: { ...where, status: { in: ['offered', 'accepted', 'en_route'] } },
      orderBy: { allocatedAt: 'asc' },
      include: { shipment: { include: { customer: true } } },
    });
    // Tie the daily walk-around check to the job's vehicle.
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const vehicleIds = [...new Set(jobs.map((j) => j.vehicleId).filter(Boolean))];
    const [checksToday, vehicleRows] = await Promise.all([
      vehicleIds.length ? prisma.walkAroundCheck.findMany({ where: { vehicleId: { in: vehicleIds }, checkDate: { gte: today } }, select: { vehicleId: true } }) : [],
      vehicleIds.length ? prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, registration: true } }) : [],
    ]);
    const checked = new Set(checksToday.map((c) => c.vehicleId));
    const vehMap = Object.fromEntries(vehicleRows.map((v) => [v.id, v.registration]));
    const enriched = jobs.map((j) => ({ ...j, vehicleReg: j.vehicleId ? (vehMap[j.vehicleId] || 'Vehicle') : null, vehicleChecked: j.vehicleId ? checked.has(j.vehicleId) : false }));
    res.render('driver/jobs', { title: 'My Jobs', jobs: enriched, svc: shipmentSvc, formatDate, path: '/driver/jobs' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/jobs/:id/accept', webAuth, requireRoles(...driverJobRoles), async (req, res) => {
  try {
    await prisma.job.update({ where: { id: req.params.id }, data: { status: 'accepted', acceptedAt: new Date() } });
    res.redirect('/driver/jobs');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/jobs/:id/collect', webAuth, requireRoles(...driverJobRoles), async (req, res) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (job) await shipmentSvc.setStatus(job.shipmentId, 'collected', req.user.id);
    res.redirect('/driver/jobs');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/jobs/:id/deliver', webAuth, requireRoles(...driverJobRoles), async (req, res) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (job) {
      await shipmentSvc.recordPod(job.shipmentId, { recipientName: req.body.recipientName, signatureData: req.body.signatureData, notes: req.body.notes, otpVerified: !!req.body.otpVerified }, req.user.id);
    }
    res.redirect('/driver/jobs');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Invoices (invoice-only MVP) ───────────────────────────────────────
router.get('/invoices', webAuth, requireRoles(...invoiceRoles), async (req, res) => {
  try {
    const PAGE_SIZE = 25;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const [total, invoices, allTotals] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { customer: true, shipment: true } }),
      prisma.invoice.findMany({ select: { total: true, status: true } }),
    ]);
    const totals = allTotals.reduce((a, i) => { a.all += Number(i.total); if (i.status !== 'paid') a.outstanding += Number(i.total); return a; }, { all: 0, outstanding: 0 });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    res.render('invoices/index', { title: 'Invoices', invoices, totals, formatDate, path: '/invoices', page, totalPages, total });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/shipments/:id/invoice', webAuth, requireRoles(...invoiceRoles), async (req, res) => {
  try {
    await shipmentSvc.generateInvoice(req.params.id, req.user.id);
    res.redirect(req.body.returnTo || `/shipments/${req.params.id}`);
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/invoices/:id/pay', webAuth, requireRoles(...invoiceRoles), async (req, res) => {
  try {
    await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'paid', paidAt: new Date() } });
    res.redirect('/invoices');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/invoices/:id/remind', webAuth, requireRoles(...invoiceRoles), async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id },
      include: { customer: true, shipment: true },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ error: 'Invoice is already paid' });
    if (!invoice.customer?.email) return res.status(400).json({ error: 'Customer has no email address on file' });

    const dueStr = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'as agreed';

    await sendMail({
      to: invoice.customer.email,
      subject: `Payment reminder — Invoice ${invoice.number}`,
      text: [
        `Dear ${invoice.customer.name},`,
        '',
        `This is a friendly reminder that invoice ${invoice.number} for £${Number(invoice.total).toFixed(2)} is due ${dueStr}.`,
        '',
        'If you have already made payment, please disregard this message.',
        '',
        '256 Logistics Ltd',
      ].join('\n'),
      html: `<p>Dear ${esc(invoice.customer.name)},</p><p>This is a friendly reminder that invoice <strong>${esc(invoice.number)}</strong> for <strong>£${Number(invoice.total).toFixed(2)}</strong> is due <strong>${dueStr}</strong>.</p><p>If you have already made payment, please disregard this message.</p><p>256 Logistics Ltd</p>`,
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Could not send reminder' });
  }
});

// ── Compliance Tasks (Phase C — panel M6) ─────────────────
const taskManageRoles = ['super_admin', 'director', 'transport_manager', 'hr_manager', 'operations_manager', 'fleet_manager'];

// Derive a task's effective status (overdue is computed, not stored).
function decorateTask(t, empMap, vehMap) {
  const now = new Date();
  const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed' && t.status !== 'cancelled';
  const subDone = t.subtasks ? t.subtasks.filter(s => s.done).length : 0;
  const subTotal = t.subtasks ? t.subtasks.length : 0;
  return {
    ...t,
    assignee: t.assigneeId ? empMap[t.assigneeId] || null : null,
    vehicleReg: t.vehicleId ? vehMap[t.vehicleId] || null : null,
    isOverdue,
    effStatus: isOverdue ? 'overdue' : t.status,
    subDone, subTotal,
    progressPct: subTotal ? Math.round((subDone / subTotal) * 100) : (t.status === 'completed' ? 100 : t.status === 'in_progress' ? 50 : 0),
  };
}

router.get('/compliance-tasks', webAuth, requireRoles(...taskManageRoles), async (req, res) => {
  try {
    const now = new Date();
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const weekEnd = new Date(startToday); weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(startToday); monthEnd.setDate(monthEnd.getDate() + 30);
    const monthStart = startOfMonth(now);

    const [tasks, employees, vehicles] = await Promise.all([
      prisma.complianceTask.findMany({
        include: { subtasks: { orderBy: { createdAt: 'asc' } }, evidence: { orderBy: { createdAt: 'desc' } } },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.employee.findMany({ where: { employmentStatus: 'active' }, select: { id: true, fullName: true, photoStorageKey: true }, orderBy: { fullName: 'asc' } }),
      prisma.vehicle.findMany({ where: { status: { not: 'sold' } }, select: { id: true, registration: true }, orderBy: { registration: 'asc' } }),
    ]);
    const empMap = Object.fromEntries(employees.map(e => [e.id, e]));
    const vehMap = Object.fromEntries(vehicles.map(v => [v.id, v.registration]));
    const decorated = tasks.map(t => decorateTask(t, empMap, vehMap));

    const active = decorated.filter(t => t.status !== 'cancelled');
    const completed = decorated.filter(t => t.status === 'completed');
    const kpis = {
      total: active.length,
      overdue: decorated.filter(t => t.isOverdue).length,
      dueThisWeek: decorated.filter(t => t.dueDate && new Date(t.dueDate) >= startToday && new Date(t.dueDate) <= weekEnd && t.status !== 'completed').length,
      dueThisMonth: decorated.filter(t => t.dueDate && new Date(t.dueDate) >= startToday && new Date(t.dueDate) <= monthEnd && t.status !== 'completed').length,
      completedThisMonth: completed.filter(t => t.completedAt && new Date(t.completedAt) >= monthStart).length,
      onTrackPct: active.length ? Math.round((active.filter(t => !t.isOverdue).length / active.length) * 100) : 100,
    };
    // Status mix for the doughnut
    const statusMix = { not_started: 0, in_progress: 0, completed: 0, overdue: 0 };
    decorated.forEach(t => { if (t.status !== 'cancelled') statusMix[t.effStatus] = (statusMix[t.effStatus] || 0) + 1; });
    // Category breakdown
    const byCategory = {};
    active.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + 1; });
    const categoryRows = Object.entries(byCategory).map(([k, v]) => ({ key: k, label: TASK_CATEGORY_LABELS[k] || k, count: v })).sort((a, b) => b.count - a.count);

    const myTasks = req.user.employeeId ? decorated.filter(t => t.assigneeId === req.user.employeeId && t.status !== 'completed' && t.status !== 'cancelled').slice(0, 6) : [];
    const criticalDeadlines = decorated.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && (t.priority === 'critical' || t.priority === 'high' || t.isOverdue))
      .sort((a, b) => (a.dueDate ? new Date(a.dueDate) : Infinity) - (b.dueDate ? new Date(b.dueDate) : Infinity)).slice(0, 6);

    const selectedId = req.query.task;
    const selected = (selectedId && decorated.find(t => t.id === selectedId)) || decorated.find(t => t.status !== 'completed') || decorated[0] || null;

    res.render('compliance-tasks/index', {
      title: 'Compliance Tasks', tasks: decorated, kpis, statusMix, categoryRows, myTasks, criticalDeadlines, selected,
      employees, vehicles, categories: TASK_CATEGORIES, categoryLabels: TASK_CATEGORY_LABELS, priorities: TASK_PRIORITIES,
      formatDate, path: '/compliance-tasks',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/compliance-tasks', webAuth, requireRoles(...taskManageRoles), async (req, res) => {
  try {
    const { title, description, category, priority, dueDate, assigneeId, vehicleId, subtasks } = req.body;
    if (!title || !title.trim()) return res.redirect('/compliance-tasks');
    const task = await prisma.complianceTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: TASK_CATEGORIES.includes(category) ? category : 'other',
        priority: TASK_PRIORITIES.includes(priority) ? priority : 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        vehicleId: vehicleId || null,
        createdById: req.user.id,
      },
    });
    // Optional newline-separated subtasks
    const subLines = (subtasks || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 20);
    if (subLines.length) {
      await prisma.complianceSubtask.createMany({ data: subLines.map(s => ({ taskId: task.id, title: s })) });
    }
    res.redirect('/compliance-tasks?task=' + task.id);
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/compliance-tasks/:id/status', webAuth, requireRoles(...taskManageRoles), async (req, res) => {
  try {
    const status = TASK_STATUSES.includes(req.body.status) ? req.body.status : 'not_started';
    await prisma.complianceTask.update({
      where: { id: req.params.id },
      data: { status, completedAt: status === 'completed' ? new Date() : null },
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Could not update task.' }); }
});

router.post('/compliance-tasks/:id/subtasks/:sid/toggle', webAuth, requireRoles(...taskManageRoles), async (req, res) => {
  try {
    const sub = await prisma.complianceSubtask.findUnique({ where: { id: req.params.sid } });
    if (!sub) return res.status(404).json({ success: false });
    await prisma.complianceSubtask.update({ where: { id: req.params.sid }, data: { done: !sub.done } });
    res.json({ success: true, done: !sub.done });
  } catch (e) { res.status(500).json({ success: false }); }
});

router.post('/compliance-tasks/:id/evidence', webAuth, requireRoles(...taskManageRoles),
  (req, res, next) => { req.uploadSubdir = `compliance-tasks/${req.params.id}`; next(); },
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.redirect('/compliance-tasks?task=' + req.params.id);
      const storageKey = path.relative(process.cwd(), req.file.path).split(path.sep).join('/');
      await prisma.complianceTaskEvidence.create({ data: { taskId: req.params.id, storageKey, fileName: req.file.originalname, uploadedById: req.user.id } });
      res.redirect('/compliance-tasks?task=' + req.params.id);
    } catch (e) { res.redirect('/compliance-tasks?task=' + req.params.id); }
  });

router.get('/compliance-tasks/:id/evidence/:eid/content', webAuth, requireRoles(...taskManageRoles), async (req, res) => {
  try {
    const ev = await prisma.complianceTaskEvidence.findFirst({ where: { id: req.params.eid, taskId: req.params.id } });
    if (!ev) return res.status(404).end();
    const absolutePath = path.resolve(process.cwd(), ev.storageKey);
    if (!absolutePath.startsWith(path.resolve(process.cwd(), UPLOAD_DIR)) || !fs.existsSync(absolutePath)) return res.status(404).end();
    return res.sendFile(absolutePath);
  } catch (e) { return res.status(404).end(); }
});

router.post('/compliance-tasks/:id/delete', webAuth, requireRoles(...taskManageRoles), async (req, res) => {
  try {
    await prisma.complianceTask.delete({ where: { id: req.params.id } });
    res.redirect('/compliance-tasks');
  } catch (e) { res.redirect('/compliance-tasks'); }
});

// ── Compliance & Safety overview (panel home) ─────────────
const complianceOverviewRoles = ['super_admin', 'director', 'transport_manager', 'hr_manager', 'operations_manager', 'fleet_manager', 'trainer'];
router.get('/compliance', webAuth, requireRoles(...complianceOverviewRoles), async (req, res) => {
  try {
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    const [score, alertGroups, openDefects, vorOpen, sponsored, employees, vehicles, missedToday] = await Promise.all([
      prisma.complianceScore.findFirst({ orderBy: { scoreDate: 'desc' } }),
      prisma.alert.groupBy({ by: ['severity'], where: { isResolved: false }, _count: { _all: true } }),
      prisma.defectCase.count({ where: { status: { notIn: ['repaired', 'signed_off'] } } }),
      prisma.vorRecord.count({ where: { actualReturnDate: null } }),
      prisma.sponsoredWorker.findMany({ where: { OR: [{ visaExpiryDate: { lte: soon } }, { rightToWorkFollowupDate: { lte: soon } }] }, include: { employee: { select: { fullName: true, id: true } } } }),
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.vehicle.count({ where: { status: { not: 'sold' } } }),
      prisma.alert.findMany({ where: { isResolved: false }, orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }], take: 8 }),
    ]);
    const sev = Object.fromEntries(alertGroups.map((g) => [g.severity, g._count._all]));
    res.render('compliance/overview', {
      title: 'Compliance & Safety',
      score, sev: { critical: sev.critical || 0, warning: sev.warning || 0, notice: sev.notice || 0 },
      stats: { openDefects, vorOpen, employees, vehicles, sponsoredAtRisk: sponsored.length },
      sponsored, alerts: missedToday, formatDate, daysUntil, path: '/compliance',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ══════════════════════════════════════════════════════════════════════
// PHASE 3: PEOPLE & LEARNING
// ══════════════════════════════════════════════════════════════════════
const hrPanelRoles = ['super_admin', 'director', 'hr_manager'];
const lmsAdminRoles = ['super_admin', 'director', 'hr_manager', 'trainer'];
const calcDays = (start, end) => Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
const LEAVE_BADGE = { pending: 'badge-amber', approved: 'badge-green', rejected: 'badge-red', cancelled: 'badge-slate' };
const empNameMap = async (ids) => {
  const list = ids.length ? await prisma.employee.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, fullName: true } }) : [];
  return Object.fromEntries(list.map((e) => [e.id, e.fullName]));
};

// ── Leave management ──────────────────────────────────────────────────
router.get('/leave', webAuth, async (req, res) => {
  try {
    const isHr = hasRole(req.user, hrPanelRoles);
    const mine = req.user.employeeId
      ? await prisma.leaveRequest.findMany({ where: { employeeId: req.user.employeeId }, orderBy: { createdAt: 'desc' } })
      : [];
    const all = isHr ? await prisma.leaveRequest.findMany({ orderBy: [{ status: 'asc' }, { startDate: 'asc' }], take: 100 }) : [];
    const names = await empNameMap([...all.map((l) => l.employeeId), ...mine.map((l) => l.employeeId)]);
    const employees = isHr ? await prisma.employee.findMany({ where: { employmentStatus: 'active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } }) : [];
    res.render('hr/leave', { title: 'Leave Management', isHr, mine, all, names, employees, badge: LEAVE_BADGE, canSelfRequest: !!req.user.employeeId, formatDate, path: '/leave' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/leave', webAuth, async (req, res) => {
  try {
    const isHr = hasRole(req.user, hrPanelRoles);
    const employeeId = (isHr && req.body.employeeId) ? req.body.employeeId : req.user.employeeId;
    if (!employeeId || !req.body.startDate || !req.body.endDate) return res.redirect('/leave');
    await prisma.leaveRequest.create({
      data: {
        employeeId,
        type: req.body.type || 'annual',
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        days: calcDays(req.body.startDate, req.body.endDate),
        reason: req.body.reason || null,
        status: 'pending',
      },
    });
    res.redirect('/leave');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/leave/:id/decision', webAuth, requireRoles(...hrPanelRoles), async (req, res) => {
  try {
    const status = req.body.decision === 'approve' ? 'approved' : 'rejected';
    await prisma.leaveRequest.update({ where: { id: req.params.id }, data: { status, approverId: req.user.id, decidedAt: new Date(), notes: req.body.notes || null } });
    res.redirect('/leave');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── HR overview (panel home) ──────────────────────────────────────────
router.get('/hr', webAuth, requireRoles(...hrPanelRoles), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in60 = new Date(); in60.setDate(in60.getDate() + 60);
    const [
      totalEmployees, activeEmployees, pendingLeave, onLeaveToday,
      completedEnrolments, overdueEnrolments, rtwWatch,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.leaveRequest.findMany({ where: { status: 'pending' }, orderBy: { startDate: 'asc' }, take: 10 }),
      prisma.leaveRequest.count({ where: { status: 'approved', startDate: { lte: today }, endDate: { gte: today } } }),
      prisma.courseEnrolment.count({ where: { status: 'completed' } }),
      prisma.courseEnrolment.findMany({ where: { status: { in: ['assigned', 'in_progress'] } }, orderBy: { assignedAt: 'asc' }, take: 10, include: { course: { select: { title: true } } } }),
      prisma.sponsoredWorker.findMany({ where: { OR: [{ visaExpiryDate: { lte: in60 } }, { rightToWorkFollowupDate: { lte: in60 } }] }, include: { employee: { select: { fullName: true } } }, orderBy: { visaExpiryDate: 'asc' }, take: 10 }),
    ]);
    const allEmpIds = [
      ...pendingLeave.map((l) => l.employeeId),
      ...overdueEnrolments.map((e) => e.employeeId),
    ];
    const empNames = await empNameMap(allEmpIds);
    res.render('hr/overview', {
      title: 'HR Overview',
      stats: {
        totalEmployees, activeEmployees,
        pendingLeave: pendingLeave.length, onLeaveToday,
        completedEnrolments, overdueEnrolments: overdueEnrolments.length,
        rtwAtRisk: rtwWatch.length,
      },
      pendingLeave, overdueEnrolments, rtwWatch, empNames,
      badge: LEAVE_BADGE, formatDate, path: '/hr',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── LMS admin ─────────────────────────────────────────────────────────
const STATUS_BADGE = { assigned: 'badge-slate', in_progress: 'badge-blue', completed: 'badge-green', expired: 'badge-red' };

router.get('/lms', webAuth, requireRoles(...lmsAdminRoles), async (req, res) => {
  try {
    const [courses, enrolments, employees] = await Promise.all([
      prisma.course.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { enrolments: true } } } }),
      prisma.courseEnrolment.findMany({ orderBy: { updatedAt: 'desc' }, take: 100, include: { course: { select: { title: true, category: true } } } }),
      prisma.employee.findMany({ where: { employmentStatus: 'active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } }),
    ]);
    const enrolCounts = Object.fromEntries(courses.map((c) => [c.id, c._count.enrolments]));
    const empNames = await empNameMap(enrolments.map((e) => e.employeeId));
    const canEdit = hasRole(req.user, lmsAdminRoles);
    res.render('lms/index', {
      title: 'Learning Management', courses, enrolments, employees, empNames, enrolCounts, canEdit,
      statusBadge: STATUS_BADGE, formatDate, path: '/lms',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/lms/courses', webAuth, requireRoles(...lmsAdminRoles), async (req, res) => {
  try {
    await prisma.course.create({ data: { title: (req.body.title || '').trim(), category: req.body.category || 'General', description: req.body.description || null, mandatory: req.body.mandatory === '1', validityMonths: req.body.validityMonths ? parseInt(req.body.validityMonths, 10) : null, contentUrl: req.body.contentUrl || null } });
    res.redirect('/lms');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/lms/assign', webAuth, requireRoles(...lmsAdminRoles), async (req, res) => {
  try {
    let courseIds = req.body.courseIds;
    if (!Array.isArray(courseIds)) courseIds = courseIds ? [courseIds] : [];
    let employeeIds = req.body.employeeIds;
    if (!Array.isArray(employeeIds)) employeeIds = employeeIds ? [employeeIds] : [];
    if (req.body.assignAll === '1') {
      const all = await prisma.employee.findMany({ where: { employmentStatus: 'active' }, select: { id: true } });
      employeeIds = all.map((e) => e.id);
    }
    for (const courseId of courseIds) {
      for (const employeeId of employeeIds) {
        await prisma.courseEnrolment.upsert({
          where: { courseId_employeeId: { courseId, employeeId } },
          update: {},
          create: { courseId, employeeId, status: 'assigned', assignedById: req.user.id },
        });
      }
    }
    res.redirect('/lms');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

async function completeEnrolment(id) {
  const enr = await prisma.courseEnrolment.findUnique({ where: { id }, include: { course: true } });
  if (!enr) return;
  let expiryDate = null;
  if (enr.course.validityMonths) { expiryDate = new Date(); expiryDate.setMonth(expiryDate.getMonth() + enr.course.validityMonths); }
  const cert = `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  await prisma.courseEnrolment.update({ where: { id }, data: { status: 'completed', completedAt: new Date(), expiryDate, certificateNumber: cert } });
}

router.post('/lms/enrolments/:id/complete', webAuth, requireRoles(...lmsAdminRoles), async (req, res) => {
  try { await completeEnrolment(req.params.id); res.redirect('/lms'); }
  catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── My Learning (learner self-service) ────────────────────────────────
router.get('/my-learning', webAuth, async (req, res) => {
  try {
    if (!req.user.employeeId) return res.status(403).render('error', { title: 'No learner record', message: 'Your account is not linked to an employee record.', code: 403 });
    const enrolments = await prisma.courseEnrolment.findMany({ where: { employeeId: req.user.employeeId }, orderBy: { status: 'asc' }, include: { course: true } });
    const completed = enrolments.filter((e) => e.status === 'completed').length;
    res.render('lms/my-learning', { title: 'My Learning', enrolments, completed, statusBadge: STATUS_BADGE, formatDate, path: '/my-learning', justCompleted: req.query.completed === '1' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/my-learning/:id/complete', webAuth, async (req, res) => {
  try {
    const enr = await prisma.courseEnrolment.findUnique({ where: { id: req.params.id } });
    if (enr && enr.employeeId === req.user.employeeId) await completeEnrolment(req.params.id);
    res.redirect('/my-learning?completed=1');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Phase 4: Finance & Executive ─────────────────────────────────────
const financeRoles = ['super_admin', 'director', 'finance_officer'];
const executiveRoles = ['super_admin', 'director'];
const EXPENSE_CATEGORIES = ['fuel', 'maintenance', 'wages', 'insurance', 'admin', 'rent', 'utilities', 'marketing', 'other'];
const EXPENSE_LABELS = { fuel: 'Fuel', maintenance: 'Maintenance', wages: 'Wages', insurance: 'Insurance', admin: 'Admin', rent: 'Rent', utilities: 'Utilities', marketing: 'Marketing', other: 'Other' };

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfYear(d) { return new Date(d.getFullYear(), 0, 1); }

// ── Finance overview (panel home) ─────────────────────────────────────
router.get('/finance', webAuth, requireRoles(...financeRoles), async (req, res) => {
  try {
    const now = new Date();
    const som = startOfMonth(now);
    const soy = startOfYear(now);

    const [
      allInvoices, mtdInvoices, ytdInvoices,
      allExpenses, mtdExpenses, ytdExpenses,
      recentExpenses, recentInvoices,
    ] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { total: true }, _count: { _all: true } }),
      prisma.invoice.aggregate({ where: { createdAt: { gte: som } }, _sum: { total: true }, _count: { _all: true } }),
      prisma.invoice.aggregate({ where: { createdAt: { gte: soy } }, _sum: { total: true } }),
      prisma.expense.aggregate({ _sum: { amount: true, vatAmount: true } }),
      prisma.expense.aggregate({ where: { expenseDate: { gte: som } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { expenseDate: { gte: soy } }, _sum: { amount: true } }),
      prisma.expense.findMany({ orderBy: { expenseDate: 'desc' }, take: 8 }),
      prisma.invoice.findMany({ where: { status: { in: ['issued', 'overdue'] } }, orderBy: { createdAt: 'desc' }, take: 8, include: { customer: true } }),
    ]);

    const expByCat = await prisma.expense.groupBy({ by: ['category'], _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } });

    const revenue = { mtd: Number(mtdInvoices._sum.total || 0), ytd: Number(ytdInvoices._sum.total || 0), total: Number(allInvoices._sum.total || 0) };
    const expenses = { mtd: Number(mtdExpenses._sum.amount || 0), ytd: Number(ytdExpenses._sum.amount || 0), total: Number(allExpenses._sum.amount || 0) };
    const pl = { mtd: revenue.mtd - expenses.mtd, ytd: revenue.ytd - expenses.ytd };
    const outstanding = await prisma.invoice.aggregate({ where: { status: { in: ['issued', 'overdue'] } }, _sum: { total: true }, _count: { _all: true } });
    const vatOwed = await prisma.invoice.aggregate({ where: { createdAt: { gte: soy } }, _sum: { vat: true } });

    // 30-day daily revenue + expenses for the bar chart and KPI sparklines
    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 29);
    const [last30, last30Exp] = await Promise.all([
      prisma.invoice.findMany({ where: { createdAt: { gte: thirtyAgo } }, select: { createdAt: true, total: true } }),
      prisma.expense.findMany({ where: { expenseDate: { gte: thirtyAgo } }, select: { expenseDate: true, amount: true } }),
    ]);
    const sameDay = (a, d) => { const c = new Date(a); return c.getDate() === d.getDate() && c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear(); };
    const revenueChart = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      const dayTotal = last30.filter(inv => sameDay(inv.createdAt, d)).reduce((s, inv) => s + Number(inv.total), 0);
      return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), total: dayTotal };
    });
    const expenseSeries = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      return last30Exp.filter(e => sameDay(e.expenseDate, d)).reduce((s, e) => s + Number(e.amount), 0);
    });
    // Spark series for the KPI cards (revenue, expenses, running net P&L)
    const revenueSeries = revenueChart.map(d => d.total);
    let runningPl = 0;
    const plSeries = revenueSeries.map((rev, i) => { runningPl += rev - expenseSeries[i]; return runningPl; });
    const sparks = { revenue: revenueSeries, expense: expenseSeries, pl: plSeries };

    res.render('finance/overview', {
      title: 'Finance Overview', revenue, expenses, pl, outstanding: { amount: Number(outstanding._sum.total || 0), count: outstanding._count._all },
      vatOwed: Number(vatOwed._sum.vat || 0), expByCat, recentExpenses, recentInvoices, revenueChart, sparks,
      expenseLabels: EXPENSE_LABELS, formatDate, path: '/finance',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Finance: expenses ─────────────────────────────────────────────────
router.get('/finance/expenses', webAuth, requireRoles(...financeRoles), async (req, res) => {
  try {
    const { cat, from, to } = req.query;
    const where = {};
    if (cat) where.category = cat;
    if (from || to) { where.expenseDate = {}; if (from) where.expenseDate.gte = new Date(from); if (to) where.expenseDate.lte = new Date(to); }
    const [expenses, totals] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' }, take: 200 }),
      prisma.expense.aggregate({ where, _sum: { amount: true, vatAmount: true }, _count: { _all: true } }),
    ]);
    res.render('finance/expenses', {
      title: 'Expenses', expenses, totals: { amount: Number(totals._sum.amount || 0), vat: Number(totals._sum.vatAmount || 0), count: totals._count._all },
      categories: EXPENSE_CATEGORIES, expenseLabels: EXPENSE_LABELS, filter: { cat, from, to }, formatDate, path: '/finance/expenses',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/finance/expenses', webAuth, requireRoles(...financeRoles), async (req, res) => {
  try {
    const { category, description, amount, vatAmount, expenseDate, supplier, reference } = req.body;
    if (!description || !amount || !expenseDate) return res.redirect('/finance/expenses');
    await prisma.expense.create({
      data: {
        category: EXPENSE_CATEGORIES.includes(category) ? category : 'other',
        description: description.trim(),
        amount: parseFloat(amount),
        vatAmount: parseFloat(vatAmount || 0),
        expenseDate: new Date(expenseDate),
        supplier: supplier || null,
        reference: reference || null,
        recordedById: req.user.id,
      },
    });
    res.redirect('/finance/expenses');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

// ── Executive / Director BI dashboard ────────────────────────────────
router.get('/executive', webAuth, requireRoles(...executiveRoles), async (req, res) => {
  try {
    const now = new Date();
    const som = startOfMonth(now);
    const soy = startOfYear(now);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      revenueYtd, revenueMtd, revenueTotal,
      expensesYtd, expensesMtd,
      shipmentsTotal, shipmentsMtd, shipmentsInTransit,
      activeEmployees, totalVehicles, activeVehicles,
      complianceScore,
      enrolTotal, enrolCompleted,
      openDefects, pendingLeave, onLeaveToday,
      rtwAtRisk,
      sparkInvoices,
    ] = await Promise.all([
      prisma.invoice.aggregate({ where: { createdAt: { gte: soy } }, _sum: { total: true } }),
      prisma.invoice.aggregate({ where: { createdAt: { gte: som } }, _sum: { total: true } }),
      prisma.invoice.aggregate({ _sum: { total: true }, _count: { _all: true } }),
      prisma.expense.aggregate({ where: { expenseDate: { gte: soy } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { expenseDate: { gte: som } }, _sum: { amount: true } }),
      prisma.shipment.count(),
      prisma.shipment.count({ where: { createdAt: { gte: som } } }),
      prisma.shipment.count({ where: { status: { in: ['collected', 'in_transit', 'out_for_delivery'] } } }),
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'active' } }),
      prisma.complianceScore.findFirst({ orderBy: { scoreDate: 'desc' } }),
      prisma.courseEnrolment.count(),
      prisma.courseEnrolment.count({ where: { status: 'completed' } }),
      prisma.defectCase.count({ where: { status: { in: ['reported', 'under_review', 'repair_booked'] } } }),
      prisma.leaveRequest.count({ where: { status: 'pending' } }),
      prisma.leaveRequest.count({ where: { status: 'approved', startDate: { lte: today }, endDate: { gte: today } } }),
      prisma.sponsoredWorker.count({ where: { visaExpiryDate: { lte: new Date(Date.now() + 60 * 86400000) } } }),
      prisma.invoice.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { total: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
    ]);

    const rvYtd = Number(revenueYtd._sum.total || 0);
    const rvMtd = Number(revenueMtd._sum.total || 0);
    const exYtd = Number(expensesYtd._sum.amount || 0);
    const exMtd = Number(expensesMtd._sum.amount || 0);
    const fleetUtil = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
    const trainingRate = enrolTotal > 0 ? Math.round((enrolCompleted / enrolTotal) * 100) : 0;
    const score = complianceScore ? Number(complianceScore.overallScore) : null;

    // Build 7-day revenue sparkline
    const sparkByDay = {};
    sparkInvoices.forEach((inv) => {
      const d = new Date(inv.createdAt); d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split('T')[0];
      sparkByDay[key] = (sparkByDay[key] || 0) + Number(inv.total);
    });
    const revenueSpark = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo); d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      return { label: d.toLocaleDateString('en-GB', { weekday: 'short' }), total: sparkByDay[key] || 0 };
    });

    res.render('executive/index', {
      title: 'Executive Overview',
      kpi: {
        revenueYtd: rvYtd, revenueMtd: rvMtd, plYtd: rvYtd - exYtd, plMtd: rvMtd - exMtd,
        expensesYtd: exYtd, expensesMtd: exMtd,
        shipmentsTotal, shipmentsMtd, shipmentsInTransit,
        activeEmployees, totalVehicles, activeVehicles, fleetUtil,
        complianceScore: score, openDefects,
        trainingRate, pendingLeave, onLeaveToday, rtwAtRisk,
        invoiceCount: revenueTotal._count._all,
      },
      revenueSpark,
      formatDate, path: '/executive',
    });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

module.exports = router;
