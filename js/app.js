/**
 * Main Application Orchestrator & Toast System
 * Namespace: window.EmployeeHub
 */
window.EmployeeHub = window.EmployeeHub || {};

// Toast System
window.EmployeeHub.toast = (function () {
  'use strict';

  function show(title, message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    switch (type) {
      case 'success':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        break;
      case 'warning':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        break;
      case 'danger':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        break;
      default:
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon-wrap">${iconSvg}</div>
      <div class="toast-body">
        <span class="toast-title">${window.EmployeeHub.utils.escapeHTML(title)}</span>
        <span class="toast-message">${window.EmployeeHub.utils.escapeHTML(message)}</span>
      </div>
      <button class="toast-close-btn" aria-label="Close notification">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 250);
    };

    if (closeBtn) closeBtn.onclick = dismiss;

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  return { show };
})();

// Application Bootstrap
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // 1. Live Date & Time Display
  function updateLiveDate() {
    const dateElem = document.getElementById('topbarCurrentDate');
    if (dateElem) {
      const now = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateElem.textContent = now.toLocaleDateString('en-IN', options);
    }

    // Dynamic greeting
    const greetingElem = document.getElementById('welcomeGreetingText');
    if (greetingElem) {
      const greeting = window.EmployeeHub.utils.getTimeGreeting();
      greetingElem.textContent = `${greeting}, Admin`;
    }
  }
  updateLiveDate();

  // 2. Initialize Navigation
  if (window.EmployeeHub.navigation) {
    window.EmployeeHub.navigation.initNavigation();
  }

  // 3. Initialize Modals
  if (window.EmployeeHub.modals) {
    window.EmployeeHub.modals.initModalListeners();
  }

  // 4. Initialize Dashboard & Tables
  if (window.EmployeeHub.dashboard) {
    window.EmployeeHub.dashboard.initDashboard();
  }

  // 4b. Initialize Branch Management
  if (window.EmployeeHub.branches) {
    window.EmployeeHub.branches.initBranchesModule();
  }

  // 4c. Initialize Employee Management
  if (window.EmployeeHub.employees) {
    window.EmployeeHub.employees.initEmployeesModule();
  }

  // 4d. Initialize Phase 3 Payroll & Salary Configuration Modules
  if (window.EmployeeHub.payrollStore) {
    window.EmployeeHub.payrollStore.init();
  }
  if (window.EmployeeHub.salaryConfig) {
    window.EmployeeHub.salaryConfig.initSalaryConfigModule();
  }
  if (window.EmployeeHub.payroll) {
    window.EmployeeHub.payroll.initPayrollModule();
  }

  // 4e. Initialize Phase 4 Attendance, Leave, Communication & ESS Modules
  if (window.EmployeeHub.attendanceStore) {
    window.EmployeeHub.attendanceStore.init();
  }
  if (window.EmployeeHub.attendance) {
    window.EmployeeHub.attendance.initAttendanceModule();
  }
  if (window.EmployeeHub.leave) {
    window.EmployeeHub.leave.initLeaveModule();
  }
  if (window.EmployeeHub.communication) {
    window.EmployeeHub.communication.initCommunicationModule();
  }
  if (window.EmployeeHub.ess) {
    window.EmployeeHub.ess.initEssModule();
  }
  if (window.EmployeeHub.growth) {
    window.EmployeeHub.growth.initGrowthModule();
  }

  // 4f. Initialize Phase 6 Administration & Authentication
  if (window.EmployeeHub.auth) {
    window.EmployeeHub.auth.init();
  }
  if (window.EmployeeHub.admin) {
    window.EmployeeHub.admin.init();
  }

  // 5. Initialize Charts
  if (window.EmployeeHub.charts) {
    window.EmployeeHub.charts.initCharts();
  }

  // 6. Initialize Global Search
  if (window.EmployeeHub.search) {
    window.EmployeeHub.search.initSearch();
  }

  // 7. Initialize Notifications
  if (window.EmployeeHub.notifications) {
    window.EmployeeHub.notifications.initNotifications();
  }

  // 8. Re-initialize Lucide Icons if loaded
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // 9. Attach global demo button handlers
  const btnReportsPreview = document.getElementById('btnReportsPreview');
  if (btnReportsPreview) {
    btnReportsPreview.addEventListener('click', function () {
      window.EmployeeHub.navigation.navigateTo('view-admin');
      if (window.EmployeeHub.admin) window.EmployeeHub.admin.switchAdminTab('reports');
    });
  }

  const btnViewAllCandidates = document.getElementById('btnViewAllCandidates');
  if (btnViewAllCandidates) {
    btnViewAllCandidates.addEventListener('click', function () {
      window.EmployeeHub.navigation.navigateTo('view-growth');
    });
  }

  const btnViewAllNotifications = document.getElementById('btnViewAllNotifications');
  if (btnViewAllNotifications) {
    btnViewAllNotifications.addEventListener('click', function () {
      window.EmployeeHub.navigation.navigateTo('view-notifications');
    });
  }

  // Profile Menu Demo Actions
  const btnDemoSignOut = document.getElementById('btnDemoSignOut');
  if (btnDemoSignOut) {
    btnDemoSignOut.addEventListener('click', function () {
      if (window.EmployeeHub.auth) {
        window.EmployeeHub.auth.logout();
      } else {
        window.EmployeeHub.toast.show('Sign Out', 'Session cleared.', 'info');
      }
    });
  }

  const btnDemoProfile = document.getElementById('btnDemoProfile');
  if (btnDemoProfile) {
    btnDemoProfile.addEventListener('click', function () {
      const u = window.EmployeeHub.auth ? window.EmployeeHub.auth.getCurrentUser() : null;
      window.EmployeeHub.toast.show(
        'User Profile',
        u ? `Logged in as ${u.fullName} (${u.roleName}) • Scope: ${u.branchScope || 'All'}` : 'Guest Profile',
        'info',
        4000
      );
    });
  }

  // Welcome Toast on First Load
  setTimeout(() => {
    window.EmployeeHub.toast.show(
      'EmployeeHub Enterprise Active',
      'Phases 1–10 Fully Integrated: Multi-branch HRMS, Payroll, Attendance, Growth, RBAC, and Backend API are live.',
      'success',
      3800
    );
  }, 600);
});

// App Helper Namespace Bridge
window.EmployeeHub.app = {
  showToast: function (message, type = 'info', title = 'EmployeeHub') {
    window.EmployeeHub.toast.show(title, message, type);
  }
};
