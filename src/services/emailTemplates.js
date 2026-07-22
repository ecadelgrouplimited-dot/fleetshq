/**
 * FLEET.HQ transactional email templates.
 *
 * Every builder returns { subject, text, html } ready for sendMail().
 * HTML is email-client-safe: single 600px table, inline styles only,
 * no external assets. All user-supplied values must pass through esc().
 */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const BRAND = {
  bg: '#f4f4f6', panel: '#ffffff', ink: '#26262c', muted: '#6f6f7a',
  line: '#e8e8ec', red: '#e11d2a', redDeep: '#a60f1a', gold: '#f5b301', dark: '#0f0f13',
};

const APP_URL = () => (process.env.APP_URL || 'https://fleetshq.com').replace(/\/$/, '');

/** Shared shell: dark FLEET.HQ masthead, white card, footer. */
const layout = ({ preheader = '', heading, bodyHtml, cta = null, footerNote = '' }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Masthead -->
        <tr><td style="background:${BRAND.dark};border-radius:14px 14px 0 0;padding:22px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="36" style="padding-right:12px;">
              <img src="${APP_URL()}/img/logo-fleetshq-icon.png" width="36" height="36" alt="FLEET.HQ" style="display:block;width:36px;height:36px;">
            </td>
            <td style="font-size:20px;font-weight:900;letter-spacing:-0.3px;color:#ffffff;">
              FLEET<span style="color:${BRAND.red};">.</span>HQ
              <div style="font-size:9px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#8a8a94;margin-top:4px;">One platform. Total control.</div>
            </td>
            <td align="right" style="font-size:11px;color:#8a8a94;">
              <a href="${APP_URL()}" style="color:${BRAND.gold};text-decoration:none;font-weight:700;">fleetshq.com</a>
            </td>
          </tr></table>
        </td></tr>
        <!-- Accent rule -->
        <tr><td style="height:3px;background:${BRAND.red};font-size:0;line-height:0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td style="background:${BRAND.panel};padding:34px 32px 30px;border:1px solid ${BRAND.line};border-top:0;">
          <h1 style="margin:0 0 16px;font-size:21px;font-weight:800;letter-spacing:-0.02em;color:${BRAND.ink};">${esc(heading)}</h1>
          <div style="font-size:14.5px;line-height:1.65;color:${BRAND.ink};">${bodyHtml}</div>
          ${cta ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;"><tr><td style="border-radius:10px;background:${BRAND.red};">
            <a href="${esc(cta.url)}" style="display:inline-block;padding:13px 28px;font-size:14.5px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(cta.label)}</a>
          </td></tr></table>
          <p style="margin:10px 0 0;font-size:12px;color:${BRAND.muted};">If the button doesn't work, copy this link:<br><a href="${esc(cta.url)}" style="color:${BRAND.red};word-break:break-all;">${esc(cta.url)}</a></p>` : ''}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:${BRAND.panel};border:1px solid ${BRAND.line};border-top:1px solid ${BRAND.line};border-radius:0 0 14px 14px;padding:18px 32px;">
          ${footerNote ? `<p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${BRAND.muted};">${footerNote}</p>` : ''}
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">
            FLEET<span style="color:${BRAND.red};">.</span>HQ &mdash; formerly 256 Logistics
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const severityChip = (sev) => {
  const map = {
    critical: { bg: '#fde8ea', fg: BRAND.redDeep, label: 'CRITICAL' },
    warning: { bg: '#fdf3d7', fg: '#8a6400', label: 'WARNING' },
    notice: { bg: '#e8f0fd', fg: '#1d4fa6', label: 'NOTICE' },
  };
  const c = map[sev] || map.notice;
  return `<span style="display:inline-block;padding:2px 9px;border-radius:100px;background:${c.bg};color:${c.fg};font-size:10.5px;font-weight:800;letter-spacing:0.5px;">${c.label}</span>`;
};

// ── Templates ────────────────────────────────────────────────────────────

const resetPassword = ({ name, link }) => ({
  subject: 'Reset your FLEET.HQ password',
  text: `Hi ${name || 'there'},\n\nReset your FLEET.HQ password using this link (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can safely ignore this email — your password is unchanged.\n\nFLEET.HQ`,
  html: layout({
    preheader: 'Your password reset link — valid for 1 hour.',
    heading: 'Reset your password',
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${esc(name || 'there')},</p>
      <p style="margin:0 0 12px;">We received a request to reset the password for your FLEET.HQ account. The link below is valid for <strong>1 hour</strong>.</p>`,
    cta: { label: 'Set a new password', url: link },
    footerNote: `You're receiving this because a password reset was requested for your account. If this wasn't you, ignore this email &mdash; your password is unchanged.`,
  }),
});

const passwordChanged = ({ name, when, context }) => ({
  subject: 'Your FLEET.HQ password was changed',
  text: `Hi ${name || 'there'},\n\nThe password on your FLEET.HQ account was changed on ${when}${context ? ` (${context})` : ''}.\n\nIf this was you, no action is needed. If you did not make this change, reset your password immediately at ${APP_URL()}/forgot-password and contact your administrator.\n\nFLEET.HQ`,
  html: layout({
    preheader: 'Security notice: your account password was changed.',
    heading: 'Your password was changed',
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${esc(name || 'there')},</p>
      <p style="margin:0 0 12px;">The password on your FLEET.HQ account was changed on <strong>${esc(when)}</strong>${context ? ` (${esc(context)})` : ''}.</p>
      <p style="margin:0;">If this was you, no action is needed. If you <strong>did not</strong> make this change, reset your password immediately and contact your administrator.</p>`,
    cta: { label: 'Reset my password', url: `${APP_URL()}/forgot-password` },
    footerNote: 'This is an automated security notification from FLEET.HQ.',
  }),
});

const welcome = ({ tradingName, adminFirst, loginUrl, adminEmail, tempPassword }) => ({
  subject: `Welcome to FLEET.HQ — your ${tradingName} account is ready`,
  text: `Hi ${adminFirst},\n\nYour ${tradingName} account on FLEET.HQ has been created.\n\nSign-in: ${loginUrl}\nEmail: ${adminEmail}\nTemporary password: ${tempPassword}\n\nFor security, you'll be asked to set your own password the first time you sign in.\n\n— FLEET.HQ, powered by 256 Digital Technologies`,
  html: layout({
    preheader: `Your ${tradingName} environment is ready — sign in to get started.`,
    heading: `Welcome to FLEET.HQ, ${adminFirst}`,
    bodyHtml: `<p style="margin:0 0 12px;">Your <strong>${esc(tradingName)}</strong> environment on FLEET.HQ has been created and is ready to use.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0;border:1px solid ${BRAND.line};border-radius:10px;">
        <tr><td style="padding:14px 18px;border-bottom:1px solid ${BRAND.line};font-size:13px;"><span style="color:${BRAND.muted};">Sign-in email</span><br><strong style="font-size:14.5px;">${esc(adminEmail)}</strong></td></tr>
        <tr><td style="padding:14px 18px;font-size:13px;"><span style="color:${BRAND.muted};">Temporary password</span><br><strong style="font-size:15px;font-family:Consolas,Menlo,monospace;letter-spacing:0.5px;">${esc(tempPassword)}</strong></td></tr>
      </table>
      <p style="margin:0;">For security, you'll be asked to <strong>set your own password</strong> the first time you sign in.</p>`,
    cta: { label: 'Sign in to FLEET.HQ', url: loginUrl },
    footerNote: 'FLEET.HQ, powered by 256 Digital Technologies. This email contains a temporary credential — delete it once you have signed in.',
  }),
});

const enquiry = ({ name, email, phone, company, enquiryType, message, sourcePath }) => {
  const row = (label, value) => `<tr>
    <td style="padding:9px 14px;border-bottom:1px solid ${BRAND.line};font-size:12px;color:${BRAND.muted};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
    <td style="padding:9px 14px;border-bottom:1px solid ${BRAND.line};font-size:13.5px;color:${BRAND.ink};">${esc(value)}</td></tr>`;
  return {
    subject: `New public enquiry: ${enquiryType} — ${name}`,
    text: `New enquiry received on fleetshq.com\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\nCompany: ${company || '-'}\nType: ${enquiryType}\nPage: ${sourcePath || '-'}\n\n${message}`,
    html: layout({
      preheader: `${name} (${company || 'no company'}) — ${enquiryType}`,
      heading: 'New public enquiry',
      bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;margin-bottom:16px;">
          ${row('Name', name)}${row('Email', email)}${row('Phone', phone || '—')}${row('Company', company || '—')}${row('Type', enquiryType)}${row('Page', sourcePath || '—')}
        </table>
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${BRAND.muted};">Message</p>
        <p style="margin:0;padding:14px 16px;background:${BRAND.bg};border-radius:10px;">${esc(message).replace(/\n/g, '<br>')}</p>`,
      cta: { label: 'Open leads in FLEET.HQ', url: `${APP_URL()}/super-admin` },
      footerNote: 'Sent automatically when a visitor submits the public contact form.',
    }),
  };
};

const invoiceReminder = ({ customerName, number, total, dueStr }) => ({
  subject: `Payment reminder — Invoice ${number}`,
  text: `Dear ${customerName},\n\nThis is a friendly reminder that invoice ${number} for £${total} is due ${dueStr}.\n\nIf you have already made payment, please disregard this message.\n\nFLEET.HQ`,
  html: layout({
    preheader: `Invoice ${number} for £${total} is due ${dueStr}.`,
    heading: 'Payment reminder',
    bodyHtml: `<p style="margin:0 0 12px;">Dear ${esc(customerName)},</p>
      <p style="margin:0 0 16px;">This is a friendly reminder that the invoice below is awaiting payment.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;margin-bottom:16px;">
        <tr><td style="padding:14px 18px;border-bottom:1px solid ${BRAND.line};font-size:13px;"><span style="color:${BRAND.muted};">Invoice</span><br><strong style="font-size:15px;">${esc(number)}</strong></td>
            <td style="padding:14px 18px;border-bottom:1px solid ${BRAND.line};font-size:13px;" align="right"><span style="color:${BRAND.muted};">Amount due</span><br><strong style="font-size:15px;">&pound;${esc(total)}</strong></td></tr>
        <tr><td colspan="2" style="padding:14px 18px;font-size:13px;"><span style="color:${BRAND.muted};">Due</span><br><strong style="font-size:14.5px;">${esc(dueStr)}</strong></td></tr>
      </table>
      <p style="margin:0;">If you have already made payment, please disregard this message.</p>`,
    footerNote: 'Questions about this invoice? Reply to this email and our team will help.',
  }),
});

const alertDigest = ({ dateStr, counts, items }) => {
  const total = (counts.critical || 0) + (counts.warning || 0) + (counts.notice || 0);
  const shown = items.slice(0, 12);
  const rows = shown.map((a) => `<tr>
      <td style="padding:9px 12px;border-bottom:1px solid ${BRAND.line};vertical-align:top;width:74px;">${severityChip(a.severity)}</td>
      <td style="padding:9px 12px;border-bottom:1px solid ${BRAND.line};font-size:13.5px;color:${BRAND.ink};">${esc(a.message)}</td></tr>`).join('');
  const stat = (n, label, color) => `<td align="center" style="padding:14px 6px;border:1px solid ${BRAND.line};border-radius:10px;">
      <div style="font-size:24px;font-weight:900;color:${color};line-height:1;">${n}</div>
      <div style="font-size:10.5px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${BRAND.muted};margin-top:5px;">${label}</div></td>`;
  return {
    subject: `Compliance digest — ${counts.critical || 0} critical, ${counts.warning || 0} warning (${dateStr})`,
    text: `FLEET.HQ compliance digest for ${dateStr}\n\nCritical: ${counts.critical || 0}\nWarning: ${counts.warning || 0}\nNotice: ${counts.notice || 0}\n\n${items.map((a) => `[${a.severity.toUpperCase()}] ${a.message}`).join('\n')}\n\nFull details: ${APP_URL()}/alerts`,
    html: layout({
      preheader: `${total} open compliance items — ${counts.critical || 0} critical.`,
      heading: `Compliance digest — ${dateStr}`,
      bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:8px 0;margin:0 -8px 20px;"><tr>
          ${stat(counts.critical || 0, 'Critical', BRAND.red)}${stat(counts.warning || 0, 'Warning', '#8a6400')}${stat(counts.notice || 0, 'Notice', '#1d4fa6')}
        </tr></table>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;">${rows}</table>
        ${items.length > shown.length ? `<p style="margin:10px 0 0;font-size:12.5px;color:${BRAND.muted};">+ ${items.length - shown.length} more in the dashboard.</p>` : ''}`,
      cta: { label: 'Review all alerts', url: `${APP_URL()}/alerts` },
      footerNote: 'Daily compliance digest, generated automatically by FLEET.HQ. Thresholds are configurable in Settings.',
    }),
  };
};

const verificationCode = ({ contactName, companyName, code }) => ({
  subject: `${code} is your FLEET.HQ verification code`,
  text: `Hi ${contactName || 'there'},\n\nYour FLEET.HQ verification code for registering ${companyName} is:\n\n${code}\n\nThe code is valid for 15 minutes. If you didn't start a registration, you can ignore this email.\n\nFLEET.HQ`,
  html: layout({
    preheader: `Your verification code: ${code} (valid 15 minutes).`,
    heading: 'Verify your email',
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${esc(contactName || 'there')},</p>
      <p style="margin:0 0 18px;">Enter this code to continue registering <strong>${esc(companyName)}</strong> on FLEET.HQ:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:18px;background:${BRAND.bg};border:1px dashed ${BRAND.line};border-radius:12px;">
        <span style="font-family:Consolas,Menlo,monospace;font-size:34px;font-weight:800;letter-spacing:10px;color:${BRAND.ink};">${esc(code)}</span>
      </td></tr></table>
      <p style="margin:16px 0 0;font-size:13px;color:${BRAND.muted};">The code is valid for <strong>15 minutes</strong>. If you didn't start a registration, you can safely ignore this email.</p>`,
    footerNote: 'Verification codes are sent from alerts@fleetshq.com — we will never ask for your code by phone or reply.',
  }),
});

const registrationPending = ({ contactName, companyName, tierLabel }) => ({
  subject: `Registration received — ${companyName} on FLEET.HQ`,
  text: `Hi ${contactName},\n\nThanks — your registration for ${companyName} (${tierLabel} tier) has been received and your email is verified.\n\nWhat happens next:\n1. Our team confirms your details and annual licence payment.\n2. Your private FLEET.HQ environment is provisioned.\n3. You receive sign-in credentials by email — usually within one business day.\n\nFLEET.HQ`,
  html: layout({
    preheader: 'Your registration is verified and queued for activation.',
    heading: 'Registration received',
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${esc(contactName)},</p>
      <p style="margin:0 0 14px;">Thanks — your registration for <strong>${esc(companyName)}</strong> on the <strong>${esc(tierLabel)}</strong> tier has been received and your email is verified.</p>
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${BRAND.muted};">What happens next</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;">
        <tr><td style="padding:11px 16px;border-bottom:1px solid ${BRAND.line};font-size:13.5px;"><strong style="color:${BRAND.red};">1.</strong>&nbsp; Our team confirms your details and the annual licence payment.</td></tr>
        <tr><td style="padding:11px 16px;border-bottom:1px solid ${BRAND.line};font-size:13.5px;"><strong style="color:${BRAND.red};">2.</strong>&nbsp; Your private FLEET.HQ environment is provisioned.</td></tr>
        <tr><td style="padding:11px 16px;font-size:13.5px;"><strong style="color:${BRAND.red};">3.</strong>&nbsp; You receive sign-in credentials by email — usually within one business day.</td></tr>
      </table>`,
    footerNote: 'Questions in the meantime? Just reply to this email.',
  }),
});

const opsNewRegistration = ({ companyName, companyRegNo, contactName, contactEmail, contactPhone, fleetSize, region, tierLabel, chSummary, reviewUrl }) => {
  const row = (label, value) => `<tr>
    <td style="padding:9px 14px;border-bottom:1px solid ${BRAND.line};font-size:12px;color:${BRAND.muted};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
    <td style="padding:9px 14px;border-bottom:1px solid ${BRAND.line};font-size:13.5px;color:${BRAND.ink};">${esc(value)}</td></tr>`;
  return {
    subject: `New registration pending activation: ${companyName} (${tierLabel})`,
    text: `New verified registration awaiting activation.\n\nCompany: ${companyName}\nReg no: ${companyRegNo || '-'}\nContact: ${contactName} <${contactEmail}> ${contactPhone || ''}\nFleet: ${fleetSize} · Region: ${region || '-'}\nTier: ${tierLabel}\nCompanies House: ${chSummary}\n\nReview: ${reviewUrl}`,
    html: layout({
      preheader: `${companyName} — ${tierLabel}, fleet ${fleetSize}. Awaiting activation.`,
      heading: 'New registration pending activation',
      bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;">
        ${row('Company', companyName)}${row('Reg number', companyRegNo || '—')}${row('Contact', `${contactName} · ${contactEmail}${contactPhone ? ' · ' + contactPhone : ''}`)}
        ${row('Fleet size', fleetSize)}${row('Region', region || '—')}${row('Tier', tierLabel)}${row('Companies House', chSummary)}
      </table>
      <p style="margin:14px 0 0;font-size:13px;color:${BRAND.muted};">Email ownership is verified. Confirm payment, then approve to provision their environment — credentials are emailed automatically.</p>`,
      cta: { label: 'Review & activate', url: reviewUrl },
      footerNote: 'Sent automatically when a self-serve registration completes verification and tier selection.',
    }),
  };
};

const registrationRejected = ({ contactName, companyName }) => ({
  subject: `Update on your FLEET.HQ registration — ${companyName}`,
  text: `Hi ${contactName},\n\nThank you for your interest in FLEET.HQ. After reviewing your registration for ${companyName}, we're unable to activate an account at this time.\n\nIf you believe this is a mistake or want to provide more information, just reply to this email.\n\nFLEET.HQ`,
  html: layout({
    preheader: 'An update on your FLEET.HQ registration.',
    heading: 'Update on your registration',
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${esc(contactName)},</p>
      <p style="margin:0 0 12px;">Thank you for your interest in FLEET.HQ. After reviewing your registration for <strong>${esc(companyName)}</strong>, we're unable to activate an account at this time.</p>
      <p style="margin:0;">If you believe this is a mistake, or you'd like to provide more information, just reply to this email and our team will take another look.</p>`,
    footerNote: 'This decision was made after manual review by the FLEET.HQ team.',
  }),
});

const renewalReminder = ({ companyName, tierLabel, renewalDate, daysLeft, price, renewUrl }) => ({
  subject: `Your FLEET.HQ licence renews in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — ${companyName}`,
  text: `Hi,\n\nThe annual FLEET.HQ licence for ${companyName} (${tierLabel} tier${price ? `, ${price}/year` : ''}) is due for renewal on ${renewalDate} — ${daysLeft} day${daysLeft === 1 ? '' : 's'} from now.\n\nRenew: ${renewUrl}\n\nIf the licence lapses there is a short grace period, after which access is paused (your data stays safe).\n\nFLEET.HQ`,
  html: layout({
    preheader: `${companyName} renews on ${renewalDate}.`,
    heading: `Licence renewal in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    bodyHtml: `<p style="margin:0 0 12px;">The annual FLEET.HQ licence for <strong>${esc(companyName)}</strong> (<strong>${esc(tierLabel)}</strong> tier${price ? `, <strong>${esc(price)}</strong>/year` : ''}) is due for renewal on <strong>${esc(renewalDate)}</strong>.</p>
      <p style="margin:0;">Renewing keeps your drivers, vehicles and compliance records exactly as they are. If the licence lapses there is a short grace period, after which access is paused &mdash; your data stays safe either way.</p>`,
    cta: { label: 'Review & renew', url: renewUrl },
    footerNote: 'You are receiving this because you are the primary contact for this FLEET.HQ environment.',
  }),
});

const licenceExpired = ({ companyName, graceUntil, renewUrl }) => ({
  subject: `Action needed — the FLEET.HQ licence for ${companyName} has expired`,
  text: `Hi,\n\nThe annual licence for ${companyName} expired. Access continues during a grace period until ${graceUntil}, after which sign-in is paused (your data stays safe).\n\nRenew now: ${renewUrl}\n\nFLEET.HQ`,
  html: layout({
    preheader: `Grace period until ${graceUntil} — renew to avoid interruption.`,
    heading: 'Your licence has expired',
    bodyHtml: `<p style="margin:0 0 12px;">The annual FLEET.HQ licence for <strong>${esc(companyName)}</strong> has expired.</p>
      <p style="margin:0;">Access continues during a grace period until <strong>${esc(graceUntil)}</strong>. After that, sign-in is paused until the licence is renewed &mdash; all of your data stays safe and nothing is deleted.</p>`,
    cta: { label: 'Renew now', url: renewUrl },
    footerNote: 'Renewing during the grace period keeps access uninterrupted.',
  }),
});

const licenceSuspended = ({ companyName, renewUrl }) => ({
  subject: `FLEET.HQ access paused — ${companyName}`,
  text: `Hi,\n\nThe grace period for ${companyName} has ended and access is now paused. Your data is safe and access resumes the moment the licence is renewed.\n\nRenew: ${renewUrl}\n\nFLEET.HQ`,
  html: layout({
    preheader: 'Access is paused until the licence is renewed. Data is safe.',
    heading: 'Access paused',
    bodyHtml: `<p style="margin:0 0 12px;">The grace period for <strong>${esc(companyName)}</strong> has ended and access to your FLEET.HQ environment is now <strong>paused</strong>.</p>
      <p style="margin:0;">All of your data is safe and nothing has been deleted. Access resumes automatically the moment the licence is renewed.</p>`,
    cta: { label: 'Renew & restore access', url: renewUrl },
    footerNote: 'Need help or more time? Reply to this email and the FLEET.HQ team will assist.',
  }),
});

const renewalConfirmed = ({ companyName, tierLabel, amount, periodEnd }) => ({
  subject: `Renewal confirmed — ${companyName} on FLEET.HQ`,
  text: `Hi,\n\nThanks — the FLEET.HQ licence for ${companyName} (${tierLabel}${amount ? `, ${amount}` : ''}) has been renewed. Your environment is licensed until ${periodEnd}.\n\nFLEET.HQ`,
  html: layout({
    preheader: `Licensed until ${periodEnd}.`,
    heading: 'Renewal confirmed',
    bodyHtml: `<p style="margin:0 0 12px;">Thanks &mdash; the FLEET.HQ licence for <strong>${esc(companyName)}</strong> (<strong>${esc(tierLabel)}</strong>${amount ? `, <strong>${esc(amount)}</strong>` : ''}) has been renewed.</p>
      <p style="margin:0;">Your environment is licensed until <strong>${esc(periodEnd)}</strong>. No further action is needed.</p>`,
    footerNote: 'A payment receipt is available from your billing page.',
  }),
});

const testMessage = ({ hostname }) => ({
  subject: 'FLEET.HQ email test — configuration OK',
  text: `This is a test message from FLEET.HQ (${hostname}). If you're reading this, SMTP delivery is working.`,
  html: layout({
    preheader: 'SMTP delivery is configured correctly.',
    heading: 'Email configuration test',
    bodyHtml: `<p style="margin:0 0 12px;">This is a test message from FLEET.HQ (<strong>${esc(hostname)}</strong>).</p>
      <p style="margin:0;">If you're reading this, outbound email is configured correctly &mdash; verification codes, password resets, welcome emails and compliance digests will all be delivered.</p>`,
    footerNote: 'Sent manually to verify SMTP configuration.',
  }),
});

module.exports = {
  resetPassword, passwordChanged, welcome, enquiry, invoiceReminder, alertDigest, testMessage,
  verificationCode, registrationPending, opsNewRegistration, registrationRejected,
  renewalReminder, licenceExpired, licenceSuspended, renewalConfirmed,
};
