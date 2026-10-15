const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const auditService = require('./auditService');
const { config } = require('../config');

async function listUsers({ search = '', roleId = '', status = '', branch = '', limit = 50, offset = 0 } = {}) {
  let sql = `
    SELECT u.id, u.email, u.full_name, u.role_id, u.employee_id, u.status, u.branch_scope,
           u.last_login_at, u.created_at, r.name as role_name, e.name as employee_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (roleId) {
    sql += ' AND u.role_id = ?';
    params.push(roleId);
  }

  if (status) {
    sql += ' AND u.status = ?';
    params.push(status);
  }

  if (branch && branch !== 'All' && branch !== 'All Branches') {
    sql += ' AND (u.branch_scope = ? OR u.branch_scope = "All")';
    params.push(branch);
  }

  sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await db.query(sql, params);

  // Get total count
  const countParams = params.slice(0, params.length - 2);
  let countSql = `
    SELECT COUNT(*) as total
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  if (search) countSql += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
  if (roleId) countSql += ' AND u.role_id = ?';
  if (status) countSql += ' AND u.status = ?';
  if (branch && branch !== 'All' && branch !== 'All Branches') countSql += ' AND (u.branch_scope = ? OR u.branch_scope = "All")';

  const countRow = await db.get(countSql, countParams);

  return {
    users: result.rows,
    total: countRow ? countRow.total : 0
  };
}

async function getUserById(id) {
  const user = await db.get(`
    SELECT u.id, u.email, u.full_name, u.role_id, u.employee_id, u.status, u.branch_scope,
           u.last_login_at, u.created_at, r.name as role_name, e.name as employee_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE u.id = ?
  `, [id]);

  if (!user) throw { statusCode: 404, userMessage: 'User not found.' };

  const perms = await db.query(`
    SELECT p.name, p.module, p.description
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `, [user.role_id]);

  return {
    ...user,
    permissions: perms.rows
  };
}

async function createUser(data, actingUser) {
  const { email, password, fullName, roleId, employeeId, branchScope = 'All' } = data;

  if (!email || !password || !fullName || !roleId) {
    throw { statusCode: 400, userMessage: 'Email, password, full name, and role are required.' };
  }

  // Validate email uniqueness
  const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (existing) {
    throw { statusCode: 400, userMessage: `User with email "${email}" already exists.` };
  }

  // Validate role exists
  const role = await db.get('SELECT id, name FROM roles WHERE id = ?', [roleId]);
  if (!role) {
    throw { statusCode: 400, userMessage: 'Selected role does not exist.' };
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const passwordHash = bcrypt.hashSync(password, config.security.bcryptRounds);

  await db.run(`
    INSERT INTO users (id, email, password_hash, full_name, role_id, employee_id, status, branch_scope)
    VALUES (?, ?, ?, ?, ?, ?, 'Active', ?)
  `, [id, email.trim().toLowerCase(), passwordHash, fullName.trim(), roleId, employeeId || null, branchScope || 'All']);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'USER_CREATED',
    targetType: 'USER',
    targetId: id,
    details: { email, fullName, roleName: role.name, branchScope }
  });

  return getUserById(id);
}

async function updateUser(id, updates, actingUser) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) throw { statusCode: 404, userMessage: 'User not found.' };

  // Safety check: Prevent modifying the last active Super Administrator to a non-admin role
  if (user.role_id === 'role_superadmin' && updates.roleId && updates.roleId !== 'role_superadmin') {
    const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role_id = "role_superadmin" AND status = "Active"');
    if (adminCount.count <= 1) {
      throw { statusCode: 400, userMessage: 'Action Blocked: Cannot demote the last remaining Super Administrator.' };
    }
  }

  // Check email conflict if email is updated
  if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
    const conflict = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?', [updates.email.trim(), id]);
    if (conflict) {
      throw { statusCode: 400, userMessage: `Email "${updates.email}" is already in use by another user.` };
    }
  }

  const newEmail = updates.email ? updates.email.trim().toLowerCase() : user.email;
  const newFullName = updates.fullName ? updates.fullName.trim() : user.full_name;
  const newRoleId = updates.roleId || user.role_id;
  const newEmployeeId = updates.employeeId !== undefined ? updates.employeeId : user.employee_id;
  const newBranchScope = updates.branchScope || user.branch_scope;

  await db.run(`
    UPDATE users
    SET email = ?, full_name = ?, role_id = ?, employee_id = ?, branch_scope = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [newEmail, newFullName, newRoleId, newEmployeeId, newBranchScope, id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'USER_UPDATED',
    targetType: 'USER',
    targetId: id,
    details: { changes: { email: newEmail, fullName: newFullName, roleId: newRoleId, branchScope: newBranchScope } }
  });

  return getUserById(id);
}

async function toggleUserStatus(id, actingUser) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) throw { statusCode: 404, userMessage: 'User not found.' };

  // Safety check: Cannot deactivate the last Super Administrator
  if (user.role_id === 'role_superadmin' && user.status === 'Active') {
    const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role_id = "role_superadmin" AND status = "Active"');
    if (adminCount.count <= 1) {
      throw { statusCode: 400, userMessage: 'Safety Guard: Cannot deactivate the last active Super Administrator.' };
    }
  }

  // Cannot deactivate oneself
  if (user.id === actingUser.id) {
    throw { statusCode: 400, userMessage: 'Cannot deactivate your own active session.' };
  }

  const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
  await db.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: newStatus === 'Active' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetType: 'USER',
    targetId: id,
    details: { newStatus }
  });

  return { id, status: newStatus };
}

async function resetUserPasswordByAdmin(id, newPassword, actingUser) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) throw { statusCode: 404, userMessage: 'User not found.' };

  if (!newPassword || newPassword.length < 8) {
    throw { statusCode: 400, userMessage: 'Temporary password must be at least 8 characters long.' };
  }

  const newHash = bcrypt.hashSync(newPassword, config.security.bcryptRounds);
  await db.run(`
    UPDATE users
    SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [newHash, id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'USER_PASSWORD_RESET_BY_ADMIN',
    targetType: 'USER',
    targetId: id,
    details: { targetEmail: user.email }
  });

  return { success: true, message: `Password reset successfully for ${user.email}.` };
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPasswordByAdmin
};
