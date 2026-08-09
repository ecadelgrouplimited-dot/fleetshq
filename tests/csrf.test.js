const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');
const { getCsrf } = require('./helpers');

describe('CSRF protection', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('blocks an authenticated mutation without a token and allows it with one', async () => {
    const agent = request.agent(app);
    const token = await getCsrf(agent);
    await agent
      .post('/login')
      .type('form')
      .send({ email: 'director@fleetshq.local', password: 'Demo2024!', _csrf: token })
      .expect(302);

    // Same cookie session, but no CSRF header -> rejected
    await agent
      .post('/api/v1/import/analyze')
      .send({ entity: 'vehicles', headers: ['Reg'] })
      .expect(403);

    // With the matching token -> allowed
    await agent
      .post('/api/v1/import/analyze')
      .set('X-CSRF-Token', token)
      .send({ entity: 'vehicles', headers: ['Reg'] })
      .expect(200);
  });
});
