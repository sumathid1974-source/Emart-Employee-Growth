const jwt = require('jsonwebtoken');
const { config } = require('../config');
const db = require('../db/connection');

async function authenticate(req, res, next) {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.eh_token) {
      token = req.cookies.eh_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid token. Please log in again.'
      });
    }

    // Fetch user and verify active status
    const user = await db.get(`
      SELECT u.id, u.email, u.full_name, u.role_id, u.employee_id, u.status, u.branch_scope,
             r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [decoded.userId]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or has been removed.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact your system administrator.'
      });
    }

    // Load user permissions
    const permsResult = await db.query(`
      SELECT p.name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `, [user.role_id]);

    const permissions = permsResult.rows.map(r => r.name);

    req.user = {
      ...user,
      permissions
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed due to an internal server error.'
    });
  }
}

module.exports = {
  authenticate
};
