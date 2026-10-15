/**
 * Phase 4: Attendance Management Controller
 * Namespace: window.EmployeeHub.attendance
 * Handles Attendance Dashboard, Records Table, Daily Entry Roster, Settings & CSV Export
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.attendance = (function () {
  'use strict';

  let attendanceTrendChartInstance = null;
  let recordsCurrentPage = 1;
  const recordsPageSize = 8;
  let dailyEntryBranch = 'BLR-01';
  let dailyEntryDate = '2026-10-13';

  // Filters State
  const recordsFilter = {
    search: '',
    branch: 'ALL',
    employeeId: 'ALL',
    status: 'ALL',
    startDate: '',
    endDate: ''
  };

  /**
   * Initialize Attendance module controls
   */
  function initAttendanceModule() {
    initDashboardFilters();
    initRecordsFilters();
    initDailyEntryControls();
    initSettingsControls();
  }

  // =========================================================================
  // 1. ATTENDANCE DASHBOARD
  // =========================================================================

  function initDashboardFilters() {
    const branchFilter = document.getElementById('attDashBranchFilter');
    const dateFilter = document.getElementById('attDashDateFilter');

    if (branchFilter) {
      populateBranchDropdown(branchFilter, true);
      branchFilter.addEventListener('change', () => refreshDashboard());
    }

    if (dateFilter) {
      dateFilter.value = '2026-10-13';
      dateFilter.addEventListener('change', () => refreshDashboard());
    }
  }

  function refreshDashboard() {
    const dateInput = document.getElementById('attDashDateFilter');
    const branchInput = document.getElementById('attDashBranchFilter');

    const selectedDate = dateInput ? dateInput.value : '2026-10-13';
    const selectedBranch = branchInput ? branchInput.value : 'ALL';

    const store = window.EmployeeHub.attendanceStore;
    if (!store) return;

    const stats = store.getAttendanceStats(selectedDate, selectedBranch);

    // Update KPI Metric Cards
    updateText('attMetricTotalActive', stats.totalActive);
    updateText('attMetricPresent', Math.floor(stats.present));
    updateText('attMetricAbsent', stats.absent);
    updateText('attMetricLate', stats.late);
    updateText('attMetricOnLeave', stats.onLeave);
    updateText('attMetricRate', `${stats.attendancePercentage}%`);

    // Render Trend Chart & Branch Summary
    renderAttendanceTrendChart(selectedBranch);
    renderBranchAttendanceSummary(selectedDate);
    renderRecentAttendanceActivity(selectedDate, selectedBranch);
  }

  function renderAttendanceTrendChart(branchFilter = 'ALL') {
    const ctx = document.getElementById('chartAttendanceTrends');
    if (!ctx) return;

    if (attendanceTrendChartInstance) {
      attendanceTrendChartInstance.destroy();
    }

    const store = window.EmployeeHub.attendanceStore;
    const dates = ['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13'];
    const labels = ['Wed 07', 'Thu 08', 'Fri 09', 'Sat 10', 'Sun 11 (Off)', 'Mon 12', 'Tue 13 (Today)'];

    const presentData = [];
    const absentData = [];
    const lateData = [];
    const leaveData = [];

    dates.forEach(d => {
      const s = store.getAttendanceStats(d, branchFilter);
      presentData.push(Math.floor(s.present));
      absentData.push(s.absent);
      lateData.push(s.late);
      leaveData.push(s.onLeave);
    });

    if (typeof Chart === 'undefined') return;

    attendanceTrendChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Present',
            data: presentData,
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Late',
            data: lateData,
            backgroundColor: '#f59e0b',
            borderRadius: 4
          },
          {
            label: 'On Leave',
            data: leaveData,
            backgroundColor: '#8b5cf6',
            borderRadius: 4
          },
          {
            label: 'Absent',
            data: absentData,
            backgroundColor: '#ef4444',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
        },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } },
          tooltip: { mode: 'index' }
        }
      }
    });
  }

  function renderBranchAttendanceSummary(selectedDate) {
    const tbody = document.getElementById('branchAttendanceSummaryBody');
    if (!tbody) return;

    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];
    const store = window.EmployeeHub.attendanceStore;

    tbody.innerHTML = branches.slice(0, 6).map(br => {
      const s = store.getAttendanceStats(selectedDate, br.name);
      return `
        <tr>
          <td>
            <strong>${window.EmployeeHub.utils.escapeHTML(br.name)}</strong>
            <div style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${br.code}</div>
          </td>
          <td>${s.totalActive}</td>
          <td><span class="badge badge-present">${Math.floor(s.present)}</span></td>
          <td><span class="badge badge-late">${s.late}</span></td>
          <td><span class="badge badge-on-leave">${s.onLeave}</span></td>
          <td><span class="badge badge-absent">${s.absent}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: ${s.attendancePercentage >= 90 ? 'var(--color-success)' : s.attendancePercentage >= 75 ? 'var(--color-warning)' : 'var(--color-danger)'};">
                ${s.attendancePercentage}%
              </strong>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderRecentAttendanceActivity(dateStr, branchFilter) {
    const tbody = document.getElementById('recentAttendanceLogsBody');
    if (!tbody) return;

    const store = window.EmployeeHub.attendanceStore;
    const records = store.getAttendanceRecords({ date: dateStr });
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const empMap = new Map(employees.map(e => [e.id, e]));

    const filtered = records.filter(r => {
      const emp = empMap.get(r.employeeId);
      if (!emp) return false;
      if (branchFilter !== 'ALL' && emp.branch !== branchFilter) return false;
      return true;
    }).slice(0, 7);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 24px; color: var(--color-text-muted);">No attendance entries recorded for this selection.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const emp = empMap.get(r.employeeId);
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="table-avatar">${emp ? emp.initials : 'EM'}</div>
              <div>
                <strong>${emp ? window.EmployeeHub.utils.escapeHTML(emp.name) : r.employeeId}</strong>
                <div style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${r.employeeId}</div>
              </div>
            </div>
          </td>
          <td>${emp ? window.EmployeeHub.utils.escapeHTML(emp.branch) : '--'}</td>
          <td><span style="font-family: var(--font-mono);">${r.checkIn || '--'}</span></td>
          <td><span style="font-family: var(--font-mono);">${r.checkOut || '--'}</span></td>
          <td>${r.workHours ? r.workHours + ' hrs' : '--'}</td>
          <td>${getStatusBadge(r.status)}</td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 2. ATTENDANCE RECORDS (Full Table & History)
  // =========================================================================

  function initRecordsFilters() {
    const searchInput = document.getElementById('attRecordsSearch');
    const branchFilter = document.getElementById('attRecordsBranchFilter');
    const empFilter = document.getElementById('attRecordsEmployeeFilter');
    const statusFilter = document.getElementById('attRecordsStatusFilter');
    const startDate = document.getElementById('attRecordsStartDate');
    const endDate = document.getElementById('attRecordsEndDate');

    if (branchFilter) {
      populateBranchDropdown(branchFilter, true);
      branchFilter.addEventListener('change', (e) => {
        recordsFilter.branch = e.target.value;
        recordsCurrentPage = 1;
        renderRecordsTable();
      });
    }

    if (empFilter) {
      populateEmployeeDropdown(empFilter, true);
      empFilter.addEventListener('change', (e) => {
        recordsFilter.employeeId = e.target.value;
        recordsCurrentPage = 1;
        renderRecordsTable();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        recordsFilter.status = e.target.value;
        recordsCurrentPage = 1;
        renderRecordsTable();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        recordsFilter.search = e.target.value.toLowerCase().trim();
        recordsCurrentPage = 1;
        renderRecordsTable();
      });
    }

    if (startDate) {
      startDate.addEventListener('change', (e) => {
        recordsFilter.startDate = e.target.value;
        recordsCurrentPage = 1;
        renderRecordsTable();
      });
    }

    if (endDate) {
      endDate.addEventListener('change', (e) => {
        recordsFilter.endDate = e.target.value;
        recordsCurrentPage = 1;
        renderRecordsTable();
      });
    }

    // Pagination
    const prevBtn = document.getElementById('btnAttPrevPage');
    const nextBtn = document.getElementById('btnAttNextPage');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (recordsCurrentPage > 1) { recordsCurrentPage--; renderRecordsTable(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { recordsCurrentPage++; renderRecordsTable(); });
  }

  function resetRecordsFilters() {
    recordsFilter.search = '';
    recordsFilter.branch = 'ALL';
    recordsFilter.employeeId = 'ALL';
    recordsFilter.status = 'ALL';
    recordsFilter.startDate = '';
    recordsFilter.endDate = '';

    const s = document.getElementById('attRecordsSearch'); if (s) s.value = '';
    const b = document.getElementById('attRecordsBranchFilter'); if (b) b.value = 'ALL';
    const e = document.getElementById('attRecordsEmployeeFilter'); if (e) e.value = 'ALL';
    const st = document.getElementById('attRecordsStatusFilter'); if (st) st.value = 'ALL';
    const sd = document.getElementById('attRecordsStartDate'); if (sd) sd.value = '';
    const ed = document.getElementById('attRecordsEndDate'); if (ed) ed.value = '';

    recordsCurrentPage = 1;
    renderRecordsTable();
  }

  function renderRecordsTable() {
    const tbody = document.getElementById('attendanceRecordsTableBody');
    const emptyState = document.getElementById('attRecordsEmptyState');
    if (!tbody) return;

    const store = window.EmployeeHub.attendanceStore;
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const empMap = new Map(employees.map(e => [e.id, e]));

    let records = store.getAttendanceRecords();

    // Apply Filters
    records = records.filter(r => {
      const emp = empMap.get(r.employeeId);
      if (!emp) return false;

      if (recordsFilter.branch !== 'ALL' && emp.branch !== recordsFilter.branch) return false;
      if (recordsFilter.employeeId !== 'ALL' && r.employeeId !== recordsFilter.employeeId) return false;
      if (recordsFilter.status !== 'ALL' && r.status !== recordsFilter.status) return false;
      if (recordsFilter.startDate && r.date < recordsFilter.startDate) return false;
      if (recordsFilter.endDate && r.date > recordsFilter.endDate) return false;

      if (recordsFilter.search) {
        const q = recordsFilter.search;
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesId = r.employeeId.toLowerCase().includes(q);
        const matchesRole = emp.designation.toLowerCase().includes(q);
        const matchesNotes = (r.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesRole && !matchesNotes) return false;
      }
      return true;
    });

    // Sort by Date descending, then ID
    records.sort((a, b) => b.date.localeCompare(a.date) || a.employeeId.localeCompare(b.employeeId));

    if (records.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      updatePaginationControls(0, 0, 0);
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Pagination
    const totalRecords = records.length;
    const totalPages = Math.ceil(totalRecords / recordsPageSize);
    if (recordsCurrentPage > totalPages) recordsCurrentPage = totalPages;

    const startIdx = (recordsCurrentPage - 1) * recordsPageSize;
    const pageRecords = records.slice(startIdx, startIdx + recordsPageSize);

    tbody.innerHTML = pageRecords.map(r => {
      const emp = empMap.get(r.employeeId);
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="table-avatar">${emp ? emp.initials : 'EM'}</div>
              <div>
                <strong>${emp ? window.EmployeeHub.utils.escapeHTML(emp.name) : r.employeeId}</strong>
                <div style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${r.employeeId}</div>
              </div>
            </div>
          </td>
          <td>${emp ? window.EmployeeHub.utils.escapeHTML(emp.branch) : '--'}</td>
          <td><span style="font-family: var(--font-mono);">${r.date}</span></td>
          <td><span style="font-family: var(--font-mono);">${r.checkIn || '--'}</span></td>
          <td><span style="font-family: var(--font-mono);">${r.checkOut || '--'}</span></td>
          <td>${r.breakMinutes ? r.breakMinutes + 'm' : '0m'}</td>
          <td><strong>${r.workHours ? r.workHours + ' hrs' : '--'}</strong></td>
          <td>${getStatusBadge(r.status)}</td>
          <td>
            <span style="font-size: 0.75rem; color: var(--color-text-secondary); max-width: 140px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${window.EmployeeHub.utils.escapeHTML(r.notes || '')}">
              ${window.EmployeeHub.utils.escapeHTML(r.notes || '--')}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.attendance.openEditModal('${r.id}')" title="Edit Record">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.attendance.openEmployeeHistory('${r.employeeId}')" title="View Full Attendance History">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    updatePaginationControls(startIdx + 1, Math.min(startIdx + recordsPageSize, totalRecords), totalRecords);
  }

  function updatePaginationControls(start, end, total) {
    const info = document.getElementById('attRecordsPaginationInfo');
    const pagesContainer = document.getElementById('attRecordsPaginationPages');
    const prevBtn = document.getElementById('btnAttPrevPage');
    const nextBtn = document.getElementById('btnAttNextPage');

    if (info) {
      info.textContent = total > 0 ? `Showing ${start} to ${end} of ${total} records` : 'No records';
    }

    const totalPages = Math.ceil(total / recordsPageSize) || 1;
    if (prevBtn) prevBtn.disabled = recordsCurrentPage <= 1;
    if (nextBtn) nextBtn.disabled = recordsCurrentPage >= totalPages;

    if (pagesContainer) {
      pagesContainer.innerHTML = '';
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= recordsCurrentPage - 1 && p <= recordsCurrentPage + 1)) {
          const btn = document.createElement('button');
          btn.className = `btn-page ${p === recordsCurrentPage ? 'active' : ''}`;
          btn.textContent = p;
          btn.addEventListener('click', () => { recordsCurrentPage = p; renderRecordsTable(); });
          pagesContainer.appendChild(btn);
        }
      }
    }
  }

  // =========================================================================
  // 3. MARK / EDIT ATTENDANCE MODAL
  // =========================================================================

  function openMarkAttendanceModal() {
    const modal = document.getElementById('modalAttendanceForm');
    if (!modal) return;

    document.getElementById('attFormRecordId').value = '';
    document.getElementById('attModalTitle').textContent = 'Mark Employee Attendance';

    const empSelect = document.getElementById('attFormEmployee');
    populateEmployeeDropdown(empSelect, false);

    document.getElementById('attFormDate').value = '2026-10-13';
    document.getElementById('attFormCheckIn').value = '09:30';
    document.getElementById('attFormCheckOut').value = '18:30';
    document.getElementById('attFormBreak').value = '60';
    document.getElementById('attFormStatus').value = 'Present';
    document.getElementById('attFormNotes').value = '';

    recalculateModalHours();
    modal.classList.add('show');
  }

  function openEditModal(recordId) {
    const store = window.EmployeeHub.attendanceStore;
    const records = store.getAttendanceRecords();
    const r = records.find(item => item.id === recordId);
    if (!r) return;

    const modal = document.getElementById('modalAttendanceForm');
    if (!modal) return;

    document.getElementById('attFormRecordId').value = r.id;
    document.getElementById('attModalTitle').textContent = 'Edit Attendance Record';

    const empSelect = document.getElementById('attFormEmployee');
    populateEmployeeDropdown(empSelect, false);
    empSelect.value = r.employeeId;

    document.getElementById('attFormDate').value = r.date;
    document.getElementById('attFormCheckIn').value = r.checkIn || '';
    document.getElementById('attFormCheckOut').value = r.checkOut || '';
    document.getElementById('attFormBreak').value = r.breakMinutes || '60';
    document.getElementById('attFormStatus').value = r.status;
    document.getElementById('attFormNotes').value = r.notes || '';

    recalculateModalHours();
    modal.classList.add('show');
  }

  function recalculateModalHours() {
    const inVal = document.getElementById('attFormCheckIn').value;
    const outVal = document.getElementById('attFormCheckOut').value;
    const breakVal = Number(document.getElementById('attFormBreak').value) || 0;

    const store = window.EmployeeHub.attendanceStore;
    const hours = store.calculateWorkingHours(inVal, outVal, breakVal);

    const calcDisplay = document.getElementById('attFormCalcHours');
    if (calcDisplay) {
      calcDisplay.textContent = `${hours} hours`;
    }

    // Auto-suggest status if check-in changed
    const statusSelect = document.getElementById('attFormStatus');
    if (statusSelect && inVal && outVal) {
      const suggested = store.determineStatus(inVal, outVal, breakVal);
      statusSelect.value = suggested;
    }
  }

  function handleAttendanceFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('attFormRecordId').value;
    const employeeId = document.getElementById('attFormEmployee').value;
    const date = document.getElementById('attFormDate').value;
    const checkIn = document.getElementById('attFormCheckIn').value;
    const checkOut = document.getElementById('attFormCheckOut').value;
    const breakMinutes = Number(document.getElementById('attFormBreak').value) || 0;
    const status = document.getElementById('attFormStatus').value;
    const notes = document.getElementById('attFormNotes').value;

    const store = window.EmployeeHub.attendanceStore;

    // Validation: Check-out must follow check-in if both provided
    if (checkIn && checkOut) {
      const hours = store.calculateWorkingHours(checkIn, checkOut, breakMinutes);
      if (hours <= 0 && checkOut <= checkIn) {
        window.EmployeeHub.app.showToast('Validation Error: Check-out time must be after check-in time.', 'error');
        return;
      }
    }

    const workHours = store.calculateWorkingHours(checkIn, checkOut, breakMinutes);

    store.saveAttendanceRecord({
      id: id || undefined,
      employeeId,
      date,
      checkIn,
      checkOut,
      breakMinutes,
      workHours,
      status,
      notes
    });

    window.EmployeeHub.modals.closeModal('modalAttendanceForm');
    window.EmployeeHub.app.showToast(`Attendance record saved for ${employeeId} on ${date}.`, 'success');
    renderRecordsTable();
    refreshDashboard();
  }

  // =========================================================================
  // 4. DAILY ATTENDANCE ENTRY ROSTER WORKFLOW
  // =========================================================================

  function initDailyEntryControls() {
    const branchSelect = document.getElementById('dailyEntryBranch');
    const dateInput = document.getElementById('dailyEntryDate');

    if (branchSelect) {
      populateBranchDropdown(branchSelect, false);
      branchSelect.value = dailyEntryBranch;
      branchSelect.addEventListener('change', (e) => {
        dailyEntryBranch = e.target.value;
        loadDailyEntryRoster();
      });
    }

    if (dateInput) {
      dateInput.value = dailyEntryDate;
      dateInput.addEventListener('change', (e) => {
        dailyEntryDate = e.target.value;
        loadDailyEntryRoster();
      });
    }
  }

  function loadDailyEntryRoster() {
    const tbody = document.getElementById('dailyEntryRosterBody');
    if (!tbody) return;

    const store = window.EmployeeHub.attendanceStore;
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];

    // Filter active employees for the selected branch
    const branchEmployees = employees.filter(e => e.branch === dailyEntryBranch && e.status === 'Active');

    if (branchEmployees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--color-text-muted);">No active employees found in ${dailyEntryBranch}.</td></tr>`;
      return;
    }

    // Load existing records for that date
    const existingRecords = store.getAttendanceRecords({ date: dailyEntryDate });
    const recordMap = new Map(existingRecords.map(r => [r.employeeId, r]));

    // Check if records already exist for warning
    const overwriteNotice = document.getElementById('dailyEntryOverwriteNotice');
    const hasExisting = branchEmployees.some(e => recordMap.has(e.id));
    if (overwriteNotice) {
      overwriteNotice.style.display = hasExisting ? 'flex' : 'none';
    }

    tbody.innerHTML = branchEmployees.map(emp => {
      const rec = recordMap.get(emp.id) || {
        checkIn: '09:30',
        checkOut: '18:30',
        breakMinutes: 60,
        status: 'Present',
        notes: ''
      };

      return `
        <tr data-emp-id="${emp.id}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="table-avatar">${emp.initials}</div>
              <div>
                <strong>${window.EmployeeHub.utils.escapeHTML(emp.name)}</strong>
                <div style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono);">${emp.id}</div>
              </div>
            </div>
          </td>
          <td>${window.EmployeeHub.utils.escapeHTML(emp.designation)}</td>
          <td>
            <input type="time" class="form-input form-input-sm daily-in" value="${rec.checkIn || ''}" style="width: 105px;" onchange="window.EmployeeHub.attendance.updateDailyRowHours('${emp.id}')">
          </td>
          <td>
            <input type="time" class="form-input form-input-sm daily-out" value="${rec.checkOut || ''}" style="width: 105px;" onchange="window.EmployeeHub.attendance.updateDailyRowHours('${emp.id}')">
          </td>
          <td>
            <div class="quick-status-group" id="quickGroup_${emp.id}">
              <button type="button" class="btn-status-toggle ${rec.status === 'Present' ? 'active-p' : ''}" onclick="window.EmployeeHub.attendance.setRowStatus('${emp.id}', 'Present')">P</button>
              <button type="button" class="btn-status-toggle ${rec.status === 'Late' ? 'active-l' : ''}" onclick="window.EmployeeHub.attendance.setRowStatus('${emp.id}', 'Late')">L</button>
              <button type="button" class="btn-status-toggle ${rec.status === 'Half-day' ? 'active-hd' : ''}" onclick="window.EmployeeHub.attendance.setRowStatus('${emp.id}', 'Half-day')">HD</button>
              <button type="button" class="btn-status-toggle ${rec.status === 'Absent' ? 'active-a' : ''}" onclick="window.EmployeeHub.attendance.setRowStatus('${emp.id}', 'Absent')">A</button>
              <button type="button" class="btn-status-toggle ${rec.status === 'On leave' ? 'active-ol' : ''}" onclick="window.EmployeeHub.attendance.setRowStatus('${emp.id}', 'On leave')">LV</button>
            </div>
            <input type="hidden" class="daily-status" value="${rec.status}">
          </td>
          <td>
            <span class="daily-hours-display" style="font-weight: 600; font-family: var(--font-mono);">
              ${rec.workHours ? rec.workHours + 'h' : '--'}
            </span>
          </td>
          <td>
            <input type="text" class="form-input form-input-sm daily-notes" value="${window.EmployeeHub.utils.escapeHTML(rec.notes || '')}" placeholder="Optional note..." style="width: 130px;">
          </td>
        </tr>
      `;
    }).join('');
  }

  function setRowStatus(empId, status) {
    const row = document.querySelector(`tr[data-emp-id="${empId}"]`);
    if (!row) return;

    const hiddenInput = row.querySelector('.daily-status');
    if (hiddenInput) hiddenInput.value = status;

    const group = document.getElementById(`quickGroup_${empId}`);
    if (group) {
      group.querySelectorAll('.btn-status-toggle').forEach(btn => {
        btn.classList.remove('active-p', 'active-a', 'active-l', 'active-hd', 'active-ol');
      });
      const btnMap = {
        'Present': 'active-p',
        'Late': 'active-l',
        'Half-day': 'active-hd',
        'Absent': 'active-a',
        'On leave': 'active-ol'
      };
      const activeClass = btnMap[status];
      if (activeClass) {
        const matchingBtn = Array.from(group.querySelectorAll('.btn-status-toggle')).find(b => {
          if (status === 'Present') return b.textContent === 'P';
          if (status === 'Late') return b.textContent === 'L';
          if (status === 'Half-day') return b.textContent === 'HD';
          if (status === 'Absent') return b.textContent === 'A';
          if (status === 'On leave') return b.textContent === 'LV';
          return false;
        });
        if (matchingBtn) matchingBtn.classList.add(activeClass);
      }
    }

    // Auto-clear times for Absent or On leave
    if (status === 'Absent' || status === 'On leave') {
      const inInput = row.querySelector('.daily-in');
      const outInput = row.querySelector('.daily-out');
      if (inInput) inInput.value = '';
      if (outInput) outInput.value = '';
    } else if (status === 'Present') {
      const inInput = row.querySelector('.daily-in');
      const outInput = row.querySelector('.daily-out');
      if (inInput && !inInput.value) inInput.value = '09:30';
      if (outInput && !outInput.value) outInput.value = '18:30';
    }

    updateDailyRowHours(empId);
  }

  function updateDailyRowHours(empId) {
    const row = document.querySelector(`tr[data-emp-id="${empId}"]`);
    if (!row) return;

    const inVal = row.querySelector('.daily-in').value;
    const outVal = row.querySelector('.daily-out').value;
    const hoursSpan = row.querySelector('.daily-hours-display');

    const store = window.EmployeeHub.attendanceStore;
    const hours = store.calculateWorkingHours(inVal, outVal, 60);
    if (hoursSpan) {
      hoursSpan.textContent = hours > 0 ? `${hours}h` : '--';
    }
  }

  function bulkSetDailyRoster(status) {
    const rows = document.querySelectorAll('#dailyEntryRosterBody tr[data-emp-id]');
    rows.forEach(row => {
      const empId = row.getAttribute('data-emp-id');
      setRowStatus(empId, status);
    });
    window.EmployeeHub.app.showToast(`Set all roster rows to ${status}.`, 'info');
  }

  function saveDailyRoster() {
    const rows = document.querySelectorAll('#dailyEntryRosterBody tr[data-emp-id]');
    if (rows.length === 0) return;

    const store = window.EmployeeHub.attendanceStore;
    const recordsToSave = [];

    rows.forEach(row => {
      const empId = row.getAttribute('data-emp-id');
      const checkIn = row.querySelector('.daily-in').value;
      const checkOut = row.querySelector('.daily-out').value;
      const status = row.querySelector('.daily-status').value || 'Present';
      const notes = row.querySelector('.daily-notes').value;

      const workHours = store.calculateWorkingHours(checkIn, checkOut, 60);

      recordsToSave.push({
        employeeId: empId,
        date: dailyEntryDate,
        checkIn,
        checkOut,
        breakMinutes: 60,
        workHours,
        status,
        notes
      });
    });

    store.bulkSaveAttendance(recordsToSave);
    window.EmployeeHub.app.showToast(`Successfully saved daily attendance for ${recordsToSave.length} employees on ${dailyEntryDate}.`, 'success');

    loadDailyEntryRoster();
    refreshDashboard();
  }

  // =========================================================================
  // 5. EMPLOYEE ATTENDANCE HISTORY MODAL
  // =========================================================================

  function openEmployeeHistory(empId) {
    const store = window.EmployeeHub.attendanceStore;
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const modal = document.getElementById('modalEmployeeAttendanceHistory');
    if (!modal) return;

    document.getElementById('attHistoryEmpName').textContent = emp.name;
    document.getElementById('attHistoryEmpMeta').textContent = `${emp.id} • ${emp.designation} • ${emp.branch}`;

    const records = store.getAttendanceRecords({ employeeId: empId });
    records.sort((a, b) => b.date.localeCompare(a.date));

    // Stats
    const totalDays = records.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const lateCount = records.filter(r => r.status === 'Late').length;
    const leaveCount = records.filter(r => r.status === 'On leave').length;
    const rate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 0;

    document.getElementById('attHistoryPresent').textContent = presentCount;
    document.getElementById('attHistoryLate').textContent = lateCount;
    document.getElementById('attHistoryLeave').textContent = leaveCount;
    document.getElementById('attHistoryRate').textContent = `${rate}%`;

    const tbody = document.getElementById('attHistoryTableBody');
    if (tbody) {
      if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 24px;">No attendance history found.</td></tr>`;
      } else {
        tbody.innerHTML = records.map(r => `
          <tr>
            <td><span style="font-family: var(--font-mono);">${r.date}</span></td>
            <td><span style="font-family: var(--font-mono);">${r.checkIn || '--'}</span></td>
            <td><span style="font-family: var(--font-mono);">${r.checkOut || '--'}</span></td>
            <td>${r.workHours ? r.workHours + ' hrs' : '--'}</td>
            <td>${getStatusBadge(r.status)}</td>
            <td>${window.EmployeeHub.utils.escapeHTML(r.notes || '--')}</td>
          </tr>
        `).join('');
      }
    }

    modal.classList.add('show');
  }

  // =========================================================================
  // 6. CSV EXPORT
  // =========================================================================

  function exportAttendanceCSV() {
    const store = window.EmployeeHub.attendanceStore;
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const empMap = new Map(employees.map(e => [e.id, e]));

    const records = store.getAttendanceRecords();
    records.sort((a, b) => b.date.localeCompare(a.date));

    const headers = [
      'Record ID',
      'Employee ID',
      'Employee Name',
      'Branch',
      'Designation',
      'Date',
      'Check In',
      'Check Out',
      'Break (Mins)',
      'Working Hours',
      'Attendance Status',
      'Notes'
    ];

    const rows = records.map(r => {
      const emp = empMap.get(r.employeeId);
      return [
        r.id,
        r.employeeId,
        emp ? emp.name : '',
        emp ? emp.branch : '',
        emp ? emp.designation : '',
        r.date,
        r.checkIn || '',
        r.checkOut || '',
        r.breakMinutes || 0,
        r.workHours || 0,
        r.status,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EmployeeHub_Attendance_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.EmployeeHub.app.showToast('Attendance report exported to CSV.', 'success');
  }

  // =========================================================================
  // 7. SETTINGS & HOLIDAYS CONTROLS
  // =========================================================================

  function initSettingsControls() {
    // Holiday calendar rendering
    renderHolidayList();
  }

  function loadSettingsForm() {
    const store = window.EmployeeHub.attendanceStore;
    const settings = store.getAttendanceSettings();

    const start = document.getElementById('settingWorkStart'); if (start) start.value = settings.standardStartTime;
    const end = document.getElementById('settingWorkEnd'); if (end) end.value = settings.standardEndTime;
    const grace = document.getElementById('settingGraceMins'); if (grace) grace.value = settings.gracePeriodMinutes;
    const brk = document.getElementById('settingBreakMins'); if (brk) brk.value = settings.standardBreakMinutes;
    const exp = document.getElementById('settingExpectedHours'); if (exp) exp.value = settings.expectedDailyHours;

    renderHolidayList();
  }

  function saveSettingsForm(e) {
    if (e) e.preventDefault();
    const store = window.EmployeeHub.attendanceStore;
    const current = store.getAttendanceSettings();

    const start = document.getElementById('settingWorkStart').value;
    const end = document.getElementById('settingWorkEnd').value;
    const grace = Number(document.getElementById('settingGraceMins').value) || 15;
    const brk = Number(document.getElementById('settingBreakMins').value) || 60;
    const exp = Number(document.getElementById('settingExpectedHours').value) || 8;

    store.saveAttendanceSettings({
      ...current,
      standardStartTime: start,
      standardEndTime: end,
      gracePeriodMinutes: grace,
      standardBreakMinutes: brk,
      expectedDailyHours: exp
    });

    window.EmployeeHub.app.showToast('Attendance working hours & settings saved.', 'success');
    refreshDashboard();
  }

  function renderHolidayList() {
    const container = document.getElementById('holidayCalendarList');
    if (!container) return;

    const store = window.EmployeeHub.attendanceStore;
    const settings = store.getAttendanceSettings();
    const holidays = settings.holidays || [];

    if (holidays.length === 0) {
      container.innerHTML = `<div style="padding: 16px; color: var(--color-text-muted); font-size: 0.8125rem;">No holidays configured.</div>`;
      return;
    }

    container.innerHTML = holidays.map(h => `
      <div class="holiday-item">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="holiday-date-badge">${h.date}</span>
          <span style="font-weight: 600; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(h.name)}</span>
        </div>
        <button class="btn btn-ghost btn-sm text-danger" onclick="window.EmployeeHub.attendance.removeHolidayItem('${h.date}')" title="Delete Holiday">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');
  }

  function handleAddHoliday(e) {
    e.preventDefault();
    const dateInput = document.getElementById('newHolidayDate');
    const nameInput = document.getElementById('newHolidayName');

    if (!dateInput.value || !nameInput.value.trim()) return;

    const store = window.EmployeeHub.attendanceStore;
    store.addHoliday({
      date: dateInput.value,
      name: nameInput.value.trim()
    });

    dateInput.value = '';
    nameInput.value = '';

    renderHolidayList();
    window.EmployeeHub.app.showToast('Holiday added to calendar.', 'success');
  }

  function removeHolidayItem(dateStr) {
    const store = window.EmployeeHub.attendanceStore;
    store.removeHoliday(dateStr);
    renderHolidayList();
    window.EmployeeHub.app.showToast('Holiday removed from calendar.', 'info');
  }

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================

  function getStatusBadge(status) {
    switch (status) {
      case 'Present': return '<span class="badge badge-present">Present</span>';
      case 'Late': return '<span class="badge badge-late">Late Arrival</span>';
      case 'Half-day': return '<span class="badge badge-half-day">Half-Day</span>';
      case 'Absent': return '<span class="badge badge-absent">Absent</span>';
      case 'On leave': return '<span class="badge badge-on-leave">On Leave</span>';
      case 'Holiday': return '<span class="badge badge-holiday">Holiday</span>';
      default: return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  function populateBranchDropdown(selectElem, includeAll = false) {
    if (!selectElem) return;
    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];
    selectElem.innerHTML = '';
    if (includeAll) {
      selectElem.innerHTML += '<option value="ALL">All Branches</option>';
    }
    branches.forEach(b => {
      selectElem.innerHTML += `<option value="${b.name}">${b.name}</option>`;
    });
  }

  function populateEmployeeDropdown(selectElem, includeAll = false) {
    if (!selectElem) return;
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    selectElem.innerHTML = '';
    if (includeAll) {
      selectElem.innerHTML += '<option value="ALL">All Employees</option>';
    }
    employees.forEach(e => {
      selectElem.innerHTML += `<option value="${e.id}">${e.id} — ${e.name} (${e.branch})</option>`;
    });
  }

  function updateText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return {
    initAttendanceModule,
    refreshDashboard,
    renderRecordsTable,
    resetRecordsFilters,
    openMarkAttendanceModal,
    openEditModal,
    recalculateModalHours,
    handleAttendanceFormSubmit,
    loadDailyEntryRoster,
    setRowStatus,
    updateDailyRowHours,
    bulkSetDailyRoster,
    saveDailyRoster,
    openEmployeeHistory,
    exportAttendanceCSV,
    loadSettingsForm,
    saveSettingsForm,
    handleAddHoliday,
    removeHolidayItem
  };
})();
