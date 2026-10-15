-- ============================================================================
-- EmployeeHub Unified Relational Database Schema
-- Compatible with SQLite and PostgreSQL
-- ============================================================================

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 2. BRANCHES
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  address TEXT,
  manager TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Active',
  capacity INTEGER DEFAULT 100,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  branch_id TEXT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 3. EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  joining_date TEXT,
  dob TEXT,
  gender TEXT,
  city TEXT,
  employment_type TEXT DEFAULT 'Full-time',
  status TEXT DEFAULT 'Active',
  reporting_manager TEXT,
  basic_salary REAL DEFAULT 45000.00,
  rating REAL DEFAULT 3.5,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 4. USERS & BRANCH SCOPE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  status TEXT DEFAULT 'Active',
  branch_scope TEXT DEFAULT 'All', -- 'All' or specific branch name/list
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  reset_token TEXT,
  reset_token_expires TEXT,
  last_login_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_branches (
  user_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  PRIMARY KEY (user_id, branch_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 5. SALARY CONFIGURATION & PAYROLL
CREATE TABLE IF NOT EXISTS salary_structures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  gross_salary REAL DEFAULT 0.00,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_components (
  id TEXT PRIMARY KEY,
  structure_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Earning' or 'Deduction'
  amount REAL DEFAULT 0.00,
  formula TEXT,
  is_taxable INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payroll_batches (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL, -- e.g. 'Nov 2026'
  branch_id TEXT, -- NULL for nationwide/all branches
  status TEXT DEFAULT 'Draft', -- 'Draft', 'Reviewed', 'Finalized', 'Paid'
  total_gross REAL DEFAULT 0.00,
  total_deductions REAL DEFAULT 0.00,
  total_net REAL DEFAULT 0.00,
  employee_count INTEGER DEFAULT 0,
  created_by TEXT,
  finalized_at TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_records (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  period TEXT NOT NULL,
  basic_salary REAL NOT NULL,
  gross_pay REAL NOT NULL,
  total_deductions REAL NOT NULL,
  net_pay REAL NOT NULL,
  status TEXT DEFAULT 'Processed',
  breakdown_json TEXT, -- Serialized earnings and deductions details
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES payroll_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 6. ATTENDANCE & HOLIDAY SETTINGS
CREATE TABLE IF NOT EXISTS attendance_settings (
  id TEXT PRIMARY KEY,
  standard_start_time TEXT DEFAULT '09:00',
  standard_end_time TEXT DEFAULT '18:00',
  grace_period_minutes INTEGER DEFAULT 15,
  break_minutes INTEGER DEFAULT 60,
  expected_daily_hours REAL DEFAULT 8.0,
  working_days_json TEXT DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]'
);

CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  break_minutes INTEGER DEFAULT 0,
  total_hours REAL DEFAULT 0.0,
  status TEXT NOT NULL, -- 'Present', 'Absent', 'Late', 'Half-day', 'On leave', 'Holiday'
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 7. LEAVE MANAGEMENT
CREATE TABLE IF NOT EXISTS leave_types (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  annual_quota INTEGER DEFAULT 12,
  paid INTEGER DEFAULT 1,
  description TEXT
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  leave_type_code TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Cancelled'
  reviewer_id TEXT,
  reviewer_notes TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_code) REFERENCES leave_types(code)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  leave_type_code TEXT NOT NULL,
  annual_quota INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  pending INTEGER DEFAULT 0,
  remaining INTEGER NOT NULL,
  UNIQUE(employee_id, leave_type_code),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_code) REFERENCES leave_types(code)
);

-- 8. ANNOUNCEMENTS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT DEFAULT 'All Branches',
  category TEXT DEFAULT 'Company Update',
  is_published INTEGER DEFAULT 1,
  expiry_date TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  target_branch TEXT DEFAULT 'All Branches',
  recipient_id TEXT, -- NULL for broad branch notification, or user/employee ID
  is_read INTEGER DEFAULT 0,
  link_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,
  in_app INTEGER DEFAULT 1,
  email INTEGER DEFAULT 1,
  sms INTEGER DEFAULT 0,
  leave_updates INTEGER DEFAULT 1,
  payroll_updates INTEGER DEFAULT 1,
  announcements INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. EMPLOYEE GROWTH & PERFORMANCE
CREATE TABLE IF NOT EXISTS review_cycles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  submission_deadline TEXT NOT NULL,
  target_branch TEXT DEFAULT 'All Branches',
  status TEXT DEFAULT 'Active', -- 'Draft', 'Active', 'In Progress', 'Completed', 'Archived'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appraisals (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  reviewer_id TEXT,
  overall_score REAL DEFAULT 0.0,
  ratings_json TEXT, -- 8 criteria weights and ratings
  status TEXT DEFAULT 'Draft', -- 'Draft', 'Submitted', 'Under Review', 'Completed'
  manager_notes TEXT,
  employee_comments TEXT,
  promotion_recommended TEXT DEFAULT 'Standard Growth Path',
  submitted_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (cycle_id) REFERENCES review_cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  employee_id TEXT NOT NULL,
  department TEXT,
  branch_id TEXT,
  category TEXT,
  priority TEXT DEFAULT 'Medium',
  start_date TEXT,
  target_date TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Not Started',
  measurement_type TEXT DEFAULT 'percentage', -- 'percentage' or 'metric'
  target_value TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goal_milestones (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT,
  is_completed INTEGER DEFAULT 0,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dev_plans (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  target_role TEXT,
  career_objective TEXT,
  strengths TEXT,
  development_areas TEXT,
  mentor TEXT,
  status TEXT DEFAULT 'In Progress',
  action_items_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  required_level TEXT DEFAULT 'Intermediate'
);

CREATE TABLE IF NOT EXISTS employee_skills (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  proficiency_level TEXT NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced', 'Expert'
  verified_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, skill_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  trainer TEXT,
  delivery_method TEXT DEFAULT 'Virtual Live Workshop',
  duration_hours INTEGER DEFAULT 20,
  capacity INTEGER DEFAULT 30,
  skills_covered TEXT,
  status TEXT DEFAULT 'Open',
  start_date TEXT,
  end_date TEXT
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  status TEXT DEFAULT 'Enrolled', -- 'Enrolled', 'In Progress', 'Completed', 'Dropped'
  enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  UNIQUE(course_id, employee_id),
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotion_reviews (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  current_role TEXT NOT NULL,
  proposed_role TEXT NOT NULL,
  status TEXT DEFAULT 'Under Review',
  review_notes TEXT,
  reviewer_name TEXT,
  review_date TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS career_paths (
  id TEXT PRIMARY KEY,
  track_name TEXT NOT NULL,
  current_role TEXT NOT NULL,
  next_role TEXT NOT NULL,
  required_skills TEXT,
  suggested_trainings TEXT,
  review_checkpoint TEXT
);

CREATE TABLE IF NOT EXISTS feedback_recognition (
  id TEXT PRIMARY KEY,
  sender_name TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  badge TEXT NOT NULL,
  visibility TEXT DEFAULT 'Public', -- 'Public' or 'Manager Only'
  message TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 10. AUDIT LOGS & SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  acting_user_id TEXT,
  acting_user_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  branch_context TEXT,
  outcome TEXT DEFAULT 'SUCCESS', -- 'SUCCESS' or 'FAILURE'
  details_json TEXT
);

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  org_name TEXT DEFAULT 'EmployeeHub Multi-Branch Enterprise',
  org_code TEXT DEFAULT 'EH-CORP',
  contact_email TEXT DEFAULT 'admin@employeehub.demo',
  timezone TEXT DEFAULT 'Asia/Kolkata (IST)',
  currency TEXT DEFAULT 'INR (₹)',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  session_timeout_mins INTEGER DEFAULT 1440,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create performance indexes for relational joins and lookups
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_emp ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_batch ON payroll_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
