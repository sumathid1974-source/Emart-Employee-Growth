const db = require('../db/connection');
const auditService = require('./auditService');
const employeeService = require('./employeeService');

// Sanitize cell values against Spreadsheet Formula Injection (=, +, -, @)
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`; // Prefix with single quote to deactivate formulas
  }
  return str;
}

// Convert JSON array to RFC-4180 compliant CSV string
function toCsv(rows, headers) {
  if (!rows || rows.length === 0) {
    return headers.map(h => `"${h.label}"`).join(',') + '\r\n';
  }

  const headerLine = headers.map(h => `"${h.label}"`).join(',');
  const lines = rows.map(row => {
    return headers.map(h => {
      const raw = h.key ? row[h.key] : '';
      const safe = sanitizeCsvCell(raw);
      return `"${safe.replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headerLine, ...lines].join('\r\n') + '\r\n';
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse CSV text into array of rows
function parseCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return { headers: [], rows: [] };
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());

  const parsedRows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rowObj.__rowNumber = i; // 1-indexed data row
    parsedRows.push(rowObj);
  }

  return { headers, rows: parsedRows };
}

/**
 * Validate and Import Employees CSV
 * Supported headers: ID, Name, Email, Phone, Designation, Department, Branch, Basic Salary
 */
async function importEmployeesCsv(csvText, { dryRun = true } = {}, actingUser) {
  const { headers, rows } = parseCsv(csvText);

  if (rows.length === 0) {
    throw { statusCode: 400, userMessage: 'CSV file is empty or missing data rows.' };
  }

  const errors = [];
  const validRecords = [];

  const branches = await db.query('SELECT id, name, code FROM branches');
  const branchMap = new Map();
  branches.rows.forEach(b => {
    branchMap.set(b.name.toLowerCase(), b);
    branchMap.set(b.code.toLowerCase(), b);
    branchMap.set(b.id.toLowerCase(), b);
  });

  for (const row of rows) {
    const rowNum = row.__rowNumber;
    const name = row.Name || row.name || '';
    const email = row.Email || row.email || '';
    const designation = row.Designation || row.designation || '';
    const department = row.Department || row.department || '';
    const branchName = row.Branch || row.branch || '';
    const basicSalary = Number(row['Basic Salary'] || row.basic_salary || row.BasicSalary || 45000);

    if (!name) {
      errors.push({ row: rowNum, error: 'Employee Name is required.' });
      continue;
    }
    if (!email || !email.includes('@')) {
      errors.push({ row: rowNum, error: `Invalid email address "${email}".` });
      continue;
    }
    if (!designation) {
      errors.push({ row: rowNum, error: 'Designation is required.' });
      continue;
    }
    if (!department) {
      errors.push({ row: rowNum, error: 'Department is required.' });
      continue;
    }

    const branch = branchMap.get(branchName.trim().toLowerCase());
    if (!branch) {
      errors.push({ row: rowNum, error: `Branch "${branchName}" not found.` });
      continue;
    }

    // Check duplicate email
    const existing = await db.get('SELECT id FROM employees WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      errors.push({ row: rowNum, error: `Email "${email}" is already registered to employee ${existing.id}.` });
      continue;
    }

    validRecords.push({
      id: row.ID || row.id || null,
      name,
      email,
      phone: row.Phone || row.phone || '',
      designation,
      department,
      branchId: branch.id,
      branchName: branch.name,
      basicSalary,
      rowNumber: rowNum
    });
  }

  // If dryRun is requested or errors exist, return summary
  if (dryRun || errors.length > 0) {
    return {
      dryRun: true,
      totalRows: rows.length,
      validCount: validRecords.length,
      errorCount: errors.length,
      errors,
      previewRecords: validRecords.slice(0, 10)
    };
  }

  // Execute import inside transaction
  let importedCount = 0;
  await db.transaction(async () => {
    for (const rec of validRecords) {
      await employeeService.createEmployee({
        id: rec.id,
        name: rec.name,
        email: rec.email,
        phone: rec.phone,
        designation: rec.designation,
        department: rec.department,
        branchId: rec.branchId,
        basicSalary: rec.basicSalary
      }, actingUser);
      importedCount++;
    }
  });

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'CSV_EMPLOYEES_IMPORTED',
    targetType: 'EMPLOYEES',
    details: { totalRows: rows.length, importedCount }
  });

  return {
    dryRun: false,
    success: true,
    totalRows: rows.length,
    importedCount
  };
}

// Export Employees to CSV
async function exportEmployeesCsv(userBranchScope = 'All') {
  let sql = `
    SELECT e.id, e.name, e.email, e.phone, e.designation, e.department,
           b.name as branch, e.joining_date, e.employment_type, e.status,
           e.basic_salary, e.rating
    FROM employees e
    JOIN branches b ON e.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (b.name = ? OR b.code = ?)';
    params.push(userBranchScope, userBranchScope);
  }
  sql += ' ORDER BY e.id ASC';

  const result = await db.query(sql, params);
  const headers = [
    { label: 'Employee ID', key: 'id' },
    { label: 'Full Name', key: 'name' },
    { label: 'Corporate Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Designation', key: 'designation' },
    { label: 'Department', key: 'department' },
    { label: 'Branch', key: 'branch' },
    { label: 'Joining Date', key: 'joining_date' },
    { label: 'Employment Type', key: 'employment_type' },
    { label: 'Status', key: 'status' },
    { label: 'Basic Salary (INR)', key: 'basic_salary' },
    { label: 'Rating', key: 'rating' }
  ];

  return toCsv(result.rows, headers);
}

// Export Audit Logs to CSV
async function exportAuditLogsCsv() {
  const result = await db.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000');
  const headers = [
    { label: 'Event ID', key: 'id' },
    { label: 'Timestamp', key: 'timestamp' },
    { label: 'Acting User', key: 'acting_user_name' },
    { label: 'Action', key: 'action' },
    { label: 'Target Type', key: 'target_type' },
    { label: 'Target ID', key: 'target_id' },
    { label: 'Branch Context', key: 'branch_context' },
    { label: 'Outcome', key: 'outcome' },
    { label: 'Details', key: 'details_json' }
  ];
  return toCsv(result.rows, headers);
}

module.exports = {
  sanitizeCsvCell,
  toCsv,
  parseCsv,
  importEmployeesCsv,
  exportEmployeesCsv,
  exportAuditLogsCsv
};
