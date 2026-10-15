const express = require('express');
const router = express.Router();
const csvService = require('../services/csvService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// Import Employees CSV (supports dry-run and commit)
router.post('/import/employees', requirePermission('import_data'), express.text({ type: '*/*', limit: '5mb' }), async (req, res, next) => {
  try {
    const csvContent = typeof req.body === 'string' ? req.body : (req.body.csvText || '');
    const isDryRun = req.query.commit !== 'true';

    const result = await csvService.importEmployeesCsv(csvContent, { dryRun: isDryRun }, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Export Employees CSV
router.get('/export/employees', requirePermission('export_reports'), async (req, res, next) => {
  try {
    const csvData = await csvService.exportEmployeesCsv(req.user.branch_scope);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="employeehub_employees_${Date.now()}.csv"`);
    res.send(csvData);
  } catch (err) {
    next(err);
  }
});

// Export Audit Logs CSV
router.get('/export/audit-logs', requirePermission('view_audit_logs'), async (req, res, next) => {
  try {
    const csvData = await csvService.exportAuditLogsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="employeehub_audit_logs_${Date.now()}.csv"`);
    res.send(csvData);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
