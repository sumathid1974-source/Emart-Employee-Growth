const express = require('express');
const router = express.Router();
const branchService = require('../services/branchService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { enforceBranchScope } = require('../middleware/branchScope');

router.use(authenticate);

// List Branches
router.get('/', requirePermission('view_branches'), async (req, res, next) => {
  try {
    const branches = await branchService.listBranches(req.user.branch_scope);
    res.json({ success: true, branches });
  } catch (err) {
    next(err);
  }
});

// Get Branch Details
router.get('/:id', requirePermission('view_branches'), async (req, res, next) => {
  try {
    const branch = await branchService.getBranchById(req.params.id);
    res.json({ success: true, branch });
  } catch (err) {
    next(err);
  }
});

// Create Branch
router.post('/', requirePermission('manage_branches'), async (req, res, next) => {
  try {
    const branch = await branchService.createBranch(req.body, req.user);
    res.status(201).json({ success: true, branch });
  } catch (err) {
    next(err);
  }
});

// Update Branch
router.patch('/:id', requirePermission('manage_branches'), async (req, res, next) => {
  try {
    const branch = await branchService.updateBranch(req.params.id, req.body, req.user);
    res.json({ success: true, branch });
  } catch (err) {
    next(err);
  }
});

// Delete Branch
router.delete('/:id', requirePermission('manage_branches'), async (req, res, next) => {
  try {
    const result = await branchService.deleteBranch(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
