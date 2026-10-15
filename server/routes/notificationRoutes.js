const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// List Notifications
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const result = await notificationService.listNotifications(req.user.employee_id || req.user.id, req.user.branch_scope, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Mark Single Notification as Read
router.post('/:id/read', async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Mark All Notifications as Read
router.post('/read-all', async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.employee_id || req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
