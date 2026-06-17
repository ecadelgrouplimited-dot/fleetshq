/**
 * Shared password strength policy. Used by every place that sets a password
 * (user create, admin reset, self-service change). Tunable via env:
 *   PASSWORD_MIN_LENGTH (default 8)
 */
const MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8;

const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', 'qwerty123',
  'changeme', 'changeme1', 'welcome1', 'welcome123', 'letmein1', 'admin123',
]);

/** @returns {string|null} an error message, or null if the password is acceptable. */
function checkPassword(pw) {
  if (!pw || typeof pw !== 'string') return 'Password is required';
  if (pw.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters`;
  if (pw.length > 128) return 'Password is too long';
  if (!/[A-Za-z]/.test(pw)) return 'Password must contain at least one letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
  if (COMMON.has(pw.toLowerCase())) return 'That password is too common — choose something less guessable';
  return null;
}

module.exports = { checkPassword, MIN_LENGTH };
