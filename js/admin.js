/**
 * EmployeeHub — Phase 6: System Administration, Reports, Audit Logs, and CSV Engine
 * Namespace: window.EmployeeHub.admin
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.admin = (function () {
  'use strict';

  let currentAdminTab = 'users';
  let cachedUsers = [];
  let pendingImportCsvText = null;

  function init() {
    setupTabListeners();
    setupFormListeners();
  }

  function setupTabListeners() {
    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-admin-tab');
        switchAdminTab(tab);
      });
    });
  }

  const adminMeta = {
    users: { title: 'User Management & Credentials', breadcrumb: 'System / User Management' },
    roles: { title: 'Role-Based Access Control (RBAC)', breadcrumb: 'System / Roles & Permissions' },
    audit: { title: 'Security & Operational Audit Logs', breadcrumb: 'System / Audit Logs' },
    reports: { title: 'Advanced Reports & Analytics', breadcrumb: 'System / Reports' },
    import: { title: 'CSV Import & Export Engine', breadcrumb: 'System / CSV Import & Export' },
    settings: { title: 'System Settings & Configuration', breadcrumb: 'System / Settings' }
  };

  function switchAdminTab(tabName) {
    currentAdminTab = tabName;

    // 1. In-page sub-tabs synchronization
    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
      if (btn.getAttribute('data-admin-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 2. Sidebar navigation link synchronization (only 1 option active)
    document.querySelectorAll('[data-admin-nav]').forEach(link => {
      if (link.getAttribute('data-admin-nav') === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 3. Update topbar title & breadcrumb
    const meta = adminMeta[tabName];
    if (meta) {
      const pageTitleElem = document.getElementById('topbarPageTitle');
      const breadcrumbElem = document.getElementById('topbarBreadcrumbCurrent');
      if (pageTitleElem) pageTitleElem.textContent = meta.title;
      if (breadcrumbElem) breadcrumbElem.textContent = meta.breadcrumb;
    }

    // 4. Switch active tab panel
    document.querySelectorAll('.admin-tab-panel').forEach(p => p.style.display = 'none');
    const panel = document.getElementById(`panelAdmin_${tabName}`);
    if (panel) panel.style.display = 'block';

    switch (tabName) {
      case 'users':
        loadUsersTable();
        break;
      case 'roles':
        loadRolesView();
        break;
      case 'audit':
        loadAuditLogs();
        break;
      case 'reports':
        loadReportsView();
        break;
      case 'import':
        initCsvImportView();
        break;
      case 'settings':
        loadSystemSettings();
        break;
    }
  }

  // 1. User Management
  async function loadUsersTable() {
    const tbody = document.getElementById('tbodyUsersList');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px;">Loading users...</td></tr>';

    try {
      const res = await window.EmployeeHub.api.get('/api/users');
      if (res.success && res.users) {
        cachedUsers = res.users;
        renderUsers(res.users);
      }
    } catch (e) {
      // Fallback demo users if offline
      const mockUsers = [
        { id: 'usr_superadmin', full_name: 'Chief Administrator', email: 'admin@employeehub.demo', role_name: 'Super Administrator', branch_scope: 'All', status: 'Active', last_login_at: '2026-10-14 00:30' },
        { id: 'usr_hr_admin', full_name: 'Aarav Patel (HR Lead)', email: 'hr@employeehub.demo', role_name: 'HR Administrator', branch_scope: 'All', status: 'Active', last_login_at: '2026-10-13 18:15' },
        { id: 'usr_payroll_admin', full_name: 'Ananya Mukherjee (Payroll)', email: 'payroll@employeehub.demo', role_name: 'Payroll Administrator', branch_scope: 'All', status: 'Active', last_login_at: '2026-10-13 14:00' },
        { id: 'usr_bom_mgr', full_name: 'Pooja Mehta (Mumbai Mgr)', email: 'bom.manager@employeehub.demo', role_name: 'Branch Manager', branch_scope: 'Mumbai West', status: 'Active', last_login_at: '2026-10-12 11:45' },
        { id: 'usr_priya_emp', full_name: 'Priya Sharma', email: 'priya.sharma@employeehub.demo', role_name: 'Employee', branch_scope: 'Bengaluru HQ', status: 'Active', last_login_at: '2026-10-14 01:00' }
      ];
      cachedUsers = mockUsers;
      renderUsers(mockUsers);
    }
  }

  function renderUsers(users) {
    const tbody = document.getElementById('tbodyUsersList');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--color-text-muted);">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(u.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">${window.EmployeeHub.utils.escapeHTML(u.email)}</div>
        </td>
        <td><span class="badge badge-brand">${window.EmployeeHub.utils.escapeHTML(u.role_name || u.role_id)}</span></td>
        <td>${window.EmployeeHub.utils.escapeHTML(u.branch_scope || 'All')}</td>
        <td>${u.employee_id ? `<span class="badge badge-neutral">${u.employee_id}</span>` : '<span style="color:var(--color-text-muted)">--</span>'}</td>
        <td>
          <span class="user-status-pill ${u.status === 'Active' ? 'user-status-active' : 'user-status-inactive'}">
            ● ${u.status}
          </span>
        </td>
        <td style="font-size: 0.75rem; color: var(--color-text-muted);">${u.last_login_at || 'Never'}</td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.admin.toggleUserStatus('${u.id}')">
              ${u.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.admin.openResetPasswordModal('${u.id}', '${window.EmployeeHub.utils.escapeHTML(u.email)}')">
              Reset Pwd
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function toggleUserStatus(userId) {
    try {
      const res = await window.EmployeeHub.api.post(`/api/users/${userId}/toggle-status`, {});
      if (res.success) {
        window.EmployeeHub.app.showToast(`User status updated to ${res.status}.`, 'success');
        loadUsersTable();
      }
    } catch (e) {
      window.EmployeeHub.app.showToast(e.message, 'error');
    }
  }

  function openCreateUserModal() {
    const modal = document.getElementById('modalCreateUser');
    if (modal) modal.classList.add('active');
  }

  function openResetPasswordModal(userId, email) {
    document.getElementById('resetTargetUserId').value = userId;
    document.getElementById('resetTargetEmail').textContent = email;
    const modal = document.getElementById('modalResetPassword');
    if (modal) modal.classList.add('active');
  }

  // 2. Roles & Permissions
  async function loadRolesView() {
    const container = document.getElementById('gridRolesList');
    if (!container) return;

    try {
      const res = await window.EmployeeHub.api.get('/api/roles');
      if (res.success && res.roles) {
        renderRoles(res.roles);
      }
    } catch (e) {
      // Fallback roles
      renderRoles([
        { id: 'role_superadmin', name: 'Super Administrator', description: 'Full nationwide administrative access across all modules', is_system: 1, permissions: [{ name: 'All (*)' }] },
        { id: 'role_hr_admin', name: 'HR Administrator', description: 'Employee management, branch coordination, leave, and talent growth', is_system: 1, permissions: [{ name: 'manage_employees' }, { name: 'manage_leave' }, { name: 'manage_growth' }] },
        { id: 'role_branch_mgr', name: 'Branch Manager', description: 'Branch-level staff administration, attendance roster, and leave approvals', is_system: 1, permissions: [{ name: 'view_attendance' }, { name: 'manage_attendance' }, { name: 'manage_leave' }] },
        { id: 'role_payroll_admin', name: 'Payroll Administrator', description: 'Salary configurations, batch runs, statutory compliance, and payslips', is_system: 1, permissions: [{ name: 'view_payroll' }, { name: 'manage_payroll' }] },
        { id: 'role_employee', name: 'Employee', description: 'Employee Self-Service (ESS), personal goals, leave applications, peer kudos', is_system: 1, permissions: [{ name: 'view_dashboard' }, { name: 'view_growth' }] }
      ]);
    }
  }

  function renderRoles(roles) {
    const container = document.getElementById('gridRolesList');
    if (!container) return;

    container.innerHTML = roles.map(r => `
      <div class="card" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="margin: 0; font-size: 1.0625rem; font-weight: 700; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(r.name)}</h4>
          ${r.is_system ? '<span class="badge badge-brand">System Role</span>' : ''}
        </div>
        <p style="font-size: 0.8125rem; color: var(--color-text-secondary); margin-bottom: 16px;">${window.EmployeeHub.utils.escapeHTML(r.description || '')}</p>
        <div>
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 8px;">CONFIGURED PERMISSIONS</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${(r.permissions || []).map(p => `<span class="badge badge-neutral" style="font-family: var(--font-mono); font-size: 0.6875rem;">${p.name}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  // 3. Audit Logs
  async function loadAuditLogs() {
    const tbody = document.getElementById('tbodyAuditLogs');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px;">Loading audit events...</td></tr>';

    try {
      const res = await window.EmployeeHub.api.get('/api/audit-logs');
      if (res.success && res.logs) {
        renderAuditLogs(res.logs);
      }
    } catch (e) {
      renderAuditLogs([
        { timestamp: new Date().toISOString(), acting_user_name: 'Chief Administrator', action: 'SYSTEM_STARTUP', target_type: 'SYSTEM', branch_context: 'All Branches', outcome: 'SUCCESS', details: { note: 'Backend initialized successfully' } },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), acting_user_name: 'Chief Administrator', action: 'LOGIN_SUCCESS', target_type: 'USER', branch_context: 'All Branches', outcome: 'SUCCESS', details: { ip: '127.0.0.1' } }
      ]);
    }
  }

  function renderAuditLogs(logs) {
    const tbody = document.getElementById('tbodyAuditLogs');
    if (!tbody) return;

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--color-text-muted);">No audit events recorded.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let badgeClass = 'audit-action-update';
      if (l.action.includes('CREATE') || l.action.includes('PROVISION')) badgeClass = 'audit-action-create';
      if (l.action.includes('DELETE')) badgeClass = 'audit-action-delete';
      if (l.action.includes('LOGIN') || l.action.includes('AUTH') || l.action.includes('PASSWORD')) badgeClass = 'audit-action-auth';

      return `
        <tr>
          <td style="font-size: 0.75rem; font-family: var(--font-mono);">${l.timestamp}</td>
          <td><strong>${window.EmployeeHub.utils.escapeHTML(l.acting_user_name || 'System')}</strong></td>
          <td><span class="audit-action-badge ${badgeClass}">${window.EmployeeHub.utils.escapeHTML(l.action)}</span></td>
          <td>${window.EmployeeHub.utils.escapeHTML(l.target_type)}</td>
          <td>${window.EmployeeHub.utils.escapeHTML(l.branch_context || 'All')}</td>
          <td><span class="badge ${l.outcome === 'SUCCESS' ? 'badge-success' : 'badge-danger'}">${l.outcome}</span></td>
          <td style="font-size: 0.75rem; font-family: var(--font-mono); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title='${JSON.stringify(l.details || {})}'>
            ${JSON.stringify(l.details || {})}
          </td>
        </tr>
      `;
    }).join('');
  }

  // 4. Advanced Reports View
  async function loadReportsView() {
    loadHeadcountReport();
  }

  async function loadHeadcountReport() {
    const tbody = document.getElementById('tbodyHeadcountReport');
    if (!tbody) return;

    try {
      const res = await window.EmployeeHub.api.get('/api/reports/headcount');
      if (res.success && res.report && res.report.length > 0) {
        tbody.innerHTML = res.report.map(r => `
          <tr>
            <td><strong>${window.EmployeeHub.utils.escapeHTML(r.branch_name)}</strong></td>
            <td>${window.EmployeeHub.utils.escapeHTML(r.department)}</td>
            <td>${window.EmployeeHub.utils.escapeHTML(r.designation)}</td>
            <td><span class="badge badge-success">${r.status}</span></td>
            <td style="font-weight: 700;">${r.employee_count}</td>
            <td>₹${Number(r.avg_basic_salary).toLocaleString('en-IN')}</td>
            <td>${r.avg_rating} / 5.0</td>
          </tr>
        `).join('');
        return;
      }
    } catch (e) {
      console.warn('Reports load error:', e);
    }

    // Fallback if offline
    const fallback = [
      { branch_name: 'Bengaluru HQ', department: 'Engineering', designation: 'Senior Frontend Engineer', status: 'Active', employee_count: 3, avg_basic_salary: 85000, avg_rating: 4.2 },
      { branch_name: 'Bengaluru HQ', department: 'Product', designation: 'Product Manager', status: 'Active', employee_count: 2, avg_basic_salary: 92000, avg_rating: 4.5 },
      { branch_name: 'Mumbai West', department: 'Sales', designation: 'Account Executive', status: 'Active', employee_count: 4, avg_basic_salary: 58000, avg_rating: 3.8 },
      { branch_name: 'Delhi NCR', department: 'Operations', designation: 'Ops Specialist', status: 'Active', employee_count: 2, avg_basic_salary: 48000, avg_rating: 3.9 }
    ];
    tbody.innerHTML = fallback.map(r => `
      <tr>
        <td><strong>${window.EmployeeHub.utils.escapeHTML(r.branch_name)}</strong></td>
        <td>${window.EmployeeHub.utils.escapeHTML(r.department)}</td>
        <td>${window.EmployeeHub.utils.escapeHTML(r.designation)}</td>
        <td><span class="badge badge-success">${r.status}</span></td>
        <td style="font-weight: 700;">${r.employee_count}</td>
        <td>₹${Number(r.avg_basic_salary).toLocaleString('en-IN')}</td>
        <td>${r.avg_rating} / 5.0</td>
      </tr>
    `).join('');
  }

  // 5. CSV Import & Export View
  function initCsvImportView() {
    const dropzone = document.getElementById('csvDropzone');
    const fileInput = document.getElementById('csvFileInput');

    if (dropzone && fileInput) {
      dropzone.onclick = () => fileInput.click();

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) handleCsvFile(file);
      };
    }
  }

  function handleCsvFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      pendingImportCsvText = e.target.result;
      document.getElementById('importFileName').textContent = file.name;
      document.getElementById('importFileBox').style.display = 'block';

      // Automatically run dry-run validation preview
      await runDryRunValidation(pendingImportCsvText);
    };
    reader.readAsText(file);
  }

  async function runDryRunValidation(csvText) {
    const previewContainer = document.getElementById('importPreviewArea');
    if (!previewContainer) return;

    previewContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Validating CSV structure and branch references...</div>';

    try {
      const res = await window.EmployeeHub.api.uploadCsv('/api/csv/import/employees', csvText, false);
      if (res.success) {
        previewContainer.innerHTML = `
          <div class="import-summary-box">
            <div class="import-stat-card">
              <span class="growth-metric-label">Total Rows Analyzed</span>
              <div class="import-stat-val">${res.totalRows}</div>
            </div>
            <div class="import-stat-card">
              <span class="growth-metric-label" style="color: #059669;">Valid Records</span>
              <div class="import-stat-val" style="color: #059669;">${res.validCount}</div>
            </div>
            <div class="import-stat-card">
              <span class="growth-metric-label" style="color: #dc2626;">Validation Errors</span>
              <div class="import-stat-val" style="color: #dc2626;">${res.errorCount}</div>
            </div>
          </div>

          ${res.errorCount > 0 ? `
            <div class="alert alert-danger" style="margin-bottom: 16px;">
              <strong>Row-Level Errors Detected:</strong>
              <ul style="margin: 6px 0 0 16px;">
                ${res.errors.map(err => `<li>Row ${err.row}: ${window.EmployeeHub.utils.escapeHTML(err.error)}</li>`).join('')}
              </ul>
            </div>
          ` : `
            <div class="alert alert-success" style="margin-bottom: 16px;">
              ✓ All records passed validation checks. Ready for atomic database import.
            </div>
          `}

          <div style="display: flex; gap: 12px; margin-top: 16px;">
            <button type="button" class="btn btn-primary" onclick="window.EmployeeHub.admin.commitCsvImport()" ${res.errorCount > 0 ? 'disabled' : ''}>
              Commit Safe Import to Database
            </button>
            <button type="button" class="btn btn-secondary" onclick="window.EmployeeHub.admin.cancelCsvImport()">
              Cancel
            </button>
          </div>
        `;
      }
    } catch (e) {
      previewContainer.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  async function commitCsvImport() {
    if (!pendingImportCsvText) return;
    try {
      const res = await window.EmployeeHub.api.uploadCsv('/api/csv/import/employees', pendingImportCsvText, true);
      if (res.success) {
        window.EmployeeHub.app.showToast(`Import Success: ${res.importedCount} employees added!`, 'success');
        cancelCsvImport();
        // Refresh employees table
        if (window.EmployeeHub.employees) window.EmployeeHub.employees.refreshData();
      }
    } catch (e) {
      window.EmployeeHub.app.showToast(e.message, 'error');
    }
  }

  function cancelCsvImport() {
    pendingImportCsvText = null;
    const box = document.getElementById('importFileBox');
    if (box) box.style.display = 'none';
    const preview = document.getElementById('importPreviewArea');
    if (preview) preview.innerHTML = '';
  }

  function downloadSampleCsv() {
    const sample = `ID,Name,Email,Phone,Designation,Department,Branch,Basic Salary\r\nEMP-1025,Tanvi Verma,tanvi.verma@employeehub.demo,+91 98765 43220,Product Analyst,Product,Bengaluru HQ,65000\r\nEMP-1026,Manish Chawla,manish.chawla@employeehub.demo,+91 98765 43221,QA Automation Lead,Engineering,Mumbai West,75000\r\n`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employeehub_sample_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // 6. System Settings View
  async function loadSystemSettings() {
    try {
      const res = await window.EmployeeHub.api.get('/api/settings');
      if (res.success && res.settings) {
        const s = res.settings;
        document.getElementById('settingsOrgName').value = s.org_name || '';
        document.getElementById('settingsOrgCode').value = s.org_code || '';
        document.getElementById('settingsContactEmail').value = s.contact_email || '';
        document.getElementById('settingsTimezone').value = s.timezone || 'Asia/Kolkata (IST)';
        document.getElementById('settingsCurrency').value = s.currency || 'INR (₹)';
        document.getElementById('settingsSessionTimeout').value = s.session_timeout_mins || 1440;
      }
    } catch (e) {
      console.warn('Settings load error:', e);
    }
  }

  function setupFormListeners() {
    // Create User Form
    const formUser = document.getElementById('formCreateUser');
    if (formUser) {
      formUser.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          fullName: document.getElementById('newUserFullName').value,
          email: document.getElementById('newUserEmail').value,
          password: document.getElementById('newUserPassword').value,
          roleId: document.getElementById('newUserRole').value,
          branchScope: document.getElementById('newUserBranchScope').value
        };
        try {
          const res = await window.EmployeeHub.api.post('/api/users', payload);
          if (res.success) {
            window.EmployeeHub.app.showToast('User created successfully!', 'success');
            document.getElementById('modalCreateUser').classList.remove('active');
            formUser.reset();
            loadUsersTable();
          }
        } catch (err) {
          window.EmployeeHub.app.showToast(err.message, 'error');
        }
      });
    }

    // Reset Password Form
    const formReset = document.getElementById('formResetPassword');
    if (formReset) {
      formReset.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('resetTargetUserId').value;
        const newPassword = document.getElementById('adminNewPassword').value;
        try {
          const res = await window.EmployeeHub.api.post(`/api/users/${userId}/reset-password`, { newPassword });
          if (res.success) {
            window.EmployeeHub.app.showToast('Password reset successfully!', 'success');
            document.getElementById('modalResetPassword').classList.remove('active');
            formReset.reset();
          }
        } catch (err) {
          window.EmployeeHub.app.showToast(err.message, 'error');
        }
      });
    }

    // Settings Form
    const formSettings = document.getElementById('formSystemSettings');
    if (formSettings) {
      formSettings.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          orgName: document.getElementById('settingsOrgName').value,
          orgCode: document.getElementById('settingsOrgCode').value,
          contactEmail: document.getElementById('settingsContactEmail').value,
          timezone: document.getElementById('settingsTimezone').value,
          currency: document.getElementById('settingsCurrency').value,
          sessionTimeoutMins: document.getElementById('settingsSessionTimeout').value
        };
        try {
          const res = await window.EmployeeHub.api.patch('/api/settings', payload);
          if (res.success) {
            window.EmployeeHub.app.showToast('System settings saved successfully!', 'success');
          }
        } catch (err) {
          window.EmployeeHub.app.showToast(err.message, 'error');
        }
      });
    }
  }

  return {
    init,
    switchAdminTab,
    loadUsersTable,
    toggleUserStatus,
    openCreateUserModal,
    openResetPasswordModal,
    commitCsvImport,
    cancelCsvImport,
    downloadSampleCsv,
    getCurrentTab: () => currentAdminTab
  };
})();
