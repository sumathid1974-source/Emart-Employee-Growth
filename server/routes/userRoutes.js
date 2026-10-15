const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// List Users
router.get('/', requirePermission('manage_users'), async (req, res, next) => {
  try {
    const { search, roleId, status, branch, limit, offset } = req.query;
    const result = await userService.listUsers({
      search,
      roleId,
      status,
      branch: branch || req.user.branch_scope,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Get User by ID
router.get('/:id', requirePermission('manage_users'), async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// Create User
router.post('/', requirePermission('manage_users'), async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// Update User
router.patch('/:id', requirePermission('manage_users'), async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// Toggle User Status (Activate / Deactivate)
router.post('/:id/toggle-status', requirePermission('manage_users'), async (req, res, next) => {
  try {
    const result = await userService.toggleUserStatus(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Admin Reset Password
router.post('/:id/reset-password', requirePermission('manage_users'), async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const result = await userService.resetUserPasswordByAdmin(req.params.id, newPassword, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
