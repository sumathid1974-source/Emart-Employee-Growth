/**
 * Phase 4: Employee Self-Service (ESS) Controller
 * Namespace: window.EmployeeHub.ess
 * Provides an interactive demo portal for any selected employee:
 * - Personal attendance history & metrics
 * - Personal leave balances and request submission
 * - Track leave requests
 * - Targeted announcements and personal notifications
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.ess = (function () {
  'use strict';

  let currentEmployeeId = 'EMP-1001'; // Default: Priya Sharma (Bengaluru HQ)

  function initEssModule() {
    initEmployeeSelector();
  }

  function initEmployeeSelector() {
    const selector = document.getElementById('essEmployeeSelector');
    if (!selector) return;

    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    selector.innerHTML = employees.map(e => `
      <option value="${e.id}" ${e.id === currentEmployeeId ? 'selected' : ''}>
        ${e.name} (${e.id} • ${e.branch})
      </option>
    `).join('');

    selector.addEventListener('change', (e) => {
      currentEmployeeId = e.target.value;
      refreshEssPortal();
    });
  }

  function refreshEssPortal() {
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const emp = employees.find(e => e.id === currentEmployeeId) || employees[0];
    if (!emp) return;

    currentEmployeeId = emp.id;

    // 1. Hero Profile Banner
    const avatar = document.getElementById('essHeroAvatar');
    const name = document.getElementById('essHeroName');
    const meta = document.getElementById('essHeroMeta');

    if (avatar) avatar.textContent = emp.initials;
    if (name) name.textContent = emp.name;
    if (meta) {
      meta.innerHTML = `
        <span>${emp.id}</span> •
        <span>${emp.designation}</span> •
        <span>${emp.department}</span> •
        <span>${emp.branch}</span>
      `;
    }

    // 2. Personal Attendance Metrics
    const store = window.EmployeeHub.attendanceStore;
    const records = store.getAttendanceRecords({ employeeId: emp.id });
    records.sort((a, b) => b.date.localeCompare(a.date));

    const totalDays = records.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const lateCount = records.filter(r => r.status === 'Late').length;
    const leaveCount = records.filter(r => r.status === 'On leave').length;
    const rate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 0;

    updateText('essMetricPresent', presentCount);
    updateText('essMetricLate', lateCount);
    updateText('essMetricLeave', leaveCount);
    updateText('essMetricRate', `${rate}%`);

    // 3. Personal Attendance Log Table
    const attTbody = document.getElementById('essAttendanceLogBody');
    if (attTbody) {
      if (records.length === 0) {
        attTbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 16px; color: var(--color-text-muted);">No attendance records found.</td></tr>`;
      } else {
        attTbody.innerHTML = records.slice(0, 5).map(r => `
          <tr>
            <td><span style="font-family: var(--font-mono);">${r.date}</span></td>
            <td><span style="font-family: var(--font-mono);">${r.checkIn || '--'}</span></td>
            <td><span style="font-family: var(--font-mono);">${r.checkOut || '--'}</span></td>
            <td>${r.workHours ? r.workHours + ' hrs' : '--'}</td>
            <td>${getStatusBadge(r.status)}</td>
          </tr>
        `).join('');
      }
    }

    // 4. Personal Leave Balances
    const balances = store.getEmployeeLeaveBalance(emp.id);
    const balanceContainer = document.getElementById('essLeaveBalancesGrid');
    if (balanceContainer) {
      balanceContainer.innerHTML = Object.values(balances).map(b => {
        const pct = b.allocated > 0 ? Math.round((b.approvedUsed / b.allocated) * 100) : 0;
        return `
          <div class="leave-quota-card" style="padding: 14px;">
            <div class="leave-quota-header">
              <span class="leave-quota-title" style="font-size: 0.875rem;">${b.name}</span>
              <span class="leave-quota-code" style="background: rgba(37,99,235,0.1); color: var(--color-brand);">${b.code}</span>
            </div>
            <div class="leave-quota-metric">
              <span class="leave-quota-val" style="font-size: 1.25rem;">${b.remaining}</span>
              <span class="leave-quota-denom">/ ${b.allocated} remaining</span>
            </div>
            <div class="leave-progress-track">
              <div class="leave-progress-fill" style="width: ${pct}%; background: ${pct > 80 ? 'var(--color-danger)' : pct > 50 ? 'var(--color-warning)' : 'var(--color-success)'};"></div>
            </div>
            <div class="leave-quota-meta">
              <span>Used: ${b.approvedUsed} d</span>
              <span>Pending: ${b.pending} d</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 5. Personal Leave Requests Table
    const reqs = store.getLeaveRequests({ employeeId: emp.id });
    const types = store.getLeaveTypes();
    const typeMap = new Map(types.map(t => [t.id, t]));
    const reqTbody = document.getElementById('essLeaveRequestsBody');

    if (reqTbody) {
      if (reqs.length === 0) {
        reqTbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 16px; color: var(--color-text-muted);">No leave requests submitted yet.</td></tr>`;
      } else {
        reqTbody.innerHTML = reqs.map(r => {
          const lt = typeMap.get(r.leaveTypeId);
          return `
            <tr>
              <td><span style="font-family: var(--font-mono); font-weight: 600;">${r.id}</span></td>
              <td>${lt ? lt.name : r.leaveTypeId}</td>
              <td>${r.startDate} to ${r.endDate} (${r.dayCount} d)</td>
              <td>${getLeaveStatusBadge(r.status)}</td>
              <td>
                <span style="font-size: 0.75rem; color: var(--color-text-secondary); max-width: 140px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${r.reviewerComment || r.reason || '--'}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // 6. Targeted Announcements
    const announcements = store.getAnnouncements({ status: 'Published' });
    const targeted = announcements.filter(a => a.targetAudience === 'all' || a.targetBranchId === emp.branch);
    const annContainer = document.getElementById('essAnnouncementsFeed');

    if (annContainer) {
      if (targeted.length === 0) {
        annContainer.innerHTML = `<div style="padding: 16px; color: var(--color-text-muted); font-size: 0.8125rem;">No circulars targeted to your branch.</div>`;
      } else {
        annContainer.innerHTML = targeted.slice(0, 3).map(a => `
          <div style="padding: 12px; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <strong style="font-size: 0.84375rem; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(a.title)}</strong>
              <span class="badge badge-brand" style="font-size: 0.625rem;">${a.category}</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 4px; line-height: 1.4;">
              ${window.EmployeeHub.utils.escapeHTML(a.content)}
            </p>
          </div>
        `).join('');
      }
    }

    // 7. Personal Notifications
    const notifs = store.getNotifications();
    const personalNotifs = notifs.filter(n => !n.relatedEmployeeId || n.relatedEmployeeId === emp.id || n.relatedBranchId === emp.branch || n.relatedBranchId === 'ALL');
    const notifContainer = document.getElementById('essNotificationsFeed');

    if (notifContainer) {
      if (personalNotifs.length === 0) {
        notifContainer.innerHTML = `<div style="padding: 16px; color: var(--color-text-muted); font-size: 0.8125rem;">No personal alerts.</div>`;
      } else {
        notifContainer.innerHTML = personalNotifs.slice(0, 4).map(n => `
          <div style="padding: 10px 12px; border-bottom: 1px solid var(--color-border-subtle); display: flex; align-items: flex-start; gap: 8px;">
            <div style="flex: 1;">
              <div style="font-size: 0.8125rem; font-weight: 600; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(n.title)}</div>
              <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 2px;">${window.EmployeeHub.utils.escapeHTML(n.message)}</div>
              <div style="font-size: 0.6875rem; color: var(--color-text-muted); margin-top: 2px;">${n.timestamp}</div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  function applyLeaveForCurrentEmployee() {
    if (window.EmployeeHub.leave && window.EmployeeHub.leave.openNewLeaveRequestModal) {
      window.EmployeeHub.leave.openNewLeaveRequestModal(currentEmployeeId);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'Present': return '<span class="badge badge-present">Present</span>';
      case 'Late': return '<span class="badge badge-late">Late</span>';
      case 'Half-day': return '<span class="badge badge-half-day">Half-Day</span>';
      case 'Absent': return '<span class="badge badge-absent">Absent</span>';
      case 'On leave': return '<span class="badge badge-on-leave">On Leave</span>';
      case 'Holiday': return '<span class="badge badge-holiday">Holiday</span>';
      default: return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  function getLeaveStatusBadge(status) {
    switch (status) {
      case 'Approved': return '<span class="badge badge-success">Approved</span>';
      case 'Pending': return '<span class="badge badge-warning">Pending</span>';
      case 'Rejected': return '<span class="badge badge-danger">Rejected</span>';
      default: return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  function updateText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return {
    initEssModule,
    refreshEssPortal,
    applyLeaveForCurrentEmployee,
    getCurrentEmployeeId: () => currentEmployeeId
  };
})();
