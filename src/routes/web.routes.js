const router = require('express').Router();
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');
const { verify } = require('../config/jwt');
const { DEFAULT_TENANT_ID, runWithTenant } = require('../utils/tenantContext');
const { UPLOAD_DIR } = require('../config/storage');
const { daysUntil, formatDate } = require('../utils/dateHelpers');
const { TRAINING_LABELS, CHECK_ITEM_LABELS, CHECK_ITEMS } = require('../utils/constants');
const loginLimiter = require('../middleware/loginLimiter');
const { esc } = require('../utils/escapeHtml');
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
    res.locals.user = payload;
    res.locals.formatDate = formatDate;
    res.locals.daysUntil = daysUntil;
    res.locals.esc = esc;
    res.locals.panels = getUserPanels(payload);
    res.locals.roleLabel = roleLabel;
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
      name: `${user.firstName} ${user.lastName}`, employeeId: user.employee?.id || null });

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

router.get('/welcome', renderPublicPage('home', '256 Logistics - Logistics platform'));
router.get('/about', renderPublicPage('about', 'About 256 Logistics'));
router.get('/services', renderPublicPage('services', '256 Logistics services'));
router.get('/quote', (req, res) => res.redirect('/contact?type=quote'));

router.get('/contact', (req, res) => {
  res.render('landing/index', {
    page: 'contact',
    title: 'Contact 256 Logistics',
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
    title: 'Contact 256 Logistics',
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
    page: 'track', title: 'Track a shipment', leadSent: false, leadError: null,
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

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: { totalEmp, sponsoredCount, totalVehicles, activeVehicles, vorVehicles, openDefects, missedChecks, pendingToolbox },
      score: { people: Number(score.peopleScore ?? score.people), fleet: Number(score.fleetScore ?? score.fleet),
        driver: Number(score.driverScore ?? score.driver), overall: Number(score.overallScore ?? score.overall) },
      alerts, alertGroups, recentDefects, chartData, healthCards,
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
    const [logs, vehicles, monthLogs] = await Promise.all([
      prisma.fuelLog.findMany({ orderBy: { loggedDate: 'desc' }, take: 60 }),
      prisma.vehicle.findMany({ where: { status: { not: 'sold' } }, select: { id: true, registration: true }, orderBy: { registration: 'asc' } }),
      prisma.fuelLog.findMany({ where: { loggedDate: { gte: monthStart } } }),
    ]);
    const vehMap = Object.fromEntries(vehicles.map((v) => [v.id, v.registration]));
    const spend = monthLogs.reduce((s, f) => s + Number(f.cost), 0);
    const litres = monthLogs.reduce((s, f) => s + Number(f.litres), 0);
    res.render('fleet/fuel', { title: 'Fuel Management', logs, vehicles, vehMap, totals: { spend, litres, ppl: litres ? spend / litres : 0, count: monthLogs.length }, canLog: hasRole(req.user, fleetMgrRoles), formatDate, path: '/fleet/fuel' });
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
        dailyChecks: true,
        defects: true,
        user: { select: { id: true, email: true, role: true, createdAt: true, lastLoginAt: true } },
        sponsorship: true,
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
    const where = status ? { status } : {};
    const shipments = await prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100, include: { customer: true, job: true, invoice: true } });
    res.render('portal/shipments', { title: 'Shipments', shipments, status: status || '', svc: shipmentSvc, formatDate, path: '/shipments' });
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
    const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { customer: true, shipment: true } });
    const totals = invoices.reduce((a, i) => { a.all += Number(i.total); if (i.status !== 'paid') a.outstanding += Number(i.total); return a; }, { all: 0, outstanding: 0 });
    res.render('invoices/index', { title: 'Invoices', invoices, totals, formatDate, path: '/invoices' });
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
    res.render('lms/my-learning', { title: 'My Learning', enrolments, completed, statusBadge: STATUS_BADGE, formatDate, path: '/my-learning' });
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

router.post('/my-learning/:id/complete', webAuth, async (req, res) => {
  try {
    const enr = await prisma.courseEnrolment.findUnique({ where: { id: req.params.id } });
    if (enr && enr.employeeId === req.user.employeeId) await completeEnrolment(req.params.id);
    res.redirect('/my-learning');
  } catch (e) { res.render('error', { title: 'Error', message: e.message, code: 500 }); }
});

module.exports = router;
