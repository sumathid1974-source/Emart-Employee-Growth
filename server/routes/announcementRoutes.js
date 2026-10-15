const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// List Announcements
router.get('/', async (req, res, next) => {
  try {
    const announcements = await notificationService.listAnnouncements(req.user.branch_scope);
    res.json({ success: true, announcements });
  } catch (err) {
    next(err);
  }
});

// Create Announcement
router.post('/', requirePermission('manage_employees'), async (req, res, next) => {
  try {
    const announcement = await notificationService.createAnnouncement(req.body, req.user);
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    next(err);
  }
});

// Toggle Publish Status
router.post('/:id/toggle-publish', requirePermission('manage_employees'), async (req, res, next) => {
  try {
    const result = await notificationService.toggleAnnouncementPublish(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
