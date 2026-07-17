const prisma = require('../config/database');
const logger = require('../utils/logger');
const { getPlan, formatPrice } = require('../config/plans');
const { getPlatformConfig } = require('./platformConfig.service');
const { bustTenantStatusCache } = require('../utils/tenantStatus');
const { sendMail, opsRecipients } = require('./mail.service');
const emailTemplates = require('./emailTemplates');

const APP_URL = () => (process.env.APP_URL || 'https://fleetshq.com').replace(/\/$/, '');
const DAY_MS = 24 * 60 * 60 * 1000;

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const contactFor = async (subscription) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: subscription.tenantId } });
  return { tenant, email: tenant?.primaryContactEmail || null };
};

/**
 * Daily licence lifecycle:
 *  - reminder emails at the configured thresholds before renewal
 *  - expiry -> past_due (grace window starts, email)
 *  - grace exhausted -> suspend tenant (lock screen) + email
 * Idempotent per period via Subscription.remindersSent.
 */
const runSubscriptionLifecycle = async () => {
  const { reminderDays, graceDays } = await getPlatformConfig();
  const now = new Date();
  const results = { reminders: 0, expired: 0, suspended: 0 };

  // ── Renewal reminders ──────────────────────────────────────────────
  const active = await prisma.subscription.findMany({ where: { status: 'active' } });
  for (const sub of active) {
    const daysLeft = Math.ceil((new Date(sub.currentPeriodEnd) - now) / DAY_MS);
    const threshold = [...reminderDays].sort((a, b) => a - b).find((t) => daysLeft <= t);
    if (daysLeft < 0 || threshold === undefined) continue;
    const sent = (sub.remindersSent && typeof sub.remindersSent === 'object') ? sub.remindersSent : {};
    if (sent[String(threshold)]) continue;

    const { tenant, email } = await contactFor(sub);
    if (!tenant) continue;
    const plan = getPlan(sub.plan);
    const msg = emailTemplates.renewalReminder({
      companyName: tenant.name,
      tierLabel: plan?.label || sub.plan,
      renewalDate: fmtDate(sub.currentPeriodEnd),
      daysLeft: Math.max(daysLeft, 0),
      price: formatPrice(sub.priceAnnualPence),
      renewUrl: `${APP_URL()}/billing`,
    });
    if (email) await sendMail({ to: email, cc: opsRecipients().cc, ...msg });
    else await sendMail({ ...opsRecipients(), ...msg });
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { remindersSent: { ...sent, [String(threshold)]: now.toISOString() } },
    });
    results.reminders += 1;
  }

  // ── Expiry -> past_due ─────────────────────────────────────────────
  const expired = await prisma.subscription.findMany({
    where: { status: 'active', currentPeriodEnd: { lt: now } },
  });
  for (const sub of expired) {
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'past_due' } });
    const { tenant, email } = await contactFor(sub);
    if (!tenant) continue;
    const grace = sub.graceDays ?? graceDays;
    const msg = emailTemplates.licenceExpired({
      companyName: tenant.name,
      graceUntil: fmtDate(new Date(new Date(sub.currentPeriodEnd).getTime() + grace * DAY_MS)),
      renewUrl: `${APP_URL()}/billing`,
    });
    if (email) await sendMail({ to: email, cc: opsRecipients().cc, ...msg });
    else await sendMail({ ...opsRecipients(), ...msg });
    results.expired += 1;
  }

  // ── Grace exhausted -> suspend ─────────────────────────────────────
  const pastDue = await prisma.subscription.findMany({ where: { status: 'past_due' } });
  for (const sub of pastDue) {
    const grace = sub.graceDays ?? graceDays;
    const graceEnd = new Date(new Date(sub.currentPeriodEnd).getTime() + grace * DAY_MS);
    if (graceEnd > now) continue;

    await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'suspended' } });
    await prisma.tenant.update({ where: { id: sub.tenantId }, data: { status: 'suspended' } });
    bustTenantStatusCache(sub.tenantId);

    const { tenant, email } = await contactFor(sub);
    if (tenant) {
      const msg = emailTemplates.licenceSuspended({ companyName: tenant.name, renewUrl: `${APP_URL()}/billing` });
      if (email) await sendMail({ to: email, cc: opsRecipients().cc, ...msg });
      sendMail({
        ...opsRecipients(),
        subject: `Tenant auto-suspended (licence lapsed): ${tenant.name}`,
        text: `${tenant.name} exhausted its ${grace}-day grace period and was suspended automatically. Renewal restores access immediately.`,
        html: `<p><strong>${tenant.name}</strong> exhausted its ${grace}-day grace period and was suspended automatically.</p><p>Renewal restores access immediately.</p>`,
      }).catch(() => {});
    }
    results.suspended += 1;
  }

  if (results.reminders || results.expired || results.suspended) {
    logger.info(`[billing] lifecycle: ${results.reminders} reminders, ${results.expired} expired, ${results.suspended} suspended`);
  }
  return results;
};

module.exports = { runSubscriptionLifecycle };
