const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login endpoints — blunt brute-force protection by client IP.
 * Per-account lockout (see utils/loginGuard) handles targeted attacks; this
 * caps overall attempt volume from a single source. Requires `trust proxy`
 * to key on the real client IP behind nginx.
 */
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count successful logins against the limit.
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    const msg = 'Too many login attempts. Please wait a few minutes and try again.';
    if (req.path.startsWith('/api')) {
      return res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: msg } });
    }
    return res.status(429).render('auth/login', { title: 'Login', error: msg });
  },
});
