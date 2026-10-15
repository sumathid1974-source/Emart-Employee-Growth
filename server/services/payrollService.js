const db = require('../db/connection');
const auditService = require('./auditService');

// Fixed-precision helper for financial values (rounds to 2 decimal places reliably)
function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Standard Indian Statutory Compensation Calculation
 * Basic: Base salary
 * HRA: 40% of Basic
 * Conveyance: Flat ₹1,600
 * Medical: Flat ₹1,250
 * Special Allowance: 15% of Basic
 * PF (Employee): 12% of Basic (capped at ₹1,800 standard or 12%)
 * Professional Tax: Flat ₹200
 * TDS (Est. Income Tax): Calculated tier or 5% of taxable gross
 */
function calculateCompensationBreakdown(basicSalary) {
  const basic = round2(basicSalary);
  const hra = round2(basic * 0.40);
  const conveyance = 1600.00;
  const medical = 1250.00;
  const specialAllowance = round2(basic * 0.15);

  const grossPay = round2(basic + hra + conveyance + medical + specialAllowance);

  // Deductions
  const pf = round2(Math.min(basic * 0.12, 1800));
  const pt = 200.00;
  // Estimated monthly tax deduction
  let tds = 0;
  if (grossPay > 50000) {
    tds = round2((grossPay - 50000) * 0.10);
  }

  const totalDeductions = round2(pf + pt + tds);
  const netPay = round2(grossPay - totalDeductions);

  return {
    basicSalary: basic,
    earnings: [
      { name: 'Basic Salary', amount: basic, type: 'Earning' },
      { name: 'House Rent Allowance (HRA)', amount: hra, type: 'Earning' },
      { name: 'Conveyance Allowance', amount: conveyance, type: 'Earning' },
      { name: 'Medical Allowance', amount: medical, type: 'Earning' },
      { name: 'Special Allowance', amount: specialAllowance, type: 'Earning' }
    ],
    deductions: [
      { name: 'Provident Fund (EPF)', amount: pf, type: 'Deduction' },
      { name: 'Professional Tax (PT)', amount: pt, type: 'Deduction' },
      { name: 'Tax Deducted at Source (TDS)', amount: tds, type: 'Deduction' }
    ],
    grossPay,
    totalDeductions,
    netPay
  };
}

async function getDashboardStats(userBranchScope = 'All') {
  let batchQuery = 'SELECT * FROM payroll_batches WHERE 1=1';
  const params = [];

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    batchQuery += ' AND branch_id IN (SELECT id FROM branches WHERE name = ? OR code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  batchQuery += ' ORDER BY created_at DESC LIMIT 5';
  const recentBatches = await db.query(batchQuery, params);

  // Totals across all batches
  const totalStats = await db.get(`
    SELECT
      COUNT(*) as total_batches,
      COALESCE(SUM(total_gross), 0) as total_gross_disbursed,
      COALESCE(SUM(total_net), 0) as total_net_disbursed,
      COALESCE(SUM(employee_count), 0) as total_payslips_issued
    FROM payroll_batches
    WHERE status = 'Finalized' OR status = 'Paid'
  `);

  // Active employees for upcoming run
  let empCountQuery = 'SELECT COUNT(*) as count FROM employees WHERE status = "Active"';
  const empParams = [];
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    empCountQuery += ' AND branch_id IN (SELECT id FROM branches WHERE name = ? OR code = ?)';
    empParams.push(userBranchScope, userBranchScope);
  }
  const empCount = await db.get(empCountQuery, empParams);

  return {
    totalBatches: totalStats ? totalStats.total_batches : 0,
    totalGrossDisbursed: totalStats ? round2(totalStats.total_gross_disbursed) : 0,
    totalNetDisbursed: totalStats ? round2(totalStats.total_net_disbursed) : 0,
    totalPayslipsIssued: totalStats ? totalStats.total_payslips_issued : 0,
    activeHeadcount: empCount ? empCount.count : 0,
    recentBatches: recentBatches.rows
  };
}

async function listBatches(userBranchScope = 'All') {
  let sql = `
    SELECT pb.*, b.name as branch_name, b.code as branch_code
    FROM payroll_batches pb
    LEFT JOIN branches b ON pb.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  sql += ' ORDER BY pb.created_at DESC';
  const result = await db.query(sql, params);
  return result.rows;
}

async function getBatchDetails(batchId) {
  const batch = await db.get(`
    SELECT pb.*, b.name as branch_name, b.code as branch_code
    FROM payroll_batches pb
    LEFT JOIN branches b ON pb.branch_id = b.id
    WHERE pb.id = ?
  `, [batchId]);

  if (!batch) throw { statusCode: 404, userMessage: 'Payroll batch not found.' };

  const records = await db.query(`
    SELECT pr.*, e.name as employee_name, e.designation, e.department, b.name as branch_name
    FROM payroll_records pr
    JOIN employees e ON pr.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE pr.batch_id = ?
    ORDER BY e.name ASC
  `, [batchId]);

  return {
    ...batch,
    records: records.rows.map(r => ({
      ...r,
      breakdown: r.breakdown_json ? JSON.parse(r.breakdown_json) : {}
    }))
  };
}

async function generateBatch(period, branchId = null, actingUser) {
  if (!period) throw { statusCode: 400, userMessage: 'Payroll period (e.g. "Nov 2026") is required.' };

  // Check duplicate batch for same period & branch
  let dupQuery = 'SELECT id, status FROM payroll_batches WHERE period = ?';
  const dupParams = [period];
  if (branchId) {
    dupQuery += ' AND branch_id = ?';
    dupParams.push(branchId);
  } else {
    dupQuery += ' AND branch_id IS NULL';
  }

  const existing = await db.get(dupQuery, dupParams);
  if (existing) {
    throw {
      statusCode: 400,
      userMessage: `A payroll batch for period "${period}" ${branchId ? 'at this branch' : '(All Branches)'} already exists (ID: ${existing.id}, Status: ${existing.status}).`
    };
  }

  // Fetch target active employees
  let empQuery = 'SELECT * FROM employees WHERE status = "Active"';
  const empParams = [];
  if (branchId) {
    empQuery += ' AND branch_id = ?';
    empParams.push(branchId);
  }
  empQuery += ' ORDER BY name ASC';

  const employees = await db.query(empQuery, empParams);
  if (employees.rows.length === 0) {
    throw { statusCode: 400, userMessage: 'No active employees found to generate payroll for.' };
  }

  const batchId = `PAY-${period.replace(/\s+/g, '-').toUpperCase()}-${branchId ? branchId : 'NAT'}`;
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  const recordsToInsert = [];

  for (const emp of employees.rows) {
    const comp = calculateCompensationBreakdown(emp.basic_salary);
    totalGross += comp.grossPay;
    totalDeductions += comp.totalDeductions;
    totalNet += comp.netPay;

    recordsToInsert.push({
      id: `pr_${batchId}_${emp.id}`,
      batchId,
      employeeId: emp.id,
      period,
      basicSalary: comp.basicSalary,
      grossPay: comp.grossPay,
      totalDeductions: comp.totalDeductions,
      netPay: comp.netPay,
      breakdownJson: JSON.stringify(comp)
    });
  }

  totalGross = round2(totalGross);
  totalDeductions = round2(totalDeductions);
  totalNet = round2(totalNet);

  // Write batch and records inside transaction
  await db.transaction(async (tx) => {
    await tx.run(`
      INSERT INTO payroll_batches (
        id, period, branch_id, status, total_gross, total_deductions, total_net,
        employee_count, created_by
      ) VALUES (?, ?, ?, 'Draft', ?, ?, ?, ?, ?)
    `, [
      batchId, period, branchId || null, totalGross, totalDeductions, totalNet,
      employees.rows.length, actingUser.full_name
    ]);

    for (const rec of recordsToInsert) {
      await tx.run(`
        INSERT INTO payroll_records (
          id, batch_id, employee_id, period, basic_salary, gross_pay,
          total_deductions, net_pay, status, breakdown_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Processed', ?)
      `, [
        rec.id, rec.batchId, rec.employeeId, rec.period, rec.basicSalary,
        rec.grossPay, rec.totalDeductions, rec.netPay, rec.breakdownJson
      ]);
    }
  });

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'PAYROLL_BATCH_GENERATED',
    targetType: 'PAYROLL_BATCH',
    targetId: batchId,
    details: { period, employeeCount: employees.rows.length, totalNet }
  });

  return getBatchDetails(batchId);
}

async function updateBatchStatus(batchId, newStatus, actingUser) {
  const batch = await db.get('SELECT * FROM payroll_batches WHERE id = ?', [batchId]);
  if (!batch) throw { statusCode: 404, userMessage: 'Payroll batch not found.' };

  const validTransitions = {
    Draft: ['Reviewed'],
    Reviewed: ['Draft', 'Finalized'],
    Finalized: ['Paid'],
    Paid: []
  };

  const allowed = validTransitions[batch.status] || [];
  if (!allowed.includes(newStatus)) {
    throw {
      statusCode: 400,
      userMessage: `Invalid Status Transition: Cannot transition batch from '${batch.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'None (Locked)'}.`
    };
  }

  let finalizedAt = batch.finalized_at;
  let paidAt = batch.paid_at;

  if (newStatus === 'Finalized') finalizedAt = new Date().toISOString();
  if (newStatus === 'Paid') paidAt = new Date().toISOString();

  await db.run(`
    UPDATE payroll_batches
    SET status = ?, finalized_at = ?, paid_at = ?
    WHERE id = ?
  `, [newStatus, finalizedAt, paidAt, batchId]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: `PAYROLL_STATUS_${newStatus.toUpperCase()}`,
    targetType: 'PAYROLL_BATCH',
    targetId: batchId,
    details: { fromStatus: batch.status, toStatus: newStatus }
  });

  return getBatchDetails(batchId);
}

async function getPayslip(recordId, actingUser) {
  const record = await db.get(`
    SELECT pr.*, e.name as employee_name, e.designation, e.department, e.joining_date,
           b.name as branch_name, b.code as branch_code, b.address as branch_address
    FROM payroll_records pr
    JOIN employees e ON pr.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE pr.id = ?
  `, [recordId]);

  if (!record) throw { statusCode: 404, userMessage: 'Payslip record not found.' };

  // Authorization check: Employees can only view their own payslips
  if (actingUser.role_name === 'Employee' && actingUser.employee_id !== record.employee_id) {
    throw { statusCode: 403, userMessage: 'Access Denied: You can only view your own payslips.' };
  }

  return {
    ...record,
    breakdown: record.breakdown_json ? JSON.parse(record.breakdown_json) : {}
  };
}

module.exports = {
  calculateCompensationBreakdown,
  getDashboardStats,
  listBatches,
  getBatchDetails,
  generateBatch,
  updateBatchStatus,
  getPayslip
};
