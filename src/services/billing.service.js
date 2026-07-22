const prisma = require('../config/database');
const logger = require('../utils/logger');
const { getPlan } = require('../config/plans');
const { getPlatformConfig } = require('./platformConfig.service');
const { provisionTenant } = require('./provisioning.service');
const { bustTenantStatusCache } = require('../utils/tenantStatus');
const { sendMail, opsRecipients } = require('./mail.service');
const emailTemplates = require('./emailTemplates');

const APP_URL = () => (process.env.APP_URL || 'https://fleetshq.com').replace(/\/$/, '');

// ── Stripe client (lazy — configured via /platform/settings or env) ──────
let stripeClient = null;
let stripeClientKey = null;

const getStripe = async () => {
  const { stripeSecretKey } = await getPlatformConfig();
  if (!stripeSecretKey) return null;
  if (!stripeClient || stripeClientKey !== stripeSecretKey) {
    const Stripe = require('stripe');
    stripeClient = new Stripe(stripeSecretKey);
    stripeClientKey = stripeSecretKey;
  }
  return stripeClient;
};

// ── Subscriptions ────────────────────────────────────────────────────────
const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const createSubscriptionForTenant = async (tenantId, planKey, { termYears = 1, stripeCustomerId = null } = {}) => {
  const plan = getPlan(planKey) || getPlan('starter');
  const { graceDays } = await getPlatformConfig();
  const now = new Date();
  return prisma.subscription.upsert({
    where: { tenantId },
    create: {
      tenantId, plan: plan.key, status: 'active', termYears,
      priceAnnualPence: plan.priceAnnualPence,
      currentPeriodStart: now, currentPeriodEnd: addYears(now, termYears),
      graceDays, stripeCustomerId,
    },
    update: {
      plan: plan.key, status: 'active', termYears,
      priceAnnualPence: plan.priceAnnualPence,
      currentPeriodStart: now, currentPeriodEnd: addYears(now, termYears),
      remindersSent: {},
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
    },
  });
};

const recordPayment = (subscriptionId, { amountPence, status = 'paid', description, stripeCheckoutId, stripePaymentIntentId, receiptUrl }) =>
  prisma.payment.create({
    data: { subscriptionId, amountPence, status, description: description || null,
      stripeCheckoutId: stripeCheckoutId || null, stripePaymentIntentId: stripePaymentIntentId || null,
      receiptUrl: receiptUrl || null, paidAt: new Date() },
  });

/**
 * Turn a verified registration into a live tenant + subscription + welcome
 * email. Used by the Platform Admin "Activate" button and by the Stripe
 * webhook. Idempotent: an already-provisioned request is returned as-is.
 */
const activateRegistration = async (requestOrId, { reviewNotes = null, payment = null, via = 'manual' } = {}) => {
  const request = typeof requestOrId === 'string'
    ? await prisma.registrationRequest.findUnique({ where: { id: requestOrId } })
    : requestOrId;
  if (!request) throw new Error('Registration not found.');
  if (request.status === 'provisioned') return { alreadyProvisioned: true, request };
  if (!['verified', 'pending_activation'].includes(request.status)) {
    throw new Error(`This registration is ${request.status.replace(/_/g, ' ')} — only verified registrations can be activated.`);
  }

  const nameParts = request.contactName.trim().split(/\s+/);
  const { tenant, adminUser, tempPassword } = await provisionTenant({
    tradingName: request.companyName,
    plan: request.plan || 'starter',
    status: 'active',
    adminEmail: request.contactEmail,
    adminFirst: nameParts[0],
    adminLast: nameParts.slice(1).join(' ') || nameParts[0],
    adminPhone: request.contactPhone,
    notes: [
      `Self-serve registration (${via}).`,
      request.companyRegNo ? `Company reg no: ${request.companyRegNo}` : null,
      `Fleet size: ${request.fleetSize}`,
      request.region ? `Region: ${request.region}` : null,
      reviewNotes ? `Review notes: ${reviewNotes}` : null,
    ].filter(Boolean).join(' '),
  });

  const subscription = await createSubscriptionForTenant(tenant.id, request.plan || 'starter');
  if (payment) await recordPayment(subscription.id, payment);

  await prisma.registrationRequest.update({
    where: { id: request.id },
    data: { status: 'provisioned', tenantId: tenant.id, provisionedAt: new Date(), reviewNotes },
  });

  const loginUrl = `${APP_URL()}/login`;
  const mailResult = await sendMail({
    to: adminUser.email,
    ...emailTemplates.welcome({ tradingName: tenant.name, adminFirst: adminUser.firstName, loginUrl, adminEmail: adminUser.email, tempPassword }),
  });

  return { tenant, adminUser, tempPassword, subscription, emailed: !!mailResult.sent, loginUrl };
};

/** Extend a subscription by its term and reactivate the tenant if gated. */
const renewSubscription = async (subscription, { payment = null } = {}) => {
  const now = new Date();
  // If renewal happens before expiry, extend from the current end; if it
  // lapsed, the new period starts today.
  const base = subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: addYears(base, subscription.termYears || 1),
      remindersSent: {},
    },
  });
  if (payment) await recordPayment(subscription.id, payment);

  const tenant = await prisma.tenant.findUnique({ where: { id: subscription.tenantId } });
  if (tenant && tenant.status === 'suspended') {
    await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'active' } });
    bustTenantStatusCache(tenant.id);
  }
  return updated;
};

// ── Stripe Checkout ──────────────────────────────────────────────────────
const checkoutLineItem = (plan, label) => ({
  price_data: {
    currency: 'gbp',
    unit_amount: plan.priceAnnualPence,
    product_data: {
      name: `FLEETS.HQ ${plan.label} — 12-month licence`,
      description: label,
    },
  },
  quantity: 1,
});

const createRegistrationCheckout = async (request, plan, origin) => {
  const stripe = await getStripe();
  if (!stripe || !plan.priceAnnualPence) return null;
  const base = origin || APP_URL();
  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: request.contactEmail,
    line_items: [checkoutLineItem(plan, request.companyName)],
    metadata: { kind: 'registration', rid: request.id, plan: plan.key },
    success_url: `${base}/register/done?rid=${request.id}&paid=1`,
    cancel_url: `${base}/register/plan?rid=${request.id}&cancelled=1`,
  });
};

const createRenewalCheckout = async (subscription, tenant, origin) => {
  const stripe = await getStripe();
  const plan = getPlan(subscription.plan);
  const price = subscription.priceAnnualPence || plan?.priceAnnualPence;
  if (!stripe || !price) return null;
  const base = origin || APP_URL();
  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: tenant.primaryContactEmail || undefined,
    line_items: [checkoutLineItem({ ...plan, priceAnnualPence: price }, `${tenant.name} — renewal`)],
    metadata: { kind: 'renewal', subscriptionId: subscription.id },
    success_url: `${base}/billing?renewed=1`,
    cancel_url: `${base}/billing`,
  });
};

// ── Stripe webhook ───────────────────────────────────────────────────────
const handleStripeWebhook = async (rawBody, signature) => {
  const stripe = await getStripe();
  const { stripeWebhookSecret } = await getPlatformConfig();
  if (!stripe || !stripeWebhookSecret) throw new Error('Stripe is not configured');

  const event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  if (event.type !== 'checkout.session.completed') return { ignored: event.type };

  const session = event.data.object;
  if (session.payment_status !== 'paid') return { ignored: 'not_paid' };
  const meta = session.metadata || {};
  const paymentBase = {
    amountPence: session.amount_total,
    description: null,
    stripeCheckoutId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
  };

  // Idempotency: Stripe retries webhooks — never double-process a session.
  const existing = await prisma.payment.findUnique({ where: { stripeCheckoutId: session.id } });
  if (existing) return { ignored: 'already_processed' };

  if (meta.kind === 'registration' && meta.rid) {
    const result = await activateRegistration(meta.rid, {
      via: 'stripe checkout',
      payment: { ...paymentBase, description: 'Annual licence — online payment' },
    });
    logger.info(`[billing] auto-provisioned registration ${meta.rid} from Stripe session ${session.id}`);
    sendMail({
      ...opsRecipients(),
      subject: `Payment received & environment provisioned: ${result.tenant?.name || meta.rid}`,
      text: `Stripe payment confirmed (£${(session.amount_total / 100).toFixed(2)}). The tenant environment was provisioned automatically and credentials were emailed to the admin.`,
      html: `<p>Stripe payment confirmed (<strong>£${(session.amount_total / 100).toFixed(2)}</strong>).</p><p>The tenant environment for <strong>${result.tenant?.name || ''}</strong> was provisioned automatically and credentials were emailed to the admin.</p>`,
    }).catch(() => {});
    return { provisioned: true };
  }

  if (meta.kind === 'renewal' && meta.subscriptionId) {
    const subscription = await prisma.subscription.findUnique({ where: { id: meta.subscriptionId } });
    if (!subscription) throw new Error('Subscription not found for renewal webhook');
    await renewSubscription(subscription, {
      payment: { ...paymentBase, description: 'Annual licence renewal — online payment' },
    });
    logger.info(`[billing] renewed subscription ${meta.subscriptionId} from Stripe session ${session.id}`);
    return { renewed: true };
  }

  return { ignored: 'unknown_metadata' };
};

module.exports = {
  getStripe, createSubscriptionForTenant, recordPayment, activateRegistration,
  renewSubscription, createRegistrationCheckout, createRenewalCheckout, handleStripeWebhook,
};
