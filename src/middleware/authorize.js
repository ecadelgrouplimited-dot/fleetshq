const { PERMISSIONS } = require('../utils/constants');
const { ForbiddenError } = require('../utils/errors');
const { hasAnyRole } = require('../utils/rbac');

const authorize = (...requiredPermissions) => (req, res, next) => {
  const allowed = requiredPermissions.every((perm) => {
    const roles = PERMISSIONS[perm] || [];
    return hasAnyRole(req.user, roles);
  });
  if (!allowed) return next(new ForbiddenError());
  next();
};

module.exports = authorize;
