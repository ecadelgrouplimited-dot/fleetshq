const { DEFAULT_TENANT_ID } = require('./tenantContext');

/**
 * Tenant status lookups with a short in-memory cache, so the suspension gate
 * can run on every authenticated request without a DB hit each time.
 * Platform admins bust the cache when they change a tenant's status, so
 * suspend/reactivate takes effect immediately; the TTL only bounds staleness
 * across multiple pm2 workers or out-of-band DB edits.
 */

const TTL_MS = 60 * 1000;
const cache = new Map(); // tenantId -> { status, at }

const getTenantStatus = async (tenantId) => {
  if (!tenantId || tenantId === DEFAULT_TENANT_ID) return 'active';
  const hit = cache.get(tenantId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.status;
  // Lazy require to avoid a circular import at module load.
  const prisma = require('../config/database');
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
  const status = tenant?.status || 'active';
  cache.set(tenantId, { status, at: Date.now() });
  return status;
};

const isTenantSuspended = async (tenantId) => (await getTenantStatus(tenantId)) === 'suspended';

const bustTenantStatusCache = (tenantId) => {
  if (tenantId) cache.delete(tenantId);
  else cache.clear();
};

module.exports = { getTenantStatus, isTenantSuspended, bustTenantStatusCache };
