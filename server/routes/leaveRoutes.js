const express = require('express');
const router = express.Router();
const leaveService = require('../services/leaveService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// Dashboard Stats
router.get('/stats', requirePermission('view_leave'), async (req, res, next) => {
  try {
    const stats = await leaveService.getDashboardStats(req.user.branch_scope);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});

// List Leave Requests
router.get('/requests', requirePermission('view_leave'), async (req, res, next) => {
  try {
    const { status, employeeId, branchId, limit, offset } = req.query;
    const result = await leaveService.listRequests({
      status,
      employeeId,
      branchId,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
      userBranchScope: req.user.branch_scope
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Get Employee Balances
router.get('/balances/:employeeId', async (req, res, next) => {
  try {
    const balances = await leaveService.getEmployeeBalances(req.params.employeeId);
    res.json({ success: true, balances });
  } catch (err) {
    next(err);
  }
});

// Apply for Leave
router.post('/apply', async (req, res, next) => {
  try {
    const request = await leaveService.applyLeave(req.body, req.user);
    res.status(201).json({ success: true, request });
  } catch (err) {
    next(err);
  }
});

// Approve / Reject Leave
router.post('/requests/:id/action', requirePermission('manage_leave'), async (req, res, next) => {
  try {
    const { status, reviewerNotes } = req.body;
    const request = await leaveService.approveOrRejectLeave(req.params.id, status, reviewerNotes, req.user);
    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
