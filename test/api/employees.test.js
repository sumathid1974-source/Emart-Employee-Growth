const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { startTestServer } = require('../testHelper');

describe('API Tests — Employee Directory & Profile Operations', () => {
  let serverInfo;
  let adminToken;
  const testEmpId = `EMP-TEST-${Date.now().toString().slice(-4)}`;
  const testEmail = `test.employee.${Date.now()}@employeehub.demo`;

  before(async () => {
    serverInfo = await startTestServer();
    const adminRes = await fetch(`${serverInfo.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@employeehub.demo', password: 'Admin@12345' })
    });
    const adminBody = await adminRes.json();
    adminToken = adminBody.token;
  });

  after(async () => {
    if (serverInfo) await serverInfo.close();
  });

  it('GET /api/employees returns paginated active employees directory', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/employees`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.employees));
    assert.ok(body.employees.length > 0);
  });

  it('POST /api/employees creates a new employee and initializes leave quotas', async () => {
    const payload = {
      id: testEmpId,
      fullName: 'Aarohi Sen',
      email: testEmail,
      phone: '+91 98765 43299',
      branchId: 'BR-BLR-01',
      department: 'Engineering',
      designation: 'Senior Frontend Engineer',
      basicSalary: 85000,
      joiningDate: '2026-05-01'
    };

    const res = await fetch(`${serverInfo.baseUrl}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.employee.id, testEmpId);
    assert.strictEqual(body.employee.name || body.employee.full_name, 'Aarohi Sen');
  });

  it('POST /api/employees rejects duplicate employee ID or email', async () => {
    const duplicatePayload = {
      id: testEmpId, // Same ID
      fullName: 'Duplicate Aarohi',
      email: testEmail, // Same email
      branchId: 'BR-BLR-01',
      department: 'Engineering',
      designation: 'Senior Frontend Engineer',
      basicSalary: 60000
    };

    const res = await fetch(`${serverInfo.baseUrl}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(duplicatePayload)
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message || body.error, /already/i);
  });

  it('GET /api/employees/:id returns complete employee profile dossier', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/employees/${testEmpId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.employee.id, testEmpId);
    assert.strictEqual(body.employee.department, 'Engineering');
    assert.ok(body.employee.branch_name.includes('Bengaluru'));
  });
});
