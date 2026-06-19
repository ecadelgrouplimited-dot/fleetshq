const { AsyncLocalStorage } = require('async_hooks');

const DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000001';
const tenantStore = new AsyncLocalStorage();

const getTenantId = () => tenantStore.getStore()?.tenantId || null;

const runWithTenant = (tenantId, callback) => (
  tenantStore.run({ tenantId: tenantId || DEFAULT_TENANT_ID }, async () => callback())
);

module.exports = {
  DEFAULT_TENANT_ID,
  getTenantId,
  runWithTenant,
};
