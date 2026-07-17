const { verify } = require('../config/jwt');
const { AuthError } = require('../utils/errors');
const { DEFAULT_TENANT_ID, runWithTenant } = require('../utils/tenantContext');
const { getUserRoles } = require('../utils/rbac');
const { isTenantSuspended } = require('../utils/tenantStatus');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  const rawBearerToken = header && header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const bearerToken = rawBearerToken && !['undefined', 'null'].includes(rawBearerToken) ? rawBearerToken : null;
  const token = bearerToken || req.cookies?.token;
  if (!token) return next(new AuthError());

  const payload = verify(token);
  if (!payload) return next(new AuthError('Invalid or expired token'));

  payload.tenantId = payload.tenantId || DEFAULT_TENANT_ID;
  payload.roles = getUserRoles(payload);
  payload.branchIds = payload.branchIds || [];

  // Suspension gate: a paused tenant's API access is blocked with a clear code.
  try {
    if (await isTenantSuspended(payload.tenantId)) {
      return res.status(403).json({ success: false, error: { code: 'TENANT_SUSPENDED', message: 'This organisation\'s FLEET.HQ subscription is paused. Contact your administrator.' } });
    }
  } catch (e) { /* fail open — a status-lookup blip must not lock everyone out */ }

  runWithTenant(payload.tenantId, () => {
    req.user = payload;
    next();
  });
};
