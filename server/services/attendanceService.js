const db = require('../db/connection');
const auditService = require('./auditService');

function parseTimeMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function calculateHours(checkIn, checkOut, breakMinutes = 60) {
  if (!checkIn || !checkOut) return 0.0;
  const inMins = parseTimeMinutes(checkIn);
  const outMins = parseTimeMinutes(checkOut);
  if (outMins <= inMins) return 0.0;
  const netMins = Math.max(0, (outMins - inMins) - Number(breakMinutes));
  return Math.round((netMins / 60) * 10) / 10;
}

async function getDashboardStats(date = null, userBranchScope = 'All') {
  const targetDate = date || new Date().toISOString().split('T')[0];

  let sql = `
    SELECT
      COUNT(*) as total_logged,
      SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) as present_count,
      SUM(CASE WHEN ar.status = 'Late' THEN 1 ELSE 0 END) as late_count,
      SUM(CASE WHEN ar.status = 'Half-day' THEN 1 ELSE 0 END) as half_day_count,
      SUM(CASE WHEN ar.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
      SUM(CASE WHEN ar.status = 'On leave' THEN 1 ELSE 0 END) as on_leave_count
    FROM attendance_records ar
    JOIN employees e ON ar.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE ar.date = ?
  `;
  const params = [targetDate];

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  const row = await db.get(sql, params);

  // Active employees
  let activeEmpSql = 'SELECT COUNT(*) as count FROM employees e JOIN branches b ON e.branch_id = b.id WHERE e.status = "Active"';
  const activeParams = [];
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    activeEmpSql += ' AND (b.name = ? OR b.code = ?)';
    activeParams.push(userBranchScope, userBranchScope);
  }
  const activeEmpRow = await db.get(activeEmpSql, activeParams);
  const totalActive = activeEmpRow ? activeEmpRow.count : 0;

  const present = row ? (row.present_count || 0) : 0;
  const late = row ? (row.late_count || 0) : 0;
  const halfDay = row ? (row.half_day_count || 0) : 0;
  const absent = row ? (row.absent_count || 0) : 0;
  const onLeave = row ? (row.on_leave_count || 0) : 0;

  const attendanceRate = totalActive > 0 ? Math.round(((present + late + halfDay) / totalActive) * 100) : 0;

  return {
    targetDate,
    totalActive,
    present,
    late,
    halfDay,
    absent,
    onLeave,
    attendanceRate
  };
}

async function listRecords({
  date = '',
  startDate = '',
  endDate = '',
  employeeId = '',
  branchId = '',
  status = '',
  search = '',
  limit = 50,
  offset = 0,
  userBranchScope = 'All'
} = {}) {
  let sql = `
    SELECT ar.*, e.name as employee_name, e.designation, e.department,
           b.name as branch_name, b.code as branch_code
    FROM attendance_records ar
    JOIN employees e ON ar.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  if (date) {
    sql += ' AND ar.date = ?';
    params.push(date);
  } else {
    if (startDate) {
      sql += ' AND ar.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND ar.date <= ?';
      params.push(endDate);
    }
  }

  if (employeeId) {
    sql += ' AND ar.employee_id = ?';
    params.push(employeeId);
  }

  if (branchId) {
    sql += ' AND (e.branch_id = ? OR b.name = ?)';
    params.push(branchId, branchId);
  }

  if (status) {
    sql += ' AND ar.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (e.name LIKE ? OR e.id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY ar.date DESC, e.name ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await db.query(sql, params);

  // Total count
  const countParams = params.slice(0, params.length - 2);
  let countSql = `
    SELECT COUNT(*) as total
    FROM attendance_records ar
    JOIN employees e ON ar.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') countSql += ' AND (b.name = ? OR b.code = ?)';
  if (date) countSql += ' AND ar.date = ?';
  else {
    if (startDate) countSql += ' AND ar.date >= ?';
    if (endDate) countSql += ' AND ar.date <= ?';
  }
  if (employeeId) countSql += ' AND ar.employee_id = ?';
  if (branchId) countSql += ' AND (e.branch_id = ? OR b.name = ?)';
  if (status) countSql += ' AND ar.status = ?';
  if (search) countSql += ' AND (e.name LIKE ? OR e.id LIKE ?)';

  const countRow = await db.get(countSql, countParams);

  return {
    records: result.rows,
    total: countRow ? countRow.total : 0
  };
}

async function markAttendance(data, actingUser) {
  const { employeeId, date, checkIn, checkOut, breakMinutes = 60, status, notes = '' } = data;

  if (!employeeId || !date) {
    throw { statusCode: 400, userMessage: 'Employee ID and Date are required.' };
  }

  const emp = await db.get('SELECT * FROM employees WHERE id = ?', [employeeId]);
  if (!emp) throw { statusCode: 404, userMessage: 'Employee not found.' };

  const totalHours = calculateHours(checkIn, checkOut, breakMinutes);
  let finalStatus = status || 'Present';

  // Infer late status if not explicitly passed
  if (!status && checkIn) {
    const settings = await getSettings();
    const startMins = parseTimeMinutes(settings.standard_start_time || '09:00');
    const inMins = parseTimeMinutes(checkIn);
    const graceMins = settings.grace_period_minutes || 15;
    if (inMins > (startMins + graceMins)) {
      finalStatus = 'Late';
    }
  }

  const recordId = `attn_${employeeId}_${date}`;

  await db.run(`
    INSERT INTO attendance_records (id, employee_id, date, check_in, check_out, break_minutes, total_hours, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(employee_id, date) DO UPDATE SET
      check_in = excluded.check_in,
      check_out = excluded.check_out,
      break_minutes = excluded.break_minutes,
      total_hours = excluded.total_hours,
      status = excluded.status,
      notes = excluded.notes,
      updated_at = CURRENT_TIMESTAMP
  `, [recordId, employeeId, date, checkIn || null, checkOut || null, Number(breakMinutes) || 0, totalHours, finalStatus, notes]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'ATTENDANCE_MARKED',
    targetType: 'ATTENDANCE',
    targetId: recordId,
    details: { employeeId, date, status: finalStatus, totalHours }
  });

  return db.get('SELECT * FROM attendance_records WHERE id = ?', [recordId]);
}

async function bulkMarkRoster(branchId, date, records, actingUser) {
  if (!date || !Array.isArray(records)) {
    throw { statusCode: 400, userMessage: 'Date and roster records array are required.' };
  }

  let successCount = 0;

  await db.transaction(async (tx) => {
    for (const item of records) {
      if (!item.employeeId) continue;
      const recId = `attn_${item.employeeId}_${date}`;
      const hours = calculateHours(item.checkIn, item.checkOut, item.breakMinutes || 60);

      await tx.run(`
        INSERT INTO attendance_records (id, employee_id, date, check_in, check_out, break_minutes, total_hours, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(employee_id, date) DO UPDATE SET
          check_in = excluded.check_in,
          check_out = excluded.check_out,
          break_minutes = excluded.break_minutes,
          total_hours = excluded.total_hours,
          status = excluded.status,
          notes = excluded.notes,
          updated_at = CURRENT_TIMESTAMP
      `, [
        recId, item.employeeId, date, item.checkIn || null, item.checkOut || null,
        Number(item.breakMinutes) || 60, hours, item.status || 'Present', item.notes || ''
      ]);
      successCount++;
    }
  });

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'ATTENDANCE_ROSTER_BULK_MARKED',
    targetType: 'ATTENDANCE_ROSTER',
    targetId: `${branchId}_${date}`,
    details: { branchId, date, count: successCount }
  });

  return { success: true, processedCount: successCount, date };
}

async function getSettings() {
  const row = await db.get('SELECT * FROM attendance_settings WHERE id = "global_attn"');
  return row || {
    standard_start_time: '09:00',
    standard_end_time: '18:00',
    grace_period_minutes: 15,
    break_minutes: 60,
    expected_daily_hours: 8.0
  };
}

async function updateSettings(data, actingUser) {
  const { standardStartTime, standardEndTime, gracePeriodMinutes, breakMinutes, expectedDailyHours } = data;

  await db.run(`
    UPDATE attendance_settings
    SET standard_start_time = ?, standard_end_time = ?, grace_period_minutes = ?,
        break_minutes = ?, expected_daily_hours = ?
    WHERE id = 'global_attn'
  `, [standardStartTime, standardEndTime, Number(gracePeriodMinutes), Number(breakMinutes), Number(expectedDailyHours)]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'ATTENDANCE_SETTINGS_UPDATED',
    targetType: 'SETTINGS',
    targetId: 'global_attn',
    details: data
  });

  return getSettings();
}

async function listHolidays() {
  const result = await db.query('SELECT * FROM holidays ORDER BY date ASC');
  return result.rows;
}

async function addHoliday(data, actingUser) {
  const { name, date, description = '' } = data;
  if (!name || !date) throw { statusCode: 400, userMessage: 'Holiday name and date are required.' };

  const id = `hol_${Date.now()}`;
  await db.run('INSERT INTO holidays (id, name, date, description) VALUES (?, ?, ?, ?)', [id, name.trim(), date, description]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'HOLIDAY_ADDED',
    targetType: 'HOLIDAY',
    targetId: id,
    details: { name, date }
  });

  return { id, name, date, description };
}

module.exports = {
  getDashboardStats,
  listRecords,
  markAttendance,
  bulkMarkRoster,
  getSettings,
  updateSettings,
  listHolidays,
  addHoliday
};
