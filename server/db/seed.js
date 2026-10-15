const bcrypt = require('bcryptjs');
const db = require('./connection');

async function seedDatabase() {
  console.log('Seeding database with system foundation and seed records...');
  db.initDb();

  // 1. Roles
  const roles = [
    { id: 'role_superadmin', name: 'Super Administrator', description: 'Full nationwide administrative access across all modules', is_system: 1 },
    { id: 'role_hr_admin', name: 'HR Administrator', description: 'Employee management, branch coordination, leave, and talent growth', is_system: 1 },
    { id: 'role_branch_mgr', name: 'Branch Manager', description: 'Branch-level staff administration, attendance roster, and leave approvals', is_system: 1 },
    { id: 'role_payroll_admin', name: 'Payroll Administrator', description: 'Salary configurations, batch runs, statutory compliance, and payslips', is_system: 1 },
    { id: 'role_employee', name: 'Employee', description: 'Employee Self-Service (ESS), personal goals, leave applications, peer kudos', is_system: 1 }
  ];

  for (const r of roles) {
    const existing = await db.get('SELECT id FROM roles WHERE id = ?', [r.id]);
    if (!existing) {
      await db.run('INSERT INTO roles (id, name, description, is_system) VALUES (?, ?, ?, ?)', [r.id, r.name, r.description, r.is_system]);
    }
  }

  // 2. Permissions
  const permissions = [
    { id: 'perm_dashboard_view', name: 'view_dashboard', module: 'Dashboard', description: 'View dashboard analytics and overviews' },
    { id: 'perm_users_manage', name: 'manage_users', module: 'Administration', description: 'Create, update, and manage users and access' },
    { id: 'perm_roles_manage', name: 'manage_roles', module: 'Administration', description: 'Manage roles and security permissions' },
    { id: 'perm_branches_view', name: 'view_branches', module: 'Branches', description: 'View branch directory and profiles' },
    { id: 'perm_branches_manage', name: 'manage_branches', module: 'Branches', description: 'Create, edit, and safely manage branches' },
    { id: 'perm_employees_view', name: 'view_employees', module: 'Employees', description: 'View employee directory and profiles' },
    { id: 'perm_employees_manage', name: 'manage_employees', module: 'Employees', description: 'Create, update, and manage employees' },
    { id: 'perm_payroll_view', name: 'view_payroll', module: 'Payroll', description: 'View payroll runs, history, and payslips' },
    { id: 'perm_payroll_manage', name: 'manage_payroll', module: 'Payroll', description: 'Configure structures, run wizard, finalize payroll' },
    { id: 'perm_attendance_view', name: 'view_attendance', module: 'Attendance', description: 'View attendance records and roster' },
    { id: 'perm_attendance_manage', name: 'manage_attendance', module: 'Attendance', description: 'Mark attendance, daily roster, edit punches' },
    { id: 'perm_leave_view', name: 'view_leave', module: 'Leave', description: 'View leave requests and balances' },
    { id: 'perm_leave_manage', name: 'manage_leave', module: 'Leave', description: 'Approve or reject leave applications' },
    { id: 'perm_growth_view', name: 'view_growth', module: 'Growth', description: 'View reviews, goals, skills, and training' },
    { id: 'perm_growth_manage', name: 'manage_growth', module: 'Growth', description: 'Conduct appraisals, assign goals, verify skills, promotions' },
    { id: 'perm_audit_view', name: 'view_audit_logs', module: 'Audit', description: 'View security and business audit logs' },
    { id: 'perm_reports_export', name: 'export_reports', module: 'Reports', description: 'Generate multi-module reports and export CSV' },
    { id: 'perm_data_import', name: 'import_data', module: 'Import', description: 'Perform controlled CSV data imports' },
    { id: 'perm_settings_manage', name: 'manage_settings', module: 'Settings', description: 'Configure organization rules and application settings' }
  ];

  for (const p of permissions) {
    const existing = await db.get('SELECT id FROM permissions WHERE id = ?', [p.id]);
    if (!existing) {
      await db.run('INSERT INTO permissions (id, name, module, description) VALUES (?, ?, ?, ?)', [p.id, p.name, p.module, p.description]);
    }
  }

  // 3. Role-Permission mappings
  const allPermIds = permissions.map(p => p.id);
  // Superadmin gets everything
  for (const pId of allPermIds) {
    await db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role_superadmin', pId]);
  }

  // HR Admin
  const hrPerms = [
    'perm_dashboard_view', 'perm_branches_view', 'perm_employees_view', 'perm_employees_manage',
    'perm_attendance_view', 'perm_attendance_manage', 'perm_leave_view', 'perm_leave_manage',
    'perm_growth_view', 'perm_growth_manage', 'perm_reports_export', 'perm_data_import'
  ];
  for (const pId of hrPerms) {
    await db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role_hr_admin', pId]);
  }

  // Branch Manager
  const branchMgrPerms = [
    'perm_dashboard_view', 'perm_branches_view', 'perm_employees_view',
    'perm_attendance_view', 'perm_attendance_manage', 'perm_leave_view', 'perm_leave_manage',
    'perm_growth_view', 'perm_reports_export'
  ];
  for (const pId of branchMgrPerms) {
    await db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role_branch_mgr', pId]);
  }

  // Payroll Admin
  const payrollPerms = [
    'perm_dashboard_view', 'perm_employees_view', 'perm_payroll_view', 'perm_payroll_manage',
    'perm_attendance_view', 'perm_leave_view', 'perm_reports_export'
  ];
  for (const pId of payrollPerms) {
    await db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role_payroll_admin', pId]);
  }

  // Employee
  const empPerms = [
    'perm_dashboard_view', 'perm_growth_view'
  ];
  for (const pId of empPerms) {
    await db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role_employee', pId]);
  }

  // 4. System Settings
  const existingSettings = await db.get('SELECT id FROM system_settings WHERE id = ?', ['global_settings']);
  if (!existingSettings) {
    await db.run(`
      INSERT INTO system_settings (
        id, org_name, org_code, contact_email, timezone, currency, date_format, session_timeout_mins
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'global_settings',
      'EmployeeHub Multi-Branch Enterprise',
      'EH-CORP',
      'admin@employeehub.demo',
      'Asia/Kolkata (IST)',
      'INR (₹)',
      'YYYY-MM-DD',
      1440
    ]);
  }

  // 5. Branches
  const initialBranches = [
    { id: "BR-BLR-01", code: "BLR-01", name: "Bengaluru HQ", city: "Bengaluru", state: "Karnataka", postal_code: "560103", address: "Outer Ring Road, Bellandur, Bengaluru", manager: "Rajesh Sharma", email: "bangalore.hq@employeehub.demo", phone: "+91 80 4123 4567", status: "Active", capacity: 150 },
    { id: "BR-BOM-01", code: "BOM-01", name: "Mumbai West", city: "Mumbai", state: "Maharashtra", postal_code: "400051", address: "Bandra Kurla Complex (BKC), Mumbai", manager: "Pooja Mehta", email: "mumbai.west@employeehub.demo", phone: "+91 22 2654 9870", status: "Active", capacity: 120 },
    { id: "BR-DEL-01", code: "DEL-01", name: "Delhi NCR Hub", city: "New Delhi", state: "Delhi", postal_code: "110037", address: "Aerocity Gateway Towers, New Delhi", manager: "Amitav Roy", email: "delhi.ncr@employeehub.demo", phone: "+91 11 4987 1234", status: "Active", capacity: 100 },
    { id: "BR-HYD-01", code: "HYD-01", name: "Hyderabad Tech Park", city: "Hyderabad", state: "Telangana", postal_code: "500081", address: "HITEC City, Madhapur, Hyderabad", manager: "Kiranmai Reddy", email: "hyderabad.tp@employeehub.demo", phone: "+91 40 6789 0123", status: "Active", capacity: 140 },
    { id: "BR-MAA-01", code: "MAA-01", name: "Chennai Central", city: "Chennai", state: "Tamil Nadu", postal_code: "600096", address: "OMR IT Corridor, Thoraipakkam, Chennai", manager: "Karthik Subramanian", email: "chennai.central@employeehub.demo", phone: "+91 44 4321 8765", status: "Active", capacity: 90 },
    { id: "BR-PUN-01", code: "PUN-01", name: "Pune Cyber Hub", city: "Pune", state: "Maharashtra", postal_code: "411057", address: "Hinjawadi Phase 1, Pune", manager: "Sneha Kulkarni", email: "pune.cyber@employeehub.demo", phone: "+91 20 6612 3456", status: "Active", capacity: 85 },
    { id: "BR-KOL-01", code: "KOL-01", name: "Kolkata Salt Lake", city: "Kolkata", state: "West Bengal", postal_code: "700091", address: "Sector V, Salt Lake City, Kolkata", manager: "Anindita Sen", email: "kolkata.saltlake@employeehub.demo", phone: "+91 33 2357 9081", status: "Active", capacity: 80 },
    { id: "BR-AMD-01", code: "AMD-01", name: "Ahmedabad West", city: "Ahmedabad", state: "Gujarat", postal_code: "380015", address: "SG Highway, Prahlad Nagar, Ahmedabad", manager: "Bhavin Shah", email: "ahmedabad.branch@employeehub.demo", phone: "+91 79 4001 2233", status: "Inactive", capacity: 100 },
    { id: "BR-JAI-01", code: "JAI-01", name: "Jaipur Tech Hub", city: "Jaipur", state: "Rajasthan", postal_code: "302037", address: "Mahindra World City, SEZ Zone, Jaipur", manager: "Narendra Singh", email: "jaipur.branch@employeehub.demo", phone: "+91 141 398 7654", status: "Inactive", capacity: 60 }
  ];

  for (const b of initialBranches) {
    const existing = await db.get('SELECT id FROM branches WHERE id = ?', [b.id]);
    if (!existing) {
      await db.run(`
        INSERT INTO branches (id, code, name, city, state, postal_code, address, manager, email, phone, status, capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [b.id, b.code, b.name, b.city, b.state, b.postal_code, b.address, b.manager, b.email, b.phone, b.status, b.capacity]);
    }
  }

  // 6. Employees (20 consistent employees)
  const initialEmployees = [
    { id: "EMP-1001", name: "Priya Sharma", initials: "PS", email: "priya.sharma@employeehub.demo", phone: "+91 98765 43210", designation: "Senior Software Engineer", department: "Engineering", branch_id: "BR-BLR-01", joining_date: "2021-03-15", dob: "1994-06-12", gender: "Female", city: "Bengaluru", employment_type: "Full-time", status: "Active", reporting_manager: "Rajesh Sharma", basic_salary: 85000, rating: 4.8 },
    { id: "EMP-1002", name: "Aarav Patel", initials: "AP", email: "aarav.patel@employeehub.demo", phone: "+91 98765 43211", designation: "HR Business Partner", department: "Human Resources", branch_id: "BR-BOM-01", joining_date: "2020-07-01", dob: "1991-09-23", gender: "Male", city: "Mumbai", employment_type: "Full-time", status: "Active", reporting_manager: "Pooja Mehta", basic_salary: 65000, rating: 4.5 },
    { id: "EMP-1003", name: "Rohan Verma", initials: "RV", email: "rohan.verma@employeehub.demo", phone: "+91 98765 43212", designation: "Lead Product Designer", department: "Product", branch_id: "BR-BLR-01", joining_date: "2019-11-10", dob: "1989-12-05", gender: "Male", city: "Bengaluru", employment_type: "Full-time", status: "Active", reporting_manager: "Rajesh Sharma", basic_salary: 92000, rating: 4.9 },
    { id: "EMP-1004", name: "Sunita Joshi", initials: "SJ", email: "sunita.joshi@employeehub.demo", phone: "+91 98765 43213", designation: "DevOps Engineer", department: "Engineering", branch_id: "BR-HYD-01", joining_date: "2022-01-18", dob: "1996-03-30", gender: "Female", city: "Hyderabad", employment_type: "Full-time", status: "Active", reporting_manager: "Kiranmai Reddy", basic_salary: 78000, rating: 4.3 },
    { id: "EMP-1005", name: "Vikram Nair", initials: "VN", email: "vikram.nair@employeehub.demo", phone: "+91 98765 43214", designation: "Branch Operations Lead", department: "Operations", branch_id: "BR-MAA-01", joining_date: "2018-05-20", dob: "1987-08-14", gender: "Male", city: "Chennai", employment_type: "Full-time", status: "Active", reporting_manager: "Karthik Subramanian", basic_salary: 58000, rating: 4.2 },
    { id: "EMP-1006", name: "Ananya Mukherjee", initials: "AM", email: "ananya.m@employeehub.demo", phone: "+91 98765 43215", designation: "Financial Analyst", department: "Finance", branch_id: "BR-KOL-01", joining_date: "2021-09-01", dob: "1995-11-19", gender: "Female", city: "Kolkata", employment_type: "Full-time", status: "Active", reporting_manager: "Anindita Sen", basic_salary: 62000, rating: 4.4 },
    { id: "EMP-1007", name: "Devendra Singh", initials: "DS", email: "devendra.singh@employeehub.demo", phone: "+91 98765 43216", designation: "Senior Talent Acquisition Specialist", department: "Human Resources", branch_id: "BR-DEL-01", joining_date: "2020-02-15", dob: "1990-04-08", gender: "Male", city: "New Delhi", employment_type: "Full-time", status: "Active", reporting_manager: "Amitav Roy", basic_salary: 60000, rating: 4.1 },
    { id: "EMP-1008", name: "Meera Krishnan", initials: "MK", email: "meera.krishnan@employeehub.demo", phone: "+91 98765 43217", designation: "Technical Support Engineer", department: "Technical Support", branch_id: "BR-BLR-01", joining_date: "2022-06-10", dob: "1997-07-25", gender: "Female", city: "Bengaluru", employment_type: "Full-time", status: "Active", reporting_manager: "Rajesh Sharma", basic_salary: 42000, rating: 3.8 },
    { id: "EMP-1009", name: "Kunal Gupta", initials: "KG", email: "kunal.gupta@employeehub.demo", phone: "+91 98765 43218", designation: "Senior Operations Associate", department: "Operations", branch_id: "BR-BOM-01", joining_date: "2021-10-05", dob: "1993-02-17", gender: "Male", city: "Mumbai", employment_type: "Full-time", status: "Active", reporting_manager: "Pooja Mehta", basic_salary: 48000, rating: 4.0 },
    { id: "EMP-1010", name: "Fatima Al-Hassan", initials: "FA", email: "fatima.hassan@employeehub.demo", phone: "+91 98765 43219", designation: "Cloud Infrastructure Architect", department: "Engineering", branch_id: "BR-HYD-01", joining_date: "2019-04-12", dob: "1988-10-03", gender: "Female", city: "Hyderabad", employment_type: "Full-time", status: "Active", reporting_manager: "Kiranmai Reddy", basic_salary: 110000, rating: 4.9 }
  ];

  for (const emp of initialEmployees) {
    const existing = await db.get('SELECT id FROM employees WHERE id = ?', [emp.id]);
    if (!existing) {
      await db.run(`
        INSERT INTO employees (
          id, name, initials, email, phone, designation, department, branch_id,
          joining_date, dob, gender, city, employment_type, status, reporting_manager, basic_salary, rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        emp.id, emp.name, emp.initials, emp.email, emp.phone, emp.designation, emp.department, emp.branch_id,
        emp.joining_date, emp.dob, emp.gender, emp.city, emp.employment_type, emp.status, emp.reporting_manager, emp.basic_salary, emp.rating
      ]);
    }
  }

  // 7. Users
  const passwordHash = bcrypt.hashSync('Admin@12345', 10);

  const initialUsers = [
    { id: 'usr_superadmin', email: 'admin@employeehub.demo', full_name: 'Chief Administrator', role_id: 'role_superadmin', employee_id: null, branch_scope: 'All' },
    { id: 'usr_hr_admin', email: 'hr@employeehub.demo', full_name: 'Aarav Patel (HR Lead)', role_id: 'role_hr_admin', employee_id: 'EMP-1002', branch_scope: 'All' },
    { id: 'usr_payroll_admin', email: 'payroll@employeehub.demo', full_name: 'Ananya Mukherjee (Payroll)', role_id: 'role_payroll_admin', employee_id: 'EMP-1006', branch_scope: 'All' },
    { id: 'usr_bom_mgr', email: 'bom.manager@employeehub.demo', full_name: 'Pooja Mehta (Mumbai Mgr)', role_id: 'role_branch_mgr', employee_id: null, branch_scope: 'Mumbai West' },
    { id: 'usr_priya_emp', email: 'priya.sharma@employeehub.demo', full_name: 'Priya Sharma', role_id: 'role_employee', employee_id: 'EMP-1001', branch_scope: 'Bengaluru HQ' }
  ];

  for (const u of initialUsers) {
    const existing = await db.get('SELECT id FROM users WHERE id = ?', [u.id]);
    if (!existing) {
      await db.run(`
        INSERT INTO users (id, email, password_hash, full_name, role_id, employee_id, status, branch_scope)
        VALUES (?, ?, ?, ?, ?, ?, 'Active', ?)
      `, [u.id, u.email, passwordHash, u.full_name, u.role_id, u.employee_id, u.branch_scope]);
    }
  }

  // 8. Attendance Settings & Holidays
  const existingAttnSettings = await db.get('SELECT id FROM attendance_settings WHERE id = ?', ['global_attn']);
  if (!existingAttnSettings) {
    await db.run(`
      INSERT INTO attendance_settings (id, standard_start_time, standard_end_time, grace_period_minutes, break_minutes, expected_daily_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['global_attn', '09:00', '18:00', 15, 60, 8.0]);
  }

  const holidays = [
    { id: 'hol_1', name: 'Republic Day', date: '2026-01-26', description: 'National Holiday' },
    { id: 'hol_2', name: 'Independence Day', date: '2026-08-15', description: 'National Holiday' },
    { id: 'hol_3', name: 'Gandhi Jayanti', date: '2026-10-02', description: 'National Holiday' },
    { id: 'hol_4', name: 'Diwali Festival', date: '2026-11-08', description: 'National Public Holiday' }
  ];
  for (const h of holidays) {
    await db.run('INSERT OR IGNORE INTO holidays (id, name, date, description) VALUES (?, ?, ?, ?)', [h.id, h.name, h.date, h.description]);
  }

  // 9. Leave Types & Initial Balances
  const leaveTypes = [
    { id: 'lt_cl', code: 'CL', name: 'Casual Leave', annual_quota: 12, paid: 1, description: 'Short-term personal urgent matters' },
    { id: 'lt_sl', code: 'SL', name: 'Sick Leave', annual_quota: 10, paid: 1, description: 'Medical recovery and health emergencies' },
    { id: 'lt_el', code: 'EL', name: 'Earned / Annual Leave', annual_quota: 18, paid: 1, description: 'Planned annual vacation and relaxation' },
    { id: 'lt_lwp', code: 'LWP', name: 'Leave Without Pay', annual_quota: 30, paid: 0, description: 'Unpaid extended personal leave' }
  ];
  for (const lt of leaveTypes) {
    await db.run('INSERT OR IGNORE INTO leave_types (id, code, name, annual_quota, paid, description) VALUES (?, ?, ?, ?, ?, ?)', [lt.id, lt.code, lt.name, lt.annual_quota, lt.paid, lt.description]);
  }

  // Seed initial balances for employees
  for (const emp of initialEmployees) {
    for (const lt of leaveTypes) {
      await db.run(`
        INSERT OR IGNORE INTO leave_balances (id, employee_id, leave_type_code, annual_quota, used, pending, remaining)
        VALUES (?, ?, ?, ?, 0, 0, ?)
      `, [`lb_${emp.id}_${lt.code}`, emp.id, lt.code, lt.annual_quota, lt.annual_quota]);
    }
  }

  // 10. Audit Log Initial Entry
  await db.run(`
    INSERT OR IGNORE INTO audit_logs (id, acting_user_id, acting_user_name, action, target_type, target_id, branch_context, outcome, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'audit_init_1',
    'usr_superadmin',
    'Chief Administrator',
    'SYSTEM_PROVISION',
    'SYSTEM',
    'global_settings',
    'All Branches',
    'SUCCESS',
    JSON.stringify({ note: 'Initial system provisioning and seed data migration completed.' })
  ]);

  console.log('Database seeding successfully verified.');
  return true;
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase
};
