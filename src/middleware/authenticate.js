const { verify } = require('../config/jwt');
const { AuthError } = require('../utils/errors');
const { DEFAULT_TENANT_ID, runWithTenant } = require('../utils/tenantContext');
const { getUserRoles } = require('../utils/rbac');

module.exports = (req, res, next) => {
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
  runWithTenant(payload.tenantId, () => {
    req.user = payload;
    next();
  });
};
