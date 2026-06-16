/**
 * HTML-escape a value for safe interpolation into server-rendered markup.
 *
 * Views in this app build HTML as JS template literals and emit them via
 * EJS `<%- body %>` (unescaped), so any user-controlled value MUST be passed
 * through esc() to prevent stored XSS. Safe in HTML text and double-quoted
 * attribute contexts. Returns '' for null/undefined.
 */
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { esc };
