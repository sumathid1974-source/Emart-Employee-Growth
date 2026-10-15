const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { startTestServer } = require('../testHelper');

describe('API Tests — RBAC Permissions & Authorization Enforcement', () => {
  let serverInfo;
  let adminToken;
  let employeeToken;

  before(async () => {
    serverInfo = await startTestServer();

    // 1. Login as Super Admin
    const adminRes = await fetch(`${serverInfo.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@employeehub.demo', password: 'Admin@12345' })
    });
    const adminBody = await adminRes.json();
    adminToken = adminBody.token;

    // 2. Login as regular Employee (Priya Sharma)
    const empRes = await fetch(`${serverInfo.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@employeehub.demo', password: 'Admin@12345' })
    });
    const empBody = await empRes.json();
    employeeToken = empBody.token;
  });

  after(async () => {
    if (serverInfo) await serverInfo.close();
  });

  it('Super Admin is allowed to list users via GET /api/users', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.users));
    assert.ok(body.users.length > 0);
  });

  it('Standard Employee is strictly forbidden (HTTP 403) from accessing GET /api/users', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/users`, {
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message || body.error, /Access Denied|forbidden/i);
  });

  it('Super Admin can retrieve system audit logs via GET /api/audit-logs', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/audit-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.logs));
  });

  it('Standard Employee cannot view system audit logs (HTTP 403)', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/audit-logs`, {
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    assert.strictEqual(res.status, 403);
  });
});
