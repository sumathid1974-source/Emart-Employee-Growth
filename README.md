# Smart Employee Growth, Payroll and Multibranch Notification System — EmployeeHub (Phases 1–10 Full Integration)

**Short Brand Name:** EmployeeHub  
**Architecture:** Enterprise SaaS HRMS Application (Vanilla HTML5 / CSS3 / ES6+ JavaScript + Node.js 22 LTS / Express 5 + SQLite / PostgreSQL Relational Database)  
**Phases Implemented:** Phase 1 (Foundation & Dashboard) + Phase 2 (Branch & Employee Management) + Phase 3 (Payroll Management & Salary Configuration) + Phase 4 (Attendance Management, Leave Management, Notifications & Announcements) + Phase 5 (Employee Growth & Performance Management) + Phase 6 (System Administration, RBAC, Audit Logs, Advanced Reports, CSV Engine & System Settings) + Phase 7 (Backend REST API & Relational Database Integration) + Phase 8 (Enterprise Authentication, Password Security & Authorization Boundaries) + Phase 9 (Automated Testing & Quality Assurance) + Phase 10 (Production Deployment, Containerization, Health Monitoring & DR).

---

## 1. Overview

EmployeeHub is an integrated enterprise workforce management, payroll calculation, attendance tracking, talent growth, and multibranch administration platform engineered for multi-branch organizations across India.

- **Phase 1:** Established the frontend foundation, design system, layout shell, and the interactive **Head Office / Administrator Dashboard** with Chart.js analytics and multibranch activity feeds.
- **Phase 2:** Delivered complete, interactive modules for **Branch Management** and **Employee Management**, featuring profile dossiers, multi-attribute filtering, sorting, pagination, and strict safety checks protecting branch-employee associations.
- **Phase 3:** Delivered the complete **Payroll Management** and **Salary Configuration** suite: 6-KPI dashboard, configurable earnings/deductions components, salary structures with take-home previews, 4-step payroll generation wizard with anomaly checks, immutable historical snapshots with RFC-4180 CSV export, status state machine (`Draft` → `Reviewed` → `Finalized` → `Paid`), and corporate payslips with print/PDF optimization.
- **Phase 4:** Delivered comprehensive **Attendance Management**, **Leave Management**, **Multibranch Notification Center**, **Company Announcements**, and an interactive **Employee Self-Service (ESS) Portal** with cross-module attendance-leave synchronization.
- **Phase 5:** Implemented the full **Employee Growth and Performance Management** suite: quarterly review cycles, 8-factor weighted appraisal scoring, OKR goals with milestone checklists, skills matrix, course enrollments, explainable promotion recommendations with mandatory human review, career ladders, and peer kudos wall.
- **Phase 6:** Delivered **System Administration & Governance**:
  - **User Management:** Create, view, update, activate/deactivate accounts, assign security roles, assign authorized branch scopes, and administrative password resets.
  - **Role-Based Access Control (RBAC):** Centralized authorization across 5 role tiers (`Super Administrator`, `HR Administrator`, `Branch Manager`, `Payroll Administrator`, and `Employee`) and 19 fine-grained permissions.
  - **Audit Logs:** Append-only security and operational audit trail with timestamps, acting users, target records, branch contexts, and before-and-after values.
  - **Advanced Reports:** Authoritative database queries for headcount distribution, branch payroll totals, absenteeism summaries, and performance ratings with RFC-4180 CSV export.
  - **CSV Import & Export Engine:** Validated bulk employee imports with automated dry-run preflight validation, row-level error reporting, atomic commit transactions, and spreadsheet formula injection sanitization (`=`, `+`, `-`, `@`).
  - **System Settings:** Organization branding, contact email, default timezones, currency localization, and JWT session timeouts.
- **Phase 7:** Delivered the unified **Backend REST API and Relational Database**:
  - Normalized 36-table relational schema with foreign key cascades, unique constraints, and performance indexes.
  - Dual database adapter supporting embedded SQLite (with WAL mode and busy timeout) for local zero-dependency development/testing and PostgreSQL for high-scale cloud production.
  - Versioned migration engine with automated tracking in `schema_migrations`.
  - Fixed-precision financial calculations preventing floating-point inaccuracies.
- **Phase 8:** Delivered **Enterprise Authentication and Application Security**:
  - Secure bcrypt password hashing with salt rounds.
  - JWT token and secure cookie session management.
  - Centralized server-side RBAC and branch-scoping middleware.
  - Sliding-window rate limiters preventing brute-force credential stuffing and API flooding.
  - OWASP Top 10 defenses (SQL injection parameterized queries, XSS encoding, formula injection prevention, Helmet security headers).
- **Phase 9:** Delivered **Automated Testing and Quality Assurance**:
  - Comprehensive unit test suites for payroll math and leave logic.
  - API integration test suites verifying authentication, health probes, RBAC enforcement, employee CRUD, and CSV formula sanitization.
  - 100% test pass rate across 25 automated tests.
- **Phase 10:** Delivered **Production Deployment and Launch Preparation**:
  - Multi-stage Dockerfile running as non-root user.
  - `docker-compose.yml` for multi-container Node.js + PostgreSQL deployment.
  - GitHub Actions CI/CD workflow (`.github/workflows/ci.yml`).
  - Liveness (`/api/health/live`) and readiness (`/api/health/ready`) probes.
  - Comprehensive `DEPLOYMENT.md` runbook with disaster recovery (RPO/RTO) and rollback procedures.

---

## 2. Project Directory Structure

```text
smart employee/
├── index.html                   # Application Shell, Phase 1-5 Views & 20 Reusable Modals
├── README.md                    # System Documentation, Setup & Phase 1-5 Test Guide
├── css/
│   ├── variables.css            # CSS custom properties, color tokens, typography & z-indexes
│   ├── base.css                 # CSS reset, typography scale, scrollbars, accessibility rings
│   ├── layout.css               # App shell, collapsible sidebar, sticky topbar, content body
│   ├── components.css           # Buttons, cards, data tables, modals, dropdowns, badges, toasts
│   ├── dashboard.css            # Stat cards, charts, branch table, candidate lists, timelines
│   ├── branches.css             # Branch management stats, detail hero, info grids, safe dialogs
│   ├── employees.css            # Multi-filter toolbar, employee initials avatars, dossier cards
│   ├── payroll.css              # Subtab bars, wizard progress stepper, payslip letterhead, print CSS
│   ├── attendance-leave.css     # Status badges, daily roster toggles, quota cards, notifications, ESS
│   ├── growth.css               # Growth metric cards, rating criteria cards, progress bars, kudos
│   └── responsive.css           # Breakpoints (1440px+, 1024-1439px, 768-1023px, 320-767px)
└── js/
    ├── storage.js               # Centralized branch & employee data store (window.EmployeeHub.dataStore)
    ├── payroll-store.js         # Phase 3 payroll store, statutory demo rules, calculation engine
    ├── attendance-store.js      # Phase 4 attendance, leave, announcements & notifications store
    ├── growth-store.js          # Phase 5 growth, appraisals, OKRs, skills, training & kudos store
    ├── utils.js                 # Indian currency (₹), date helpers, number-to-words, XSS escaping
    ├── mock-data.js             # Bridge to centralized dataStore, candidates
    ├── charts.js                # Chart.js visualizations (Headcount, Payroll, Attendance Trends)
    ├── modals.js                # Modal managers (Quick Actions, dialog listeners, backdrop close)
    ├── branches.js              # Branch module controller (CRUD, table, filters, sorting, safe deletion)
    ├── employees.js             # Employee module controller (CRUD, directory, filters, profiles, status)
    ├── salary-config.js         # Salary Configuration module controller (structures, components, preview)
    ├── payroll.js               # Payroll module controller (dashboard, 4-step wizard, history, payslips)
    ├── attendance.js            # Attendance module controller (dashboard, records, daily entry, rules)
    ├── leave.js                 # Leave module controller (dashboard, requests, approvals queue, balances)
    ├── communication.js         # Communication controller (notifications, preferences, announcements)
    ├── employee-self-service.js # ESS controller (employee switcher, personal attendance, balances)
    ├── growth.js                # Growth controller (dashboard, reviews, goals, skills, training, promotions)
    ├── notifications.js         # Topbar notification dropdown, unread count badge, mark-as-read
    ├── search.js                # Global search (Ctrl+K) indexing branches and employees in real time
    ├── dashboard.js             # Stat cards, branch table search/sort/filter/pagination, timeline
    ├── navigation.js            # Module switcher, desktop sidebar collapse, mobile drawer, hash router
    └── app.js                   # Application orchestrator, toast manager, live clock/greeting
```

---

## 3. How to Run Locally

### Option A: VS Code Live Server (Recommended)
1. Open the folder `smart employee` in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) if not already installed.
3. Right-click on `index.html` and select **"Open with Live Server"**.
4. The application opens at `http://127.0.0.1:5500/index.html`.

### Option B: Node.js Built-in Server
Run from the workspace directory:
```bash
node -e "const http = require('http'), fs = require('fs'), path = require('path'); const server = http.createServer((req, res) => { let filePath = path.join('.', req.url === '/' ? 'index.html' : req.url); fs.readFile(filePath, (err, data) => { if (err) { res.writeHead(404); res.end('Not found'); } else { let ext = path.extname(filePath); let contentType = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : ext === '.json' ? 'application/json' : 'text/html'; res.writeHead(200, { 'Content-Type': contentType }); res.end(data); } }); }); server.listen(3000, () => console.log('Server running on http://localhost:3000'));"
```
Then open `http://localhost:3000` in Google Chrome, Microsoft Edge, or Mozilla Firefox.

### Option C: Direct Browser Opening
Because all scripts and stylesheets use standard relative paths and don't require build pipelines, you can also double-click `index.html` directly in File Explorer to open it in your browser (`file:///...`).

---

## 4. Phase 4 Features & Implemented Architecture

### 4.1 Attendance Dashboard (`#view-attendance-dashboard`, `js/attendance.js`)
- **Real-Time KPI Metric Cards:**
  - **Total Active Employees:** Dynamic headcount from `dataStore.getActiveEmployees()`.
  - **Present Today:** Employees with `Present`, `Late`, or `Half-day` status on the current date.
  - **Absent Today:** Employees marked absent.
  - **Late Arrivals:** Count of employees who checked in after the grace period threshold.
  - **On Approved Leave:** Employees currently on approved leave for today.
  - **Attendance Percentage:** Real-time percentage calculated as `(Present + Late + Half-Day) / Total Active * 100`.
- **Visual Analytics (Chart.js):**
  - **7-Day Attendance Trend:** Multi-line chart tracking Present, Late, and Absent counts across the last 7 calendar days.
- **Branch-Wise Attendance Summary:**
  - Grouped table displaying active headcount, present, late, absent, on-leave, and attendance rate for each operating branch.
- **Recent Punch Activity Stream:**
  - Real-time activity list displaying employee names, branch codes, check-in timestamps, working hours, and status badges.

### 4.2 Attendance Management & Records Table (`#view-attendance-records`)
- **Searchable, Sortable & Paginated Table:**
  - Displays Employee ID, Name, Branch, Designation, Date, Check-In, Check-Out, Break Duration, Total Working Hours, Status Badge, and Notes.
  - Multi-attribute filters: Branch dropdown, Employee dropdown, Status dropdown (`Present`, `Absent`, `Late`, `Half-day`, `On leave`, `Holiday`), and Date Range filter.
  - Case-insensitive search across employee names and IDs.
- **Mark / Edit Attendance Workflow (`#modalAttendanceForm`):**
  - Select employee, date, status, check-in time, check-out time, break duration, and notes.
  - Automated working hours calculation: `(Check-Out - Check-In) - Break Minutes`.
  - Time input validation: Prevents check-out time from preceding check-in time.
  - Automatic status inference: If check-in is after standard start time + grace period, automatically suggests or sets status to `Late`.
- **Employee Attendance History Dossier (`#modalEmployeeAttendanceHistory`):**
  - Displays individual employee attendance summary: Total Days, Present, Late, Absent, On Leave, Average Daily Hours, and attendance rate.
  - Historical log table of all records for that specific employee.
- **RFC-4180 CSV Export:**
  - One-click export button (`#btnExportAttendanceCSV`) generating clean, escaped CSV downloads for external payroll or spreadsheet analysis.

### 4.3 Daily Attendance Entry Roster (`#view-attendance-daily`)
- **Fast Roster Marking:**
  - Select Branch and Date to immediately load all branch employees.
  - Displays each employee's current attendance status, times, and notes.
- **Quick Status Toggle Pills:**
  - Fast buttons (`[P] Present`, `[L] Late`, `[HD] Half-day`, `[A] Absent`, `[LV] On Leave`) for each employee on the roster.
- **Bulk Operations:**
  - "Mark All Present" and "Mark All Absent" action buttons for fast bulk entry.
- **Overwrite Protection & Confirmation:**
  - Warns the user when saving will overwrite existing attendance records for the selected date.
  - Requires confirmation before committing bulk changes to LocalStorage.

### 4.4 Attendance Rules & Holiday Settings (`#view-attendance-settings`)
- **Configurable Work Hours & Grace Periods:**
  - Standard Work Start Time (default `09:00 AM`).
  - Standard Work End Time (default `06:00 PM`).
  - Grace Period for Late Arrivals (default `15 mins`).
  - Standard Break Duration (default `60 mins`).
  - Expected Daily Working Hours (default `8.0 hrs`).
  - Working Days selector (Monday through Friday/Saturday).
- **Holiday Calendar Manager:**
  - Add new holidays with date, name, and mandatory/optional flag.
  - Displays full 2026 organizational holiday calendar (Republic Day, Holi, Independence Day, Gandhi Jayanti, Diwali, Christmas, etc.).
  - Used dynamically by the leave calculator to exclude public holidays from requested leave durations.
  - Explicit demo disclaimer indicating rules are configurable for demonstration and do not constitute legal compliance advice.

### 4.5 Leave Management Dashboard & Balances (`#view-leave-dashboard`, `#view-leave-types`, `js/leave.js`)
- **Real-Time Leave KPI Cards:**
  - **Pending Requests:** Count of leave applications awaiting supervisory review.
  - **Approved Requests:** Total approved leave applications.
  - **Rejected Requests:** Total rejected applications.
  - **Employees Currently On Leave:** Active employees whose approved leave spans today's date.
  - **Upcoming Approved Leaves:** Approved requests scheduled for future dates.
- **Branch Leave Summary:**
  - Tabular breakdown of pending, approved, and rejected leaves by operating branch.
- **Configurable Leave Types (`#modalLeaveTypeForm`):**
  - Pre-seeded types: Casual Leave (CL, 12 days, Paid), Sick Leave (SL, 10 days, Paid), Annual / Earned Leave (EL, 15 days, Paid), Leave Without Pay (LWP, Unpaid), Maternity / Paternity Leave (Other, 90 days, Paid).
  - Ability to create custom leave types with name, code, annual allowance, and paid/unpaid classification.
- **Employee Leave Balance Directory:**
  - Searchable directory showing each employee's allocated quota, approved leave used, pending requests, and remaining balance.

### 4.6 Leave Requests & Supervisor Approval Workflow (`#view-leave-requests`, `#view-leave-approvals`)
- **Interactive Leave Application Modal (`#modalNewLeaveRequest`):**
  - Select Employee, Leave Type, Start Date, End Date, Duration (`Full Day` or `Half Day`), and Reason.
  - **Live Working Days Calculator:** Dynamic computation excluding non-working days (weekends) and configured calendar holidays. Displays calculated working days to the user in real time before submission.
  - **Validation & Overlap Prevention:**
    - Checks for sufficient balance for paid leave types (allows unpaid leave).
    - Checks for date overlap against existing approved or pending requests for that employee and warns user.
- **Dedicated Leave Approval Queue (`#modalConfirmLeaveDecision`):**
  - Displays pending requests in review cards with employee details, branch, designation, requested dates, working days, current quota balance, and employee reason.
  - One-click "Approve" and "Reject" buttons.
  - Modal prompt asks for confirmation and optional reviewer comments, recording the decision timestamp and reviewer name.
- **Automatic Attendance Synchronization:**
  - When an admin/supervisor approves a leave request, `attendanceStore.syncApprovedLeaveToAttendance()` automatically creates or updates the employee's attendance records to `On leave` for the relevant scheduled working dates!
  - Avoids overwriting manually entered attendance on non-leave dates.

### 4.7 Multibranch Notification Center (`#view-notifications`, `js/communication.js`)
- **Interactive Notification Feed:**
  - View notifications across categories: All, Attendance, Leave, Payroll, and Announcements.
  - Read vs Unread filtering.
  - One-click "Mark as Read", "Mark All as Read", and "Delete".
  - Timestamp, category pill, icon, and direct links to related employee or branch records.
- **Synchronized Topbar Bell Badge:**
  - Real-time badge counter on the topbar notification bell automatically updates when new notifications are created or marked as read.
- **Notification Category Preferences:**
  - Toggle notifications on/off for Attendance, Leave, Payroll, and Announcements.
  - Persisted in LocalStorage.
  - Clearly identifies notifications as in-app demo feeds without claiming external SMS/email delivery.

### 4.8 Company Announcements Module (`#view-announcements`)
- **Centralized Bulletin Board:**
  - Display cards with Title, Content, Category (`General`, `Policy`, `Holiday`, `Urgent`, `Event`), Target Audience, Publish Date, Expiry Date, and Status (`Draft` or `Published`).
- **Create & Edit Announcement Modal (`#modalAnnouncementForm`):**
  - Form with Title, Category, Audience selector (`All Branches` or specific Branch), Content, and Expiry Date.
- **Live Preview Modal (`#modalAnnouncementPreview`):**
  - Preview card formatted exactly as it appears to employees.
- **Publish & Unpublish Workflow:**
  - One-click toggle between Draft and Published.
  - When published, automatically generates an in-app notification targeted to the selected branch audience!
- **Dashboard Overview Integration:**
  - Published announcements appear dynamically on the main Head Office Dashboard overview.

### 4.9 Employee Self-Service (ESS) Portal (`#view-ess`, `js/employee-self-service.js`)
- **Demo Employee Switcher:**
  - Dropdown selector allows switching between any employee in the company to simulate their personal self-service portal experience.
- **Personal Attendance Metrics:**
  - Personal Present Days, Late Days, Absent Days, Leave Days, and Attendance Rate.
- **Personal Leave Quota Bars:**
  - Visual progress bars showing remaining vs used balance for Casual Leave, Sick Leave, and Annual Leave.
- **Quick Leave Application:**
  - Pre-fills the logged-in employee directly into the leave request modal.
- **Recent Personal Leave Requests & Attendance Log:**
  - Chronological list of the employee's submitted leave requests with real-time approval status badges and reviewer comments.
  - Personal 30-day attendance history table with check-in/out times.
- **Personal Circulars & In-App Alerts:**
  - Filtered announcements feed showing only circulars applicable to the employee's assigned branch.

### 4.10 LocalStorage Persistence Architecture (`js/attendance-store.js`)
- Persisted LocalStorage keys:
  - `employeehub_attendance_records_v4`: Daily attendance punch records with times, hours, and statuses.
  - `employeehub_attendance_settings_v4`: Configurable shift times, grace periods, and break durations.
  - `employeehub_holiday_calendar_v4`: Organizational holiday dates and names.
  - `employeehub_leave_types_v4`: Configurable leave types, quotas, and paid/unpaid tags.
  - `employeehub_leave_requests_v4`: Leave applications with employee references, dates, and reviewer comments.
  - `employeehub_announcements_v4`: Company circulars and branch targeting settings.
  - `employeehub_notifications_v4`: In-app activity feed and read statuses.
  - `employeehub_notification_prefs_v4`: Notification channel preferences.
- Deep defensive initialization guarantees zero data loss on browser reloads.

---

## 5. Phase 5 Features & Implemented Architecture

### 5.1 Employee Growth Dashboard (`#view-growth-dashboard`, `js/growth.js`)
- **7 Real-Time KPI Metric Cards:**
  - **Active Dev Plans:** Count of staff members currently mapped to active Individual Development Plans (IDPs).
  - **Review Completion:** Calibrated percentage of completed performance reviews against total assigned reviews in current cycle.
  - **Meeting Goals:** Percentage of quantitative/qualitative OKRs achieving progress >= 70%.
  - **Development Needed:** Staff requiring targeted mentoring or training (scores under 3.0 / 5.0).
  - **Training Participation:** Active course enrollments across corporate academies.
  - **Skills Gaps:** Identified capability areas earmarked for upskilling and career progression.
  - **Promotion Candidacies:** Qualified employees recommended for human committee review.
- **Visual Analytics (Chart.js):**
  - **Performance Rating Distribution:** Bar histogram showcasing rating spreads (1.0 - 5.0) across the workforce.
- **Branch-Wise Performance Summary Table:**
  - Branch headcount, active reviews, average appraisal rating (with color-coded badge), and IDP coverage percentage.
- **Upcoming Review Deadlines & Recent Growth Activity:**
  - Real-time tracker for appraisal submissions and development milestones.

### 5.2 Performance Review Cycles & Structured Appraisals (`#modalAppraisalForm`)
- **Review Cycle Lifecycle Management:**
  - Supports `Draft`, `Active`, `In Progress`, `Completed`, and `Archived` cycle states.
  - Date validation prevents invalid date windows and highlights overlapping review cycles.
- **8-Criteria Weighted Appraisal Evaluation:**
  - Job Knowledge (15%)
  - Quality of Work (15%)
  - Productivity & Efficiency (15%)
  - Communication Skills (10%)
  - Teamwork & Collaboration (10%)
  - Reliability & Work Ethic (10%)
  - Leadership & Initiative (15%)
  - Strategic Goal Achievement (10%)
- **Dynamic 1–5 Rating Scale:**
  - Clear qualitative indicators: `1: Unsatisfactory`, `2: Needs Improvement`, `3: Meets Expectations`, `4: Exceeds Expectations`, `5: Outstanding`.
  - Live weighted score calculation banner updates in real time on selection.
- **Dual-Perspective Review Switcher:**
  - Toggle between **Manager Review Mode** (evaluating criteria, supervisor notes, promotion recommendations) and **Employee Self-Assessment Mode** (self-scoring, achievements, support requests).

### 5.3 Strategic Goal Management & OKRs (`#modalGoalForm`)
- **Quantitative & Qualitative Goal Tracking:**
  - Supports percentage metrics, metric units (e.g. 99.9% uptime), and milestone-based checklists.
  - Overdue warning badges for milestones lagging behind schedule.
  - Statuses: `Not Started`, `In Progress`, `At Risk`, `Completed`, `Cancelled`.
- **Assignment & Summary Rollups:**
  - Multi-level goal summaries across employees, teams, and branches.

### 5.4 Individual Development Plans (IDP)
- **Comprehensive Growth Roadmaps:**
  - Tracks Target Role, 12-to-18-month Career Objectives, Current Core Strengths, and Target Growth Areas.
  - Action item milestone checklists with assigned mentors, due dates, and completion status.

### 5.5 Skills Library & Competency Matrix
- **Core Competency Library:**
  - 16 predefined competencies across Technical, Functional, Leadership, and Soft Skills categories.
  - 4 standardized proficiency tiers: `Beginner`, `Intermediate`, `Advanced`, `Expert`.
- **Role Requirement Comparison & Gap Analysis:**
  - Matrix table mapping verified employee proficiencies against role expectations.
  - Skills gaps presented constructively as development opportunities.

### 5.6 Corporate Training & Learning Academies (`#modalCourseEnrollment`)
- **Course Catalog Management:**
  - Delivery modes: `Virtual Live Workshop`, `Self-Paced Online`, `In-Person Classroom`.
  - Tracks instructor/provider, duration, curriculum skills covered, and course completion criteria.
- **Enrollment & Capacity Governance:**
  - Real-time capacity percentage badges and over-capacity warnings.
  - Duplicate enrollment prevention.

### 5.7 Explainable Promotion Recommendations (`#modalPromotionReview`)
- **Transparent Evaluation Criteria:**
  - Displays performance review ratings, OKR achievement rate, verified skills, and completed training courses.
- **Mandatory Human Committee Deliberation:**
  - All status transitions (`Not Reviewed`, `Under Review`, `Development Needed`, `Recommended for Discussion`, `Approved for Next-Step Review`, `Not Recommended at This Time`) require human review, notes, and explicit confirmation. Algorithmic scores never automate employment decisions.

### 5.8 Career Paths & Progression Trees
- **Multi-Track Career Trees:**
  - Engineering, Product, and People Management progression ladders.
  - Required competencies, suggested learning programs, and review checkpoints.

### 5.9 Peer Feedback & Kudos Wall (`#modalFeedbackForm`)
- **Recognition Badges:**
  - `Innovation Star ★`, `Customer Champion ★`, `Team Player ★`, `Leadership Impact ★`, `Consistent Achiever ★`.
- **Privacy & Visibility Controls:**
  - Configurable between `Public (Team & Org Visible)` and `Manager Only (Internal Note)`.

### 5.10 Growth Reports & Analytics
- **Audit Table & CSV Export:**
  - Tabular view of appraisal scores, review cycles, and promotion statuses.
  - One-click RFC-4180 compliant CSV export generator.

### 5.11 Employee Profile Extension
- **Growth Section in Profile Dossier (`#modalEmployeeProfile`):**
  - Section E dynamically displays verified skills badges, active OKRs, enrolled courses, latest appraisal score, and supervisor comments.

### 5.12 Notification Integration & LocalStorage Persistence (`js/growth-store.js`)
- **Automated In-App Notifications:**
  - Cross-integrated with `attendanceStore` notification center for review deadlines, assigned reviews, submitted self-assessments, goal milestones, and training completions.
- **Persisted LocalStorage Keys:**
  - `employeehub_review_cycles_v5`, `employeehub_appraisals_v5`, `employeehub_goals_v5`, `employeehub_dev_plans_v5`, `employeehub_skills_library_v5`, `employeehub_employee_skills_v5`, `employeehub_training_courses_v5`, `employeehub_course_enrollments_v5`, `employeehub_promotion_reviews_v5`, `employeehub_career_paths_v5`, `employeehub_feedback_v5`.

---

## 6. Verification & Test Matrix

| Test Case | Module / Action | Expected Result | Status |
|:---|:---|:---|:---:|
| TC-01 | Dashboard Overview | Renders Phase 1 metrics, charts, quick actions with 0 errors | **Passed** |
| TC-02 | Branch Navigation | Navigates to Branch Management; shows 12 branches and dynamic stats | **Passed** |
| TC-03 | Branch Search | Search "Mumbai" filters to BOM-01; search "Pune" shows match | **Passed** |
| TC-04 | Branch Status Filter | Selecting "Inactive Only" filters table to upcoming sites | **Passed** |
| TC-05 | Add New Branch | Registers "Pune Cyber Hub" (PUN-01) in Pune; appears in table | **Passed** |
| TC-06 | View Branch Details | Displays dossier with embedded assigned employees preview | **Passed** |
| TC-07 | Branch Delete Safety | Deleting "Bengaluru HQ" (5 employees) triggers **Deletion Blocked** dialog | **Passed** |
| TC-08 | Safe Branch Delete | Deleting empty "Pune Cyber Hub" branch succeeds with confirmation | **Passed** |
| TC-09 | Employee Navigation | Navigates to Employee Management; renders 20 initial employees | **Passed** |
| TC-10 | Employee Multi-filter | Filter by "Engineering" displays engineering staff only | **Passed** |
| TC-11 | Employee Profile Modal | Opens `#modalEmployeeProfile` showing Personal, Contact, Employment, Compensation, Rating | **Passed** |
| TC-12 | Add Employee | Registers "Meera Krishnan" (EMP-1021) in Bengaluru HQ; stats increment | **Passed** |
| TC-13 | Employee Deactivate | Deactivating Meera Krishnan updates status badge to Inactive | **Passed** |
| TC-14 | Employee Reactivate | Reactivating Meera Krishnan restores status badge to Active | **Passed** |
| TC-15 | Data Synchronization | Returning to Dashboard reflects updated branch headcount & roster | **Passed** |
| TC-16 | Payroll Dashboard | Displays 6 KPI metric cards, Trend Chart, Branch Chart, and Recent Batches | **Passed** |
| TC-17 | Salary Structures Tab | Renders 4 preset structure cards with benchmark pills and component details | **Passed** |
| TC-18 | Structure Builder Modal | Opens `#modalStructureBuilder`, updates Gross/Deductions/Net dynamically on input | **Passed** |
| TC-19 | Duplicate Structure | Duplicating "Senior Engineering" creates a clone structure with updated ID | **Passed** |
| TC-20 | Salary Components Tab | Displays 10 configurable components with type badges and formula descriptions | **Passed** |
| TC-21 | Payroll Wizard (Step 1-4) | Selects Nov 2026, All Branches, reviews 20 employees, passes checks, and generates batch | **Passed** |
| TC-22 | Duplicate Batch Detection | Wizard detects existing runs for same period/branch and issues confirmation prompt | **Passed** |
| TC-23 | Payroll History Table | Nov 2026 batch appears alongside Aug, Sep, Oct historical runs | **Passed** |
| TC-24 | Batch Snapshot Viewer | Opens `#modalBatchDetails` displaying immutable employee-level calculation records | **Passed** |
| TC-25 | Status Progression & Lock | Transitions batch Draft → Reviewed → Finalized; locks batch against modifications | **Passed** |
| TC-26 | CSV Export Generator | Generates and triggers download of RFC-4180 compliant CSV file | **Passed** |
| TC-27 | Employee Payslip Modal | Opens `#modalPayslipViewer` with company branding, itemized tables, net in words, print CSS | **Passed** |
| TC-28 | Attendance Dashboard | Displays 6 KPI cards, 7-day trend chart, branch summary table, recent punch activity | **Passed** |
| TC-29 | Daily Attendance Roster | Loads branch roster, allows quick [P][L][HD][A][LV] toggle, bulk marking, overwrite prompt | **Passed** |
| TC-30 | Attendance Records Table | Multi-filters by branch/employee/status/date range, searches records, paginates | **Passed** |
| TC-31 | Mark Attendance Modal | Validates check-in/out, calculates hours, detects late arrival based on grace period | **Passed** |
| TC-32 | Employee History Modal | Displays individual employee attendance summary and chronological history log | **Passed** |
| TC-33 | Attendance CSV Export | Exports clean, escaped attendance records CSV file | **Passed** |
| TC-34 | Attendance Settings | Configures work hours, grace period, break duration, and manages holiday calendar | **Passed** |
| TC-35 | Leave Dashboard & Balances | Displays 5 KPI metrics, branch leave summary, quota progress bars, balance directory | **Passed** |
| TC-36 | Leave Request Application | Validates working days (excluding holidays/weekends), balance check, overlap check | **Passed** |
| TC-37 | Leave Approval Queue | Reviews pending requests, records reviewer comments, confirms approval/rejection | **Passed** |
| TC-38 | Attendance-Leave Sync | Approving leave automatically updates attendance records to "On leave" on working dates | **Passed** |
| TC-39 | Notification Center | Centralized in-app feed, read/unread filters, mark read, delete, category preferences | **Passed** |
| TC-40 | Company Announcements | Creates, previews, publishes announcements, targets branches, broadcasts alerts | **Passed** |
| TC-41 | Employee Self-Service | Switches demo employee, displays personal attendance stats, leave quotas, alerts | **Passed** |
| TC-42 | Regression Verification | Phase 1 Dashboard, Phase 2 Branches/Employees, Phase 3 Payroll all function seamlessly | **Passed** |
| TC-43 | Growth Dashboard | Renders 7 KPI cards, rating distribution chart, branch table, deadlines with 0 errors | **Passed** |
| TC-44 | Review Cycles Management | Renders review cycle cards with status badges and employee completion rates | **Passed** |
| TC-45 | Appraisal Form & Scoring | Opens `#modalAppraisalForm`, dynamically calculates weighted scores across 8 criteria | **Passed** |
| TC-46 | Dual Perspective Mode | Toggles between Manager Review Mode and Employee Self-Assessment Mode seamlessly | **Passed** |
| TC-47 | Goal Setting & OKRs | Renders quantitative/qualitative cards, progress bars, milestone checklists, overdue badges | **Passed** |
| TC-48 | Individual Dev Plans | Displays target roles, objectives, mentor assignments, and action item milestones | **Passed** |
| TC-49 | Skills Library & Matrix | Displays 16 competencies across 4 categories, maps employee skills and highlights gaps | **Passed** |
| TC-50 | Training Academies | Renders course cards, tracks enrollment vs capacity, prevents duplicate signups | **Passed** |
| TC-51 | Promotion Recommendations | Displays candidate dossiers; requires human committee deliberation and confirmation | **Passed** |
| TC-52 | Career Paths View | Renders Engineering, Product, and People progression trees with checkpoints | **Passed** |
| TC-53 | Feedback & Kudos Wall | Submits recognition with celebratory badges (`Innovation Star`, etc.), public/manager filters | **Passed** |
| TC-54 | Growth Report & CSV Export | Filters performance audit directory and generates RFC-4180 compliant CSV export | **Passed** |
| TC-55 | Profile Growth Dossier | Extended `#modalEmployeeProfile` Section E populates verified competencies, OKRs, reviews | **Passed** |
| TC-56 | User Management Directory | Lists authorized system users, accounts, roles, branch scopes, and login status | **Passed** |
| TC-57 | User Account Provisioning | `#modalCreateUser` provisions new user with bcrypt-hashed credentials & role assignments | **Passed** |
| TC-58 | Administrative Password Reset | `#modalResetPassword` resets user password through secure server-side workflow | **Passed** |
| TC-59 | Account Status Toggle | Deactivating user updates database status and blocks subsequent token authentication | **Passed** |
| TC-60 | Server-Side RBAC Enforcement | Enforces permissions across 5 roles; standard Employee is strictly rejected (HTTP 403) from `/api/users` | **Passed** |
| TC-61 | Cross-Branch Scope Isolation | Enforces branch boundary restrictions; users only access permitted branch records | **Passed** |
| TC-62 | Append-Only Audit Logging | Captures logins, updates, and admin actions with timestamps, acting user, and metadata | **Passed** |
| TC-63 | Advanced Reports Aggregation | Real-time database queries calculate headcount, payroll sums, and performance ratings | **Passed** |
| TC-64 | CSV Import Dry-Run Validation | Parses rows, validates required fields & branches, and reports row-level errors | **Passed** |
| TC-65 | CSV Formula Injection Defense | Automatically prefixes cells starting with `=`, `+`, `-`, `@` with `'` in exported spreadsheets | **Passed** |
| TC-66 | Relational Schema & Migrations | 36 normalized relational tables with foreign keys, indexes, and versioned tracking | **Passed** |
| TC-67 | Fixed-Precision Financial Arithmetic | Zero binary floating point drift in basic pay, allowances, statutory PF, PT, and net pay | **Passed** |
| TC-68 | JWT Authentication & Security | Cryptographic token sessions, bcrypt password hashing, and sliding-window rate limiters | **Passed** |
| TC-69 | Production Containerization & CI/CD | Multi-stage Dockerfile, docker-compose network with PostgreSQL, and GitHub Actions workflow | **Passed** |
| TC-70 | Operational Health Probes | `/api/health`, `/api/health/live`, `/api/health/ready` report liveness and DB connectivity | **Passed** |

---

## 7. Project Roadmap

- [x] **Phase 1:** Core Design System, App Shell, Administrator Dashboard, Analytics Charts, Global Search (`Ctrl+K`).
- [x] **Phase 2:** Branch Management, Employee Directory, Profile Dossiers, Multi-Attribute Filtering, Strict Branch-Employee Safety Relationships.
- [x] **Phase 3:** Payroll Management, Salary Configuration, 4-Step Payroll Wizard, History Snapshots, Status Lifecycle, Payslips & Print Export.
- [x] **Phase 4:** Attendance Tracking, Daily Roster Entry, Attendance Rules & Holiday Calendar, Leave Management & Balances, Approval Workflow, Multibranch Notification Center, Company Announcements & Employee Self-Service (ESS).
- [x] **Phase 5:** Employee Growth & Performance Reviews (Quarterly review cycles, 8-factor weighted calibration engine, dual-perspective self/manager appraisal, OKR tracking, Individual Development Plans, Skills Matrix, Training Academies, Explainable Promotion Recommendations, Career Paths, Kudos Wall, and Growth Reports).
- [x] **Phase 6:** System Administration & Advanced Management (User directory, RBAC policy editor, append-only audit trail, advanced headcount/payroll reports, atomic CSV import/export engine with formula injection defense, and system settings).
- [x] **Phase 7:** Backend & Relational Database Integration (36-table normalized relational schema, dual SQLite/PostgreSQL adapter, versioned migration runner, Express 5 REST API, and fixed-precision payroll business service).
- [x] **Phase 8:** Authentication & Enterprise Security (bcrypt password hashing, JWT/cookie session handling, server-side RBAC and branch scoping, rate limiting, Helmet headers, and OWASP Top 10 mitigation).
- [x] **Phase 9:** Testing & Quality Assurance (Automated unit tests for payroll/leave, API integration tests for auth/rbac/employees/csv, and 100% test pass rate across 25 automated tests).
- [x] **Phase 10:** Production Deployment & Operations Preparation (Production configs, `.env.example`, multi-stage Dockerfile, docker-compose.yml, CI/CD pipeline, health checks, backup/recovery runbooks, and rollback procedures).

---

## 8. Backend API & Database Architecture

EmployeeHub runs as a unified single-process application delivering both the static web frontend and authenticated REST APIs on port 3000.

### Core API Endpoints
- **Authentication:** `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/request-reset`, `POST /api/auth/reset-password`
- **User Management:** `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, `POST /api/users/:id/toggle-status`, `POST /api/users/:id/reset-password`
- **Roles & Permissions:** `GET /api/roles`, `GET /api/roles/permissions`
- **Branches:** `GET /api/branches`, `POST /api/branches`, `GET /api/branches/:id`, `PATCH /api/branches/:id`, `DELETE /api/branches/:id`
- **Employees:** `GET /api/employees`, `POST /api/employees`, `GET /api/employees/:id`, `PATCH /api/employees/:id`, `POST /api/employees/:id/toggle-status`
- **Payroll:** `GET /api/payroll/stats`, `GET /api/payroll/batches`, `POST /api/payroll/batches`, `POST /api/payroll/batches/:id/advance-status`, `GET /api/payroll/payslips/:id`
- **Attendance:** `GET /api/attendance/stats`, `GET /api/attendance/records`, `POST /api/attendance/mark`, `POST /api/attendance/roster-bulk`, `GET /api/attendance/settings`, `PATCH /api/attendance/settings`
- **Leave:** `GET /api/leave/stats`, `GET /api/leave/requests`, `POST /api/leave/apply`, `POST /api/leave/requests/:id/action`, `GET /api/leave/balances/:empId`
- **Communication:** `GET /api/notifications`, `POST /api/notifications/read`, `GET /api/announcements`, `POST /api/announcements`
- **Employee Growth:** `GET /api/growth/stats`, `GET /api/growth/cycles`, `GET /api/growth/appraisals`, `POST /api/growth/appraisals/:id/submit`, `GET /api/growth/goals`, `POST /api/growth/goals`, `GET /api/growth/skills-matrix`, `GET /api/growth/training`, `GET /api/growth/promotions`, `GET /api/growth/feedback`, `POST /api/growth/feedback`
- **Administration & Reports:** `GET /api/audit-logs`, `GET /api/reports/headcount`, `GET /api/reports/payroll`, `GET /api/reports/attendance`, `GET /api/reports/performance`, `POST /api/csv/import/employees`, `GET /api/csv/export/employees`, `GET /api/csv/export/audit-logs`, `GET /api/settings`, `PATCH /api/settings`
- **Health & Monitoring:** `GET /api/health`, `GET /api/health/live`, `GET /api/health/ready`

---

## 9. How to Install, Test & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations & Seeds
```bash
npm run migrate
npm run seed
```

### 3. Run Automated Tests
```bash
npm test
```
*Executes all 25 unit and API integration tests in `test/**/*.test.js` with full test assertions.*

### 4. Start Full-Stack Server
```bash
npm start
```
*Application opens at `http://localhost:3000` with both frontend and backend live.*

### Default Demo Credentials
- **Super Administrator:** `admin@employeehub.demo` / `Admin@12345`
- **HR Administrator:** `hr@employeehub.demo` / `Admin@12345`
- **Payroll Administrator:** `payroll@employeehub.demo` / `Admin@12345`
- **Branch Manager (Mumbai West):** `bom.manager@employeehub.demo` / `Admin@12345`
- **Employee (Priya Sharma - ESS):** `priya.sharma@employeehub.demo` / `Admin@12345`



