const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Email delivery. If SMTP isn't configured (SMTP_HOST + SMTP_USER), sending is
 * a safe no-op that logs what would have been sent — so the app works in dev /
 * before SMTP is wired, and lights up automatically once the env is set.
 *
 * Required env to enable: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 *   SMTP_SECURE (true for 465), ALERT_FROM_EMAIL.
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

async function sendMail({ to, subject, text, html }) {
  const from = process.env.ALERT_FROM_EMAIL || 'no-reply@256logisticsltd.com';
  if (!transporter) {
    logger.warn(`[mail:disabled] would send "${subject}" to ${to} (set SMTP_* to enable)`);
    return { skipped: true };
  }
  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true };
  } catch (e) {
    logger.error(`[mail] failed to send "${subject}" to ${to}: ${e.message}`);
    return { error: e.message };
  }
}

module.exports = { sendMail, mailEnabled };
