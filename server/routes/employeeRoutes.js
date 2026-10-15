const express = require('express');
const router = express.Router();
const employeeService = require('../services/employeeService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

// List Employees
router.get('/', requirePermission('view_employees'), async (req, res, next) => {
  try {
    const { search, branchId, department, status, limit, offset } = req.query;
    const result = await employeeService.listEmployees({
      search,
      branchId,
      department,
      status,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
      userBranchScope: req.user.branch_scope
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Get Employee by ID
router.get('/:id', requirePermission('view_employees'), async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json({ success: true, employee });
  } catch (err) {
    next(err);
  }
});

// Create Employee
router.post('/', requirePermission('manage_employees'), async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body, req.user);
    res.status(201).json({ success: true, employee });
  } catch (err) {
    next(err);
  }
});

// Update Employee
router.patch('/:id', requirePermission('manage_employees'), async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body, req.user);
    res.json({ success: true, employee });
  } catch (err) {
    next(err);
  }
});

// Toggle Status (Active / Inactive)
router.post('/:id/toggle-status', requirePermission('manage_employees'), async (req, res, next) => {
  try {
    const result = await employeeService.toggleEmployeeStatus(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Delete Employee
router.delete('/:id', requirePermission('manage_employees'), async (req, res, next) => {
  try {
    const result = await employeeService.deleteEmployee(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
