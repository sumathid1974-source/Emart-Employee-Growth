const db = require('../db/connection');

async function logEvent({
  userId = null,
  userName = 'System',
  action,
  targetType,
  targetId = null,
  branchContext = 'All Branches',
  outcome = 'SUCCESS',
  details = {}
}) {
  try {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Sanitize details to never record passwords or secrets
    const safeDetails = { ...details };
    delete safeDetails.password;
    delete safeDetails.password_hash;
    delete safeDetails.reset_token;
    delete safeDetails.token;

    await db.run(`
      INSERT INTO audit_logs (
        id, timestamp, acting_user_id, acting_user_name, action,
        target_type, target_id, branch_context, outcome, details_json
      ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      userId,
      userName,
      action,
      targetType,
      targetId ? String(targetId) : null,
      branchContext || 'All Branches',
      outcome,
      JSON.stringify(safeDetails)
    ]);

    return id;
  } catch (err) {
    console.error('Failed to write audit log event:', err);
    return null;
  }
}

async function getAuditLogs({
  action = null,
  targetType = null,
  startDate = null,
  endDate = null,
  branch = null,
  search = null,
  limit = 50,
  offset = 0
} = {}) {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }

  if (targetType) {
    query += ' AND target_type = ?';
    params.push(targetType);
  }

  if (branch && branch !== 'All' && branch !== 'All Branches') {
    query += ' AND branch_context = ?';
    params.push(branch);
  }

  if (startDate) {
    query += ' AND timestamp >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND timestamp <= ?';
    params.push(`${endDate} 23:59:59`);
  }

  if (search) {
    query += ' AND (acting_user_name LIKE ? OR action LIKE ? OR details_json LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Count total for pagination
  let countQuery = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1';
  const countParams = params.slice(0, params.length - 2);
  const countResult = await db.get(countQuery, countParams);

  return {
    logs: result.rows.map(r => ({
      ...r,
      details: r.details_json ? JSON.parse(r.details_json) : {}
    })),
    total: countResult ? countResult.count : 0
  };
}

module.exports = {
  logEvent,
  getAuditLogs
};
