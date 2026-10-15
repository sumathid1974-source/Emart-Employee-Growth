const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { config } = require('../config');
const db = require('../db/connection');
const auditService = require('./auditService');

async function login(email, password, ip = '127.0.0.1') {
  if (!email || !password) {
    throw { statusCode: 400, userMessage: 'Email and password are required.' };
  }

  const user = await db.get(`
    SELECT u.*, r.name as role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.email) = LOWER(?)
  `, [email.trim()]);

  if (!user) {
    await auditService.logEvent({
      action: 'LOGIN_FAILURE',
      targetType: 'USER',
      targetId: email,
      outcome: 'FAILURE',
      details: { reason: 'User not found', ip }
    });
    throw { statusCode: 401, userMessage: 'Invalid email or password.' };
  }

  // Check if locked out
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    throw {
      statusCode: 403,
      userMessage: `Account locked due to consecutive failed logins. Please try again in ${remainingMins} minute(s).`
    };
  }

  // Check status
  if (user.status !== 'Active') {
    throw { statusCode: 403, userMessage: 'This account has been deactivated. Please contact support.' };
  }

  // Verify password
  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    let lockUntil = null;
    if (attempts >= config.security.maxLoginAttempts) {
      lockUntil = new Date(Date.now() + config.security.lockoutDurationMinutes * 60000).toISOString();
    }

    await db.run(`
      UPDATE users
      SET failed_login_attempts = ?, locked_until = ?
      WHERE id = ?
    `, [attempts, lockUntil, user.id]);

    await auditService.logEvent({
      userId: user.id,
      userName: user.full_name,
      action: 'LOGIN_FAILURE',
      targetType: 'USER',
      targetId: user.id,
      outcome: 'FAILURE',
      details: { attempts, locked: !!lockUntil, ip }
    });

    throw { statusCode: 401, userMessage: 'Invalid email or password.' };
  }

  // Reset failed attempts & update last login
  await db.run(`
    UPDATE users
    SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [user.id]);

  // Load permissions
  const permsResult = await db.query(`
    SELECT p.name
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `, [user.role_id]);
  const permissions = permsResult.rows.map(r => r.name);

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role_name,
      branchScope: user.branch_scope
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  await auditService.logEvent({
    userId: user.id,
    userName: user.full_name,
    action: 'LOGIN_SUCCESS',
    targetType: 'USER',
    targetId: user.id,
    branchContext: user.branch_scope,
    outcome: 'SUCCESS',
    details: { ip }
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      roleId: user.role_id,
      roleName: user.role_name,
      employeeId: user.employee_id,
      branchScope: user.branch_scope,
      permissions
    }
  };
}

async function getCurrentUser(userId) {
  const user = await db.get(`
    SELECT u.id, u.email, u.full_name, u.role_id, u.employee_id, u.status, u.branch_scope, u.last_login_at,
           r.name as role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `, [userId]);

  if (!user) return null;

  const permsResult = await db.query(`
    SELECT p.name
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `, [user.role_id]);

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    roleId: user.role_id,
    roleName: user.role_name,
    employeeId: user.employee_id,
    branchScope: user.branch_scope,
    lastLoginAt: user.last_login_at,
    permissions: permsResult.rows.map(r => r.name)
  };
}

async function requestPasswordReset(email) {
  if (!email) return { message: 'If an account exists, a reset instruction has been logged.' };

  const user = await db.get('SELECT id, email, full_name FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (!user) {
    // Non-enumerating response
    return { message: 'If an account exists, a reset instruction has been logged.' };
  }

  // Generate cryptographically secure reset token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db.run(`
    UPDATE users
    SET reset_token = ?, reset_token_expires = ?
    WHERE id = ?
  `, [hashedToken, expiresAt, user.id]);

  await auditService.logEvent({
    userId: user.id,
    userName: user.full_name,
    action: 'PASSWORD_RESET_REQUESTED',
    targetType: 'USER',
    targetId: user.id,
    details: { email: user.email }
  });

  return {
    message: 'Password reset token generated. In a live production system, an email would be delivered.',
    demoToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined
  };
}

async function resetPassword(token, newPassword) {
  if (!token || !newPassword || newPassword.length < 8) {
    throw { statusCode: 400, userMessage: 'Valid token and password of at least 8 characters are required.' };
  }

  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const user = await db.get(`
    SELECT id, email, full_name, reset_token_expires
    FROM users
    WHERE reset_token = ?
  `, [hashedToken]);

  if (!user || new Date(user.reset_token_expires) < new Date()) {
    throw { statusCode: 400, userMessage: 'Invalid or expired password reset token.' };
  }

  const newHash = bcrypt.hashSync(newPassword, config.security.bcryptRounds);

  await db.run(`
    UPDATE users
    SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, failed_login_attempts = 0, locked_until = NULL
    WHERE id = ?
  `, [newHash, user.id]);

  await auditService.logEvent({
    userId: user.id,
    userName: user.full_name,
    action: 'PASSWORD_RESET_SUCCESS',
    targetType: 'USER',
    targetId: user.id,
    details: { reason: 'Reset via token' }
  });

  return { success: true, message: 'Password reset successfully. You may now log in.' };
}

async function changePassword(userId, currentPassword, newPassword, actingUser) {
  if (!newPassword || newPassword.length < 8) {
    throw { statusCode: 400, userMessage: 'New password must be at least 8 characters long.' };
  }

  const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (!user) throw { statusCode: 404, userMessage: 'User not found.' };

  const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!isMatch) {
    throw { statusCode: 400, userMessage: 'Current password is incorrect.' };
  }

  const newHash = bcrypt.hashSync(newPassword, config.security.bcryptRounds);
  await db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, userId]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'PASSWORD_CHANGED',
    targetType: 'USER',
    targetId: userId,
    details: { self: actingUser.id === userId }
  });

  return { success: true, message: 'Password changed successfully.' };
}

module.exports = {
  login,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  changePassword
};
