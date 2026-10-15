/**
 * Branch Management Module Controller
 * Namespace: window.EmployeeHub.branches
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.branches = (function () {
  'use strict';

  let tableState = {
    searchQuery: '',
    statusFilter: 'ALL',
    sortColumn: 'name',
    sortDirection: 'asc',
    currentPage: 1,
    rowsPerPage: 5
  };

  let pendingDeleteBranchId = null;
  let pendingDeactivateBranchId = null;
  let currentEditingBranchId = null;

  function initBranchesModule() {
    initControls();
    renderStats();
    renderTable();
  }

  function initControls() {
    const searchInput = document.getElementById('branchModuleSearch');
    const statusSelect = document.getElementById('branchModuleStatusFilter');

    if (searchInput) {
      searchInput.addEventListener('input', window.EmployeeHub.utils.debounce(function () {
        tableState.searchQuery = searchInput.value.trim().toLowerCase();
        tableState.currentPage = 1;
        renderTable();
      }, 200));
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        tableState.statusFilter = statusSelect.value;
        tableState.currentPage = 1;
        renderTable();
      });
    }

    // Sortable headers in branch management page
    document.querySelectorAll('#branchModuleTable th.sortable').forEach(th => {
      th.addEventListener('click', function () {
        const col = th.getAttribute('data-sort');
        if (tableState.sortColumn === col) {
          tableState.sortDirection = tableState.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          tableState.sortColumn = col;
          tableState.sortDirection = (col === 'employeeCount') ? 'desc' : 'asc';
        }
        updateSortIcons();
        renderTable();
      });
    });
  }

  function updateSortIcons() {
    document.querySelectorAll('#branchModuleTable th.sortable').forEach(th => {
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
   * Render dynamic Branch Summary Statistics
   */
  function renderStats() {
    const branches = window.EmployeeHub.dataStore.getBranches();
    const totalCount = branches.length;
    const activeCount = branches.filter(b => b.status === 'Active').length;
    const inactiveCount = branches.filter(b => b.status === 'Inactive').length;
    const totalHeadcount = branches.reduce((sum, b) => sum + (b.employeeCount || 0), 0);

    const elemTotal = document.getElementById('branchStatTotal');
    const elemActive = document.getElementById('branchStatActive');
    const elemInactive = document.getElementById('branchStatInactive');
    const elemHeadcount = document.getElementById('branchStatHeadcount');

    if (elemTotal) elemTotal.textContent = totalCount;
    if (elemActive) elemActive.textContent = activeCount;
    if (elemInactive) elemInactive.textContent = inactiveCount;
    if (elemHeadcount) elemHeadcount.textContent = window.EmployeeHub.utils.formatNumber(totalHeadcount);
  }

  /**
   * Render Branch Table with Search, Filter, Sort & Pagination
   */
  function renderTable() {
    const tbody = document.getElementById('branchModuleTableBody');
    const emptyState = document.getElementById('branchModuleEmptyState');
    const paginationWrapper = document.getElementById('branchModulePagination');
    if (!tbody) return;

    let list = window.EmployeeHub.dataStore.getBranches();

    // Filter by search query
    if (tableState.searchQuery) {
      const q = tableState.searchQuery;
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q) ||
        (b.manager && b.manager.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (tableState.statusFilter !== 'ALL') {
      list = list.filter(b => b.status === tableState.statusFilter);
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[tableState.sortColumn];
      let valB = b[tableState.sortColumn];

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

    tbody.innerHTML = paginatedItems.map(b => `
      <tr>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-muted);">
            ${window.EmployeeHub.utils.escapeHTML(b.id)}
          </span>
        </td>
        <td>
          <div class="branch-name-cell">
            <span class="branch-name-title">${window.EmployeeHub.utils.escapeHTML(b.name)}</span>
            <span class="branch-code-badge">${window.EmployeeHub.utils.escapeHTML(b.code)}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 500; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(b.city)}</span>
            <small style="color: var(--color-text-muted);">${window.EmployeeHub.utils.escapeHTML(b.state)}</small>
          </div>
        </td>
        <td>
          <span style="font-size: 0.8125rem; color: var(--color-text-primary); font-weight: 500;">
            ${window.EmployeeHub.utils.escapeHTML(b.manager || 'Unassigned')}
          </span>
        </td>
        <td>
          <span class="table-cell-bold">${window.EmployeeHub.utils.formatNumber(b.employeeCount)}</span>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);"> assigned</span>
        </td>
        <td>
          <span class="table-cell-bold">${window.EmployeeHub.utils.formatINR(b.monthlyPayroll)}</span>
        </td>
        <td>
          <span class="badge ${b.status === 'Active' ? 'badge-success' : 'badge-neutral'}">
            <span class="badge-dot"></span>
            ${b.status}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.branches.viewBranchDetails('${b.id}')" title="View Branch Profile">
              View
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.branches.openEditBranch('${b.id}')" title="Edit Branch">
              Edit
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.branches.confirmToggleStatus('${b.id}')" title="${b.status === 'Active' ? 'Deactivate Branch' : 'Activate Branch'}">
              ${b.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <button class="btn btn-ghost btn-sm text-danger" onclick="window.EmployeeHub.branches.confirmDelete('${b.id}')" title="Delete Branch">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPaginationControls(totalCount, totalPages, startIndex);
  }

  function renderPaginationControls(totalCount, totalPages, startIndex) {
    const infoText = document.getElementById('branchModulePaginationInfo');
    const pagesContainer = document.getElementById('branchModulePaginationPages');
    const prevBtn = document.getElementById('btnBranchModulePrevPage');
    const nextBtn = document.getElementById('btnBranchModuleNextPage');

    const endIndex = Math.min(startIndex + tableState.rowsPerPage, totalCount);

    if (infoText) {
      infoText.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} branches`;
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
          <button class="btn-page ${i === tableState.currentPage ? 'active' : ''}" onclick="window.EmployeeHub.branches.goToPage(${i})">
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
    tableState.statusFilter = 'ALL';
    tableState.currentPage = 1;

    const searchInput = document.getElementById('branchModuleSearch');
    const statusSelect = document.getElementById('branchModuleStatusFilter');
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = 'ALL';

    renderTable();
  }

  /**
   * View Branch Details with preview of assigned employees
   */
  function viewBranchDetails(branchId) {
    const branch = window.EmployeeHub.dataStore.getBranch(branchId);
    if (!branch) return;

    const modal = document.getElementById('modalBranchFullDetails');
    if (!modal) return;

    document.getElementById('branchDetailHeroName').textContent = branch.name;
    document.getElementById('branchDetailHeroCode').textContent = branch.code;
    document.getElementById('branchDetailHeroLocation').textContent = `${branch.city}, ${branch.state}`;

    const statusBadge = document.getElementById('branchDetailHeroStatus');
    statusBadge.className = branch.status === 'Active' ? 'badge badge-success' : 'badge badge-neutral';
    statusBadge.innerHTML = `<span class="badge-dot"></span> ${branch.status}`;

    document.getElementById('branchDetailFieldId').textContent = branch.id;
    document.getElementById('branchDetailFieldManager').textContent = branch.manager || 'Unassigned';
    document.getElementById('branchDetailFieldEmail').textContent = branch.email || 'N/A';
    document.getElementById('branchDetailFieldPhone').textContent = branch.phone || 'N/A';
    document.getElementById('branchDetailFieldCapacity').textContent = `${branch.capacity || 100} workstations`;
    document.getElementById('branchDetailFieldAddress').textContent = branch.address;
    document.getElementById('branchDetailFieldPayroll').textContent = window.EmployeeHub.utils.formatINR(branch.monthlyPayroll);

    // Render assigned employees list
    const branchEmployees = window.EmployeeHub.dataStore.getEmployeesByBranch(branch.name);
    const empContainer = document.getElementById('branchDetailEmployeesList');
    const viewAllBtn = document.getElementById('btnBranchViewAllEmployees');

    if (viewAllBtn) {
      viewAllBtn.onclick = () => {
        window.EmployeeHub.modals.closeActiveModal();
        window.EmployeeHub.navigation.navigateTo('view-employees');
        if (window.EmployeeHub.employees && window.EmployeeHub.employees.filterByBranch) {
          window.EmployeeHub.employees.filterByBranch(branch.name);
        }
      };
    }

    if (empContainer) {
      if (branchEmployees.length === 0) {
        empContainer.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--color-text-muted); font-size: 0.8125rem;">
            No employees currently assigned to this branch.
          </div>
        `;
      } else {
        empContainer.innerHTML = `
          <table class="data-table" style="font-size: 0.8125rem;">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${branchEmployees.map(e => `
                <tr>
                  <td>
                    <div class="employee-cell">
                      <div class="employee-avatar-circle" style="width: 28px; height: 28px; font-size: 0.6875rem;">${e.initials}</div>
                      <div class="employee-cell-meta">
                        <span style="font-weight: 600; color: var(--color-text-primary); font-size: 0.8125rem;">${window.EmployeeHub.utils.escapeHTML(e.name)}</span>
                        <span style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${e.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>${window.EmployeeHub.utils.escapeHTML(e.designation)}</td>
                  <td><span class="badge badge-brand" style="font-size: 0.625rem;">${window.EmployeeHub.utils.escapeHTML(e.department)}</span></td>
                  <td><span class="badge ${e.status === 'Active' ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.625rem;">${e.status}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.modals.closeActiveModal(); window.EmployeeHub.employees.viewProfile('${e.id}')">
                      View Profile
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }

    window.EmployeeHub.modals.openModal('modalBranchFullDetails');
  }

  /**
   * Add Branch Handler
   */
  function handleAddBranchSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('formAddBranchModule');
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const branchData = {
      name: document.getElementById('newBranchName').value,
      code: document.getElementById('newBranchCode').value,
      city: document.getElementById('newBranchCity').value,
      state: document.getElementById('newBranchState').value,
      postalCode: document.getElementById('newBranchPostalCode').value,
      address: document.getElementById('newBranchAddress').value,
      manager: document.getElementById('newBranchManager').value,
      phone: document.getElementById('newBranchPhone').value,
      status: document.getElementById('newBranchStatus').value,
      capacity: document.getElementById('newBranchCapacity').value
    };

    try {
      window.EmployeeHub.dataStore.addBranch(branchData);
      window.EmployeeHub.modals.closeActiveModal();
      form.reset();
      renderStats();
      renderTable();
      // Synchronize dashboard table too
      if (window.EmployeeHub.dashboard) window.EmployeeHub.dashboard.renderBranchTable();
      window.EmployeeHub.toast.show('Branch Created', `Successfully registered "${branchData.name}".`, 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Validation Error', err.message, 'danger');
    }
  }

  /**
   * Edit Branch Handler
   */
  function openEditBranch(branchId) {
    const branch = window.EmployeeHub.dataStore.getBranch(branchId);
    if (!branch) return;

    currentEditingBranchId = branchId;
    document.getElementById('editBranchId').value = branch.id;
    document.getElementById('editBranchName').value = branch.name;
    document.getElementById('editBranchCode').value = branch.code;
    document.getElementById('editBranchCity').value = branch.city;
    document.getElementById('editBranchState').value = branch.state;
    document.getElementById('editBranchPostalCode').value = branch.postalCode || '';
    document.getElementById('editBranchAddress').value = branch.address;
    document.getElementById('editBranchManager').value = branch.manager || '';
    document.getElementById('editBranchPhone').value = branch.phone || '';
    document.getElementById('editBranchStatus').value = branch.status;
    document.getElementById('editBranchCapacity').value = branch.capacity || 100;

    window.EmployeeHub.modals.openModal('modalEditBranch');
  }

  function handleEditBranchSubmit(e) {
    e.preventDefault();
    if (!currentEditingBranchId) return;

    const form = document.getElementById('formEditBranch');
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const updatedData = {
      name: document.getElementById('editBranchName').value,
      code: document.getElementById('editBranchCode').value,
      city: document.getElementById('editBranchCity').value,
      state: document.getElementById('editBranchState').value,
      postalCode: document.getElementById('editBranchPostalCode').value,
      address: document.getElementById('editBranchAddress').value,
      manager: document.getElementById('editBranchManager').value,
      phone: document.getElementById('editBranchPhone').value,
      status: document.getElementById('editBranchStatus').value,
      capacity: document.getElementById('editBranchCapacity').value
    };

    try {
      window.EmployeeHub.dataStore.updateBranch(currentEditingBranchId, updatedData);
      window.EmployeeHub.modals.closeActiveModal();
      renderStats();
      renderTable();
      if (window.EmployeeHub.dashboard) window.EmployeeHub.dashboard.renderBranchTable();
      if (window.EmployeeHub.employees) window.EmployeeHub.employees.refreshData();
      window.EmployeeHub.toast.show('Branch Updated', `Updated details for "${updatedData.name}".`, 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Validation Error', err.message, 'danger');
    }
  }

  /**
   * Deactivate / Reactivate Confirmation Workflow
   */
  function confirmToggleStatus(branchId) {
    const branch = window.EmployeeHub.dataStore.getBranch(branchId);
    if (!branch) return;

    pendingDeactivateBranchId = branchId;
    const isActivating = branch.status === 'Inactive';

    document.getElementById('toggleStatusBranchName').textContent = branch.name;
    document.getElementById('toggleStatusActionText').textContent = isActivating ? 'Activate' : 'Deactivate';
    document.getElementById('toggleStatusDescText').textContent = isActivating
      ? `Activating will make this branch available for new employee assignments.`
      : `Deactivating will mark the branch inactive. Existing employee records (${branch.employeeCount}) will be preserved, but new employee additions will be prevented.`;

    const confirmBtn = document.getElementById('btnConfirmToggleStatus');
    confirmBtn.className = isActivating ? 'btn btn-primary' : 'btn btn-warning';
    confirmBtn.textContent = isActivating ? 'Activate Branch' : 'Deactivate Branch';

    window.EmployeeHub.modals.openModal('modalConfirmToggleBranchStatus');
  }

  function executeToggleStatus() {
    if (!pendingDeactivateBranchId) return;
    try {
      const branch = window.EmployeeHub.dataStore.toggleBranchStatus(pendingDeactivateBranchId);
      window.EmployeeHub.modals.closeActiveModal();
      renderStats();
      renderTable();
      if (window.EmployeeHub.dashboard) window.EmployeeHub.dashboard.renderBranchTable();
      if (window.EmployeeHub.employees) window.EmployeeHub.employees.refreshData();
      window.EmployeeHub.toast.show('Status Updated', `Branch "${branch.name}" is now ${branch.status}.`, 'info');
    } catch (err) {
      window.EmployeeHub.toast.show('Action Failed', err.message, 'danger');
    }
    pendingDeactivateBranchId = null;
  }

  /**
   * Delete Branch Safety Workflow
   */
  function confirmDelete(branchId) {
    const branch = window.EmployeeHub.dataStore.getBranch(branchId);
    if (!branch) return;

    const assigned = window.EmployeeHub.dataStore.getEmployeesByBranch(branch.name);

    // Strict safety check: Block deletion if branch has employees
    if (assigned.length > 0) {
      document.getElementById('blockedBranchName').textContent = branch.name;
      document.getElementById('blockedEmployeeCount').textContent = assigned.length;
      window.EmployeeHub.modals.openModal('modalBranchDeleteBlocked');
      return;
    }

    pendingDeleteBranchId = branchId;
    document.getElementById('deleteBranchName').textContent = branch.name;
    window.EmployeeHub.modals.openModal('modalConfirmDeleteBranch');
  }

  function executeDelete() {
    if (!pendingDeleteBranchId) return;
    try {
      window.EmployeeHub.dataStore.deleteBranch(pendingDeleteBranchId);
      window.EmployeeHub.modals.closeActiveModal();
      renderStats();
      renderTable();
      if (window.EmployeeHub.dashboard) window.EmployeeHub.dashboard.renderBranchTable();
      window.EmployeeHub.toast.show('Branch Deleted', 'Branch removed from active directory.', 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Cannot Delete', err.message, 'danger');
    }
    pendingDeleteBranchId = null;
  }

  return {
    initBranchesModule,
    renderStats,
    renderTable,
    goToPage,
    resetFilters,
    viewBranchDetails,
    openAddBranch: () => window.EmployeeHub.modals.openModal('modalAddBranchModule'),
    handleAddBranchSubmit,
    openEditBranch,
    handleEditBranchSubmit,
    confirmToggleStatus,
    executeToggleStatus,
    confirmDelete,
    executeDelete
  };
})();
