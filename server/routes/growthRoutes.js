const express = require('express');
const router = express.Router();
const growthService = require('../services/growthService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// Growth Dashboard stats
router.get('/stats', requirePermission('view_growth'), async (req, res, next) => {
  try {
    const stats = await growthService.getDashboardStats(req.user.branch_scope);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});

// Review Cycles
router.get('/cycles', requirePermission('view_growth'), async (req, res, next) => {
  try {
    const cycles = await growthService.listReviewCycles();
    res.json({ success: true, cycles });
  } catch (err) {
    next(err);
  }
});

router.post('/cycles', requirePermission('manage_growth'), async (req, res, next) => {
  try {
    const cycle = await growthService.createReviewCycle(req.body, req.user);
    res.status(201).json({ success: true, cycle });
  } catch (err) {
    next(err);
  }
});

// Appraisals
router.get('/appraisals', requirePermission('view_growth'), async (req, res, next) => {
  try {
    const appraisals = await growthService.listAppraisals(req.query.cycleId, req.user.branch_scope);
    res.json({ success: true, appraisals });
  } catch (err) {
    next(err);
  }
});

router.get('/appraisals/:id', requirePermission('view_growth'), async (req, res, next) => {
  try {
    const appraisal = await growthService.getAppraisalById(req.params.id);
    res.json({ success: true, appraisal });
  } catch (err) {
    next(err);
  }
});

router.post('/appraisals/:id', requirePermission('manage_growth'), async (req, res, next) => {
  try {
    const appraisal = await growthService.saveAppraisal(req.params.id, req.body, req.user);
    res.json({ success: true, appraisal });
  } catch (err) {
    next(err);
  }
});

// Goals
router.get('/goals', requirePermission('view_growth'), async (req, res, next) => {
  try {
    const goals = await growthService.listGoals(req.query.employeeId, req.user.branch_scope);
    res.json({ success: true, goals });
  } catch (err) {
    next(err);
  }
});

router.post('/goals', requirePermission('manage_growth'), async (req, res, next) => {
  try {
    const goal = await growthService.createGoal(req.body, req.user);
    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
});

router.patch('/goals/:id/progress', async (req, res, next) => {
  try {
    const { progress, status } = req.body;
    const goal = await growthService.updateGoalProgress(req.params.id, progress, status, req.user);
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
});

// Skills
router.get('/skills', async (req, res, next) => {
  try {
    const skills = await growthService.listSkills();
    res.json({ success: true, skills });
  } catch (err) {
    next(err);
  }
});

router.get('/skills-matrix', requirePermission('view_growth'), async (req, res, next) => {
  try {
    const matrix = await growthService.getSkillsMatrix(req.user.branch_scope);
    res.json({ success: true, matrix });
  } catch (err) {
    next(err);
  }
});

// Training
router.get('/training', async (req, res, next) => {
  try {
    const courses = await growthService.listTrainingCourses();
    res.json({ success: true, courses });
  } catch (err) {
    next(err);
  }
});

router.post('/training/:id/enroll', async (req, res, next) => {
  try {
    const employeeId = req.body.employeeId || req.user.employee_id;
    const result = await growthService.enrollCourse(req.params.id, employeeId, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Promotion Reviews
router.get('/promotions', requirePermission('view_growth'), async (req, res, next) => {
  try {
    const promotions = await growthService.listPromotionReviews(req.user.branch_scope);
    res.json({ success: true, promotions });
  } catch (err) {
    next(err);
  }
});

router.post('/promotions/:id/confirm', requirePermission('manage_growth'), async (req, res, next) => {
  try {
    const { status, reviewNotes, reviewerName } = req.body;
    const result = await growthService.confirmPromotionReview(req.params.id, status, reviewNotes, reviewerName, req.user);
    res.json({ success: true, promotion: result });
  } catch (err) {
    next(err);
  }
});

// Feedback & Kudos
router.get('/feedback', async (req, res, next) => {
  try {
    const feedback = await growthService.listFeedback(req.user.branch_scope);
    res.json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
});

router.post('/feedback', async (req, res, next) => {
  try {
    const result = await growthService.sendFeedback(req.body, req.user);
    res.status(201).json({ success: true, feedback: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
