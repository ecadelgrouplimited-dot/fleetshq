const { verify } = require('../config/jwt');

// Middleware for web routes — reads JWT from cookie or session
module.exports = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.redirect('/login');

  const payload = verify(token);
  if (!payload) return res.redirect('/login');

  req.user = payload;
  res.locals.user = payload;
  next();
};
