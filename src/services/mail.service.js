const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Email delivery. If SMTP isn't configured (SMTP_HOST + SMTP_USER), sending is
 * a safe no-op that logs what would have been sent — so the app works in dev /
 * before SMTP is wired, and lights up automatically once the env is set.
 *
 * Required env to enable: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 *   SMTP_SECURE (true for 465), ALERT_FROM_EMAIL.
 * Optional: ALERT_TO_EMAIL (ops inbox), ALERT_CC_EMAIL (copied on ops mail).
 */
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const mailEnabled = () => !!transporter;

/** Ops notifications go to the director and are copied to the alerts inbox. */
const opsRecipients = () => ({
  to: process.env.ALERT_TO_EMAIL || 'director@fleetshq.com',
  cc: process.env.ALERT_CC_EMAIL || undefined,
});

async function sendMail({ to, cc, bcc, replyTo, subject, text, html }) {
  const from = process.env.ALERT_FROM_EMAIL || 'no-reply@fleetshq.com';
  if (!transporter) {
    logger.warn(`[mail:disabled] would send "${subject}" to ${to} (set SMTP_* to enable)`);
    return { skipped: true };
  }
  try {
    await transporter.sendMail({ from: `FLEETS.HQ <${from}>`, to, cc, bcc, replyTo, subject, text, html });
    logger.info(`[mail] sent "${subject}" to ${to}${cc ? ` (cc ${cc})` : ''}`);
    return { sent: true };
  } catch (e) {
    logger.error(`[mail] failed to send "${subject}" to ${to}: ${e.message}`);
    return { error: e.message };
  }
}

module.exports = { sendMail, mailEnabled, opsRecipients };
