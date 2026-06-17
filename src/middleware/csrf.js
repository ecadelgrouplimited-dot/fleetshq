const crypto = require('crypto');

/**
 * Double-submit-cookie CSRF protection.
 *
 * issueToken: ensures a readable `csrfToken` cookie exists and exposes it to
 *   views (res.locals.csrfToken). Mounted globally before routes.
 * verifyToken: on state-changing requests, requires the `X-CSRF-Token` header
 *   (sent by the client fetch wrapper) or a `_csrf` body field to match the
 *   cookie. Pairs with SameSite=Lax auth cookies for defence in depth.
 */
const COOKIE = 'csrfToken';
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
// Auth bootstrap endpoints are exempt (no token yet; protected by rate-limit + lockout).
const EXEMPT = [/^\/api\/v1\/auth\/login$/, /^\/api\/v1\/auth\/logout$/];

function issueToken(req, res, next) {
  let token = req.cookies && req.cookies[COOKIE];
  if (!token || !/^[a-f0-9]{32,}$/.test(token)) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie(COOKIE, token, {
      httpOnly: false, // must be readable by client JS for the double-submit
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
  res.locals.csrfToken = token;
  req.csrfToken = token;
  next();
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return ba.length > 0 && ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function verifyToken(req, res, next) {
  if (SAFE.has(req.method)) return next();
  if (EXEMPT.some((re) => re.test(req.path))) return next();

  const sent = req.get('x-csrf-token') || (req.body && req.body._csrf);
  const cookie = req.cookies && req.cookies[COOKIE];
  if (safeEqual(sent, cookie)) return next();

  if (req.path.startsWith('/api')) {
    return res.status(403).json({ success: false, error: { code: 'CSRF', message: 'Invalid or missing security token. Refresh the page and try again.' } });
  }
  return res.status(403).render('error', { title: 'Security check failed', message: 'Your session security token was invalid. Please refresh the page and try again.', code: 403 });
}

module.exports = { issueToken, verifyToken };
