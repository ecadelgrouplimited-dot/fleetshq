const prisma = require('../config/database');
const { DEFAULT_TENANT_ID } = require('../utils/tenantContext');

/**
 * Platform-level configuration (Stripe keys, Companies House key, billing
 * knobs), editable from /platform/settings and stored in SystemConfig under
 * the platform tenant. Values fall back to environment variables so either
 * place works. Reads are cached briefly; saves bust the cache.
 *
 * NOTE: reads/writes use explicit tenantId filters so they behave identically
 * inside a tenant context (web requests) and outside one (webhooks, cron).
 */

const CATEGORY = 'platform';
const KEY = 'settings';
const TTL_MS = 60 * 1000;

let cached = null;
let cachedAt = 0;

const DEFAULTS = {
  stripeSecretKey: '',
  stripePublishableKey: '',
  stripeWebhookSecret: '',
  chApiKey: '',
  graceDays: 14,
  reminderDays: [30, 14, 3],
};

const loadRow = () => prisma.systemConfig.findFirst({
  where: { tenantId: DEFAULT_TENANT_ID, category: CATEGORY, key: KEY },
});

const getPlatformConfig = async () => {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  const row = await loadRow();
  const stored = (row && typeof row.value === 'object' && row.value) || {};
  cached = {
    ...DEFAULTS,
    ...stored,
    // env vars act as fallback when the stored value is blank
    stripeSecretKey: stored.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '',
    stripePublishableKey: stored.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '',
    stripeWebhookSecret: stored.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '',
    chApiKey: stored.chApiKey || process.env.CH_API_KEY || '',
    graceDays: Number(stored.graceDays) > 0 ? Number(stored.graceDays) : DEFAULTS.graceDays,
  };
  cachedAt = Date.now();
  return cached;
};

/** Merge-save: blank/undefined fields keep their stored value. */
const savePlatformConfig = async (partial) => {
  const row = await loadRow();
  const stored = (row && typeof row.value === 'object' && row.value) || {};
  const next = { ...stored };
  for (const [k, v] of Object.entries(partial)) {
    if (v === undefined || v === null || v === '') continue;
    next[k] = v;
  }
  if (row) await prisma.systemConfig.update({ where: { id: row.id }, data: { value: next, isSecret: true } });
  else {
    await prisma.systemConfig.create({
      data: { tenantId: DEFAULT_TENANT_ID, category: CATEGORY, key: KEY, value: next, isSecret: true },
    });
  }
  cached = null;
  return getPlatformConfig();
};

const bustPlatformConfigCache = () => { cached = null; };

/** "sk_live_…1234" style hint for the settings UI — never the full secret. */
const maskSecret = (value) => {
  if (!value) return null;
  const s = String(value);
  return s.length <= 8 ? '••••' : `${s.slice(0, 7)}…${s.slice(-4)}`;
};

const stripeEnabled = async () => !!(await getPlatformConfig()).stripeSecretKey;

module.exports = { getPlatformConfig, savePlatformConfig, bustPlatformConfigCache, maskSecret, stripeEnabled };
