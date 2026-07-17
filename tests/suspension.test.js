const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');
const { getCsrf } = require('./helpers');
const { provisionTenant } = require('../src/services/provisioning.service');
const { bustTenantStatusCache } = require('../src/utils/tenantStatus');

describe('tenant suspension gate', () => {
  const stamp = Date.now();
  const adminEmail = `suspend-test-${stamp}@example-fleet.co`;
  let tenantId;
  let tempPassword;

  const freshAgent = async () => {
    const agent = request.agent(app);
    const token = await getCsrf(agent);
    agent.set('X-CSRF-Token', token);
    return { agent, token };
  };

  beforeAll(async () => {
    const result = await provisionTenant({
      tradingName: `Suspend Test Ltd ${stamp}`,
      plan: 'starter', status: 'active',
      adminEmail, adminFirst: 'Sus', adminLast: 'Pended',
    });
    tenantId = result.tenant.id;
    tempPassword = result.tempPassword;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.branch.deleteMany({ where: { tenantId } });
    await prisma.company.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    bustTenantStatusCache();
  });

  test('active tenant user can sign in', async () => {
    const { agent, token } = await freshAgent();
    const res = await agent.post('/login').type('form')
      .send({ email: adminEmail, password: tempPassword, _csrf: token }).expect(302);
    expect(res.headers.location).toBe('/');
  });

  test('an already signed-in session hits the lock screen once suspended', async () => {
    const { agent, token } = await freshAgent();
    await agent.post('/login').type('form')
      .send({ email: adminEmail, password: tempPassword, _csrf: token }).expect(302);

    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'suspended' } });
    bustTenantStatusCache(tenantId);

    const res = await agent.get('/').expect(403);
    expect(res.text).toContain('Subscription paused');
    expect(res.text).toContain('data is safe');
  });

  test('sign-in is blocked while suspended, with a clear message', async () => {
    const { agent, token } = await freshAgent();
    const res = await agent.post('/login').type('form')
      .send({ email: adminEmail, password: tempPassword, _csrf: token }).expect(200);
    expect(res.text).toContain('subscription is paused');
  });

  test('API access is blocked with TENANT_SUSPENDED', async () => {
    // Grab a cookie by reactivating, logging in, then re-suspending.
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'active' } });
    bustTenantStatusCache(tenantId);
    const { agent, token } = await freshAgent();
    await agent.post('/login').type('form')
      .send({ email: adminEmail, password: tempPassword, _csrf: token }).expect(302);

    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'suspended' } });
    bustTenantStatusCache(tenantId);

    const res = await agent.get('/api/v1/auth/me').expect(403);
    expect(res.body.error.code).toBe('TENANT_SUSPENDED');
  });

  test('reactivation restores access immediately', async () => {
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'active' } });
    bustTenantStatusCache(tenantId);
    const { agent, token } = await freshAgent();
    const res = await agent.post('/login').type('form')
      .send({ email: adminEmail, password: tempPassword, _csrf: token }).expect(302);
    expect(res.headers.location).toBe('/');
  });
});
