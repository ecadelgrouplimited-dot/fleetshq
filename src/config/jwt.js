const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

const verify = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
};

module.exports = { sign, verify };
