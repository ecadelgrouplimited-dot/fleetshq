const { verify } = require('../config/jwt');
const { AuthError } = require('../utils/errors');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next(new AuthError());

  const payload = verify(header.slice(7));
  if (!payload) return next(new AuthError('Invalid or expired token'));

  req.user = payload;
  next();
};
