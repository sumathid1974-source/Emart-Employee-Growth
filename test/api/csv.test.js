const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { startTestServer } = require('../testHelper');
const { sanitizeCsvCell } = require('../../server/services/csvService');

describe('API Tests — CSV Import Validation & Formula Injection Sanitization', () => {
  let serverInfo;
  let adminToken;

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

  it('Formula injection defense: sanitizeCsvCell prefixes dangerous formula triggers (=, +, -, @) with single quote', () => {
    assert.strictEqual(sanitizeCsvCell('=1+1'), "'=1+1");
    assert.strictEqual(sanitizeCsvCell('+12345'), "'+12345");
    assert.strictEqual(sanitizeCsvCell('-SUM(A1:A10)'), "'-SUM(A1:A10)");
    assert.strictEqual(sanitizeCsvCell('@IMPORTXML(...)'), "'@IMPORTXML(...)");
    assert.strictEqual(sanitizeCsvCell('Normal Text'), 'Normal Text');
    assert.strictEqual(sanitizeCsvCell(50000), '50000');
  });

  it('POST /api/csv/import/employees (dry-run=true) validates records and reports valid count without modifying database', async () => {
    const validCsv = `ID,Name,Email,Phone,Designation,Department,Branch,Basic Salary
EMP-VAL-01,Test User One,val1@employeehub.demo,+91 98765 00001,Analyst,Operations,Bengaluru HQ,45000
EMP-VAL-02,Test User Two,val2@employeehub.demo,+91 98765 00002,Developer,Engineering,Mumbai West,60000`;

    const res = await fetch(`${serverInfo.baseUrl}/api/csv/import/employees?commit=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/csv',
        'Authorization': `Bearer ${adminToken}`
      },
      body: validCsv
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.totalRows, 2);
    assert.strictEqual(body.validCount, 2);
    assert.strictEqual(body.errorCount, 0);
  });

  it('POST /api/csv/import/employees flags invalid branches or missing fields with precise row numbers', async () => {
    const invalidCsv = `ID,Name,Email,Phone,Designation,Department,Branch,Basic Salary
EMP-ERR-01,,missing.name@demo.com,+91 98765 00003,Analyst,Operations,Bengaluru HQ,45000
EMP-ERR-02,Invalid Branch User,inv.branch@demo.com,+91 98765 00004,Dev,Eng,Unknown Martian Branch,50000`;

    const res = await fetch(`${serverInfo.baseUrl}/api/csv/import/employees?commit=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/csv',
        'Authorization': `Bearer ${adminToken}`
      },
      body: invalidCsv
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.totalRows, 2);
    assert.strictEqual(body.errorCount, 2);
    assert.ok(body.errors.some(e => e.row === 1 && e.error.includes('Name is required')));
    assert.ok(body.errors.some(e => e.row === 2 && (e.error.includes('not found') || e.error.includes('Unknown branch'))));
  });

  it('GET /api/csv/export/employees produces formula-sanitized CSV file with correct headers', async () => {
    const res = await fetch(`${serverInfo.baseUrl}/api/csv/export/employees`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'text/csv; charset=utf-8');
    const text = await res.text();
    assert.ok(text.includes('Employee ID') && text.includes('Full Name'));
    assert.ok(text.includes('EMP-1001'));
  });
});
