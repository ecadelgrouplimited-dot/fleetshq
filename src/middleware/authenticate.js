const { verify } = require('../config/jwt');
const { AuthError } = require('../utils/errors');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  const rawBearerToken = header && header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const bearerToken = rawBearerToken && !['undefined', 'null'].includes(rawBearerToken) ? rawBearerToken : null;
  const token = bearerToken || req.cookies?.token;
  if (!token) return next(new AuthError());

  const payload = verify(token);
  if (!payload) return next(new AuthError('Invalid or expired token'));

  req.user = payload;
  next();
};
