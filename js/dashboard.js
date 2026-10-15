/**
 * Administrator Dashboard Renderer & Table Controllers
 * Namespace: window.EmployeeHub.dashboard
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.dashboard = (function () {
  'use strict';

  // Table state for Branch Overview Table
  let tableState = {
    searchQuery: '',
    statusFilter: 'ALL',
    sortColumn: 'employeeCount',
    sortDirection: 'desc',
    currentPage: 1,
    rowsPerPage: 5
  };

  /**
   * Initialize Dashboard components
   */
  function initDashboard() {
    renderStatCards();
    initBranchTableControls();
    renderBranchTable();
    renderPromotionCandidates();
    renderRecentNotifications();
    renderActivityTimeline();
  }

  /**
   * 1. Render Summary Statistics Cards
   */
  function renderStatCards() {
    const stats = window.EmployeeHub.mockData.summaryStats;

    const valBranches = document.getElementById('statTotalBranches');
    if (valBranches) valBranches.textContent = stats.totalBranches.value;

    const valEmployees = document.getElementById('statTotalEmployees');
    if (valEmployees) valEmployees.textContent = window.EmployeeHub.utils.formatNumber(stats.totalEmployees.value);

    const valCandidates = document.getElementById('statPromotionCandidates');
    if (valCandidates) valCandidates.textContent = stats.promotionCandidates.value;

    const valPayroll = document.getElementById('statMonthlyPayroll');
    if (valPayroll) valPayroll.textContent = stats.monthlyPayroll.formatted;
  }

  /**
   * 2. Initialize Branch Table Search, Filter, Sort listeners
   */
  function initBranchTableControls() {
    const searchInput = document.getElementById('branchTableSearch');
    const statusSelect = document.getElementById('branchTableStatusFilter');

    if (searchInput) {
      searchInput.addEventListener('input', window.EmployeeHub.utils.debounce(function () {
        tableState.searchQuery = searchInput.value.trim().toLowerCase();
        tableState.currentPage = 1;
        renderBranchTable();
      }, 200));
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        tableState.statusFilter = statusSelect.value;
        tableState.currentPage = 1;
        renderBranchTable();
      });
    }

    // Sortable column headers
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
      th.addEventListener('click', function () {
        const col = th.getAttribute('data-sort');
        if (tableState.sortColumn === col) {
          tableState.sortDirection = tableState.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          tableState.sortColumn = col;
          tableState.sortDirection = col === 'name' ? 'asc' : 'desc';
        }
        updateSortIcons();
        renderBranchTable();
      });
    });
  }

  function updateSortIcons() {
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
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
   * 3. Filter, Sort, Paginate & Render Branch Table
   */
  function renderBranchTable() {
    const tbody = document.getElementById('branchTableBody');
    const emptyState = document.getElementById('branchTableEmptyState');
    const paginationWrapper = document.getElementById('branchTablePagination');
    if (!tbody) return;

    let list = [...window.EmployeeHub.mockData.branches];

    // Filter by search query
    if (tableState.searchQuery) {
      const q = tableState.searchQuery;
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q)
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
    const totalPages = Math.ceil(totalCount / tableState.rowsPerPage);
    if (tableState.currentPage > totalPages) {
      tableState.currentPage = totalPages;
    }
    const startIndex = (tableState.currentPage - 1) * tableState.rowsPerPage;
    const paginatedItems = list.slice(startIndex, startIndex + tableState.rowsPerPage);

    tbody.innerHTML = paginatedItems.map(b => `
      <tr>
        <td>
          <div class="branch-name-cell">
            <span class="branch-name-title">${window.EmployeeHub.utils.escapeHTML(b.name)}</span>
            <span class="branch-code-badge">${window.EmployeeHub.utils.escapeHTML(b.code)}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <span style="color: var(--color-text-primary); font-weight: 500;">${window.EmployeeHub.utils.escapeHTML(b.city)}</span>
            <small style="color: var(--color-text-muted);">${window.EmployeeHub.utils.escapeHTML(b.state)}</small>
          </div>
        </td>
        <td>
          <span class="table-cell-bold">${window.EmployeeHub.utils.formatNumber(b.employeeCount)}</span>
          <span style="color: var(--color-text-muted); font-size: 0.75rem;"> staff</span>
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
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.modals.openBranchDetails('${b.id}')" title="View details for ${b.name}">
              View Details
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPaginationControls(totalCount, totalPages, startIndex);
  }

  function renderPaginationControls(totalCount, totalPages, startIndex) {
    const infoText = document.getElementById('branchPaginationInfo');
    const pagesContainer = document.getElementById('branchPaginationPages');
    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');

    const endIndex = Math.min(startIndex + tableState.rowsPerPage, totalCount);

    if (infoText) {
      infoText.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} branches`;
    }

    if (prevBtn) {
      prevBtn.disabled = tableState.currentPage <= 1;
      prevBtn.onclick = () => {
        if (tableState.currentPage > 1) {
          tableState.currentPage--;
          renderBranchTable();
        }
      };
    }

    if (nextBtn) {
      nextBtn.disabled = tableState.currentPage >= totalPages;
      nextBtn.onclick = () => {
        if (tableState.currentPage < totalPages) {
          tableState.currentPage++;
          renderBranchTable();
        }
      };
    }

    if (pagesContainer) {
      let pagesHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
          <button class="btn-page ${i === tableState.currentPage ? 'active' : ''}" onclick="window.EmployeeHub.dashboard.goToPage(${i})">
            ${i}
          </button>
        `;
      }
      pagesContainer.innerHTML = pagesHtml;
    }
  }

  function goToPage(page) {
    tableState.currentPage = page;
    renderBranchTable();
  }

  function resetBranchFilters() {
    tableState.searchQuery = '';
    tableState.statusFilter = 'ALL';
    tableState.currentPage = 1;

    const searchInput = document.getElementById('branchTableSearch');
    const statusSelect = document.getElementById('branchTableStatusFilter');
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = 'ALL';

    renderBranchTable();
  }

  /**
   * 4. Render Promotion Candidates Preview List
   */
  function renderPromotionCandidates() {
    const container = document.getElementById('promotionCandidatesList');
    if (!container) return;

    const candidates = window.EmployeeHub.mockData.promotionCandidates;

    container.innerHTML = candidates.map(c => `
      <div class="candidate-item">
        <div class="candidate-info">
          <div class="candidate-avatar">${c.initials}</div>
          <div class="candidate-details">
            <span class="candidate-name">${window.EmployeeHub.utils.escapeHTML(c.name)}</span>
            <span class="candidate-role">${window.EmployeeHub.utils.escapeHTML(c.designation)} • ${window.EmployeeHub.utils.escapeHTML(c.branch)}</span>
          </div>
        </div>
        <div class="candidate-rating-box">
          <span class="rating-stars">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${c.rating.toFixed(1)} / 5.0
          </span>
          <span class="badge badge-success" style="font-size: 0.6875rem;">
            Recommended for Promotion
          </span>
        </div>
      </div>
    `).join('');
  }

  /**
   * 5. Render Recent Notifications Panel on Dashboard
   */
  function renderRecentNotifications() {
    const container = document.getElementById('recentNotificationsPanel');
    if (!container) return;

    const notifs = window.EmployeeHub.mockData.getNotifications();

    container.innerHTML = notifs.map(n => `
      <div class="notification-panel-item ${n.read ? '' : 'unread'}">
        ${!n.read ? '<span class="notification-unread-dot"></span>' : ''}
        <div class="notification-content">
          <span class="notification-item-title">${window.EmployeeHub.utils.escapeHTML(n.title)}</span>
          <span class="notification-item-preview">${window.EmployeeHub.utils.escapeHTML(n.message)}</span>
          <div class="notification-item-meta">
            <span class="badge ${n.targetScope === 'all' ? 'badge-brand' : 'badge-neutral'}" style="font-size: 0.6875rem; padding: 2px 7px;">
              ${window.EmployeeHub.utils.escapeHTML(n.targetBranch)}
            </span>
            <span>${window.EmployeeHub.utils.escapeHTML(n.createdAt)}</span>
          </div>
        </div>
        <div class="notification-actions">
          ${!n.read ? `
            <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.notifications.markAsRead('${n.id}', event)" title="Mark as read">
              Mark as read
            </button>
          ` : `
            <span style="font-size: 0.75rem; color: var(--color-text-muted);">Read</span>
          `}
        </div>
      </div>
    `).join('');
  }

  /**
   * 6. Render Activity Timeline
   */
  function renderActivityTimeline() {
    const container = document.getElementById('activityTimelineContainer');
    if (!container) return;

    const activities = window.EmployeeHub.mockData.activityTimeline;

    container.innerHTML = activities.map(act => `
      <div class="timeline-item">
        <div class="timeline-marker">
          <div class="timeline-marker-inner"></div>
        </div>
        <div class="timeline-content">
          <span class="timeline-title">${window.EmployeeHub.utils.escapeHTML(act.title)}</span>
          <span class="timeline-desc">${window.EmployeeHub.utils.escapeHTML(act.desc)}</span>
        </div>
        <span class="timeline-time">${window.EmployeeHub.utils.escapeHTML(act.time)}</span>
      </div>
    `).join('');
  }

  return {
    initDashboard,
    renderBranchTable,
    renderRecentNotifications,
    goToPage,
    resetBranchFilters
  };
})();
