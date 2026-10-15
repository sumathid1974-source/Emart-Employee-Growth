const { describe, it } = require('node:test');
const assert = require('node:assert');

// Test fixed-precision rounding and statutory calculations
function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function calculateSalaryBreakdown(basicSalary, customHraPct = 40, customAllowancePct = 10, customPfPct = 12, ptAmount = 200) {
  const basic = round2(basicSalary);
  const hra = round2(basic * (customHraPct / 100));
  const allowance = round2(basic * (customAllowancePct / 100));
  const grossPay = round2(basic + hra + allowance);

  const pfDeduction = round2(basic * (customPfPct / 100));
  const ptDeduction = round2(ptAmount);
  const totalDeductions = round2(pfDeduction + ptDeduction);
  const netPay = round2(grossPay - totalDeductions);

  return {
    basic,
    hra,
    allowance,
    grossPay,
    pfDeduction,
    ptDeduction,
    totalDeductions,
    netPay
  };
}

describe('Payroll Unit Tests — Fixed-Precision Financial Calculations', () => {
  it('should round floating point values to exactly 2 decimal places without binary float inaccuracies', () => {
    assert.strictEqual(round2(0.1 + 0.2), 0.3);
    assert.strictEqual(round2(100.555), 100.56);
    assert.strictEqual(round2(99.994), 99.99);
  });

  it('should compute gross salary, statutory deductions, and net pay correctly for standard ₹50,000 basic', () => {
    const res = calculateSalaryBreakdown(50000);
    // basic: 50,000
    // hra: 20,000 (40%)
    // allowance: 5,000 (10%)
    // gross: 75,000
    // pf: 6,000 (12%)
    // pt: 200
    // total deductions: 6,200
    // net: 68,800
    assert.strictEqual(res.basic, 50000);
    assert.strictEqual(res.hra, 20000);
    assert.strictEqual(res.allowance, 5000);
    assert.strictEqual(res.grossPay, 75000);
    assert.strictEqual(res.pfDeduction, 6000);
    assert.strictEqual(res.ptDeduction, 200);
    assert.strictEqual(res.totalDeductions, 6200);
    assert.strictEqual(res.netPay, 68800);
  });

  it('should handle fractional basic salaries with precise cent/paisa rounding', () => {
    const res = calculateSalaryBreakdown(55555.55);
    assert.strictEqual(res.basic, 55555.55);
    assert.strictEqual(res.hra, 22222.22);
    assert.strictEqual(res.allowance, 5555.56);
    assert.strictEqual(res.grossPay, 83333.33);
    assert.strictEqual(res.pfDeduction, 6666.67);
    assert.strictEqual(res.ptDeduction, 200);
    assert.strictEqual(res.totalDeductions, 6866.67);
    assert.strictEqual(res.netPay, 76466.66);
  });

  it('should maintain financial invariants: Gross Pay = Net Pay + Total Deductions', () => {
    const testSalaries = [25000, 48000, 75250.75, 120000, 250000];
    for (const sal of testSalaries) {
      const res = calculateSalaryBreakdown(sal);
      assert.strictEqual(round2(res.netPay + res.totalDeductions), res.grossPay);
    }
  });
});
