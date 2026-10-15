const express = require('express');
const router = express.Router();
const settingsService = require('../services/settingsService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// Get Settings
router.get('/', async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

// Update Settings
router.patch('/', requirePermission('manage_settings'), async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings(req.body, req.user);
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
