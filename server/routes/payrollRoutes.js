const express = require('express');
const router = express.Router();
const payrollService = require('../services/payrollService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// Dashboard stats
router.get('/stats', requirePermission('view_payroll'), async (req, res, next) => {
  try {
    const stats = await payrollService.getDashboardStats(req.user.branch_scope);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});

// List Batches
router.get('/batches', requirePermission('view_payroll'), async (req, res, next) => {
  try {
    const batches = await payrollService.listBatches(req.user.branch_scope);
    res.json({ success: true, batches });
  } catch (err) {
    next(err);
  }
});

// Get Batch Details
router.get('/batches/:id', requirePermission('view_payroll'), async (req, res, next) => {
  try {
    const batch = await payrollService.getBatchDetails(req.params.id);
    res.json({ success: true, batch });
  } catch (err) {
    next(err);
  }
});

// Generate Batch (Wizard Step 4)
router.post('/batches', requirePermission('manage_payroll'), async (req, res, next) => {
  try {
    const { period, branchId } = req.body;
    const batch = await payrollService.generateBatch(period, branchId, req.user);
    res.status(201).json({ success: true, batch });
  } catch (err) {
    next(err);
  }
});

// Update Batch Status (Draft -> Reviewed -> Finalized -> Paid)
router.patch('/batches/:id/status', requirePermission('manage_payroll'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const batch = await payrollService.updateBatchStatus(req.params.id, status, req.user);
    res.json({ success: true, batch });
  } catch (err) {
    next(err);
  }
});

// View Employee Payslip
router.get('/payslips/:id', async (req, res, next) => {
  try {
    const payslip = await payrollService.getPayslip(req.params.id, req.user);
    res.json({ success: true, payslip });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
