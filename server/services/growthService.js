const db = require('../db/connection');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

// 8 criteria standard weights
const CRITERIA_WEIGHTS = {
  jobKnowledge: 0.15,
  qualityOfWork: 0.15,
  productivity: 0.15,
  communication: 0.10,
  teamwork: 0.10,
  reliability: 0.10,
  leadership: 0.15,
  goalAchievement: 0.10
};

function calculateWeightedScore(ratings) {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(CRITERIA_WEIGHTS)) {
    const val = Number(ratings[key]) || 3;
    weightedSum += val * weight;
    totalWeight += weight;
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : 3.0;
  return Math.round((score + Number.EPSILON) * 100) / 100;
}

async function getDashboardStats(userBranchScope = 'All') {
  // Active Dev Plans
  const plans = await db.get('SELECT COUNT(*) as count FROM dev_plans WHERE status = "In Progress"');

  // Review completion rate
  const appraisalsStats = await db.get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
      AVG(overall_score) as avg_score,
      SUM(CASE WHEN overall_score < 3.0 AND status = 'Completed' THEN 1 ELSE 0 END) as support_needed
    FROM appraisals
  `);

  const totalAppraisals = appraisalsStats ? (appraisalsStats.total || 0) : 0;
  const completedAppraisals = appraisalsStats ? (appraisalsStats.completed || 0) : 0;
  const reviewCompletionRate = totalAppraisals > 0 ? Math.round((completedAppraisals / totalAppraisals) * 100) : 0;

  // Goals meeting threshold
  const goalStats = await db.get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN progress >= 70 THEN 1 ELSE 0 END) as meeting_goals
    FROM goals
  `);
  const totalGoals = goalStats ? (goalStats.total || 0) : 0;
  const meetingGoalsCount = goalStats ? (goalStats.meeting_goals || 0) : 0;
  const meetingGoalsPct = totalGoals > 0 ? Math.round((meetingGoalsCount / totalGoals) * 100) : 0;

  // Training enrollments
  const trainingCount = await db.get('SELECT COUNT(*) as count FROM course_enrollments WHERE status IN ("Enrolled", "In Progress")');

  // Promotion candidates
  const promoCount = await db.get('SELECT COUNT(*) as count FROM promotion_reviews WHERE status IN ("Under Review", "Recommended for Discussion")');

  // Branch performance breakdown
  const branchPerf = await db.query(`
    SELECT b.name as branch,
           COUNT(DISTINCT e.id) as headcount,
           ROUND(AVG(e.rating), 2) as avg_rating,
           COUNT(DISTINCT a.id) as reviews_count
    FROM branches b
    LEFT JOIN employees e ON e.branch_id = b.id
    LEFT JOIN appraisals a ON a.employee_id = e.id
    GROUP BY b.id
    ORDER BY avg_rating DESC
  `);

  return {
    activeDevPlans: plans ? plans.count : 0,
    reviewCompletionRate,
    meetingGoalsPct,
    supportNeededCount: appraisalsStats ? (appraisalsStats.support_needed || 0) : 0,
    trainingEnrollments: trainingCount ? trainingCount.count : 0,
    pendingPromotions: promoCount ? promoCount.count : 0,
    branchPerformance: branchPerf.rows
  };
}

// 1. Review Cycles
async function listReviewCycles() {
  const result = await db.query('SELECT * FROM review_cycles ORDER BY start_date DESC');
  return result.rows;
}

async function createReviewCycle(data, actingUser) {
  const { name, period, startDate, endDate, submissionDeadline, targetBranch = 'All Branches' } = data;
  if (!name || !period || !startDate || !endDate) {
    throw { statusCode: 400, userMessage: 'Review cycle name, period, start date, and end date are required.' };
  }

  const id = `rc_${Date.now()}`;
  await db.run(`
    INSERT INTO review_cycles (id, name, period, start_date, end_date, submission_deadline, target_branch, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
  `, [id, name.trim(), period.trim(), startDate, endDate, submissionDeadline || endDate, targetBranch]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'REVIEW_CYCLE_CREATED',
    targetType: 'REVIEW_CYCLE',
    targetId: id,
    details: { name, period }
  });

  return db.get('SELECT * FROM review_cycles WHERE id = ?', [id]);
}

// 2. Appraisals
async function listAppraisals(cycleId = null, userBranchScope = 'All') {
  let sql = `
    SELECT a.*, e.name as employee_name, e.designation, e.department,
           b.name as branch_name, b.code as branch_code, rc.name as cycle_name
    FROM appraisals a
    JOIN employees e ON a.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    JOIN review_cycles rc ON a.cycle_id = rc.id
    WHERE 1=1
  `;
  const params = [];

  if (cycleId) {
    sql += ' AND a.cycle_id = ?';
    params.push(cycleId);
  }

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  sql += ' ORDER BY a.overall_score DESC, e.name ASC';
  const result = await db.query(sql, params);
  return result.rows.map(r => ({
    ...r,
    ratings: r.ratings_json ? JSON.parse(r.ratings_json) : {}
  }));
}

async function getAppraisalById(id) {
  const a = await db.get(`
    SELECT a.*, e.name as employee_name, e.designation, e.department,
           b.name as branch_name, b.code as branch_code, rc.name as cycle_name
    FROM appraisals a
    JOIN employees e ON a.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    JOIN review_cycles rc ON a.cycle_id = rc.id
    WHERE a.id = ?
  `, [id]);

  if (!a) throw { statusCode: 404, userMessage: 'Appraisal not found.' };

  return {
    ...a,
    ratings: a.ratings_json ? JSON.parse(a.ratings_json) : {}
  };
}

async function saveAppraisal(id, data, actingUser) {
  const appraisal = await db.get('SELECT * FROM appraisals WHERE id = ?', [id]);
  if (!appraisal) throw { statusCode: 404, userMessage: 'Appraisal not found.' };

  const { ratings = {}, managerNotes, employeeComments, promotionRecommended, isSubmitting = false } = data;
  const overallScore = calculateWeightedScore(ratings);
  const status = isSubmitting ? 'Completed' : 'Draft';
  const completedAt = isSubmitting ? new Date().toISOString() : appraisal.completed_at;

  await db.run(`
    UPDATE appraisals
    SET overall_score = ?, ratings_json = ?, status = ?, manager_notes = ?,
        employee_comments = ?, promotion_recommended = ?, completed_at = ?
    WHERE id = ?
  `, [
    overallScore,
    JSON.stringify(ratings),
    status,
    managerNotes !== undefined ? managerNotes : appraisal.manager_notes,
    employeeComments !== undefined ? employeeComments : appraisal.employee_comments,
    promotionRecommended !== undefined ? promotionRecommended : appraisal.promotion_recommended,
    completedAt,
    id
  ]);

  // Sync latest rating to employee profile if completed
  if (isSubmitting) {
    await db.run('UPDATE employees SET rating = ? WHERE id = ?', [overallScore, appraisal.employee_id]);
  }

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: isSubmitting ? 'APPRAISAL_COMPLETED' : 'APPRAISAL_DRAFT_SAVED',
    targetType: 'APPRAISAL',
    targetId: id,
    details: { overallScore, status }
  });

  return getAppraisalById(id);
}

// 3. Goals
async function listGoals(employeeId = null, userBranchScope = 'All') {
  let sql = `
    SELECT g.*, e.name as employee_name, b.name as branch_name
    FROM goals g
    JOIN employees e ON g.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (employeeId) {
    sql += ' AND g.employee_id = ?';
    params.push(employeeId);
  }

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  sql += ' ORDER BY g.created_at DESC';
  const result = await db.query(sql, params);
  return result.rows;
}

async function createGoal(data, actingUser) {
  const { title, description, employeeId, category = 'Individual Performance', priority = 'Medium', startDate, targetDate, targetValue = '100%' } = data;
  if (!title || !employeeId) throw { statusCode: 400, userMessage: 'Goal title and employee are required.' };

  const id = `goal_${Date.now()}`;
  await db.run(`
    INSERT INTO goals (id, title, description, employee_id, category, priority, start_date, target_date, progress, status, target_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'In Progress', ?)
  `, [id, title.trim(), description || '', employeeId, category, priority, startDate || null, targetDate || null, targetValue]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'GOAL_ASSIGNED',
    targetType: 'GOAL',
    targetId: id,
    details: { employeeId, title }
  });

  return db.get('SELECT * FROM goals WHERE id = ?', [id]);
}

async function updateGoalProgress(id, progress, status = null, actingUser) {
  const goal = await db.get('SELECT * FROM goals WHERE id = ?', [id]);
  if (!goal) throw { statusCode: 404, userMessage: 'Goal not found.' };

  const newProg = Math.min(100, Math.max(0, parseInt(progress, 10)));
  const newStatus = status || (newProg === 100 ? 'Completed' : 'In Progress');

  await db.run('UPDATE goals SET progress = ?, status = ? WHERE id = ?', [newProg, newStatus, id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'GOAL_PROGRESS_UPDATED',
    targetType: 'GOAL',
    targetId: id,
    details: { progress: newProg, status: newStatus }
  });

  return db.get('SELECT * FROM goals WHERE id = ?', [id]);
}

// 4. Skills & Competency Matrix
async function listSkills() {
  const result = await db.query('SELECT * FROM skills ORDER BY category ASC, name ASC');
  return result.rows;
}

async function getSkillsMatrix(userBranchScope = 'All') {
  let sql = `
    SELECT e.id as employee_id, e.name as employee_name, e.designation, b.name as branch_name,
           s.name as skill_name, s.category as skill_category, es.proficiency_level
    FROM employees e
    JOIN branches b ON e.branch_id = b.id
    LEFT JOIN employee_skills es ON e.id = es.employee_id
    LEFT JOIN skills s ON es.skill_id = s.id
    WHERE e.status = 'Active'
  `;
  const params = [];
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }
  sql += ' ORDER BY e.name ASC';

  const rows = (await db.query(sql, params)).rows;

  // Group by employee
  const matrix = {};
  for (const r of rows) {
    if (!matrix[r.employee_id]) {
      matrix[r.employee_id] = {
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        designation: r.designation,
        branch: r.branch_name,
        skills: []
      };
    }
    if (r.skill_name) {
      matrix[r.employee_id].skills.push({
        name: r.skill_name,
        category: r.skill_category,
        level: r.proficiency_level
      });
    }
  }

  return Object.values(matrix);
}

// 5. Training Academies
async function listTrainingCourses() {
  const courses = await db.query(`
    SELECT tc.*,
           (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = tc.id) as enrolled_count
    FROM training_courses tc
    ORDER BY tc.name ASC
  `);
  return courses.rows;
}

async function enrollCourse(courseId, employeeId, actingUser) {
  const course = await db.get(`
    SELECT tc.*,
           (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = tc.id) as enrolled_count
    FROM training_courses tc
    WHERE tc.id = ?
  `, [courseId]);

  if (!course) throw { statusCode: 404, userMessage: 'Course not found.' };

  // Capacity check
  if (course.enrolled_count >= course.capacity) {
    throw { statusCode: 400, userMessage: `Course Capacity Exceeded: Maximum capacity of ${course.capacity} participants reached.` };
  }

  // Duplicate check
  const existing = await db.get('SELECT id FROM course_enrollments WHERE course_id = ? AND employee_id = ?', [courseId, employeeId]);
  if (existing) {
    throw { statusCode: 400, userMessage: 'Employee is already enrolled in this training course.' };
  }

  const id = `ce_${Date.now()}`;
  await db.run('INSERT INTO course_enrollments (id, course_id, employee_id, status) VALUES (?, ?, ?, "Enrolled")', [id, courseId, employeeId]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'TRAINING_ENROLLED',
    targetType: 'TRAINING',
    targetId: courseId,
    details: { employeeId, courseName: course.name }
  });

  return { id, courseId, employeeId, status: 'Enrolled' };
}

// 6. Promotion Recommendations
async function listPromotionReviews(userBranchScope = 'All') {
  let sql = `
    SELECT pr.*, e.name as employee_name, e.department, e.rating,
           b.name as branch_name, b.code as branch_code
    FROM promotion_reviews pr
    JOIN employees e ON pr.employee_id = e.id
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }
  sql += ' ORDER BY pr.review_date DESC';
  const result = await db.query(sql, params);
  return result.rows;
}

async function confirmPromotionReview(id, status, reviewNotes, reviewerName, actingUser) {
  const promo = await db.get('SELECT * FROM promotion_reviews WHERE id = ?', [id]);
  if (!promo) throw { statusCode: 404, userMessage: 'Promotion recommendation dossier not found.' };

  await db.run(`
    UPDATE promotion_reviews
    SET status = ?, review_notes = ?, reviewer_name = ?, review_date = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, reviewNotes, reviewerName || actingUser.full_name, id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'PROMOTION_REVIEW_CONFIRMED',
    targetType: 'PROMOTION_REVIEW',
    targetId: id,
    details: { status, reviewerNotes: reviewNotes }
  });

  return db.get('SELECT * FROM promotion_reviews WHERE id = ?', [id]);
}

// 7. Feedback & Recognition (Kudos)
async function listFeedback(userBranchScope = 'All') {
  const result = await db.query(`
    SELECT f.*, e.name as recipient_name, e.designation as recipient_role, b.name as branch_name
    FROM feedback_recognition f
    JOIN employees e ON f.recipient_id = e.id
    JOIN branches b ON e.branch_id = b.id
    ORDER BY f.created_at DESC
  `);
  return result.rows;
}

async function sendFeedback(data, actingUser) {
  const { recipientId, badge, message, visibility = 'Public' } = data;
  if (!recipientId || !badge || !message) {
    throw { statusCode: 400, userMessage: 'Recipient, recognition badge, and kudos message are required.' };
  }

  const id = `kudos_${Date.now()}`;
  await db.run(`
    INSERT INTO feedback_recognition (id, sender_name, recipient_id, badge, visibility, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, actingUser.full_name, recipientId, badge, visibility, message.trim()]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'KUDOS_SENT',
    targetType: 'FEEDBACK',
    targetId: id,
    details: { recipientId, badge, visibility }
  });

  return db.get('SELECT * FROM feedback_recognition WHERE id = ?', [id]);
}

module.exports = {
  getDashboardStats,
  listReviewCycles,
  createReviewCycle,
  listAppraisals,
  getAppraisalById,
  saveAppraisal,
  listGoals,
  createGoal,
  updateGoalProgress,
  listSkills,
  getSkillsMatrix,
  listTrainingCourses,
  enrollCourse,
  listPromotionReviews,
  confirmPromotionReview,
  listFeedback,
  sendFeedback
};
