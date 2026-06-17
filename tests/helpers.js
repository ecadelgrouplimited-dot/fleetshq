const request = require('supertest');

// Read the csrfToken cookie the server issues on any GET.
async function getCsrf(agent) {
  const res = await agent.get('/login');
  const sc = (res.headers['set-cookie'] || []).find((c) => c.startsWith('csrfToken='));
  return sc ? sc.split(';')[0].split('=')[1] : '';
}

// Logged-in agent that carries the CSRF token on every subsequent request.
async function loginAgent(app, email, password = 'Demo2024!') {
  const agent = request.agent(app);
  const token = await getCsrf(agent);
  agent.set('X-CSRF-Token', token);
  await agent.post('/login').type('form').send({ email, password, _csrf: token }).expect(302);
  return agent;
}

module.exports = { getCsrf, loginAgent };
