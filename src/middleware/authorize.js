const { PERMISSIONS } = require('../utils/constants');
const { ForbiddenError } = require('../utils/errors');

const authorize = (...requiredPermissions) => (req, res, next) => {
  const { role } = req.user;
  const allowed = requiredPermissions.every((perm) => {
    const roles = PERMISSIONS[perm] || [];
    return roles.includes(role);
  });
  if (!allowed) return next(new ForbiddenError());
  next();
};

module.exports = authorize;
