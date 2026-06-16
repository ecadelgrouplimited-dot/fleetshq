const prisma = require('../config/database');

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;
const LOCKOUT_MINUTES = parseInt(process.env.LOGIN_LOCKOUT_MINUTES, 10) || 15;

/**
 * Per-account brute-force lockout. Backed by User.failedLoginAttempts /
 * User.lockedUntil so it survives restarts and is shared across instances.
 */

/** @returns {number} minutes remaining if locked, else 0. */
function lockMinutesRemaining(user) {
  if (user && user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
  }
  return 0;
}

/** Record a failed attempt; lock the account once the threshold is hit. */
async function registerFailure(user) {
  const attempts = (user.failedLoginAttempts || 0) + 1;
  const data = { failedLoginAttempts: attempts };
  if (attempts >= MAX_ATTEMPTS) {
    data.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
    data.failedLoginAttempts = 0; // reset the counter once locked
  }
  await prisma.user.update({ where: { id: user.id }, data });
}

/** Clear failure state after a successful login. */
async function registerSuccess(user) {
  if (user.failedLoginAttempts || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }
}

module.exports = { lockMinutesRemaining, registerFailure, registerSuccess, LOCKOUT_MINUTES };
