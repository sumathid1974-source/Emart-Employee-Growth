/**
 * Employee Management Module Controller
 * Namespace: window.EmployeeHub.employees
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.employees = (function () {
  'use strict';

  let tableState = {
    searchQuery: '',
    branchFilter: 'ALL',
    departmentFilter: 'ALL',
    statusFilter: 'ALL',
    typeFilter: 'ALL',
    sortColumn: 'name',
    sortDirection: 'asc',
    currentPage: 1,
    rowsPerPage: 5
  };

  let pendingDeleteEmployeeId = null;
  let pendingToggleStatusEmployeeId = null;
  let currentEditingEmployeeId = null;

  function initEmployeesModule() {
    initControls();
    populateDropdownFilters();
    renderStats();
    renderTable();
  }

  function initControls() {
    const searchInput = document.getElementById('empModuleSearch');
    const branchSelect = document.getElementById('empModuleBranchFilter');
    const deptSelect = document.getElementById('empModuleDeptFilter');
    const statusSelect = document.getElementById('empModuleStatusFilter');
    const typeSelect = document.getElementById('empModuleTypeFilter');

    if (searchInput) {
      searchInput.addEventListener('input', window.EmployeeHub.utils.debounce(function () {
        tableState.searchQuery = searchInput.value.trim().toLowerCase();
        tableState.currentPage = 1;
        renderTable();
      }, 200));
    }

    if (branchSelect) {
      branchSelect.addEventListener('change', function () {
        tableState.branchFilter = branchSelect.value;
        tableState.currentPage = 1;
        renderTable();
      });
    }

    if (deptSelect) {
      deptSelect.addEventListener('change', function () {
        tableState.departmentFilter = deptSelect.value;
        tableState.currentPage = 1;
        renderTable();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        tableState.statusFilter = statusSelect.value;
        tableState.currentPage = 1;
        renderTable();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        tableState.typeFilter = typeSelect.value;
        tableState.currentPage = 1;
        renderTable();
      });
    }

    // Sortable headers in employee directory table
    document.querySelectorAll('#empModuleTable th.sortable').forEach(th => {
      th.addEventListener('click', function () {
        const col = th.getAttribute('data-sort');
        if (tableState.sortColumn === col) {
          tableState.sortDirection = tableState.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          tableState.sortColumn = col;
          tableState.sortDirection = 'asc';
        }
        updateSortIcons();
        renderTable();
      });
    });
  }

  function updateSortIcons() {
    document.querySelectorAll('#empModuleTable th.sortable').forEach(th => {
      const col = th.getAttribute('data-sort');
      const icon = th.querySelector('.sort-icon');
      if (icon) {
        if (col === tableState.sortColumn) {
          icon.classList.add('active');
          icon.innerHTML = tableState.sortDirection === 'asc'
            ? `<polyline points="18 15 12 9 6 15"/>`
            : `<polyline points="6 9 12 15 18 9"/>`;
        } else {
          icon.classList.remove('active');
          icon.innerHTML = `<polyline points="6 9 12 15 18 9"/>`;
        }
      }
    });
  }

  /**
   * Dynamically populate Branch & Department filters from current datasets
   */
  function populateDropdownFilters() {
    const branchSelect = document.getElementById('empModuleBranchFilter');
    const deptSelect = document.getElementById('empModuleDeptFilter');
    const addEmpBranchSelect = document.getElementById('newEmpBranch');
    const editEmpBranchSelect = document.getElementById('editEmpBranch');

    const branches = window.EmployeeHub.dataStore.getBranches();
    const departments = window.EmployeeHub.dataStore.getDepartments();

    // Table filter: Branches
    if (branchSelect) {
      const currentVal = branchSelect.value;
      branchSelect.innerHTML = `<option value="ALL">All Branches</option>` +
        branches.map(b => `<option value="${window.EmployeeHub.utils.escapeHTML(b.name)}">${window.EmployeeHub.utils.escapeHTML(b.name)} (${b.code})</option>`).join('');
      if (currentVal && branches.some(b => b.name === currentVal)) {
        branchSelect.value = currentVal;
      }
    }

    // Table filter: Departments
    if (deptSelect) {
      const currentVal = deptSelect.value;
      deptSelect.innerHTML = `<option value="ALL">All Departments</option>` +
        departments.map(d => `<option value="${window.EmployeeHub.utils.escapeHTML(d)}">${window.EmployeeHub.utils.escapeHTML(d)}</option>`).join('');
      if (currentVal && departments.includes(currentVal)) {
        deptSelect.value = currentVal;
      }
    }

    // Add Employee Form: Active Branches only
    if (addEmpBranchSelect) {
      const activeBranches = branches.filter(b => b.status === 'Active');
      addEmpBranchSelect.innerHTML = `<option value="">Select Operating Branch</option>` +
        activeBranches.map(b => `<option value="${window.EmployeeHub.utils.escapeHTML(b.name)}">${window.EmployeeHub.utils.escapeHTML(b.name)} (${b.city})</option>`).join('');
    }

    // Edit Employee Form: All valid branches
    if (editEmpBranchSelect) {
      editEmpBranchSelect.innerHTML = `<option value="">Select Operating Branch</option>` +
        branches.map(b => `<option value="${window.EmployeeHub.utils.escapeHTML(b.name)}">${window.EmployeeHub.utils.escapeHTML(b.name)} (${b.status})</option>`).join('');
    }
  }

  /**
   * Render dynamic Employee Statistics
   */
  function renderStats() {
    const employees = window.EmployeeHub.dataStore.getEmployees();
    const departments = window.EmployeeHub.dataStore.getDepartments();

    const totalCount = employees.length;
    const activeCount = employees.filter(e => e.status === 'Active').length;
    const inactiveCount = employees.filter(e => e.status === 'Inactive').length;

    const elemTotal = document.getElementById('empStatTotal');
    const elemActive = document.getElementById('empStatActive');
    const elemInactive = document.getElementById('empStatInactive');
    const elemDepts = document.getElementById('empStatDepts');

    if (elemTotal) elemTotal.textContent = totalCount;
    if (elemActive) elemActive.textContent = activeCount;
    if (elemInactive) elemInactive.textContent = inactiveCount;
    if (elemDepts) elemDepts.textContent = departments.length;
  }

  /**
   * Render Employee Directory Table with Search, Filter, Sort & Pagination
   */
  function renderTable() {
    const tbody = document.getElementById('empModuleTableBody');
    const emptyState = document.getElementById('empModuleEmptyState');
    const paginationWrapper = document.getElementById('empModulePagination');
    if (!tbody) return;

    let list = window.EmployeeHub.dataStore.getEmployees();

    // Filter by search query (name, id, designation, department, branch)
    if (tableState.searchQuery) {
      const q = tableState.searchQuery;
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.branch.toLowerCase().includes(q) ||
        (e.city && e.city.toLowerCase().includes(q))
      );
    }

    // Filter by Branch
    if (tableState.branchFilter !== 'ALL') {
      list = list.filter(e => e.branch === tableState.branchFilter);
    }

    // Filter by Department
    if (tableState.departmentFilter !== 'ALL') {
      list = list.filter(e => e.department === tableState.departmentFilter);
    }

    // Filter by Employment Status
    if (tableState.statusFilter !== 'ALL') {
      list = list.filter(e => e.status === tableState.statusFilter);
    }

    // Filter by Employment Type
    if (tableState.typeFilter !== 'ALL') {
      list = list.filter(e => e.employmentType === tableState.typeFilter);
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[tableState.sortColumn] || '';
      let valB = b[tableState.sortColumn] || '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return tableState.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return tableState.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = list.length;

    if (totalCount === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (paginationWrapper) paginationWrapper.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (paginationWrapper) paginationWrapper.style.display = 'flex';

    // Pagination slice
    const totalPages = Math.ceil(totalCount / tableState.rowsPerPage) || 1;
    if (tableState.currentPage > totalPages) tableState.currentPage = totalPages;
    const startIndex = (tableState.currentPage - 1) * tableState.rowsPerPage;
    const paginatedItems = list.slice(startIndex, startIndex + tableState.rowsPerPage);

    tbody.innerHTML = paginatedItems.map(e => `
      <tr>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500;">
            ${window.EmployeeHub.utils.escapeHTML(e.id)}
          </span>
        </td>
        <td>
          <div class="employee-cell">
            <div class="employee-avatar-circle">${e.initials}</div>
            <div class="employee-cell-meta">
              <span class="employee-cell-name">${window.EmployeeHub.utils.escapeHTML(e.name)}</span>
              <span class="employee-cell-id">${window.EmployeeHub.utils.escapeHTML(e.email)}</span>
            </div>
          </div>
        </td>
        <td>
          <span style="font-weight: 500; color: var(--color-text-primary); font-size: 0.8125rem;">
            ${window.EmployeeHub.utils.escapeHTML(e.designation)}
          </span>
        </td>
        <td>
          <span class="badge badge-brand" style="font-size: 0.6875rem;">
            ${window.EmployeeHub.utils.escapeHTML(e.department)}
          </span>
        </td>
        <td>
          <span style="font-size: 0.8125rem; color: var(--color-text-secondary); font-weight: 500;">
            ${window.EmployeeHub.utils.escapeHTML(e.branch)}
          </span>
        </td>
        <td>
          <span style="font-size: 0.8125rem; color: var(--color-text-muted);">
            ${window.EmployeeHub.utils.formatDate(e.joiningDate)}
          </span>
        </td>
        <td>
          <span class="badge badge-neutral" style="font-size: 0.6875rem;">
            ${window.EmployeeHub.utils.escapeHTML(e.employmentType)}
          </span>
        </td>
        <td>
          <span class="badge ${e.status === 'Active' ? 'badge-success' : 'badge-neutral'}">
            <span class="badge-dot"></span>
            ${e.status}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.employees.viewProfile('${e.id}')" title="View Full Profile">
              Profile
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.employees.openEditEmployee('${e.id}')" title="Edit Employee">
              Edit
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.employees.confirmToggleStatus('${e.id}')" title="${e.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}">
              ${e.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <button class="btn btn-ghost btn-sm text-danger" onclick="window.EmployeeHub.employees.confirmDelete('${e.id}')" title="Delete Employee">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPaginationControls(totalCount, totalPages, startIndex);
  }

  function renderPaginationControls(totalCount, totalPages, startIndex) {
    const infoText = document.getElementById('empModulePaginationInfo');
    const pagesContainer = document.getElementById('empModulePaginationPages');
    const prevBtn = document.getElementById('btnEmpModulePrevPage');
    const nextBtn = document.getElementById('btnEmpModuleNextPage');

    const endIndex = Math.min(startIndex + tableState.rowsPerPage, totalCount);

    if (infoText) {
      infoText.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} employees`;
    }

    if (prevBtn) {
      prevBtn.disabled = tableState.currentPage <= 1;
      prevBtn.onclick = () => {
        if (tableState.currentPage > 1) {
          tableState.currentPage--;
          renderTable();
        }
      };
    }

    if (nextBtn) {
      nextBtn.disabled = tableState.currentPage >= totalPages;
      nextBtn.onclick = () => {
        if (tableState.currentPage < totalPages) {
          tableState.currentPage++;
          renderTable();
        }
      };
    }

    if (pagesContainer) {
      let pagesHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
          <button class="btn-page ${i === tableState.currentPage ? 'active' : ''}" onclick="window.EmployeeHub.employees.goToPage(${i})">
            ${i}
          </button>
        `;
      }
      pagesContainer.innerHTML = pagesHtml;
    }
  }

  function goToPage(page) {
    tableState.currentPage = page;
    renderTable();
  }

  function resetFilters() {
    tableState.searchQuery = '';
    tableState.branchFilter = 'ALL';
    tableState.departmentFilter = 'ALL';
    tableState.statusFilter = 'ALL';
    tableState.typeFilter = 'ALL';
    tableState.currentPage = 1;

    const searchInput = document.getElementById('empModuleSearch');
    const branchSelect = document.getElementById('empModuleBranchFilter');
    const deptSelect = document.getElementById('empModuleDeptFilter');
    const statusSelect = document.getElementById('empModuleStatusFilter');
    const typeSelect = document.getElementById('empModuleTypeFilter');

    if (searchInput) searchInput.value = '';
    if (branchSelect) branchSelect.value = 'ALL';
    if (deptSelect) deptSelect.value = 'ALL';
    if (statusSelect) statusSelect.value = 'ALL';
    if (typeSelect) typeSelect.value = 'ALL';

    renderTable();
  }

  /**
   * Filter Employee Directory by Branch (Called when navigating from Branch Details)
   */
  function filterByBranch(branchName) {
    tableState.branchFilter = branchName;
    tableState.currentPage = 1;
    const branchSelect = document.getElementById('empModuleBranchFilter');
    if (branchSelect) branchSelect.value = branchName;
    renderTable();
  }

  /**
   * View Full Employee Profile Modal
   */
  function viewProfile(employeeId) {
    const emp = window.EmployeeHub.dataStore.getEmployee(employeeId);
    if (!emp) return;

    document.getElementById('profileHeroAvatar').textContent = emp.initials;
    document.getElementById('profileHeroName').textContent = emp.name;
    document.getElementById('profileHeroRole').textContent = `${emp.designation} • ${emp.department}`;
    document.getElementById('profileHeroBranch').textContent = emp.branch;

    const statusBadge = document.getElementById('profileHeroStatus');
    statusBadge.className = emp.status === 'Active' ? 'badge badge-success' : 'badge badge-neutral';
    statusBadge.innerHTML = `<span class="badge-dot"></span> ${emp.status}`;

    // Personal Info
    document.getElementById('profileFieldFullName').textContent = emp.name;
    document.getElementById('profileFieldDob').textContent = emp.dob ? window.EmployeeHub.utils.formatDate(emp.dob) : 'Not specified';
    document.getElementById('profileFieldGender').textContent = emp.gender || 'Decline to specify';

    // Contact Info
    document.getElementById('profileFieldEmail').textContent = emp.email;
    document.getElementById('profileFieldPhone').textContent = emp.phone || 'N/A';
    document.getElementById('profileFieldCity').textContent = emp.city || 'N/A';

    // Employment Info
    document.getElementById('profileFieldId').textContent = emp.id;
    document.getElementById('profileFieldDesignation').textContent = emp.designation;
    document.getElementById('profileFieldDepartment').textContent = emp.department;
    document.getElementById('profileFieldBranch').textContent = emp.branch;
    document.getElementById('profileFieldJoiningDate').textContent = window.EmployeeHub.utils.formatDate(emp.joiningDate);
    document.getElementById('profileFieldType').textContent = emp.employmentType;
    document.getElementById('profileFieldStatus').textContent = emp.status;
    document.getElementById('profileFieldManager').textContent = emp.reportingManager || 'Branch Head';

    // Compensation Summary
    document.getElementById('profileFieldBasicSalary').textContent = window.EmployeeHub.utils.formatINR(emp.basicSalary);

    // Performance & Growth Dossier Extension (Phase 5)
    const ratingBox = document.getElementById('profileFieldRating');
    const promoBadge = document.getElementById('profileFieldPromotion');
    
    // Check Growth Store for rich Phase 5 Appraisal
    let growthAppraisal = null;
    let growthSkills = [];
    let growthGoals = [];
    let growthTraining = [];
    let growthFeedback = [];

    if (window.EmployeeHub.growthStore) {
      const apprs = window.EmployeeHub.growthStore.getAppraisalsByEmployee(emp.id);
      if (apprs && apprs.length > 0) growthAppraisal = apprs[0];
      growthSkills = window.EmployeeHub.growthStore.getSkillsForEmployee(emp.id);
      growthGoals = window.EmployeeHub.growthStore.getGoalsByEmployee(emp.id);
      growthTraining = window.EmployeeHub.growthStore.getEnrollmentsByEmployee(emp.id);
      growthFeedback = window.EmployeeHub.growthStore.getFeedback(emp.id, true);
    }

    const currentScore = growthAppraisal && growthAppraisal.overallScore ? growthAppraisal.overallScore : (emp.rating || 0);

    if (currentScore > 0) {
      ratingBox.innerHTML = `
        <span class="rating-stars">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ★ ${currentScore.toFixed(1)} / 5.0
        </span>
        <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-left: 6px;">Reviewed: ${growthAppraisal ? growthAppraisal.reviewPeriod : 'Q3 2026'}</span>
      `;
      promoBadge.className = currentScore >= 4.5 ? 'badge badge-success' : (currentScore >= 3.5 ? 'badge badge-primary' : 'badge badge-warning');
      promoBadge.textContent = (growthAppraisal && growthAppraisal.promotionRecommendation) || emp.promotionStatus || (currentScore >= 4.0 ? 'Recommended for Promotion' : 'Standard Growth Path');
    } else {
      ratingBox.textContent = 'No performance reviews recorded yet.';
      promoBadge.textContent = 'Pending Review';
    }

    // Populate Skills in Profile Modal if container exists
    const skillsContainer = document.getElementById('profileFieldSkillsList');
    if (skillsContainer) {
      if (growthSkills.length > 0) {
        skillsContainer.innerHTML = growthSkills.map(s => {
          const badgeClass = `skill-badge-${s.proficiency.toLowerCase()}`;
          return `<span class="skill-badge ${badgeClass}">${s.skillName} • ${s.proficiency}</span>`;
        }).join(' ');
      } else {
        skillsContainer.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">No skills mapped yet.</span>';
      }
    }

    // Populate Active Goals
    const goalsContainer = document.getElementById('profileFieldGoalsList');
    if (goalsContainer) {
      if (growthGoals.length > 0) {
        goalsContainer.innerHTML = growthGoals.map(g => `
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; padding: 4px 0; border-bottom: 1px solid var(--color-border-subtle);">
            <span>${window.EmployeeHub.utils.escapeHtml(g.title)}</span>
            <strong>${g.currentProgress}% (${g.status})</strong>
          </div>
        `).join('');
      } else {
        goalsContainer.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">No active goals assigned.</span>';
      }
    }

    // Populate Training History
    const trainingContainer = document.getElementById('profileFieldTrainingList');
    if (trainingContainer) {
      if (growthTraining.length > 0) {
        trainingContainer.innerHTML = growthTraining.map(t => `
          <div style="font-size: 0.75rem; padding: 3px 0;">
            • ${window.EmployeeHub.utils.escapeHtml(t.courseName)} <span class="badge ${t.status === 'Completed' ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.625rem;">${t.status}</span>
          </div>
        `).join('');
      } else {
        trainingContainer.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">No course enrollments on record.</span>';
      }
    }

    // Populate Manager Comments vs Public Recognition
    const managerCommentsBox = document.getElementById('profileFieldManagerComments');
    if (managerCommentsBox) {
      let notes = [];
      if (growthAppraisal && growthAppraisal.reviewerComments) {
        notes.push(`<strong>Appraisal Reviewer Note:</strong> "${growthAppraisal.reviewerComments}"`);
      }
      growthFeedback.forEach(f => {
        notes.push(`<strong>${f.visibility === 'Manager Only' ? 'Internal Manager Note' : 'Peer Recognition'} (${f.senderName}):</strong> "${f.message}"`);
      });
      managerCommentsBox.innerHTML = notes.length > 0 ? notes.join('<br>') : 'No supervisory comments recorded.';
    }

    // Attach edit button in profile modal
    const editBtn = document.getElementById('btnProfileEditAction');
    if (editBtn) {
      editBtn.onclick = () => {
        window.EmployeeHub.modals.closeActiveModal();
        openEditEmployee(emp.id);
      };
    }

    window.EmployeeHub.modals.openModal('modalEmployeeProfile');
  }

  /**
   * Add Employee Handler
   */
  function handleAddEmployeeSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('formAddEmployeeModule');
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const empData = {
      name: document.getElementById('newEmpName').value,
      email: document.getElementById('newEmpEmail').value,
      phone: document.getElementById('newEmpPhone').value,
      designation: document.getElementById('newEmpDesignation').value,
      department: document.getElementById('newEmpDepartment').value,
      branch: document.getElementById('newEmpBranch').value,
      joiningDate: document.getElementById('newEmpJoiningDate').value,
      dob: document.getElementById('newEmpDob').value,
      gender: document.getElementById('newEmpGender').value,
      city: document.getElementById('newEmpCity').value,
      employmentType: document.getElementById('newEmpType').value,
      status: document.getElementById('newEmpStatus').value,
      reportingManager: document.getElementById('newEmpManager').value,
      basicSalary: document.getElementById('newEmpSalary').value
    };

    try {
      const added = window.EmployeeHub.dataStore.addEmployee(empData);
      window.EmployeeHub.modals.closeActiveModal();
      form.reset();
      populateDropdownFilters();
      renderStats();
      renderTable();
      if (window.EmployeeHub.branches) {
        window.EmployeeHub.branches.renderStats();
        window.EmployeeHub.branches.renderTable();
      }
      if (window.EmployeeHub.dashboard) window.EmployeeHub.dashboard.initDashboard();
      window.EmployeeHub.toast.show('Employee Added', `Successfully added ${added.name} (${added.id}) to ${added.branch}.`, 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Validation Error', err.message, 'danger');
    }
  }

  /**
   * Edit Employee Handler
   */
  function openEditEmployee(employeeId) {
    const emp = window.EmployeeHub.dataStore.getEmployee(employeeId);
    if (!emp) return;

    currentEditingEmployeeId = employeeId;
    populateDropdownFilters();

    document.getElementById('editEmpId').value = emp.id;
    document.getElementById('editEmpName').value = emp.name;
    document.getElementById('editEmpEmail').value = emp.email;
    document.getElementById('editEmpPhone').value = emp.phone || '';
    document.getElementById('editEmpDesignation').value = emp.designation;
    document.getElementById('editEmpDepartment').value = emp.department;
    document.getElementById('editEmpBranch').value = emp.branch;
    document.getElementById('editEmpJoiningDate').value = emp.joiningDate || '';
    document.getElementById('editEmpDob').value = emp.dob || '';
    document.getElementById('editEmpGender').value = emp.gender || 'Decline to specify';
    document.getElementById('editEmpCity').value = emp.city || '';
    document.getElementById('editEmpType').value = emp.employmentType;
    document.getElementById('editEmpStatus').value = emp.status;
    document.getElementById('editEmpManager').value = emp.reportingManager || '';
    document.getElementById('editEmpSalary').value = emp.basicSalary || 50000;

    window.EmployeeHub.modals.openModal('modalEditEmployee');
  }

  function handleEditEmployeeSubmit(e) {
    e.preventDefault();
    if (!currentEditingEmployeeId) return;

    const form = document.getElementById('formEditEmployee');
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const updatedData = {
      name: document.getElementById('editEmpName').value,
      email: document.getElementById('editEmpEmail').value,
      phone: document.getElementById('editEmpPhone').value,
      designation: document.getElementById('editEmpDesignation').value,
      department: document.getElementById('editEmpDepartment').value,
      branch: document.getElementById('editEmpBranch').value,
      joiningDate: document.getElementById('editEmpJoiningDate').value,
      dob: document.getElementById('editEmpDob').value,
      gender: document.getElementById('editEmpGender').value,
      city: document.getElementById('editEmpCity').value,
      employmentType: document.getElementById('editEmpType').value,
      status: document.getElementById('editEmpStatus').value,
      reportingManager: document.getElementById('editEmpManager').value,
      basicSalary: document.getElementById('editEmpSalary').value
    };

    try {
      window.EmployeeHub.dataStore.updateEmployee(currentEditingEmployeeId, updatedData);
      window.EmployeeHub.modals.closeActiveModal();
      renderStats();
      renderTable();
      if (window.EmployeeHub.branches) {
        window.EmployeeHub.branches.renderStats();
        window.EmployeeHub.branches.renderTable();
      }
      if (window.EmployeeHub.dashboard) window.EmployeeHub.dashboard.initDashboard();
      window.EmployeeHub.toast.show('Employee Updated', `Updated records for "${updatedData.name}".`, 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Validation Error', err.message, 'danger');
    }
  }

  /**
   * Deactivate / Reactivate Employee Confirmation Workflow
   */
  function confirmToggleStatus(employeeId) {
    const emp = window.EmployeeHub.dataStore.getEmployee(employeeId);
    if (!emp) return;

    pendingToggleStatusEmployeeId = employeeId;
    const isActivating = emp.status === 'Inactive';

    document.getElementById('toggleStatusEmpName').textContent = emp.name;
    document.getElementById('toggleStatusEmpActionText').textContent = isActivating ? 'Activate' : 'Deactivate';
    document.getElementById('toggleStatusEmpDescText').textContent = isActivating
      ? `Activating will mark this employee as active and include them in operational headcount.`
      : `Deactivating marks this employee inactive. Their historical assignments and review history remain preserved.`;

    const confirmBtn = document.getElementById('btnConfirmToggleEmpStatus');
    confirmBtn.className = isActivating ? 'btn btn-primary' : 'btn btn-warning';
    confirmBtn.textContent = isActivating ? 'Activate Employee' : 'Deactivate Employee';

    window.EmployeeHub.modals.openModal('modalConfirmToggleEmpStatus');
  }

  function executeToggleStatus() {
    if (!pendingToggleStatusEmployeeId) return;
    try {
      const emp = window.EmployeeHub.dataStore.toggleEmployeeStatus(pendingToggleStatusEmployeeId);
      window.EmployeeHub.modals.closeActiveModal();
      renderStats();
      renderTable();
      if (window.EmployeeHub.branches) {
        window.EmployeeHub.branches.renderStats();
        window.EmployeeHub.branches.renderTable();
      }
      if (window.EmployeeHub.dashboard) window.EmployeeHub.dashboard.initDashboard();
      window.EmployeeHub.toast.show('Status Updated', `Employee "${emp.name}" is now ${emp.status}.`, 'info');
    } catch (err) {
      window.EmployeeHub.toast.show('Action Failed', err.message, 'danger');
    }
    pendingToggleStatusEmployeeId = null;
  }

  /**
   * Delete Employee Confirmation Workflow
   */
  function confirmDelete(employeeId) {
    const emp = window.EmployeeHub.dataStore.getEmployee(employeeId);
    if (!emp) return;

    pendingDeleteEmployeeId = employeeId;
    document.getElementById('deleteEmpName').textContent = emp.name;
    document.getElementById('deleteEmpBranch').textContent = emp.branch;
    window.EmployeeHub.modals.openModal('modalConfirmDeleteEmployee');
  }

  function executeDelete() {
    if (!pendingDeleteEmployeeId) return;
    try {
      const deleted = window.EmployeeHub.dataStore.deleteEmployee(pendingDeleteEmployeeId);
      window.EmployeeHub.modals.closeActiveModal();
      renderStats();
      renderTable();
      if (window.EmployeeHub.branches) {
        window.EmployeeHub.branches.renderStats();
        window.EmployeeHub.branches.renderTable();
      }
      if (window.EmployeeHub.dashboard) window.EmployeeHub.dashboard.initDashboard();
      window.EmployeeHub.toast.show('Employee Deleted', `Removed record for ${deleted.name}.`, 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Cannot Delete', err.message, 'danger');
    }
    pendingDeleteEmployeeId = null;
  }

  function refreshData() {
    populateDropdownFilters();
    renderStats();
    renderTable();
  }

  return {
    initEmployeesModule,
    renderStats,
    renderTable,
    goToPage,
    resetFilters,
    filterByBranch,
    viewProfile,
    openAddEmployee: () => {
      populateDropdownFilters();
      const autoIdInput = document.getElementById('newEmpId');
      if (autoIdInput) autoIdInput.value = window.EmployeeHub.dataStore.generateEmployeeId();
      window.EmployeeHub.modals.openModal('modalAddEmployeeModule');
    },
    handleAddEmployeeSubmit,
    openEditEmployee,
    handleEditEmployeeSubmit,
    confirmToggleStatus,
    executeToggleStatus,
    confirmDelete,
    executeDelete,
    refreshData
  };
})();
