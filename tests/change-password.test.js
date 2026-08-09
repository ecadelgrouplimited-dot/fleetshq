const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');
const { getCsrf, loginAgent } = require('./helpers');

describe('self-service password management', () => {
  const email = `pw-test-${Date.now()}@fleetshq.local`;
  let userId;

  beforeAll(async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('InitPw99!', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: 'operations_manager',
        firstName: 'Pw',
        lastName: 'Test',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('rejects wrong current password with 401', async () => {
      const agent = await loginAgent(app, email, 'InitPw99!');
      const res = await agent
        .post('/api/v1/auth/change-password')
        .send({ currentPassword: 'WrongPw99!', newPassword: 'NewPw2026!' });
      expect(res.status).toBe(401);
    });

    it('rejects a weak new password with 400', async () => {
      const agent = await loginAgent(app, email, 'InitPw99!');
      const res = await agent
        .post('/api/v1/auth/change-password')
        .send({ currentPassword: 'InitPw99!', newPassword: 'short' });
      expect(res.status).toBe(400);
    });

    it('rejects same-as-current new password with 400', async () => {
      const agent = await loginAgent(app, email, 'InitPw99!');
      const res = await agent
        .post('/api/v1/auth/change-password')
        .send({ currentPassword: 'InitPw99!', newPassword: 'InitPw99!' });
      expect(res.status).toBe(400);
    });

    it('accepts a valid password change', async () => {
      const agent = await loginAgent(app, email, 'InitPw99!');
      const res = await agent
        .post('/api/v1/auth/change-password')
        .send({ currentPassword: 'InitPw99!', newPassword: 'Changed2026!' });
      expect(res.status).toBe(200);

      // Verify new password works
      const agent2 = await loginAgent(app, email, 'Changed2026!');
      const home = await agent2.get('/');
      expect(home.status).toBe(200);
    });
  });

  describe('GET /forgot-password', () => {
    it('renders the forgot-password page', async () => {
      const res = await request(app).get('/forgot-password');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Reset your password');
    });
  });

  describe('POST /forgot-password', () => {
    it('returns sent=true for a known email (no token leak)', async () => {
      const agent = request.agent(app);
      const token = await getCsrf(agent);
      const res = await agent
        .post('/forgot-password')
        .type('form')
        .send({ email, _csrf: token });
      // Redirects to ?sent=1 or re-renders with sent indicator
      const location = res.headers.location || '';
      expect(
        res.status === 302 ? location.includes('sent') : res.text.includes('Check your email')
      ).toBe(true);

      // A reset token should have been written to the DB
      const updated = await prisma.user.findUnique({ where: { id: userId } });
      expect(updated.resetTokenHash).toBeTruthy();
      expect(updated.resetTokenExpiry).not.toBeNull();
    });

    it('gives same response for an unknown email (no user enumeration)', async () => {
      const agent = request.agent(app);
      const token = await getCsrf(agent);
      const res = await agent
        .post('/forgot-password')
        .type('form')
        .send({ email: 'nobody@fleetshq.local', _csrf: token });
      const location = res.headers.location || '';
      expect(
        res.status === 302 ? location.includes('sent') : res.text.includes('Check your email')
      ).toBe(true);
    });
  });

  describe('GET /reset-password', () => {
    it('shows an error for an invalid or expired token', async () => {
      const res = await request(app).get('/reset-password?token=invalidtoken');
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/invalid|expired/i);
    });
  });
});
