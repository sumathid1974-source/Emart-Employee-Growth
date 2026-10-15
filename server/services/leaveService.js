const db = require('../db/connection');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

// Calculates inclusive working dates excluding weekends (Saturday, Sunday) and official holidays
async function getWorkingDates(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const holidays = await db.query('SELECT date FROM holidays');
  const holidaySet = new Set(holidays.rows.map(h => h.date));

  const workingDates = [];
  const cur = new Date(start);

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 = Sun, 6 = Sat
    const isoDate = cur.toISOString().split('T')[0];

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(isoDate)) {
      workingDates.push(isoDate);
    }
    cur.setDate(cur.getDate() + 1);
  }

  return workingDates;
}

async function getDashboardStats(userBranchScope = 'All') {
  let sql = `
    SELECT
      COUNT(*) as total_requests,
      SUM(CASE WHEN lr.status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN lr.status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
      SUM(CASE WHEN lr.status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  const row = await db.get(sql, params);

  // Leave types distribution
  const typesResult = await db.query('SELECT code, name, annual_quota, paid FROM leave_types ORDER BY code ASC');

  return {
    totalRequests: row ? (row.total_requests || 0) : 0,
    pendingApprovals: row ? (row.pending_count || 0) : 0,
    approvedCount: row ? (row.approved_count || 0) : 0,
    rejectedCount: row ? (row.rejected_count || 0) : 0,
    leaveTypes: typesResult.rows
  };
}

async function listRequests({
  status = '',
  employeeId = '',
  branchId = '',
  limit = 50,
  offset = 0,
  userBranchScope = 'All'
} = {}) {
  let sql = `
    SELECT lr.*, e.name as employee_name, e.designation, e.department,
           b.name as branch_name, b.code as branch_code, lt.name as leave_type_name
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    JOIN leave_types lt ON lr.leave_type_code = lt.code
    WHERE 1=1
  `;
  const params = [];

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  if (status) {
    sql += ' AND lr.status = ?';
    params.push(status);
  }

  if (employeeId) {
    sql += ' AND lr.employee_id = ?';
    params.push(employeeId);
  }

  if (branchId) {
    sql += ' AND (e.branch_id = ? OR b.name = ?)';
    params.push(branchId, branchId);
  }

  sql += ' ORDER BY lr.applied_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await db.query(sql, params);

  // Count total
  const countParams = params.slice(0, params.length - 2);
  let countSql = `
    SELECT COUNT(*) as total
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') countSql += ' AND (b.name = ? OR b.code = ?)';
  if (status) countSql += ' AND lr.status = ?';
  if (employeeId) countSql += ' AND lr.employee_id = ?';
  if (branchId) countSql += ' AND (e.branch_id = ? OR b.name = ?)';

  const countRow = await db.get(countSql, countParams);

  return {
    requests: result.rows,
    total: countRow ? countRow.total : 0
  };
}

async function getEmployeeBalances(employeeId) {
  const result = await db.query(`
    SELECT lb.*, lt.name as leave_name, lt.paid
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_code = lt.code
    WHERE lb.employee_id = ?
    ORDER BY lt.code ASC
  `, [employeeId]);
  return result.rows;
}

async function applyLeave(data, actingUser) {
  const { employeeId, leaveTypeCode, startDate, endDate, reason = '' } = data;

  if (!employeeId || !leaveTypeCode || !startDate || !endDate) {
    throw { statusCode: 400, userMessage: 'Employee, Leave Type, Start Date, and End Date are required.' };
  }

  if (new Date(endDate) < new Date(startDate)) {
    throw { statusCode: 400, userMessage: 'End Date cannot precede Start Date.' };
  }

  // Calculate working days
  const workingDates = await getWorkingDates(startDate, endDate);
  if (workingDates.length === 0) {
    throw { statusCode: 400, userMessage: 'The selected date range falls entirely on weekends or company holidays.' };
  }
  const totalDays = workingDates.length;

  // Check overlap with existing active requests
  const overlap = await db.get(`
    SELECT id, start_date, end_date FROM leave_requests
    WHERE employee_id = ? AND status IN ('Pending', 'Approved')
      AND NOT (end_date < ? OR start_date > ?)
  `, [employeeId, startDate, endDate]);

  if (overlap) {
    throw {
      statusCode: 400,
      userMessage: `Leave Conflict: A leave request already exists for this period (${overlap.start_date} to ${overlap.end_date}).`
    };
  }

  // Check balance availability
  const balance = await db.get(`
    SELECT * FROM leave_balances WHERE employee_id = ? AND leave_type_code = ?
  `, [employeeId, leaveTypeCode]);

  if (!balance) {
    throw { statusCode: 400, userMessage: `No leave balance record found for leave type ${leaveTypeCode}.` };
  }

  if (leaveTypeCode !== 'LWP' && balance.remaining < totalDays) {
    throw {
      statusCode: 400,
      userMessage: `Insufficient Leave Balance: You requested ${totalDays} day(s), but only have ${balance.remaining} remaining in ${leaveTypeCode}.`
    };
  }

  const requestId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // Transaction: insert request and increment pending count
  await db.transaction(async (tx) => {
    await tx.run(`
      INSERT INTO leave_requests (
        id, employee_id, leave_type_code, start_date, end_date, total_days, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [requestId, employeeId, leaveTypeCode, startDate, endDate, totalDays, reason]);

    await tx.run(`
      UPDATE leave_balances
      SET pending = pending + ?
      WHERE employee_id = ? AND leave_type_code = ?
    `, [totalDays, employeeId, leaveTypeCode]);
  });

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'LEAVE_REQUESTED',
    targetType: 'LEAVE_REQUEST',
    targetId: requestId,
    details: { employeeId, leaveTypeCode, totalDays, startDate, endDate }
  });

  return db.get('SELECT * FROM leave_requests WHERE id = ?', [requestId]);
}

async function approveOrRejectLeave(requestId, status, reviewerNotes = '', actingUser) {
  if (!['Approved', 'Rejected'].includes(status)) {
    throw { statusCode: 400, userMessage: 'Invalid status. Must be "Approved" or "Rejected".' };
  }

  const request = await db.get('SELECT * FROM leave_requests WHERE id = ?', [requestId]);
  if (!request) throw { statusCode: 404, userMessage: 'Leave request not found.' };

  if (request.status !== 'Pending') {
    throw { statusCode: 400, userMessage: `Leave request has already been ${request.status.toLowerCase()}.` };
  }

  const workingDates = await getWorkingDates(request.start_date, request.end_date);

  // Execute inside transaction:
  // 1. Update leave request status
  // 2. Adjust leave_balances
  // 3. If Approved, synchronize to attendance_records (mark working dates as 'On leave')
  await db.transaction(async (tx) => {
    await tx.run(`
      UPDATE leave_requests
      SET status = ?, reviewer_id = ?, reviewer_notes = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, actingUser.id, reviewerNotes, requestId]);

    if (status === 'Approved') {
      await tx.run(`
        UPDATE leave_balances
        SET pending = pending - ?, used = used + ?, remaining = remaining - ?
        WHERE employee_id = ? AND leave_type_code = ?
      `, [request.total_days, request.total_days, request.total_days, request.employee_id, request.leave_type_code]);

      // Synchronize attendance records
      for (const d of workingDates) {
        const attnId = `attn_${request.employee_id}_${d}`;
        await tx.run(`
          INSERT INTO attendance_records (id, employee_id, date, status, notes)
          VALUES (?, ?, ?, 'On leave', ?)
          ON CONFLICT(employee_id, date) DO UPDATE SET
            status = 'On leave',
            notes = excluded.notes,
            updated_at = CURRENT_TIMESTAMP
        `, [attnId, request.employee_id, d, `Approved Leave: ${request.leave_type_code}`]);
      }
    } else {
      // Rejected: simply release pending
      await tx.run(`
        UPDATE leave_balances
        SET pending = pending - ?
        WHERE employee_id = ? AND leave_type_code = ?
      `, [request.total_days, request.employee_id, request.leave_type_code]);
    }
  });

  // Notify employee
  await notificationService.createNotification({
    title: `Leave Request ${status}`,
    message: `Your ${request.leave_type_code} request for ${request.start_date} to ${request.end_date} has been ${status.toLowerCase()} by ${actingUser.full_name}.`,
    category: 'Leave',
    recipientId: request.employee_id
  });

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: `LEAVE_${status.toUpperCase()}`,
    targetType: 'LEAVE_REQUEST',
    targetId: requestId,
    details: { employeeId: request.employee_id, status, reviewerNotes }
  });

  return db.get('SELECT * FROM leave_requests WHERE id = ?', [requestId]);
}

module.exports = {
  getDashboardStats,
  listRequests,
  getEmployeeBalances,
  applyLeave,
  approveOrRejectLeave
};
