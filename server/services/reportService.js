const db = require('../db/connection');

async function getHeadcountReport(userBranchScope = 'All') {
  let sql = `
    SELECT b.name as branch_name, b.code as branch_code,
           e.department, e.designation, e.status, e.employment_type,
           COUNT(*) as employee_count,
           ROUND(AVG(e.basic_salary), 2) as avg_basic_salary,
           ROUND(AVG(e.rating), 2) as avg_rating
    FROM employees e
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }
  sql += ' GROUP BY b.id, e.department, e.designation, e.status ORDER BY b.name ASC, e.department ASC';

  const result = await db.query(sql, params);
  return result.rows;
}

async function getPayrollSummaryReport(period = null, userBranchScope = 'All') {
  let sql = `
    SELECT pb.id as batch_id, pb.period, pb.status, pb.employee_count,
           pb.total_gross, pb.total_deductions, pb.total_net,
           COALESCE(b.name, 'Nationwide (All Branches)') as branch_name,
           pb.finalized_at, pb.created_at
    FROM payroll_batches pb
    LEFT JOIN branches b ON pb.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];
  if (period) {
    sql += ' AND pb.period = ?';
    params.push(period);
  }
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }
  sql += ' ORDER BY pb.created_at DESC';

  const result = await db.query(sql, params);
  return result.rows;
}

async function getAttendanceSummaryReport(startDate, endDate, userBranchScope = 'All') {
  let sql = `
    SELECT b.name as branch_name,
           ar.date,
           COUNT(*) as total_logged,
           SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) as present_count,
           SUM(CASE WHEN ar.status = 'Late' THEN 1 ELSE 0 END) as late_count,
           SUM(CASE WHEN ar.status = 'Half-day' THEN 1 ELSE 0 END) as half_day_count,
           SUM(CASE WHEN ar.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
           SUM(CASE WHEN ar.status = 'On leave' THEN 1 ELSE 0 END) as on_leave_count,
           ROUND(AVG(ar.total_hours), 1) as avg_working_hours
    FROM attendance_records ar
    JOIN employees e ON ar.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];
  if (startDate) {
    sql += ' AND ar.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND ar.date <= ?';
    params.push(endDate);
  }
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }
  sql += ' GROUP BY b.id, ar.date ORDER BY ar.date DESC, b.name ASC';

  const result = await db.query(sql, params);
  return result.rows;
}

async function getPerformanceSummaryReport(userBranchScope = 'All') {
  let sql = `
    SELECT e.id as employee_id, e.name as employee_name, e.designation, e.department,
           b.name as branch_name,
           e.rating as current_rating,
           COALESCE(a.overall_score, e.rating) as appraisal_score,
           COALESCE(a.promotion_recommended, 'Standard Growth Path') as promotion_status,
           COALESCE(rc.name, 'Annual Review') as cycle_name
    FROM employees e
    JOIN branches b ON e.branch_id = b.id
    LEFT JOIN appraisals a ON a.employee_id = e.id
    LEFT JOIN review_cycles rc ON a.cycle_id = rc.id
    WHERE e.status = 'Active'
  `;
  const params = [];
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }
  sql += ' ORDER BY appraisal_score DESC, e.name ASC';

  const result = await db.query(sql, params);
  return result.rows;
}

module.exports = {
  getHeadcountReport,
  getPayrollSummaryReport,
  getAttendanceSummaryReport,
  getPerformanceSummaryReport
};
