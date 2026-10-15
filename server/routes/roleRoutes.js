const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// List Roles
router.get('/', requirePermission('manage_roles'), async (req, res, next) => {
  try {
    const rolesResult = await db.query('SELECT * FROM roles ORDER BY name ASC');
    const roles = [];

    for (const r of rolesResult.rows) {
      const permsResult = await db.query(`
        SELECT p.id, p.name, p.module, p.description
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [r.id]);

      roles.push({
        ...r,
        permissions: permsResult.rows
      });
    }

    res.json({ success: true, roles });
  } catch (err) {
    next(err);
  }
});

// List Permissions
router.get('/permissions', requirePermission('manage_roles'), async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM permissions ORDER BY module ASC, name ASC');
    res.json({ success: true, permissions: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
