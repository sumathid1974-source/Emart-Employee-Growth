/**
 * Application Navigation & Layout State Controller
 * Namespace: window.EmployeeHub.navigation
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.navigation = (function () {
  'use strict';

  let currentViewId = 'view-dashboard';
  let isProfileDropdownOpen = false;

  const viewMetadata = {
    'view-dashboard': {
      title: 'Dashboard Overview',
      breadcrumb: 'Overview'
    },
    'view-branches': {
      title: 'Branch Management',
      breadcrumb: 'Operations / Branches'
    },
    'view-employees': {
      title: 'Employee Management',
      breadcrumb: 'Operations / Employees'
    },
    'view-growth': {
      title: 'Growth & Performance Dashboard',
      breadcrumb: 'Growth / Dashboard'
    },
    'view-growth-dashboard': {
      title: 'Growth & Performance Dashboard',
      breadcrumb: 'Growth / Dashboard'
    },
    'view-reviews': {
      title: 'Performance Reviews & Appraisals',
      breadcrumb: 'Growth / Reviews'
    },
    'view-goals': {
      title: 'Goal Management & OKRs',
      breadcrumb: 'Growth / Goals'
    },
    'view-dev-plans': {
      title: 'Individual Development Plans',
      breadcrumb: 'Growth / Dev Plans'
    },
    'view-skills-matrix': {
      title: 'Skills & Competency Matrix',
      breadcrumb: 'Growth / Skills'
    },
    'view-training': {
      title: 'Training & Learning Management',
      breadcrumb: 'Growth / Training'
    },
    'view-promotions': {
      title: 'Promotion Recommendations',
      breadcrumb: 'Growth / Promotions'
    },
    'view-career-paths': {
      title: 'Career Paths & Progression',
      breadcrumb: 'Growth / Career Paths'
    },
    'view-feedback': {
      title: 'Feedback & Recognition',
      breadcrumb: 'Growth / Feedback'
    },
    'view-growth-reports': {
      title: 'Growth & Performance Reports',
      breadcrumb: 'Growth / Reports'
    },
    'view-salary-config': {
      title: 'Salary Configuration',
      breadcrumb: 'Payroll / Salary Configuration'
    },
    'view-payroll': {
      title: 'Payroll Management',
      breadcrumb: 'Payroll / Dashboard'
    },
    'view-payroll-history': {
      title: 'Payroll History & Batches',
      breadcrumb: 'Payroll / History'
    },
    'view-payslips': {
      title: 'Employee Payslips',
      breadcrumb: 'Payroll / Payslips'
    },
    'view-attendance-dashboard': {
      title: 'Attendance Dashboard',
      breadcrumb: 'Attendance / Dashboard'
    },
    'view-attendance-records': {
      title: 'Attendance Records & History',
      breadcrumb: 'Attendance / Records'
    },
    'view-attendance-daily': {
      title: 'Daily Attendance Entry',
      breadcrumb: 'Attendance / Daily Entry'
    },
    'view-attendance-settings': {
      title: 'Attendance Rules & Settings',
      breadcrumb: 'Attendance / Settings'
    },
    'view-leave-dashboard': {
      title: 'Leave Dashboard',
      breadcrumb: 'Leave / Dashboard'
    },
    'view-leave-requests': {
      title: 'Leave Requests',
      breadcrumb: 'Leave / Requests'
    },
    'view-leave-approvals': {
      title: 'Leave Approvals Queue',
      breadcrumb: 'Leave / Approvals'
    },
    'view-leave-types': {
      title: 'Leave Types & Balances',
      breadcrumb: 'Leave / Quotas & Balances'
    },
    'view-notifications': {
      title: 'Notification Center & Preferences',
      breadcrumb: 'Communication / Notifications'
    },
    'view-announcements': {
      title: 'Company Announcements',
      breadcrumb: 'Communication / Announcements'
    },
    'view-ess': {
      title: 'Employee Self-Service (Demo Portal)',
      breadcrumb: 'Self-Service / Portal'
    },
    'view-admin': {
      title: 'System Administration & Governance',
      breadcrumb: 'System / Administration'
    },
    'view-reports': {
      title: 'Advanced Reports & Analytics',
      breadcrumb: 'System / Reports'
    },
    'view-settings': {
      title: 'System Settings & Preferences',
      breadcrumb: 'System / Settings'
    }
  };

  /**
   * Initialize navigation controls
   */
  function initNavigation() {
    initSidebarToggle();
    initMobileDrawer();
    initNavLinks();
    initProfileDropdown();
    restoreSidebarState();
    initHashRouting();
  }

  function initHashRouting() {
    function handleHash() {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        let viewId = `view-${hash}`;
        if (hash === 'overview') viewId = 'view-dashboard';
        else if (hash === 'branches') viewId = 'view-branches';
        else if (hash === 'employees') viewId = 'view-employees';
        else if (hash === 'ess') viewId = 'view-ess';
        else if (hash === 'growth' || hash === 'growth-dashboard') viewId = 'view-growth-dashboard';
        else if (hash === 'reviews') viewId = 'view-reviews';
        else if (hash === 'goals') viewId = 'view-goals';
        else if (hash === 'dev-plans') viewId = 'view-dev-plans';
        else if (hash === 'skills-matrix') viewId = 'view-skills-matrix';
        else if (hash === 'training') viewId = 'view-training';
        else if (hash === 'promotions') viewId = 'view-promotions';
        else if (hash === 'career-paths') viewId = 'view-career-paths';
        else if (hash === 'feedback') viewId = 'view-feedback';
        else if (hash === 'growth-reports') viewId = 'view-growth-reports';
        else if (hash === 'salary-config') viewId = 'view-salary-config';
        else if (hash === 'payroll') viewId = 'view-payroll';
        else if (hash === 'payroll-history') viewId = 'view-payroll-history';
        else if (hash === 'payslips') viewId = 'view-payslips';
        else if (hash === 'attendance-dashboard') viewId = 'view-attendance-dashboard';
        else if (hash === 'attendance-records') viewId = 'view-attendance-records';
        else if (hash === 'attendance-daily') viewId = 'view-attendance-daily';
        else if (hash === 'attendance-settings') viewId = 'view-attendance-settings';
        else if (hash === 'leave-dashboard') viewId = 'view-leave-dashboard';
        else if (hash === 'leave-requests') viewId = 'view-leave-requests';
        else if (hash === 'leave-approvals') viewId = 'view-leave-approvals';
        else if (hash === 'leave-types') viewId = 'view-leave-types';
        else if (hash === 'notifications') viewId = 'view-notifications';
        else if (hash === 'announcements') viewId = 'view-announcements';
        else if (hash === 'admin' || hash === 'view-admin') {
          viewId = 'view-admin';
        } else if (hash.startsWith('admin-')) {
          viewId = 'view-admin';
          const subTab = hash.replace('admin-', '');
          if (window.EmployeeHub.admin && window.EmployeeHub.admin.switchAdminTab) {
            setTimeout(() => window.EmployeeHub.admin.switchAdminTab(subTab), 50);
          }
        } else if (hash === 'reports') {
          viewId = 'view-admin';
          if (window.EmployeeHub.admin && window.EmployeeHub.admin.switchAdminTab) {
            setTimeout(() => window.EmployeeHub.admin.switchAdminTab('reports'), 50);
          }
        } else if (hash === 'settings') {
          viewId = 'view-admin';
          if (window.EmployeeHub.admin && window.EmployeeHub.admin.switchAdminTab) {
            setTimeout(() => window.EmployeeHub.admin.switchAdminTab('settings'), 50);
          }
        }

        if (document.getElementById(viewId)) {
          navigateTo(viewId);
        }
      }
    }
    window.addEventListener('hashchange', handleHash);
    if (window.location.hash) {
      setTimeout(handleHash, 50);
    }
  }

  /**
   * Sidebar Collapse/Expand Toggle on Desktop
   */
  function initSidebarToggle() {
    const toggleBtn = document.getElementById('btnSidebarCollapse');
    const sidebar = document.getElementById('mainSidebar');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        window.EmployeeHub.utils.storage.set('sidebar_collapsed', isCollapsed);

        // Resize charts cleanly
        setTimeout(() => {
          if (window.EmployeeHub.charts && window.EmployeeHub.charts.initCharts) {
            window.EmployeeHub.charts.initCharts();
          }
        }, 300);
      });
    }
  }

  function restoreSidebarState() {
    const isCollapsed = window.EmployeeHub.utils.storage.get('sidebar_collapsed', false);
    const sidebar = document.getElementById('mainSidebar');
    if (sidebar && isCollapsed && window.innerWidth >= 1024) {
      sidebar.classList.add('collapsed');
    }
  }

  /**
   * Mobile Drawer Toggle & Backdrop
   */
  function initMobileDrawer() {
    const mobileMenuBtn = document.getElementById('btnMobileMenuToggle');
    const sidebar = document.getElementById('mainSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', function () {
        sidebar.classList.add('mobile-open');
        if (backdrop) backdrop.classList.add('active');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        closeMobileDrawer();
      });
    }
  }

  function closeMobileDrawer() {
    const sidebar = document.getElementById('mainSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  /**
   * Nav Link Click Handler
   */
  function initNavLinks() {
    document.querySelectorAll('[data-view-target]').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetView = link.getAttribute('data-view-target');
        const adminNav = link.getAttribute('data-admin-nav');
        if (adminNav && window.EmployeeHub.admin && window.EmployeeHub.admin.switchAdminTab) {
          window.EmployeeHub.admin.switchAdminTab(adminNav);
        }
        navigateTo(targetView);
        closeMobileDrawer();
      });
    });
  }

  /**
   * Switch Active View
   */
  function navigateTo(viewId) {
    if (viewId === 'view-growth') {
      viewId = 'view-growth-dashboard';
    }
    if (viewId === 'view-reports' || viewId === 'view-settings') {
      viewId = 'view-admin';
    }
    const targetElement = document.getElementById(viewId);
    if (!targetElement) return;

    // Growth sub-view mapping
    const growthSubTabMap = {
      'view-growth': 'dashboard',
      'view-growth-dashboard': 'dashboard',
      'view-reviews': 'reviews',
      'view-goals': 'goals',
      'view-dev-plans': 'devplans',
      'view-skills-matrix': 'skills',
      'view-training': 'training',
      'view-promotions': 'promotions',
      'view-career-paths': 'career',
      'view-feedback': 'feedback',
      'view-growth-reports': 'reports'
    };
    const growthSubTab = growthSubTabMap[viewId];
    let effectiveElement = targetElement;
    if (growthSubTab) {
      const growthMasterView = document.getElementById('view-growth-dashboard');
      if (growthMasterView) effectiveElement = growthMasterView;
    }

    // Update active nav link (isolating admin sub-links so only one is active at a time)
    document.querySelectorAll('[data-view-target]').forEach(link => {
      const adminNav = link.getAttribute('data-admin-nav');
      if (adminNav) {
        const currentAdminTab = (window.EmployeeHub.admin && window.EmployeeHub.admin.getCurrentTab) ? window.EmployeeHub.admin.getCurrentTab() : 'users';
        if (viewId === 'view-admin' && adminNav === currentAdminTab) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      } else {
        if (link.getAttribute('data-view-target') === viewId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });

    // Hide all views and show target
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active');
    });
    effectiveElement.classList.add('active');
    currentViewId = viewId;

    // Update Topbar Title and Breadcrumb
    let meta = viewMetadata[viewId] || { title: 'EmployeeHub', breadcrumb: 'Dashboard' };
    if (viewId === 'view-admin' && window.EmployeeHub.admin && window.EmployeeHub.admin.getCurrentTab) {
      const curTab = window.EmployeeHub.admin.getCurrentTab();
      const adminMeta = {
        users: { title: 'User Management & Credentials', breadcrumb: 'System / User Management' },
        roles: { title: 'Role-Based Access Control (RBAC)', breadcrumb: 'System / Roles & Permissions' },
        audit: { title: 'Security & Operational Audit Logs', breadcrumb: 'System / Audit Logs' },
        reports: { title: 'Advanced Reports & Analytics', breadcrumb: 'System / Reports' },
        import: { title: 'CSV Import & Export Engine', breadcrumb: 'System / CSV Import & Export' },
        settings: { title: 'System Settings & Configuration', breadcrumb: 'System / Settings' }
      };
      if (adminMeta[curTab]) {
        meta = adminMeta[curTab];
      }
    }
    const pageTitleElem = document.getElementById('topbarPageTitle');
    const breadcrumbElem = document.getElementById('topbarBreadcrumbCurrent');

    if (pageTitleElem) pageTitleElem.textContent = meta.title;
    if (breadcrumbElem) breadcrumbElem.textContent = meta.breadcrumb;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-render modules when navigating
    if (viewId === 'view-dashboard') {
      setTimeout(() => {
        if (window.EmployeeHub.charts && window.EmployeeHub.charts.initCharts) {
          window.EmployeeHub.charts.initCharts();
        }
      }, 100);
    } else if (viewId === 'view-branches') {
      if (window.EmployeeHub.branches) {
        window.EmployeeHub.branches.renderStats();
        window.EmployeeHub.branches.renderTable();
      }
    } else if (viewId === 'view-employees') {
      if (window.EmployeeHub.employees) {
        window.EmployeeHub.employees.refreshData();
      }
    } else if (viewId === 'view-salary-config') {
      if (window.EmployeeHub.salaryConfig) {
        window.EmployeeHub.salaryConfig.refresh();
      }
    } else if (viewId === 'view-payroll') {
      if (window.EmployeeHub.payroll) {
        window.EmployeeHub.payroll.refreshDashboard();
      }
    } else if (viewId === 'view-payroll-history') {
      if (window.EmployeeHub.payroll) {
        window.EmployeeHub.payroll.refreshHistory();
      }
    } else if (viewId === 'view-payslips') {
      if (window.EmployeeHub.payroll) {
        window.EmployeeHub.payroll.refreshPayslips();
      }
    } else if (viewId === 'view-attendance-dashboard') {
      if (window.EmployeeHub.attendance) {
        window.EmployeeHub.attendance.refreshDashboard();
      }
    } else if (viewId === 'view-attendance-records') {
      if (window.EmployeeHub.attendance) {
        window.EmployeeHub.attendance.renderRecordsTable();
      }
    } else if (viewId === 'view-attendance-daily') {
      if (window.EmployeeHub.attendance) {
        window.EmployeeHub.attendance.loadDailyEntryRoster();
      }
    } else if (viewId === 'view-attendance-settings') {
      if (window.EmployeeHub.attendance) {
        window.EmployeeHub.attendance.loadSettingsForm();
      }
    } else if (viewId === 'view-leave-dashboard') {
      if (window.EmployeeHub.leave) {
        window.EmployeeHub.leave.refreshLeaveDashboard();
      }
    } else if (viewId === 'view-leave-requests') {
      if (window.EmployeeHub.leave) {
        window.EmployeeHub.leave.renderLeaveRequestsTable();
      }
    } else if (viewId === 'view-leave-approvals') {
      if (window.EmployeeHub.leave) {
        window.EmployeeHub.leave.renderLeaveApprovalsQueue();
      }
    } else if (viewId === 'view-leave-types') {
      if (window.EmployeeHub.leave) {
        window.EmployeeHub.leave.renderLeaveTypesAndBalances();
      }
    } else if (viewId === 'view-notifications') {
      if (window.EmployeeHub.communication) {
        window.EmployeeHub.communication.renderNotificationCenter();
      }
    } else if (viewId === 'view-announcements') {
      if (window.EmployeeHub.communication) {
        window.EmployeeHub.communication.renderAnnouncements();
      }
    } else if (viewId === 'view-ess') {
      if (window.EmployeeHub.ess) {
        window.EmployeeHub.ess.refreshEssPortal();
      }
    } else if (viewId.startsWith('view-growth') || viewId === 'view-reviews' || viewId === 'view-goals' || viewId === 'view-dev-plans' || viewId === 'view-skills-matrix' || viewId === 'view-training' || viewId === 'view-promotions' || viewId === 'view-career-paths' || viewId === 'view-feedback' || viewId === 'view-growth-reports') {
      if (window.EmployeeHub.growth) {
        let subTab = 'dashboard';
        if (viewId === 'view-reviews') subTab = 'reviews';
        else if (viewId === 'view-goals') subTab = 'goals';
        else if (viewId === 'view-dev-plans') subTab = 'devplans';
        else if (viewId === 'view-skills-matrix') subTab = 'skills';
        else if (viewId === 'view-training') subTab = 'training';
        else if (viewId === 'view-promotions') subTab = 'promotions';
        else if (viewId === 'view-career-paths') subTab = 'career';
        else if (viewId === 'view-feedback') subTab = 'feedback';
        else if (viewId === 'view-growth-reports') subTab = 'reports';
        window.EmployeeHub.growth.switchGrowthTab(subTab);
      }
    } else if (viewId === 'view-admin') {
      if (window.EmployeeHub.admin) {
        window.EmployeeHub.admin.loadUsersTable();
      }
    }
  }

  /**
   * Topbar User Profile Dropdown
   */
  function initProfileDropdown() {
    const btn = document.getElementById('btnUserProfileDropdown');
    const dropdown = document.getElementById('userProfileDropdown');

    if (btn && dropdown) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        isProfileDropdownOpen = !isProfileDropdownOpen;
        dropdown.classList.toggle('show', isProfileDropdownOpen);
      });

      document.addEventListener('click', function (e) {
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
          dropdown.classList.remove('show');
          isProfileDropdownOpen = false;
        }
      });
    }
  }

  return {
    initNavigation,
    navigateTo,
    closeMobileDrawer,
    getCurrentView: () => currentViewId
  };
})();
