/**
 * EmployeeHub — Authentication & Session Manager
 * Namespace: window.EmployeeHub.auth
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.auth = (function () {
  'use strict';

  let currentUser = null;

  async function init() {
    setupEventListeners();
    const token = window.EmployeeHub.api.getToken();
    if (token) {
      try {
        const res = await window.EmployeeHub.api.get('/api/auth/me');
        if (res.success && res.user) {
          setCurrentUser(res.user);
          return;
        }
      } catch (e) {
        console.log('No active backend session, initializing demo administrator session.');
      }
    }

    // Attempt backend login for default Super Administrator session
    try {
      const res = await window.EmployeeHub.api.post('/api/auth/login', {
        email: 'admin@employeehub.demo',
        password: 'Admin@12345'
      });
      if (res && res.success && res.token) {
        window.EmployeeHub.api.setToken(res.token);
        setCurrentUser(res.user);
        return;
      }
    } catch (e) {
      // Fallback offline mock session
    }

    // Default to Super Administrator demo session
    setCurrentUser({
      id: 'usr_superadmin',
      email: 'admin@employeehub.demo',
      fullName: 'Chief Administrator',
      roleName: 'Super Administrator',
      roleId: 'role_superadmin',
      branchScope: 'All',
      permissions: ['*']
    });
  }

  function setCurrentUser(user) {
    currentUser = user;
    updateTopbarUI();
    // Dispatch auth state event
    window.dispatchEvent(new CustomEvent('eh-auth-changed', { detail: { user } }));
  }

  function getCurrentUser() {
    return currentUser;
  }

  function hasPermission(permissionName) {
    if (!currentUser) return false;
    if (currentUser.roleName === 'Super Administrator' || currentUser.roleId === 'role_superadmin') return true;
    if (currentUser.permissions && currentUser.permissions.includes('*')) return true;
    return !!(currentUser.permissions && currentUser.permissions.includes(permissionName));
  }

  function updateTopbarUI() {
    if (!currentUser) return;
    const nameEl = document.querySelector('.user-profile-btn .user-name');
    const roleEl = document.querySelector('.user-profile-btn .user-role');
    const avatarEl = document.querySelector('.user-profile-btn .avatar-initials');

    if (nameEl) nameEl.textContent = currentUser.fullName;
    if (roleEl) roleEl.textContent = `${currentUser.roleName} (${currentUser.branchScope || 'All'})`;
    if (avatarEl) {
      const parts = currentUser.fullName.split(' ');
      avatarEl.textContent = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    }
  }

  async function login(email, password) {
    try {
      const res = await window.EmployeeHub.api.post('/api/auth/login', { email, password });
      if (res.success && res.token) {
        window.EmployeeHub.api.setToken(res.token);
        setCurrentUser(res.user);
        if (window.EmployeeHub.app && window.EmployeeHub.app.showToast) {
          window.EmployeeHub.app.showToast(`Welcome back, ${res.user.fullName}!`, 'success');
        }
        closeLoginModal();
        return true;
      }
    } catch (err) {
      if (window.EmployeeHub.app && window.EmployeeHub.app.showToast) {
        window.EmployeeHub.app.showToast(err.message || 'Login failed.', 'error');
      }
      throw err;
    }
  }

  async function logout() {
    try {
      await window.EmployeeHub.api.post('/api/auth/logout', {});
    } catch (e) {}
    window.EmployeeHub.api.setToken(null);
    setCurrentUser(null);
    if (window.EmployeeHub.app && window.EmployeeHub.app.showToast) {
      window.EmployeeHub.app.showToast('You have been logged out.', 'info');
    }
    openLoginModal();
  }

  // Quick Demo Account Switcher
  async function quickSwitchDemoRole(roleType) {
    const demoAccounts = {
      superadmin: { email: 'admin@employeehub.demo', password: 'Admin@12345' },
      hr: { email: 'hr@employeehub.demo', password: 'Admin@12345' },
      payroll: { email: 'payroll@employeehub.demo', password: 'Admin@12345' },
      branch: { email: 'bom.manager@employeehub.demo', password: 'Admin@12345' },
      employee: { email: 'priya.sharma@employeehub.demo', password: 'Admin@12345' }
    };

    const target = demoAccounts[roleType];
    if (target) {
      try {
        await login(target.email, target.password);
      } catch (e) {
        // Fallback offline mock switch if backend is starting
        const mockRoles = {
          superadmin: { id: 'usr_superadmin', email: 'admin@employeehub.demo', fullName: 'Chief Administrator', roleName: 'Super Administrator', branchScope: 'All', permissions: ['*'] },
          hr: { id: 'usr_hr_admin', email: 'hr@employeehub.demo', fullName: 'Aarav Patel (HR Lead)', roleName: 'HR Administrator', branchScope: 'All', permissions: ['view_dashboard', 'view_employees', 'manage_employees', 'view_branches', 'manage_leave', 'view_growth', 'manage_growth'] },
          payroll: { id: 'usr_payroll_admin', email: 'payroll@employeehub.demo', fullName: 'Ananya Mukherjee (Payroll)', roleName: 'Payroll Administrator', branchScope: 'All', permissions: ['view_dashboard', 'view_payroll', 'manage_payroll'] },
          branch: { id: 'usr_bom_mgr', email: 'bom.manager@employeehub.demo', fullName: 'Pooja Mehta (Mumbai Mgr)', roleName: 'Branch Manager', branchScope: 'Mumbai West', permissions: ['view_dashboard', 'view_employees', 'view_attendance', 'manage_attendance', 'manage_leave'] },
          employee: { id: 'usr_priya_emp', email: 'priya.sharma@employeehub.demo', fullName: 'Priya Sharma', roleName: 'Employee', employeeId: 'EMP-1001', branchScope: 'Bengaluru HQ', permissions: ['view_dashboard', 'view_growth'] }
        };
        setCurrentUser(mockRoles[roleType]);
        if (window.EmployeeHub.app && window.EmployeeHub.app.showToast) {
          window.EmployeeHub.app.showToast(`Switched to demo role: ${mockRoles[roleType].roleName}`, 'info');
        }
      }
    }
  }

  function openLoginModal() {
    const modal = document.getElementById('modalLogin');
    if (modal) modal.classList.add('active');
  }

  function closeLoginModal() {
    const modal = document.getElementById('modalLogin');
    if (modal) modal.classList.remove('active');
  }

  function onSessionExpired() {
    if (window.EmployeeHub.app && window.EmployeeHub.app.showToast) {
      window.EmployeeHub.app.showToast('Session expired. Please log in again.', 'warning');
    }
    openLoginModal();
  }

  function setupEventListeners() {
    const form = document.getElementById('formLoginModal');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
      });
    }

    // Role switcher dropdown buttons
    document.querySelectorAll('[data-switch-role]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-switch-role');
        quickSwitchDemoRole(role);
      });
    });
  }

  return {
    init,
    getCurrentUser,
    hasPermission,
    login,
    logout,
    quickSwitchDemoRole,
    openLoginModal,
    closeLoginModal,
    onSessionExpired
  };
})();
