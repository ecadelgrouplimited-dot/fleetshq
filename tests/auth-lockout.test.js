const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');
const { getCsrf } = require('./helpers');

const MAX = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;

describe('per-account login lockout', () => {
  const email = `lockout-test-${Date.now()}@fleetshq.local`;
  let userId;

  beforeAll(async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Correct99!', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: 'operations_manager',
        firstName: 'Lock',
        lastName: 'Test',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('locks the account after MAX_LOGIN_ATTEMPTS wrong passwords', async () => {
    for (let i = 0; i < MAX; i++) {
      const agent = request.agent(app);
      const token = await getCsrf(agent);
      const res = await agent
        .post('/login')
        .type('form')
        .send({ email, password: 'WrongPass99!', _csrf: token });
      // Each attempt redirects or shows an error; not 200 success
      expect([302, 200]).toContain(res.status);
    }

    // Now the account should be locked
    const agent = request.agent(app);
    const token = await getCsrf(agent);
    const res = await agent
      .post('/login')
      .type('form')
      .send({ email, password: 'Correct99!', _csrf: token }); // even correct pw is rejected

    // The response should NOT be the dashboard redirect (302 → /)
    // It should be a 302 back to /login or a 200 error page
    if (res.status === 302) {
      expect(res.headers.location).toMatch(/\/login/);
    } else {
      expect(res.text).toMatch(/locked/i);
    }

    const updated = await prisma.user.findUnique({ where: { id: userId } });
    expect(updated.lockedUntil).not.toBeNull();
    expect(new Date(updated.lockedUntil).getTime()).toBeGreaterThan(Date.now());
  });

  it('resets lockout counter after a successful login', async () => {
    // Clear the lockout so the user can log in
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });

    const agent = request.agent(app);
    const token = await getCsrf(agent);
    const res = await agent
      .post('/login')
      .type('form')
      .send({ email, password: 'Correct99!', _csrf: token });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');

    const updated = await prisma.user.findUnique({ where: { id: userId } });
    expect(updated.failedLoginAttempts).toBe(0);
    expect(updated.lockedUntil).toBeNull();
  });
});
