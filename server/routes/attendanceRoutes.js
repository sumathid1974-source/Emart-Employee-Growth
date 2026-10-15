const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendanceService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// Attendance Dashboard Stats
router.get('/stats', requirePermission('view_attendance'), async (req, res, next) => {
  try {
    const { date } = req.query;
    const stats = await attendanceService.getDashboardStats(date, req.user.branch_scope);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});

// List Punch Records
router.get('/records', requirePermission('view_attendance'), async (req, res, next) => {
  try {
    const { date, startDate, endDate, employeeId, branchId, status, search, limit, offset } = req.query;
    const result = await attendanceService.listRecords({
      date,
      startDate,
      endDate,
      employeeId,
      branchId,
      status,
      search,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
      userBranchScope: req.user.branch_scope
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Mark / Edit Single Attendance Record
router.post('/mark', requirePermission('manage_attendance'), async (req, res, next) => {
  try {
    const record = await attendanceService.markAttendance(req.body, req.user);
    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
});

// Bulk Mark Daily Roster
router.post('/roster-bulk', requirePermission('manage_attendance'), async (req, res, next) => {
  try {
    const { branchId, date, records } = req.body;
    const result = await attendanceService.bulkMarkRoster(branchId, date, records, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get Settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await attendanceService.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

// Update Settings
router.patch('/settings', requirePermission('manage_attendance'), async (req, res, next) => {
  try {
    const settings = await attendanceService.updateSettings(req.body, req.user);
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

// Holidays
router.get('/holidays', async (req, res, next) => {
  try {
    const holidays = await attendanceService.listHolidays();
    res.json({ success: true, holidays });
  } catch (err) {
    next(err);
  }
});

router.post('/holidays', requirePermission('manage_attendance'), async (req, res, next) => {
  try {
    const holiday = await attendanceService.addHoliday(req.body, req.user);
    res.status(201).json({ success: true, holiday });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
