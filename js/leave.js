/**
 * Phase 4: Leave Management Controller
 * Namespace: window.EmployeeHub.leave
 * Handles Leave Dashboard, Leave Requests, Leave Approvals Workflow, Leave Types & Balances
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.leave = (function () {
  'use strict';

  let requestsCurrentPage = 1;
  const requestsPageSize = 8;

  const requestsFilter = {
    search: '',
    branch: 'ALL',
    status: 'ALL',
    leaveTypeId: 'ALL'
  };

  /**
   * Initialize Leave module controls
   */
  function initLeaveModule() {
    initRequestsFilters();
  }

  // =========================================================================
  // 1. LEAVE DASHBOARD
  // =========================================================================

  function refreshLeaveDashboard() {
    const store = window.EmployeeHub.attendanceStore;
    if (!store) return;

    const allRequests = store.getLeaveRequests();
    const today = '2026-10-13';

    const pending = allRequests.filter(r => r.status === 'Pending').length;
    const approved = allRequests.filter(r => r.status === 'Approved').length;
    const rejected = allRequests.filter(r => r.status === 'Rejected').length;

    // Currently on leave today
    const onLeaveToday = allRequests.filter(r => r.status === 'Approved' && r.startDate <= today && r.endDate >= today).length;

    // Upcoming approved leave
    const upcoming = allRequests.filter(r => r.status === 'Approved' && r.startDate > today).length;

    updateText('leaveMetricPending', pending);
    updateText('leaveMetricApproved', approved);
    updateText('leaveMetricRejected', rejected);
    updateText('leaveMetricOnLeaveToday', onLeaveToday);
    updateText('leaveMetricUpcoming', upcoming);

    renderLeaveSummaryByBranch();
    renderLeaveUsageByEmployee();
  }

  function renderLeaveSummaryByBranch() {
    const tbody = document.getElementById('branchLeaveSummaryBody');
    if (!tbody) return;

    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const store = window.EmployeeHub.attendanceStore;
    const requests = store.getLeaveRequests();

    tbody.innerHTML = branches.slice(0, 6).map(b => {
      const bEmps = employees.filter(e => e.branch === b.name);
      const bEmpIds = new Set(bEmps.map(e => e.id));

      const bReqs = requests.filter(r => bEmpIds.has(r.employeeId));
      const approvedDays = bReqs.filter(r => r.status === 'Approved').reduce((acc, r) => acc + r.dayCount, 0);
      const pendingDays = bReqs.filter(r => r.status === 'Pending').reduce((acc, r) => acc + r.dayCount, 0);

      return `
        <tr>
          <td>
            <strong>${window.EmployeeHub.utils.escapeHTML(b.name)}</strong>
            <div style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${b.code}</div>
          </td>
          <td>${bEmps.length}</td>
          <td><span class="badge badge-success">${approvedDays} days</span></td>
          <td><span class="badge badge-warning">${pendingDays} days</span></td>
          <td>${bReqs.length}</td>
        </tr>
      `;
    }).join('');
  }

  function renderLeaveUsageByEmployee() {
    const tbody = document.getElementById('employeeLeaveUsageBody');
    if (!tbody) return;

    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const store = window.EmployeeHub.attendanceStore;

    tbody.innerHTML = employees.slice(0, 6).map(emp => {
      const balance = store.getEmployeeLeaveBalance(emp.id);
      let totalAlloc = 0;
      let totalUsed = 0;
      let totalRem = 0;

      Object.values(balance).forEach(b => {
        if (!b.isUnpaid) {
          totalAlloc += b.allocated;
          totalUsed += b.approvedUsed;
          totalRem += b.remaining;
        }
      });

      const pct = totalAlloc > 0 ? Math.round((totalUsed / totalAlloc) * 100) : 0;

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="table-avatar">${emp.initials}</div>
              <div>
                <strong>${window.EmployeeHub.utils.escapeHTML(emp.name)}</strong>
                <div style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${emp.id}</div>
              </div>
            </div>
          </td>
          <td>${window.EmployeeHub.utils.escapeHTML(emp.branch)}</td>
          <td>${totalUsed} / ${totalAlloc} days</td>
          <td><strong style="color: var(--color-brand);">${totalRem} days</strong></td>
          <td style="min-width: 120px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="leave-progress-track" style="flex: 1;">
                <div class="leave-progress-fill" style="width: ${pct}%; background: ${pct > 80 ? 'var(--color-danger)' : pct > 50 ? 'var(--color-warning)' : 'var(--color-success)'};"></div>
              </div>
              <span style="font-size: 0.75rem; font-family: var(--font-mono);">${pct}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 2. LEAVE REQUESTS DIRECTORY
  // =========================================================================

  function initRequestsFilters() {
    const search = document.getElementById('leaveReqSearch');
    const branch = document.getElementById('leaveReqBranchFilter');
    const status = document.getElementById('leaveReqStatusFilter');
    const lType = document.getElementById('leaveReqTypeFilter');

    if (branch) {
      populateBranchDropdown(branch, true);
      branch.addEventListener('change', (e) => {
        requestsFilter.branch = e.target.value;
        requestsCurrentPage = 1;
        renderLeaveRequestsTable();
      });
    }

    if (lType) {
      populateLeaveTypeDropdown(lType, true);
      lType.addEventListener('change', (e) => {
        requestsFilter.leaveTypeId = e.target.value;
        requestsCurrentPage = 1;
        renderLeaveRequestsTable();
      });
    }

    if (status) {
      status.addEventListener('change', (e) => {
        requestsFilter.status = e.target.value;
        requestsCurrentPage = 1;
        renderLeaveRequestsTable();
      });
    }

    if (search) {
      search.addEventListener('input', (e) => {
        requestsFilter.search = e.target.value.toLowerCase().trim();
        requestsCurrentPage = 1;
        renderLeaveRequestsTable();
      });
    }
  }

  function renderLeaveRequestsTable() {
    const tbody = document.getElementById('leaveRequestsTableBody');
    const emptyState = document.getElementById('leaveReqEmptyState');
    if (!tbody) return;

    const store = window.EmployeeHub.attendanceStore;
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const empMap = new Map(employees.map(e => [e.id, e]));
    const types = store.getLeaveTypes();
    const typeMap = new Map(types.map(t => [t.id, t]));

    let requests = store.getLeaveRequests();

    // Filter
    requests = requests.filter(r => {
      const emp = empMap.get(r.employeeId);
      if (!emp) return false;

      if (requestsFilter.branch !== 'ALL' && emp.branch !== requestsFilter.branch) return false;
      if (requestsFilter.status !== 'ALL' && r.status !== requestsFilter.status) return false;
      if (requestsFilter.leaveTypeId !== 'ALL' && r.leaveTypeId !== requestsFilter.leaveTypeId) return false;

      if (requestsFilter.search) {
        const q = requestsFilter.search;
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesId = r.employeeId.toLowerCase().includes(q);
        const matchesReason = (r.reason || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesReason) return false;
      }
      return true;
    });

    if (requests.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = requests.map(r => {
      const emp = empMap.get(r.employeeId);
      const lt = typeMap.get(r.leaveTypeId);

      return `
        <tr>
          <td><span style="font-family: var(--font-mono); font-weight: 600;">${r.id}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="table-avatar">${emp ? emp.initials : 'EM'}</div>
              <div>
                <strong>${emp ? window.EmployeeHub.utils.escapeHTML(emp.name) : r.employeeId}</strong>
                <div style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${r.employeeId} • ${emp ? emp.branch : ''}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge" style="background: rgba(59, 130, 246, 0.1); color: var(--color-brand); font-weight: 600;">
              ${lt ? lt.name : r.leaveTypeId}
            </span>
          </td>
          <td>
            <div style="font-family: var(--font-mono); font-size: 0.8125rem;">
              ${r.startDate} ${r.startDate !== r.endDate ? 'to ' + r.endDate : ''}
            </div>
            <div style="font-size: 0.6875rem; color: var(--color-text-muted);">
              ${r.isHalfDay ? 'Half-day' : `${r.dayCount} working day(s)`}
            </div>
          </td>
          <td>
            <span style="font-size: 0.8125rem; color: var(--color-text-secondary); max-width: 180px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${window.EmployeeHub.utils.escapeHTML(r.reason || '')}">
              ${window.EmployeeHub.utils.escapeHTML(r.reason || '--')}
            </span>
          </td>
          <td>${getLeaveStatusBadge(r.status)}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              ${r.status === 'Pending' ? `
                <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.leave.openApprovalModal('${r.id}')" title="Review & Take Decision">
                  Review
                </button>
              ` : `
                <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.leave.openViewRequestModal('${r.id}')" title="View Details">
                  Details
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 3. NEW LEAVE REQUEST MODAL
  // =========================================================================

  function openNewLeaveRequestModal(defaultEmpId = null) {
    const modal = document.getElementById('modalNewLeaveRequest');
    if (!modal) return;

    const empSelect = document.getElementById('newLeaveEmp');
    populateEmployeeDropdown(empSelect, false);
    if (defaultEmpId) empSelect.value = defaultEmpId;

    const typeSelect = document.getElementById('newLeaveType');
    populateLeaveTypeDropdown(typeSelect, false);

    document.getElementById('newLeaveStart').value = '2026-10-16';
    document.getElementById('newLeaveEnd').value = '2026-10-16';
    document.getElementById('newLeaveIsHalfDay').checked = false;
    document.getElementById('newLeaveReason').value = '';

    recalculateRequestDays();
    modal.classList.add('show');
  }

  function recalculateRequestDays() {
    const empId = document.getElementById('newLeaveEmp').value;
    const typeId = document.getElementById('newLeaveType').value;
    const start = document.getElementById('newLeaveStart').value;
    const end = document.getElementById('newLeaveEnd').value;
    const isHalfDay = document.getElementById('newLeaveIsHalfDay').checked;

    const store = window.EmployeeHub.attendanceStore;
    const days = store.calculateLeaveDays(start, end, isHalfDay);

    const daysDisplay = document.getElementById('newLeaveCalcDays');
    if (daysDisplay) {
      daysDisplay.textContent = `${days} working day(s)`;
    }

    // Balance check
    const balanceInfo = store.getEmployeeLeaveBalance(empId, typeId);
    const balDisplay = document.getElementById('newLeaveAvailableBal');
    const warningBox = document.getElementById('newLeaveConflictWarning');

    if (balDisplay && balanceInfo) {
      balDisplay.textContent = `${balanceInfo.remaining} days available (Total Quota: ${balanceInfo.allocated})`;
    }

    // Overlap conflict check
    const overlap = store.checkLeaveOverlap(empId, start, end);
    if (warningBox) {
      if (overlap) {
        warningBox.style.display = 'block';
        warningBox.innerHTML = `
          <strong>Date Conflict Alert:</strong> You already have an existing request (${overlap.id}: ${overlap.status}) overlapping ${overlap.startDate} to ${overlap.endDate}.
        `;
      } else if (balanceInfo && !balanceInfo.isUnpaid && days > balanceInfo.remaining) {
        warningBox.style.display = 'block';
        warningBox.innerHTML = `
          <strong>Quota Exceeded:</strong> Requested days (${days}) exceed available balance (${balanceInfo.remaining}). This may require Leave Without Pay (LWP).
        `;
      } else {
        warningBox.style.display = 'none';
      }
    }
  }

  function handleNewLeaveSubmit(e) {
    e.preventDefault();
    const empId = document.getElementById('newLeaveEmp').value;
    const typeId = document.getElementById('newLeaveType').value;
    const start = document.getElementById('newLeaveStart').value;
    const end = document.getElementById('newLeaveEnd').value;
    const isHalfDay = document.getElementById('newLeaveIsHalfDay').checked;
    const reason = document.getElementById('newLeaveReason').value.trim();

    if (!start || !end) {
      window.EmployeeHub.app.showToast('Please select valid start and end dates.', 'error');
      return;
    }

    if (end < start) {
      window.EmployeeHub.app.showToast('End date cannot be prior to start date.', 'error');
      return;
    }

    const store = window.EmployeeHub.attendanceStore;
    const days = store.calculateLeaveDays(start, end, isHalfDay);

    if (days <= 0) {
      window.EmployeeHub.app.showToast('Selected date range contains 0 working days (falls entirely on weekends or holidays).', 'warning');
      return;
    }

    store.submitLeaveRequest({
      employeeId: empId,
      leaveTypeId: typeId,
      startDate: start,
      endDate: end,
      dayCount: days,
      isHalfDay,
      reason
    });

    window.EmployeeHub.modals.closeModal('modalNewLeaveRequest');
    window.EmployeeHub.app.showToast(`Leave request submitted (${days} days). Sent to branch manager for approval.`, 'success');

    renderLeaveRequestsTable();
    refreshLeaveDashboard();
  }

  // =========================================================================
  // 4. LEAVE APPROVALS WORKFLOW
  // =========================================================================

  function renderLeaveApprovalsQueue() {
    const container = document.getElementById('leaveApprovalQueueGrid');
    const emptyNotice = document.getElementById('leaveApprovalQueueEmpty');
    if (!container) return;

    const store = window.EmployeeHub.attendanceStore;
    const pendingReqs = store.getLeaveRequests({ status: 'Pending' });
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const empMap = new Map(employees.map(e => [e.id, e]));
    const types = store.getLeaveTypes();
    const typeMap = new Map(types.map(t => [t.id, t]));

    if (pendingReqs.length === 0) {
      container.innerHTML = '';
      if (emptyNotice) emptyNotice.style.display = 'block';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';

    container.innerHTML = pendingReqs.map(req => {
      const emp = empMap.get(req.employeeId);
      const lt = typeMap.get(req.leaveTypeId);
      const bal = store.getEmployeeLeaveBalance(req.employeeId, req.leaveTypeId);

      return `
        <div class="approval-card">
          <div class="approval-card-top">
            <div class="approval-card-avatar">${emp ? emp.initials : 'EM'}</div>
            <div class="approval-card-emp-info">
              <div class="approval-card-name">
                ${emp ? window.EmployeeHub.utils.escapeHTML(emp.name) : req.employeeId}
                <span class="badge badge-warning">Pending</span>
              </div>
              <div class="approval-card-sub">
                ${emp ? emp.designation : ''} • ${emp ? emp.branch : ''} (${req.employeeId})
              </div>
            </div>
          </div>

          <div class="approval-details-box">
            <div style="display: flex; justify-content: space-between;">
              <span>Leave Category:</span>
              <strong style="color: var(--color-brand);">${lt ? lt.name : req.leaveTypeId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Period & Working Days:</span>
              <strong>${req.startDate} to ${req.endDate} (${req.dayCount} day${req.dayCount > 1 ? 's' : ''})</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Remaining Balance:</span>
              <span><strong>${bal ? bal.remaining : '--'} days</strong> left</span>
            </div>
            <div class="approval-reason-text">
              "${window.EmployeeHub.utils.escapeHTML(req.reason || 'No reason provided')}"
            </div>
          </div>

          <div class="approval-card-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.leave.promptDecision('${req.id}', 'Rejected')">
              Reject
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.EmployeeHub.leave.promptDecision('${req.id}', 'Approved')">
              Approve Request
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function promptDecision(requestId, decision) {
    const modal = document.getElementById('modalConfirmLeaveDecision');
    if (!modal) return;

    document.getElementById('decisionRequestId').value = requestId;
    document.getElementById('decisionType').value = decision;
    document.getElementById('decisionTitleText').textContent = `${decision === 'Approved' ? 'Approve' : 'Reject'} Leave Request`;
    document.getElementById('decisionActionBtn').textContent = decision === 'Approved' ? 'Confirm Approval' : 'Confirm Rejection';
    document.getElementById('decisionActionBtn').className = `btn ${decision === 'Approved' ? 'btn-primary' : 'btn-danger'}`;

    const store = window.EmployeeHub.attendanceStore;
    const req = store.getLeaveRequests().find(r => r.id === requestId);
    const emp = req && window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployeeById(req.employeeId) : null;

    document.getElementById('decisionSummaryText').innerHTML = `
      You are taking action on <strong>${req ? req.id : ''}</strong> for <strong>${emp ? emp.name : ''}</strong> (${req ? req.dayCount : ''} days).<br>
      ${decision === 'Approved' ? '<span style="color: var(--color-success);">Approving will automatically mark attendance as "On leave" and deduct from employee leave balance.</span>' : '<span style="color: var(--color-danger);">Rejecting will maintain existing attendance status and retain leave balance.</span>'}
    `;

    document.getElementById('decisionCommentInput').value = '';
    modal.classList.add('show');
  }

  function executeLeaveDecision() {
    const requestId = document.getElementById('decisionRequestId').value;
    const decision = document.getElementById('decisionType').value;
    const comment = document.getElementById('decisionCommentInput').value.trim();

    const store = window.EmployeeHub.attendanceStore;
    store.updateLeaveRequestStatus(requestId, decision, comment, 'Vikram Malhotra (Admin / Approver)');

    window.EmployeeHub.modals.closeModal('modalConfirmLeaveDecision');
    window.EmployeeHub.app.showToast(`Leave request ${requestId} marked as ${decision}. Attendance synchronized.`, 'success');

    renderLeaveApprovalsQueue();
    renderLeaveRequestsTable();
    refreshLeaveDashboard();
  }

  // =========================================================================
  // 5. LEAVE TYPES & BALANCES DIRECTORY
  // =========================================================================

  function renderLeaveTypesAndBalances() {
    renderLeaveTypesTable();
    renderEmployeeBalancesDirectory();
  }

  function renderLeaveTypesTable() {
    const container = document.getElementById('leaveTypesContainer');
    if (!container) return;

    const store = window.EmployeeHub.attendanceStore;
    const types = store.getLeaveTypes();

    container.innerHTML = types.map(t => `
      <div class="leave-quota-card">
        <div class="leave-quota-header">
          <div>
            <div class="leave-quota-title">${window.EmployeeHub.utils.escapeHTML(t.name)}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 2px;">
              ${window.EmployeeHub.utils.escapeHTML(t.description)}
            </div>
          </div>
          <span class="leave-quota-code" style="background: rgba(37, 99, 235, 0.1); color: var(--color-brand);">${t.code}</span>
        </div>
        <div class="leave-quota-metric">
          <span class="leave-quota-val">${t.annualQuota}</span>
          <span class="leave-quota-denom">days / year</span>
          <span class="badge ${t.type === 'Paid' ? 'badge-success' : 'badge-neutral'}" style="margin-left: auto;">${t.type}</span>
        </div>
        <div class="leave-quota-meta">
          <span>Status: <strong>${t.active ? 'Active' : 'Inactive'}</strong></span>
          <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.leave.openEditLeaveTypeModal('${t.id}')">Edit</button>
        </div>
      </div>
    `).join('');
  }

  function renderEmployeeBalancesDirectory() {
    const tbody = document.getElementById('employeeBalancesDirectoryBody');
    if (!tbody) return;

    const store = window.EmployeeHub.attendanceStore;
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const types = store.getLeaveTypes();

    tbody.innerHTML = employees.map(emp => {
      const balance = store.getEmployeeLeaveBalance(emp.id);

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="table-avatar">${emp.initials}</div>
              <div>
                <strong>${window.EmployeeHub.utils.escapeHTML(emp.name)}</strong>
                <div style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${emp.id}</div>
              </div>
            </div>
          </td>
          <td>${window.EmployeeHub.utils.escapeHTML(emp.branch)}</td>
          ${types.map(t => {
            const b = balance[t.id];
            return `
              <td>
                <span title="${b ? `${b.approvedUsed} used, ${b.remaining} remaining of ${b.allocated}` : ''}">
                  <strong>${b ? b.remaining : 0}</strong> / ${b ? b.allocated : 0}
                </span>
              </td>
            `;
          }).join('')}
          <td>
            <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.leave.openNewLeaveRequestModal('${emp.id}')">
              Apply Leave
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openNewLeaveTypeModal() {
    const modal = document.getElementById('modalLeaveTypeForm');
    if (!modal) return;

    document.getElementById('leaveTypeIdInput').value = '';
    document.getElementById('leaveTypeNameInput').value = '';
    document.getElementById('leaveTypeCodeInput').value = '';
    document.getElementById('leaveTypeQuotaInput').value = '12';
    document.getElementById('leaveTypeClassification').value = 'Paid';
    document.getElementById('leaveTypeDescInput').value = '';

    modal.classList.add('show');
  }

  function openEditLeaveTypeModal(typeId) {
    const store = window.EmployeeHub.attendanceStore;
    const t = store.getLeaveTypes().find(item => item.id === typeId);
    if (!t) return;

    const modal = document.getElementById('modalLeaveTypeForm');
    if (!modal) return;

    document.getElementById('leaveTypeIdInput').value = t.id;
    document.getElementById('leaveTypeNameInput').value = t.name;
    document.getElementById('leaveTypeCodeInput').value = t.code;
    document.getElementById('leaveTypeQuotaInput').value = t.annualQuota;
    document.getElementById('leaveTypeClassification').value = t.type;
    document.getElementById('leaveTypeDescInput').value = t.description;

    modal.classList.add('show');
  }

  function handleLeaveTypeSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('leaveTypeIdInput').value;
    const name = document.getElementById('leaveTypeNameInput').value.trim();
    const code = document.getElementById('leaveTypeCodeInput').value.trim().toUpperCase();
    const annualQuota = Number(document.getElementById('leaveTypeQuotaInput').value) || 0;
    const type = document.getElementById('leaveTypeClassification').value;
    const description = document.getElementById('leaveTypeDescInput').value.trim();

    const store = window.EmployeeHub.attendanceStore;
    store.saveLeaveType({
      id: id || undefined,
      name,
      code,
      annualQuota,
      type,
      description,
      active: true
    });

    window.EmployeeHub.modals.closeModal('modalLeaveTypeForm');
    window.EmployeeHub.app.showToast(`Leave category ${name} saved.`, 'success');
    renderLeaveTypesAndBalances();
  }

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================

  function getLeaveStatusBadge(status) {
    switch (status) {
      case 'Approved': return '<span class="badge badge-success">Approved</span>';
      case 'Pending': return '<span class="badge badge-warning">Pending Review</span>';
      case 'Rejected': return '<span class="badge badge-danger">Rejected</span>';
      case 'Cancelled': return '<span class="badge badge-neutral">Cancelled</span>';
      default: return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  function populateBranchDropdown(selectElem, includeAll = false) {
    if (!selectElem) return;
    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];
    selectElem.innerHTML = '';
    if (includeAll) selectElem.innerHTML += '<option value="ALL">All Branches</option>';
    branches.forEach(b => {
      selectElem.innerHTML += `<option value="${b.name}">${b.name}</option>`;
    });
  }

  function populateEmployeeDropdown(selectElem, includeAll = false) {
    if (!selectElem) return;
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    selectElem.innerHTML = '';
    if (includeAll) selectElem.innerHTML += '<option value="ALL">All Employees</option>';
    employees.forEach(e => {
      selectElem.innerHTML += `<option value="${e.id}">${e.name} (${e.id} • ${e.branch})</option>`;
    });
  }

  function populateLeaveTypeDropdown(selectElem, includeAll = false) {
    if (!selectElem) return;
    const store = window.EmployeeHub.attendanceStore;
    const types = store.getLeaveTypes();
    selectElem.innerHTML = '';
    if (includeAll) selectElem.innerHTML += '<option value="ALL">All Categories</option>';
    types.forEach(t => {
      selectElem.innerHTML += `<option value="${t.id}">${t.name} (${t.code})</option>`;
    });
  }

  function updateText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return {
    initLeaveModule,
    refreshLeaveDashboard,
    renderLeaveRequestsTable,
    openNewLeaveRequestModal,
    recalculateRequestDays,
    handleNewLeaveSubmit,
    renderLeaveApprovalsQueue,
    promptDecision,
    executeLeaveDecision,
    renderLeaveTypesAndBalances,
    openNewLeaveTypeModal,
    openEditLeaveTypeModal,
    handleLeaveTypeSubmit
  };
})();
