const request = require('supertest');
const app = require('../server');

describe('health endpoint', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeTruthy();
  });
});
