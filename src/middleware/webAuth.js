const { verify } = require('../config/jwt');
const { DEFAULT_TENANT_ID, runWithTenant } = require('../utils/tenantContext');
const { getUserRoles } = require('../utils/rbac');
const { isTenantSuspended } = require('../utils/tenantStatus');

// Middleware for web routes — reads JWT from cookie or session
module.exports = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.redirect('/login');

  const payload = verify(token);
  if (!payload) return res.redirect('/login');

  payload.tenantId = payload.tenantId || DEFAULT_TENANT_ID;
  payload.roles = getUserRoles(payload);
  payload.branchIds = payload.branchIds || [];

  // Suspension gate: a paused tenant sees the lock screen, not the app.
  try {
    if (await isTenantSuspended(payload.tenantId)) {
      return res.status(403).render('auth/suspended', { title: 'Subscription paused — FLEET.HQ' });
    }
  } catch (e) { /* fail open — a status-lookup blip must not lock everyone out */ }

  runWithTenant(payload.tenantId, () => {
    req.user = payload;
    res.locals.user = payload;
    next();
  });
};
