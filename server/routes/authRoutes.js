const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Login
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const result = await authService.login(email, password, ip);

    // Set HTTP-only secure cookie
    res.cookie('eh_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (err) {
    next(err);
  }
});

// Get Current User Profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// Logout
router.post('/logout', authenticate, (req, res) => {
  res.clearCookie('eh_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Request Password Reset
router.post('/request-reset', authRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Reset Password with Token
router.post('/reset-password', authRateLimiter, async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Change Password (authenticated)
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
