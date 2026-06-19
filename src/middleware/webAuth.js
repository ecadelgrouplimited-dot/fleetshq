const { verify } = require('../config/jwt');
const { DEFAULT_TENANT_ID, runWithTenant } = require('../utils/tenantContext');
const { getUserRoles } = require('../utils/rbac');

// Middleware for web routes — reads JWT from cookie or session
module.exports = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.redirect('/login');

  const payload = verify(token);
  if (!payload) return res.redirect('/login');

  payload.tenantId = payload.tenantId || DEFAULT_TENANT_ID;
  payload.roles = getUserRoles(payload);
  payload.branchIds = payload.branchIds || [];
  runWithTenant(payload.tenantId, () => {
    req.user = payload;
    res.locals.user = payload;
    next();
  });
};
