const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');

describe('web session API access', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allows a logged-in director cookie session to create a user', async () => {
    const agent = request.agent(app);
    const email = `session-test-${Date.now()}@256logisticsltd.com`;

    await agent
      .post('/login')
      .type('form')
      .send({ email: 'director@256logisticsltd.com', password: 'Demo2024!' })
      .expect(302);

    await agent
      .post('/api/v1/users')
      .send({
        email,
        password: 'ChangeMe2026!',
        role: 'operations_manager',
        firstName: 'Session',
        lastName: 'Test',
      })
      .expect(201);

    const created = await prisma.user.findUnique({ where: { email } });

    await agent
      .delete(`/api/v1/users/${created.id}`)
      .expect(200);

    const deleted = await prisma.user.findUnique({ where: { email } });
    expect(deleted).toBeNull();
  });
});
