const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');
const { getCsrf, loginAgent } = require('./helpers');
const { DEFAULT_TENANT_ID } = require('../src/utils/tenantContext');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

describe('self-serve registration', () => {
  const stamp = Date.now();
  const companyName = `Reg Test Haulage ${stamp}`;
  const contactEmail = `reg-test-${stamp}@example-fleet.co`;
  const adminEmail = `platform-admin-${stamp}@256logisticsltd.com`;
  let agent;
  let rid;
  let provisionedTenantId;

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        email: adminEmail,
        passwordHash: await bcrypt.hash('Demo2024!', 10),
        role: 'super_admin',
        roles: ['super_admin', 'director'],
        firstName: 'Platform',
        lastName: 'Admin',
        isActive: true,
      },
    });
    agent = request.agent(app);
    const token = await getCsrf(agent);
    agent.set('X-CSRF-Token', token);
  });

  afterAll(async () => {
    await prisma.registrationRequest.deleteMany({ where: { contactEmail } });
    if (provisionedTenantId) {
      await prisma.user.deleteMany({ where: { tenantId: provisionedTenantId } });
      await prisma.branch.deleteMany({ where: { tenantId: provisionedTenantId } });
      await prisma.company.deleteMany({ where: { tenantId: provisionedTenantId } });
      await prisma.tenant.delete({ where: { id: provisionedTenantId } });
    }
    await prisma.user.deleteMany({ where: { email: adminEmail } });
  });

  test('GET /register renders the details step', async () => {
    const res = await agent.get('/register').expect(200);
    expect(res.text).toContain('Register your company');
    expect(res.text).toContain('Fleet size');
  });

  test('rejects disposable email addresses', async () => {
    const token = await getCsrf(agent);
    const res = await agent.post('/register').type('form').send({
      _csrf: token,
      companyName, contactName: 'Sam Test', contactEmail: `x-${stamp}@mailinator.com`, fleetSize: '6-20',
    }).expect(200);
    expect(res.text).toContain('permanent work email');
  });

  test('rejects an email that already has a platform account', async () => {
    const token = await getCsrf(agent);
    const res = await agent.post('/register').type('form').send({
      _csrf: token,
      companyName, contactName: 'Sam Test', contactEmail: adminEmail, fleetSize: '6-20',
    }).expect(200);
    expect(res.text).toContain('already has a FLEETS.HQ account');
  });

  test('POST /register creates a pending request and issues a code', async () => {
    const token = await getCsrf(agent);
    const res = await agent.post('/register').type('form').send({
      _csrf: token,
      companyName, companyRegNo: '01234567',
      contactName: 'Sam Test', contactEmail, contactPhone: '07700900123',
      fleetSize: '6-20', region: 'West Midlands',
    }).expect(302);
    expect(res.headers.location).toMatch(/^\/register\/verify\?rid=/);
    rid = new URL(res.headers.location, 'http://x').searchParams.get('rid');

    const req = await prisma.registrationRequest.findUnique({ where: { id: rid }, include: { codes: true } });
    expect(req.status).toBe('pending_verification');
    expect(req.companyName).toBe(companyName);
    expect(req.codes).toHaveLength(1);
    expect(req.codes[0].codeHash).toHaveLength(64); // hashed, never plaintext
  });

  test('wrong code is rejected and counted', async () => {
    const token = await getCsrf(agent);
    const res = await agent.post('/register/verify').type('form')
      .send({ _csrf: token, rid, code: '000000' }).expect(200);
    expect(res.text).toContain('attempt');
    const code = await prisma.verificationCode.findFirst({ where: { requestId: rid } });
    expect(code.attempts).toBe(1);
  });

  test('correct code verifies the request', async () => {
    // Tests can't read the emailed code — plant a known one.
    await prisma.verificationCode.updateMany({
      where: { requestId: rid },
      data: { codeHash: sha256('123456'), attempts: 0 },
    });
    const token = await getCsrf(agent);
    const res = await agent.post('/register/verify').type('form')
      .send({ _csrf: token, rid, code: '123456' }).expect(302);
    expect(res.headers.location).toBe(`/register/plan?rid=${rid}`);
    const req = await prisma.registrationRequest.findUnique({ where: { id: rid } });
    expect(req.status).toBe('verified');
    expect(req.verifiedAt).not.toBeNull();
  });

  test('tier selection moves the request to pending_activation', async () => {
    const planPage = await agent.get(`/register/plan?rid=${rid}`).expect(200);
    expect(planPage.text).toContain('Choose your tier');
    expect(planPage.text).toContain('Growth'); // suggested for 6-20

    const token = await getCsrf(agent);
    const res = await agent.post('/register/plan').type('form')
      .send({ _csrf: token, rid, plan: 'growth' }).expect(302);
    expect(res.headers.location).toBe(`/register/done?rid=${rid}`);

    const req = await prisma.registrationRequest.findUnique({ where: { id: rid } });
    expect(req.status).toBe('pending_activation');
    expect(req.plan).toBe('growth');

    const done = await agent.get(`/register/done?rid=${rid}`).expect(200);
    expect(done.text).toContain('Registration complete');
  });

  test('platform admin sees the registration in the review queue', async () => {
    const admin = await loginAgent(app, adminEmail);
    const res = await admin.get('/platform').expect(200);
    expect(res.text).toContain('Self-serve registrations');
    expect(res.text).toContain(companyName);
    expect(res.text).toContain('Ready to activate');
  });

  test('activation provisions a working tenant with a forced-password-change admin', async () => {
    const admin = await loginAgent(app, adminEmail);
    const token = await getCsrf(admin);
    const res = await admin.post(`/platform/registrations/${rid}/activate`).type('form')
      .send({ _csrf: token }).expect(200);
    expect(res.text).toContain('Business activated');

    const req = await prisma.registrationRequest.findUnique({ where: { id: rid } });
    expect(req.status).toBe('provisioned');
    expect(req.tenantId).not.toBeNull();
    provisionedTenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    expect(tenant.name).toBe(companyName);
    expect(tenant.plan).toBe('growth');
    expect(tenant.status).toBe('active');

    const newAdmin = await prisma.user.findFirst({ where: { email: contactEmail, tenantId: tenant.id } });
    expect(newAdmin).not.toBeNull();
    expect(newAdmin.role).toBe('director');
    expect(newAdmin.mustChangePassword).toBe(true);
  });

  test('activation is not repeatable', async () => {
    const admin = await loginAgent(app, adminEmail);
    const token = await getCsrf(admin);
    const res = await admin.post(`/platform/registrations/${rid}/activate`).type('form')
      .send({ _csrf: token });
    expect(res.status).toBe(400);
  });
});
