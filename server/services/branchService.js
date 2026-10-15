const db = require('../db/connection');
const auditService = require('./auditService');

async function listBranches(userBranchScope = 'All') {
  let sql = `
    SELECT b.*,
           (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.id AND e.status = 'Active') as active_headcount,
           (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.id) as total_headcount
    FROM branches b
    WHERE 1=1
  `;
  const params = [];

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }

  sql += ' ORDER BY b.code ASC';

  const result = await db.query(sql, params);
  return result.rows;
}

async function getBranchById(id) {
  const branch = await db.get(`
    SELECT b.*,
           (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.id AND e.status = 'Active') as active_headcount,
           (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.id) as total_headcount
    FROM branches b
    WHERE b.id = ? OR b.code = ?
  `, [id, id]);

  if (!branch) throw { statusCode: 404, userMessage: 'Branch not found.' };

  // Fetch assigned employees preview
  const employeesResult = await db.query(`
    SELECT id, name, designation, department, status, email
    FROM employees
    WHERE branch_id = ?
    ORDER BY name ASC
    LIMIT 10
  `, [branch.id]);

  return {
    ...branch,
    employeesPreview: employeesResult.rows
  };
}

async function createBranch(data, actingUser) {
  const { code, name, city, state, postalCode, address, manager, email, phone, capacity = 100 } = data;

  if (!code || !name || !city || !state) {
    throw { statusCode: 400, userMessage: 'Branch code, name, city, and state are required.' };
  }

  // Check unique code & name
  const existingCode = await db.get('SELECT id FROM branches WHERE LOWER(code) = LOWER(?)', [code.trim()]);
  if (existingCode) throw { statusCode: 400, userMessage: `Branch with code "${code}" already exists.` };

  const existingName = await db.get('SELECT id FROM branches WHERE LOWER(name) = LOWER(?)', [name.trim()]);
  if (existingName) throw { statusCode: 400, userMessage: `Branch with name "${name}" already exists.` };

  const id = `BR-${code.trim().toUpperCase()}`;

  await db.run(`
    INSERT INTO branches (id, code, name, city, state, postal_code, address, manager, email, phone, status, capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
  `, [
    id, code.trim().toUpperCase(), name.trim(), city.trim(), state.trim(),
    postalCode || '', address || '', manager || '', email || '', phone || '', capacity
  ]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'BRANCH_CREATED',
    targetType: 'BRANCH',
    targetId: id,
    branchContext: name.trim(),
    details: { code, name, city }
  });

  return getBranchById(id);
}

async function updateBranch(id, updates, actingUser) {
  const branch = await db.get('SELECT * FROM branches WHERE id = ?', [id]);
  if (!branch) throw { statusCode: 404, userMessage: 'Branch not found.' };

  const name = updates.name !== undefined ? updates.name.trim() : branch.name;
  const city = updates.city !== undefined ? updates.city.trim() : branch.city;
  const state = updates.state !== undefined ? updates.state.trim() : branch.state;
  const postalCode = updates.postalCode !== undefined ? updates.postalCode : branch.postal_code;
  const address = updates.address !== undefined ? updates.address : branch.address;
  const manager = updates.manager !== undefined ? updates.manager : branch.manager;
  const email = updates.email !== undefined ? updates.email : branch.email;
  const phone = updates.phone !== undefined ? updates.phone : branch.phone;
  const status = updates.status !== undefined ? updates.status : branch.status;
  const capacity = updates.capacity !== undefined ? Number(updates.capacity) : branch.capacity;

  await db.run(`
    UPDATE branches
    SET name = ?, city = ?, state = ?, postal_code = ?, address = ?,
        manager = ?, email = ?, phone = ?, status = ?, capacity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [name, city, state, postalCode, address, manager, email, phone, status, capacity, id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'BRANCH_UPDATED',
    targetType: 'BRANCH',
    targetId: id,
    branchContext: name,
    details: updates
  });

  return getBranchById(id);
}

async function deleteBranch(id, actingUser) {
  const branch = await db.get('SELECT * FROM branches WHERE id = ?', [id]);
  if (!branch) throw { statusCode: 404, userMessage: 'Branch not found.' };

  // Safety check: Block deletion if branch has assigned employees!
  const employeeCount = await db.get('SELECT COUNT(*) as count FROM employees WHERE branch_id = ?', [id]);
  if (employeeCount && employeeCount.count > 0) {
    throw {
      statusCode: 400,
      userMessage: `Deletion Blocked: Cannot delete branch "${branch.name}" because it currently has ${employeeCount.count} assigned employee(s). Reassign employees first.`
    };
  }

  await db.run('DELETE FROM branches WHERE id = ?', [id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'BRANCH_DELETED',
    targetType: 'BRANCH',
    targetId: id,
    branchContext: branch.name,
    details: { code: branch.code, name: branch.name }
  });

  return { success: true, message: `Branch "${branch.name}" deleted successfully.` };
}

module.exports = {
  listBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
};
