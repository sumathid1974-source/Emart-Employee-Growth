const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// List / Search Audit Logs
router.get('/', requirePermission('view_audit_logs'), async (req, res, next) => {
  try {
    const { action, targetType, startDate, endDate, branch, search, limit, offset } = req.query;
    const result = await auditService.getAuditLogs({
      action,
      targetType,
      startDate,
      endDate,
      branch: branch || req.user.branch_scope,
      search,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
