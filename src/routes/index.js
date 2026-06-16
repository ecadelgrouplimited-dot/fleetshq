const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const auditLog = require('../middleware/auditLog');
const { upload } = require('../config/storage');

// Controllers
const authCtrl = require('../controllers/auth.controller');
const dashCtrl = require('../controllers/dashboard.controller');
const empCtrl = require('../controllers/employees.controller');
const sponsoredCtrl = require('../controllers/sponsored.controller');
const trainingCtrl = require('../controllers/training.controller');
const vehicleCtrl = require('../controllers/vehicles.controller');
const checksCtrl = require('../controllers/checks.controller');
const defectsCtrl = require('../controllers/defects.controller');
const vorCtrl = require('../controllers/vor.controller');
const alertsCtrl = require('../controllers/alerts.controller');
const usersCtrl  = require('../controllers/users.controller');
const migrationCtrl = require('../controllers/migration.controller');

// ── Auth ─────────────────────────────────────────────
router.post('/auth/login', authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.me);

// ── Dashboard ─────────────────────────────────────────
router.get('/dashboard/summary', authenticate, dashCtrl.summary);

// ── Employees ─────────────────────────────────────────
router.get('/employees', authenticate, authorize('employees:list'), empCtrl.list);
router.post('/employees', authenticate, authorize('employees:create'), auditLog('employee'), empCtrl.create);
router.get('/employees/:id', authenticate, authorize('employees:list'), empCtrl.show);
router.put('/employees/:id', authenticate, authorize('employees:update'), auditLog('employee'), empCtrl.update);
router.patch('/employees/:id/status', authenticate, authorize('employees:terminate'), auditLog('employee'), empCtrl.updateStatus);

// Employee docs
const empUpload = (req, res, next) => {
  req.uploadSubdir = `employees/${req.params.id}`;
  next();
};
router.post('/employees/:id/documents', authenticate, authorize('employees:docs:upload'), empUpload, upload.single('file'), empCtrl.uploadDocument);
router.get('/employees/:id/documents', authenticate, authorize('employees:list'), empCtrl.listDocuments);

// ── Sponsored Workers ─────────────────────────────────
router.get('/sponsored-workers', authenticate, authorize('sponsored:manage'), sponsoredCtrl.list);
router.post('/sponsored-workers', authenticate, authorize('sponsored:manage'), auditLog('sponsored_worker'), sponsoredCtrl.create);
router.post('/sponsored-workers/:id/changes', authenticate, authorize('sponsored:manage'), auditLog('sponsored_change'), sponsoredCtrl.logChange);
router.get('/sponsored-workers/audit-pack', authenticate, authorize('sponsored:manage'), sponsoredCtrl.auditPackStatus);

// ── Training ──────────────────────────────────────────
router.get('/employees/:employeeId/training', authenticate, trainingCtrl.getMatrix);
router.put('/employees/:employeeId/training/:trainingType', authenticate, authorize('training:update'), auditLog('training'), trainingCtrl.updateRecord);
router.get('/employees/:employeeId/acknowledgements', authenticate, trainingCtrl.getAcknowledgements);
router.post('/employees/:employeeId/acknowledgements', authenticate, trainingCtrl.signPolicy);

// Toolbox Talks
router.get('/toolbox-talks', authenticate, trainingCtrl.listToolbox);
router.post('/toolbox-talks', authenticate, authorize('toolbox:create'), trainingCtrl.createToolbox);
router.post('/toolbox-talks/:id/sign', authenticate, trainingCtrl.signToolbox);
router.post('/toolbox-talks/:id/manager-signoff', authenticate, authorize('toolbox:signoff'), auditLog('toolbox_talk'), trainingCtrl.managerSignoff);

// ── Vehicles ──────────────────────────────────────────
router.get('/vehicles', authenticate, vehicleCtrl.list);
router.post('/vehicles', authenticate, authorize('vehicles:create'), auditLog('vehicle'), vehicleCtrl.create);
router.get('/vehicles/pmi-planner', authenticate, vehicleCtrl.pmiPlanner);
router.get('/vehicles/:id', authenticate, vehicleCtrl.show);
router.put('/vehicles/:id', authenticate, authorize('vehicles:update'), auditLog('vehicle'), vehicleCtrl.update);
router.patch('/vehicles/:id/status', authenticate, authorize('vehicles:status'), auditLog('vehicle'), vehicleCtrl.updateStatus);

// Vehicle docs
const vehUpload = (req, res, next) => {
  req.uploadSubdir = `vehicles/${req.params.id}`;
  next();
};
router.post('/vehicles/:id/documents', authenticate, vehUpload, upload.single('file'), vehicleCtrl.uploadDocument);

// ── Daily Checks ──────────────────────────────────────
router.post('/checks', authenticate, checksCtrl.submit);
router.get('/checks', authenticate, checksCtrl.list);
router.get('/checks/missed', authenticate, authorize('checks:view_all'), checksCtrl.missed);
router.get('/checks/:id', authenticate, checksCtrl.show);

// ── Defects ───────────────────────────────────────────
router.get('/defects', authenticate, defectsCtrl.list);
router.post('/defects', authenticate, defectsCtrl.create);
router.get('/defects/:id', authenticate, defectsCtrl.show);
router.patch('/defects/:id/status', authenticate, authorize('defects:review'), auditLog('defect'), defectsCtrl.updateStatus);
router.post('/defects/:id/signoff', authenticate, authorize('defects:signoff'), auditLog('defect'), defectsCtrl.finalSignoff);

const defectPhotoUpload = (req, res, next) => {
  req.uploadSubdir = `defects/${req.params.id}`;
  next();
};
router.post('/defects/:id/photos', authenticate, defectPhotoUpload, upload.single('file'), defectsCtrl.uploadPhoto);

// ── VOR ───────────────────────────────────────────────
router.get('/vor', authenticate, vorCtrl.list);
router.post('/vor', authenticate, authorize('vor:create'), auditLog('vor'), vorCtrl.create);
router.patch('/vor/:id/return', authenticate, authorize('vor:approve'), auditLog('vor'), vorCtrl.returnToService);

// ── Alerts ────────────────────────────────────────────
router.get('/alerts', authenticate, alertsCtrl.list);
router.patch('/alerts/:id/resolve', authenticate, alertsCtrl.resolve);

// ── Users ─────────────────────────────────────────────
router.get('/users',              authenticate, authorize('users:manage'), usersCtrl.list);
router.post('/users',             authenticate, authorize('users:manage'), usersCtrl.create);
router.put('/users/:id',          authenticate, authorize('users:manage'), usersCtrl.update);
router.post('/users/:id/reset-password', authenticate, authorize('users:manage'), usersCtrl.resetPassword);
router.delete('/users/:id',       authenticate, authorize('users:manage'), usersCtrl.remove);

// ── Migration Center ───────────────────────────────────────────────
router.post('/migration/import', authenticate, authorize('users:manage'), migrationCtrl.importCsv);

module.exports = router;
