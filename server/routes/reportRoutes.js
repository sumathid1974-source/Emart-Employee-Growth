const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);
router.use(requirePermission('export_reports'));

router.get('/headcount', async (req, res, next) => {
  try {
    const report = await reportService.getHeadcountReport(req.user.branch_scope);
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

router.get('/payroll', async (req, res, next) => {
  try {
    const report = await reportService.getPayrollSummaryReport(req.query.period, req.user.branch_scope);
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

router.get('/attendance', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getAttendanceSummaryReport(startDate, endDate, req.user.branch_scope);
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

router.get('/performance', async (req, res, next) => {
  try {
    const report = await reportService.getPerformanceSummaryReport(req.user.branch_scope);
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
