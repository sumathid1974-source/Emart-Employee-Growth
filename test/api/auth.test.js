const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { startTestServer } = require('../testHelper');

describe('API Tests — Authentication & Session Management', () => {
  let serverInfo;
  let adminToken;

  before(async () => {
    serverInfo = await startTestServer();
  });

  after(async () => {
    if (serverInfo) await serverInfo.close();
  });

  it('GET /api/health returns healthy liveness and database status', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.status === 'UP' || body.status === 'ok');
    assert.ok(body.database === 'CONNECTED' || body.database === 'connected');
  });

  it('POST /api/auth/login authenticates valid credentials and returns JWT token', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@employeehub.demo',
        password: 'Admin@12345'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.token, 'Expected JWT token in login response');
    assert.strictEqual(body.user.email, 'admin@employeehub.demo');
    assert.strictEqual(body.user.roleName, 'Super Administrator');
    adminToken = body.token;
  });

  it('POST /api/auth/login rejects invalid password with HTTP 401', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@employeehub.demo',
        password: 'WrongPassword999'
      })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /invalid email or password/i);
  });

  it('GET /api/auth/me returns authenticated user when valid token is provided', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.email, 'admin@employeehub.demo');
  });

  it('GET /api/auth/me rejects request with HTTP 401 when no token is provided', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/auth/me`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });
});
