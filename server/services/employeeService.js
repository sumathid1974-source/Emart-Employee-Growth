const db = require('../db/connection');
const auditService = require('./auditService');

function getInitials(name) {
  if (!name) return 'EH';
  return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
}

async function listEmployees({
  search = '',
  branchId = '',
  department = '',
  status = '',
  limit = 50,
  offset = 0,
  userBranchScope = 'All'
} = {}) {
  let sql = `
    SELECT e.*, b.name as branch_name, b.code as branch_code
    FROM employees e
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  // Branch scoping
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  if (branchId) {
    sql += ' AND (e.branch_id = ? OR b.name = ?)';
    params.push(branchId, branchId);
  }

  if (department) {
    sql += ' AND e.department = ?';
    params.push(department);
  }

  if (status) {
    sql += ' AND e.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (e.name LIKE ? OR e.id LIKE ? OR e.email LIKE ? OR e.designation LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY e.id ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await db.query(sql, params);

  // Total count
  const countParams = params.slice(0, params.length - 2);
  let countSql = `
    SELECT COUNT(*) as total
    FROM employees e
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') countSql += ' AND (b.name = ? OR b.code = ?)';
  if (branchId) countSql += ' AND (e.branch_id = ? OR b.name = ?)';
  if (department) countSql += ' AND e.department = ?';
  if (status) countSql += ' AND e.status = ?';
  if (search) countSql += ' AND (e.name LIKE ? OR e.id LIKE ? OR e.email LIKE ? OR e.designation LIKE ?)';

  const countRow = await db.get(countSql, countParams);

  return {
    employees: result.rows,
    total: countRow ? countRow.total : 0
  };
}

async function getEmployeeById(id) {
  const emp = await db.get(`
    SELECT e.*, b.name as branch_name, b.code as branch_code
    FROM employees e
    JOIN branches b ON e.branch_id = b.id
    WHERE e.id = ?
  `, [id]);

  if (!emp) throw { statusCode: 404, userMessage: 'Employee not found.' };

  // Fetch Leave balances
  const balances = await db.query(`
    SELECT lb.*, lt.name as leave_name
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_code = lt.code
    WHERE lb.employee_id = ?
  `, [id]);

  // Fetch verified skills
  const skills = await db.query(`
    SELECT es.*, s.name as skill_name, s.category as skill_category
    FROM employee_skills es
    JOIN skills s ON es.skill_id = s.id
    WHERE es.employee_id = ?
  `, [id]);

  // Fetch active goals
  const goals = await db.query(`
    SELECT * FROM goals WHERE employee_id = ? ORDER BY created_at DESC LIMIT 5
  `, [id]);

  // Fetch training enrollments
  const trainings = await db.query(`
    SELECT ce.*, tc.name as course_name, tc.category as course_category
    FROM course_enrollments ce
    JOIN training_courses tc ON ce.course_id = tc.id
    WHERE ce.employee_id = ?
  `, [id]);

  // Fetch latest appraisal
  const latestAppraisal = await db.get(`
    SELECT a.*, rc.name as cycle_name
    FROM appraisals a
    JOIN review_cycles rc ON a.cycle_id = rc.id
    WHERE a.employee_id = ?
    ORDER BY a.completed_at DESC, a.submitted_at DESC
    LIMIT 1
  `, [id]);

  return {
    ...emp,
    leaveBalances: balances.rows,
    skills: skills.rows,
    goals: goals.rows,
    trainings: trainings.rows,
    latestAppraisal
  };
}

async function createEmployee(data, actingUser) {
  const {
    id: customId,
    email,
    phone,
    designation,
    department,
    branchId,
    joiningDate,
    dob,
    gender,
    city,
    employmentType = 'Full-time',
    reportingManager,
    basicSalary = 45000,
    rating = 3.5
  } = data;
  const name = (data.name || data.fullName || '').trim();

  if (!name || !email || !designation || !department || !branchId) {
    throw { statusCode: 400, userMessage: 'Name, email, designation, department, and branch are required.' };
  }

  // Validate unique corporate email
  const existingEmail = await db.get('SELECT id FROM employees WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (existingEmail) throw { statusCode: 400, userMessage: `Corporate email "${email}" is already registered.` };

  // Generate ID if not provided
  let empId = customId ? customId.trim() : null;
  if (!empId) {
    const lastEmp = await db.get(`
      SELECT id FROM employees WHERE id LIKE 'EMP-%' ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC LIMIT 1
    `);
    const nextNum = lastEmp ? parseInt(lastEmp.id.replace('EMP-', ''), 10) + 1 : 1001;
    empId = `EMP-${nextNum}`;
  } else {
    const existingId = await db.get('SELECT id FROM employees WHERE id = ?', [empId]);
    if (existingId) throw { statusCode: 400, userMessage: `Employee ID "${empId}" already exists.` };
  }

  // Verify branch exists
  const branch = await db.get('SELECT id, name FROM branches WHERE id = ? OR name = ?', [branchId, branchId]);
  if (!branch) throw { statusCode: 400, userMessage: 'Selected branch does not exist.' };

  const initials = getInitials(name);

  // Execute inside transaction: create employee and initialize leave balances
  await db.transaction(async (tx) => {
    await tx.run(`
      INSERT INTO employees (
        id, name, initials, email, phone, designation, department, branch_id,
        joining_date, dob, gender, city, employment_type, status, reporting_manager, basic_salary, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
    `, [
      empId, name.trim(), initials, email.trim().toLowerCase(), phone || '', designation.trim(),
      department.trim(), branch.id, joiningDate || new Date().toISOString().split('T')[0],
      dob || '', gender || 'Decline to specify', city || '', employmentType,
      reportingManager || branch.manager, Number(basicSalary) || 45000, Number(rating) || 3.5
    ]);

    // Initialize default leave balances
    const leaveTypes = await tx.query('SELECT code, annual_quota FROM leave_types');
    for (const lt of leaveTypes.rows) {
      await tx.run(`
        INSERT OR IGNORE INTO leave_balances (id, employee_id, leave_type_code, annual_quota, used, pending, remaining)
        VALUES (?, ?, ?, ?, 0, 0, ?)
      `, [`lb_${empId}_${lt.code}`, empId, lt.code, lt.annual_quota, lt.annual_quota]);
    }
  });

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'EMPLOYEE_CREATED',
    targetType: 'EMPLOYEE',
    targetId: empId,
    branchContext: branch.name,
    details: { name, email, designation, department, branch: branch.name }
  });

  return getEmployeeById(empId);
}

async function updateEmployee(id, updates, actingUser) {
  const emp = await db.get('SELECT * FROM employees WHERE id = ?', [id]);
  if (!emp) throw { statusCode: 404, userMessage: 'Employee not found.' };

  if (updates.email && updates.email.toLowerCase() !== emp.email.toLowerCase()) {
    const conflict = await db.get('SELECT id FROM employees WHERE LOWER(email) = LOWER(?) AND id != ?', [updates.email.trim(), id]);
    if (conflict) throw { statusCode: 400, userMessage: `Email "${updates.email}" is already used by another employee.` };
  }

  let branchId = emp.branch_id;
  if (updates.branchId || updates.branch) {
    const bId = updates.branchId || updates.branch;
    const branch = await db.get('SELECT id FROM branches WHERE id = ? OR name = ?', [bId, bId]);
    if (!branch) throw { statusCode: 400, userMessage: 'Selected branch does not exist.' };
    branchId = branch.id;
  }

  const name = updates.name !== undefined ? updates.name.trim() : emp.name;
  const initials = getInitials(name);
  const email = updates.email !== undefined ? updates.email.trim().toLowerCase() : emp.email;
  const phone = updates.phone !== undefined ? updates.phone : emp.phone;
  const designation = updates.designation !== undefined ? updates.designation.trim() : emp.designation;
  const department = updates.department !== undefined ? updates.department.trim() : emp.department;
  const joiningDate = updates.joiningDate !== undefined ? updates.joiningDate : emp.joining_date;
  const dob = updates.dob !== undefined ? updates.dob : emp.dob;
  const gender = updates.gender !== undefined ? updates.gender : emp.gender;
  const city = updates.city !== undefined ? updates.city : emp.city;
  const employmentType = updates.employmentType !== undefined ? updates.employmentType : emp.employment_type;
  const status = updates.status !== undefined ? updates.status : emp.status;
  const reportingManager = updates.reportingManager !== undefined ? updates.reportingManager : emp.reporting_manager;
  const basicSalary = updates.basicSalary !== undefined ? Number(updates.basicSalary) : emp.basic_salary;
  const rating = updates.rating !== undefined ? Number(updates.rating) : emp.rating;

  await db.run(`
    UPDATE employees
    SET name = ?, initials = ?, email = ?, phone = ?, designation = ?, department = ?, branch_id = ?,
        joining_date = ?, dob = ?, gender = ?, city = ?, employment_type = ?, status = ?,
        reporting_manager = ?, basic_salary = ?, rating = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    name, initials, email, phone, designation, department, branchId,
    joiningDate, dob, gender, city, employmentType, status,
    reportingManager, basicSalary, rating, id
  ]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'EMPLOYEE_UPDATED',
    targetType: 'EMPLOYEE',
    targetId: id,
    details: updates
  });

  return getEmployeeById(id);
}

async function toggleEmployeeStatus(id, actingUser) {
  const emp = await db.get('SELECT * FROM employees WHERE id = ?', [id]);
  if (!emp) throw { statusCode: 404, userMessage: 'Employee not found.' };

  const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
  await db.run('UPDATE employees SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: newStatus === 'Active' ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
    targetType: 'EMPLOYEE',
    targetId: id,
    details: { newStatus }
  });

  return { id, status: newStatus };
}

async function deleteEmployee(id, actingUser) {
  const emp = await db.get('SELECT * FROM employees WHERE id = ?', [id]);
  if (!emp) throw { statusCode: 404, userMessage: 'Employee not found.' };

  // Safety check: Prevent deleting employee with finalized payroll records
  const payrollCheck = await db.get('SELECT COUNT(*) as count FROM payroll_records WHERE employee_id = ?', [id]);
  if (payrollCheck && payrollCheck.count > 0) {
    throw {
      statusCode: 400,
      userMessage: `Action Blocked: Cannot delete employee "${emp.name}" because ${payrollCheck.count} historical payroll record(s) exist. Deactivate the employee instead.`
    };
  }

  await db.run('DELETE FROM employees WHERE id = ?', [id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'EMPLOYEE_DELETED',
    targetType: 'EMPLOYEE',
    targetId: id,
    details: { name: emp.name, email: emp.email }
  });

  return { success: true, message: `Employee "${emp.name}" deleted successfully.` };
}

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee
};
