/**
 * Payroll Module Controller (Dashboard, Generation Wizard, History & Payslips)
 * Namespace: window.EmployeeHub.payroll
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.payroll = (function () {
  'use strict';

  // Wizard state
  let wizardState = {
    currentStep: 1,
    month: 'October',
    year: 2026,
    branch: 'ALL',
    selectedEmployeeIds: new Set(),
    calculatedRecords: [],
    grossTotal: 0,
    deductionsTotal: 0,
    netTotal: 0,
    duplicateConfirmed: false
  };

  // History table state
  let historyState = {
    searchQuery: '',
    monthFilter: 'ALL',
    yearFilter: 'ALL',
    branchFilter: 'ALL',
    statusFilter: 'ALL',
    currentPage: 1,
    rowsPerPage: 5
  };

  // Payslips table state
  let payslipsState = {
    searchQuery: '',
    periodFilter: 'ALL',
    branchFilter: 'ALL',
    currentPage: 1,
    rowsPerPage: 8
  };

  // Chart instances
  let trendChartInstance = null;
  let branchChartInstance = null;

  // Pending status change modal state
  let pendingStatusChange = { batchId: null, targetStatus: null };

  function initPayrollModule() {
    initHistoryControls();
    initPayslipsControls();
    renderPayrollDashboard();
  }

  // =========================================================================
  // 1. PAYROLL DASHBOARD
  // =========================================================================

  function renderPayrollDashboard() {
    const metrics = window.EmployeeHub.payrollStore.getDashboardMetrics();

    // Metric Cards
    const elMonthly = document.getElementById('payStatMonthlyTotal');
    const elCount = document.getElementById('payStatEmployeeCount');
    const elAvg = document.getElementById('payStatAvgSalary');
    const elDed = document.getElementById('payStatTotalDeductions');
    const elPending = document.getElementById('payStatPendingBatches');
    const elPaidVsUnpaid = document.getElementById('payStatPaidVsUnpaid');

    if (elMonthly) elMonthly.textContent = window.EmployeeHub.utils.formatINR(metrics.totalMonthlyPayroll);
    if (elCount) elCount.textContent = metrics.employeesInPayroll;
    if (elAvg) elAvg.textContent = window.EmployeeHub.utils.formatINR(metrics.averageSalary);
    if (elDed) elDed.textContent = window.EmployeeHub.utils.formatINR(metrics.totalDeductions);
    if (elPending) elPending.textContent = metrics.pendingBatchesCount;
    if (elPaidVsUnpaid) {
      elPaidVsUnpaid.innerHTML = `
        <span style="color: var(--color-success); font-weight: 700;">${window.EmployeeHub.utils.formatINR(metrics.paidTotal)}</span>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);"> paid / </span>
        <span style="color: var(--color-warning); font-weight: 600;">${window.EmployeeHub.utils.formatINR(metrics.unpaidTotal)}</span>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);"> pending</span>
      `;
    }

    renderRecentBatchesTable();
    renderBranchPayrollTable();
    initPayrollCharts();
  }

  function renderRecentBatchesTable() {
    const tbody = document.getElementById('payRecentBatchesBody');
    if (!tbody) return;

    const batches = window.EmployeeHub.payrollStore.getBatches().slice(0, 5);

    if (batches.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 20px;">No payroll batches generated yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = batches.map(b => `
      <tr>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 600; font-size: 0.75rem; color: var(--color-text-primary);">
            ${b.id}
          </span>
        </td>
        <td><strong>${b.period}</strong></td>
        <td>${b.branchName}</td>
        <td>${b.employeeCount} staff</td>
        <td><strong>${window.EmployeeHub.utils.formatINR(b.netTotal)}</strong></td>
        <td>${renderStatusBadge(b.status)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.payroll.openBatchDetails('${b.id}')">
            View Batch
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderBranchPayrollTable() {
    const tbody = document.getElementById('payBranchSummaryBody');
    if (!tbody) return;

    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];

    tbody.innerHTML = branches.slice(0, 6).map(b => {
      const avg = b.employeeCount > 0 ? Math.round(b.monthlyPayroll / b.employeeCount) : 0;
      return `
        <tr>
          <td>
            <strong>${window.EmployeeHub.utils.escapeHTML(b.name)}</strong>
            <span class="branch-code-badge" style="margin-left: 6px;">${b.code}</span>
          </td>
          <td>${b.employeeCount} staff</td>
          <td><strong>${window.EmployeeHub.utils.formatINR(b.monthlyPayroll)}</strong></td>
          <td>${window.EmployeeHub.utils.formatINR(avg)}</td>
          <td>
            <span class="badge ${b.status === 'Active' ? 'badge-success' : 'badge-neutral'}">
              ${b.status}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  function initPayrollCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. Monthly Payroll Trend Chart
    const trendCtx = document.getElementById('payrollTrendChart');
    if (trendCtx) {
      if (trendChartInstance) trendChartInstance.destroy();

      const batches = window.EmployeeHub.payrollStore.getBatches();
      const labels = ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'];
      const grossData = [1210000, 1260000, 1310000, 1342800, 1510000, 1580000];
      const netData = [1020000, 1060000, 1100000, 1127952, 1268400, 1320000];
      const dedData = [190000, 200000, 210000, 214848, 241600, 260000];

      trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Gross Payroll',
              data: grossData,
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.08)',
              borderWidth: 2,
              fill: true,
              tension: 0.35
            },
            {
              label: 'Net Disbursed',
              data: netData,
              borderColor: '#059669',
              backgroundColor: 'rgba(5, 150, 105, 0.08)',
              borderWidth: 2,
              fill: true,
              tension: 0.35
            },
            {
              label: 'Total Deductions',
              data: dedData,
              borderColor: '#e11d48',
              borderDash: [5, 5],
              borderWidth: 2,
              fill: false,
              tension: 0.35
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${window.EmployeeHub.utils.formatINR(ctx.raw)}`
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: (v) => `₹${v / 100000}L`
              }
            }
          }
        }
      });
    }

    // 2. Branch Payroll Distribution Chart
    const branchCtx = document.getElementById('payrollBranchChart');
    if (branchCtx) {
      if (branchChartInstance) branchChartInstance.destroy();

      const branches = (window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : []).slice(0, 5);
      const labels = branches.map(b => b.code);
      const payrollData = branches.map(b => b.monthlyPayroll);

      branchChartInstance = new Chart(branchCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Monthly Payroll (₹)',
            data: payrollData,
            backgroundColor: [
              '#4f46e5',
              '#3b82f6',
              '#06b6d4',
              '#10b981',
              '#8b5cf6'
            ],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Monthly Payroll: ${window.EmployeeHub.utils.formatINR(ctx.raw)}`
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: (v) => `₹${v / 100000}L`
              }
            }
          }
        }
      });
    }
  }

  // =========================================================================
  // 2. PAYROLL GENERATION WIZARD (4-STEP WORKFLOW)
  // =========================================================================

  function openPayrollWizard() {
    wizardState = {
      currentStep: 1,
      month: 'October',
      year: 2026,
      branch: 'ALL',
      selectedEmployeeIds: new Set(),
      calculatedRecords: [],
      grossTotal: 0,
      deductionsTotal: 0,
      netTotal: 0,
      duplicateConfirmed: false
    };

    populateWizardBranchDropdown();
    renderWizardStep1();
    setWizardStepUI(1);
    window.EmployeeHub.modals.openModal('modalPayrollWizard');
  }

  function populateWizardBranchDropdown() {
    const select = document.getElementById('wizardBranchSelect');
    if (!select) return;

    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];
    select.innerHTML = `<option value="ALL">All Branches (Organization-wide)</option>` +
      branches.map(b => `<option value="${window.EmployeeHub.utils.escapeHTML(b.name)}">${window.EmployeeHub.utils.escapeHTML(b.name)} (${b.code})</option>`).join('');
  }

  function renderWizardStep1() {
    const branchSelect = document.getElementById('wizardBranchSelect');
    const selectedBranch = branchSelect ? branchSelect.value : 'ALL';
    const includeInactive = document.getElementById('wizardIncludeInactive') ? document.getElementById('wizardIncludeInactive').checked : false;

    let employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];

    // Filter by branch
    if (selectedBranch !== 'ALL') {
      employees = employees.filter(e => e.branch === selectedBranch);
    }

    // Exclude inactive by default
    if (!includeInactive) {
      employees = employees.filter(e => e.status === 'Active');
    }

    const container = document.getElementById('wizardEmployeeChecklist');
    if (!container) return;

    if (employees.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-text-muted);">
          No eligible employees found for the selected branch.
        </div>
      `;
      return;
    }

    // Auto-select all eligible employees by default
    wizardState.selectedEmployeeIds = new Set(employees.map(e => e.id));

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-bg-subtle); border-radius: var(--radius-md); margin-bottom: 12px;">
        <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.8125rem; cursor: pointer;">
          <input type="checkbox" id="wizardSelectAllEmployees" checked onchange="window.EmployeeHub.payroll.toggleWizardSelectAll(this.checked)">
          Select All Eligible Employees (${employees.length})
        </label>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);" id="wizardSelectedCountDisplay">
          ${employees.length} selected
        </span>
      </div>
      <div style="max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
        ${employees.map(e => {
          const isAssigned = window.EmployeeHub.payrollStore.getEmployeeSalary(e.id);
          return `
            <label style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.8125rem; cursor: pointer; background: var(--color-bg-surface);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" class="wizard-emp-check" value="${e.id}" checked onchange="window.EmployeeHub.payroll.toggleWizardEmployeeCheck('${e.id}', this.checked)">
                <div class="employee-avatar-circle" style="width: 28px; height: 28px; font-size: 0.6875rem;">${e.initials}</div>
                <div>
                  <strong style="color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(e.name)}</strong>
                  <span style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono); margin-left: 6px;">${e.id}</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: var(--color-text-secondary);">${e.designation}</span>
                <span class="badge ${e.status === 'Active' ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.625rem;">${e.status}</span>
              </div>
            </label>
          `;
        }).join('')}
      </div>
    `;
  }

  function toggleWizardSelectAll(checked) {
    document.querySelectorAll('.wizard-emp-check').forEach(box => {
      box.checked = checked;
      if (checked) {
        wizardState.selectedEmployeeIds.add(box.value);
      } else {
        wizardState.selectedEmployeeIds.delete(box.value);
      }
    });
    updateWizardSelectedCountDisplay();
  }

  function toggleWizardEmployeeCheck(empId, checked) {
    if (checked) {
      wizardState.selectedEmployeeIds.add(empId);
    } else {
      wizardState.selectedEmployeeIds.delete(empId);
    }
    updateWizardSelectedCountDisplay();
  }

  function updateWizardSelectedCountDisplay() {
    const el = document.getElementById('wizardSelectedCountDisplay');
    if (el) el.textContent = `${wizardState.selectedEmployeeIds.size} selected`;
  }

  function setWizardStepUI(step) {
    wizardState.currentStep = step;

    // Update Progress Bar
    document.querySelectorAll('.wizard-step-item').forEach(el => {
      const s = Number(el.getAttribute('data-step'));
      el.classList.remove('active', 'completed');
      if (s === step) el.classList.add('active');
      else if (s < step) el.classList.add('completed');
    });

    document.querySelectorAll('.wizard-step-line').forEach((line, idx) => {
      if (idx + 1 < step) line.classList.add('completed');
      else line.classList.remove('completed');
    });

    // Toggle Step Panels
    for (let i = 1; i <= 4; i++) {
      const panel = document.getElementById(`wizardStep${i}`);
      if (panel) panel.style.display = i === step ? 'block' : 'none';
    }

    // Button states
    const btnPrev = document.getElementById('btnWizardPrev');
    const btnNext = document.getElementById('btnWizardNext');
    const btnSubmit = document.getElementById('btnWizardSubmit');

    if (btnPrev) btnPrev.style.display = step > 1 ? 'inline-flex' : 'none';
    if (btnNext) btnNext.style.display = step < 4 ? 'inline-flex' : 'none';
    if (btnSubmit) btnSubmit.style.display = step === 4 ? 'inline-flex' : 'none';
  }

  function wizardNext() {
    if (wizardState.currentStep === 1) {
      if (wizardState.selectedEmployeeIds.size === 0) {
        window.EmployeeHub.toast.show('Selection Required', 'Please select at least one employee to generate payroll.', 'danger');
        return;
      }

      wizardState.month = document.getElementById('wizardMonthSelect').value;
      wizardState.year = Number(document.getElementById('wizardYearSelect').value);
      wizardState.branch = document.getElementById('wizardBranchSelect').value;

      calculateWizardRecords();
      renderWizardStep2();
      setWizardStepUI(2);
    } else if (wizardState.currentStep === 2) {
      renderWizardStep3();
      setWizardStepUI(3);
    } else if (wizardState.currentStep === 3) {
      renderWizardStep4();
      setWizardStepUI(4);
    }
  }

  function wizardPrev() {
    if (wizardState.currentStep > 1) {
      setWizardStepUI(wizardState.currentStep - 1);
    }
  }

  function calculateWizardRecords() {
    const allEmployees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const selected = allEmployees.filter(e => wizardState.selectedEmployeeIds.has(e.id));

    let grossTotal = 0;
    let deductionsTotal = 0;

    wizardState.calculatedRecords = selected.map(emp => {
      const assignment = window.EmployeeHub.payrollStore.getEmployeeSalary(emp.id);
      const calc = window.EmployeeHub.payrollStore.calculateSalary(assignment.basicSalary, assignment.structureId);

      grossTotal += calc.grossSalary;
      deductionsTotal += calc.totalDeductions;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        employeeInitials: emp.initials,
        designation: emp.designation,
        department: emp.department,
        branch: emp.branch,
        email: emp.email,
        structureId: assignment.structureId,
        basicSalary: calc.basicSalary,
        earnings: calc.earnings,
        deductions: calc.deductions,
        grossSalary: calc.grossSalary,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        paymentStatus: 'Draft'
      };
    });

    wizardState.grossTotal = grossTotal;
    wizardState.deductionsTotal = deductionsTotal;
    wizardState.netTotal = grossTotal - deductionsTotal;
  }

  function renderWizardStep2() {
    const tbody = document.getElementById('wizardReviewTableBody');
    if (!tbody) return;

    tbody.innerHTML = wizardState.calculatedRecords.map(r => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="employee-avatar-circle" style="width: 26px; height: 26px; font-size: 0.6875rem;">${r.employeeInitials}</div>
            <div>
              <strong style="color: var(--color-text-primary); font-size: 0.8125rem;">${window.EmployeeHub.utils.escapeHTML(r.employeeName)}</strong>
              <span style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono); display: block;">${r.employeeId}</span>
            </div>
          </div>
        </td>
        <td>${r.branch}</td>
        <td>${window.EmployeeHub.utils.formatINR(r.basicSalary)}</td>
        <td style="color: var(--color-brand); font-weight: 600;">${window.EmployeeHub.utils.formatINR(r.grossSalary)}</td>
        <td style="color: var(--color-danger); font-weight: 600;">${window.EmployeeHub.utils.formatINR(r.totalDeductions)}</td>
        <td style="color: var(--color-success); font-weight: 700;">${window.EmployeeHub.utils.formatINR(r.netSalary)}</td>
      </tr>
    `).join('');
  }

  function renderWizardStep3() {
    const container = document.getElementById('wizardVerificationAlerts');
    if (!container) return;

    let alertsHtml = '';

    // Check 1: Duplicate check
    const duplicate = window.EmployeeHub.payrollStore.findDuplicateBatch(wizardState.month, wizardState.year, wizardState.branch);
    if (duplicate) {
      alertsHtml += `
        <div class="wizard-alert wizard-alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <strong>Existing Batch Warning:</strong> An existing payroll batch for <strong>${wizardState.month} ${wizardState.year} (${duplicate.branchName})</strong> is already on record (Batch ID: <code>${duplicate.id}</code> with status: <em>${duplicate.status}</em>).
            <p style="margin-top: 4px;">Proceeding will create an additional run for this period. Please verify this is intentional before finalizing.</p>
          </div>
        </div>
      `;
    }

    // Check 2: Unassigned structures or negative salaries
    const zeroSalaries = wizardState.calculatedRecords.filter(r => r.basicSalary <= 0);
    if (zeroSalaries.length > 0) {
      alertsHtml += `
        <div class="wizard-alert wizard-alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <strong>Missing Basic Salary:</strong> ${zeroSalaries.length} employee(s) have zero or unconfigured basic salary.
          </div>
        </div>
      `;
    }

    if (!alertsHtml) {
      alertsHtml = `
        <div class="wizard-alert wizard-alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <strong>Validation Passed:</strong> All ${wizardState.calculatedRecords.length} selected employee records have valid salary structures, positive basic pay, and compliant statutory deduction configurations.
          </div>
        </div>
      `;
    }

    container.innerHTML = alertsHtml;

    // Display summary metrics in Step 3
    const elGross = document.getElementById('wizardStep3Gross');
    const elDed = document.getElementById('wizardStep3Ded');
    const elNet = document.getElementById('wizardStep3Net');
    if (elGross) elGross.textContent = window.EmployeeHub.utils.formatINR(wizardState.grossTotal);
    if (elDed) elDed.textContent = window.EmployeeHub.utils.formatINR(wizardState.deductionsTotal);
    if (elNet) elNet.textContent = window.EmployeeHub.utils.formatINR(wizardState.netTotal);
  }

  function renderWizardStep4() {
    const elScope = document.getElementById('wizardSummaryScope');
    const elPeriod = document.getElementById('wizardSummaryPeriod');
    const elCount = document.getElementById('wizardSummaryCount');
    const elGross = document.getElementById('wizardSummaryGross');
    const elDed = document.getElementById('wizardSummaryDed');
    const elNet = document.getElementById('wizardSummaryNet');

    if (elScope) elScope.textContent = wizardState.branch === 'ALL' ? 'All 12 Branches' : wizardState.branch;
    if (elPeriod) elPeriod.textContent = `${wizardState.month} ${wizardState.year}`;
    if (elCount) elCount.textContent = `${wizardState.calculatedRecords.length} Employees`;
    if (elGross) elGross.textContent = window.EmployeeHub.utils.formatINR(wizardState.grossTotal);
    if (elDed) elDed.textContent = window.EmployeeHub.utils.formatINR(wizardState.deductionsTotal);
    if (elNet) elNet.textContent = window.EmployeeHub.utils.formatINR(wizardState.netTotal);
  }

  function submitPayrollWizard() {
    try {
      const initialStatus = document.getElementById('wizardInitialStatus') ? document.getElementById('wizardInitialStatus').value : 'Draft';

      const newBatch = window.EmployeeHub.payrollStore.createBatch({
        month: wizardState.month,
        year: wizardState.year,
        branch: wizardState.branch,
        status: initialStatus,
        grossTotal: wizardState.grossTotal,
        deductionsTotal: wizardState.deductionsTotal,
        records: wizardState.calculatedRecords,
        notes: `Batch generated via Payroll Wizard for ${wizardState.month} ${wizardState.year}.`
      });

      window.EmployeeHub.modals.closeActiveModal();
      renderPayrollDashboard();
      renderHistoryTable();
      renderPayslipsTable();

      window.EmployeeHub.toast.show(
        'Payroll Batch Generated',
        `Successfully generated batch ${newBatch.id} (${newBatch.period}) with ${newBatch.employeeCount} employee records.`,
        'success',
        4000
      );
    } catch (err) {
      window.EmployeeHub.toast.show('Generation Error', err.message, 'danger');
    }
  }

  // =========================================================================
  // 3. PAYROLL HISTORY & BATCH MANAGEMENT
  // =========================================================================

  function initHistoryControls() {
    const search = document.getElementById('historySearchInput');
    const monthSelect = document.getElementById('historyMonthFilter');
    const branchSelect = document.getElementById('historyBranchFilter');
    const statusSelect = document.getElementById('historyStatusFilter');

    if (search) {
      search.addEventListener('input', window.EmployeeHub.utils.debounce(() => {
        historyState.searchQuery = search.value.trim().toLowerCase();
        historyState.currentPage = 1;
        renderHistoryTable();
      }, 200));
    }

    if (monthSelect) {
      monthSelect.addEventListener('change', () => {
        historyState.monthFilter = monthSelect.value;
        historyState.currentPage = 1;
        renderHistoryTable();
      });
    }

    if (branchSelect) {
      branchSelect.addEventListener('change', () => {
        historyState.branchFilter = branchSelect.value;
        historyState.currentPage = 1;
        renderHistoryTable();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        historyState.statusFilter = statusSelect.value;
        historyState.currentPage = 1;
        renderHistoryTable();
      });
    }
  }

  function populateHistoryBranchDropdown() {
    const select = document.getElementById('historyBranchFilter');
    if (!select) return;

    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];
    select.innerHTML = `<option value="ALL">All Branches</option>` +
      branches.map(b => `<option value="${window.EmployeeHub.utils.escapeHTML(b.name)}">${window.EmployeeHub.utils.escapeHTML(b.name)}</option>`).join('');
  }

  function renderHistoryTable() {
    populateHistoryBranchDropdown();
    const tbody = document.getElementById('payrollHistoryTableBody');
    const emptyState = document.getElementById('historyEmptyState');
    const pagination = document.getElementById('historyPagination');
    if (!tbody) return;

    let list = window.EmployeeHub.payrollStore.getBatches();

    // Search filter
    if (historyState.searchQuery) {
      const q = historyState.searchQuery;
      list = list.filter(b =>
        b.id.toLowerCase().includes(q) ||
        b.period.toLowerCase().includes(q) ||
        b.branchName.toLowerCase().includes(q)
      );
    }

    // Month filter
    if (historyState.monthFilter !== 'ALL') {
      list = list.filter(b => b.month === historyState.monthFilter);
    }

    // Branch filter
    if (historyState.branchFilter !== 'ALL') {
      list = list.filter(b => b.branch === historyState.branchFilter);
    }

    // Status filter
    if (historyState.statusFilter !== 'ALL') {
      list = list.filter(b => b.status === historyState.statusFilter);
    }

    const totalCount = list.length;

    if (totalCount === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (pagination) pagination.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';

    // Pagination slice
    const totalPages = Math.ceil(totalCount / historyState.rowsPerPage) || 1;
    if (historyState.currentPage > totalPages) historyState.currentPage = totalPages;
    const startIndex = (historyState.currentPage - 1) * historyState.rowsPerPage;
    const paginatedItems = list.slice(startIndex, startIndex + historyState.rowsPerPage);

    tbody.innerHTML = paginatedItems.map(b => `
      <tr>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: var(--color-text-primary);">
            ${b.id}
          </span>
        </td>
        <td><strong>${b.period}</strong></td>
        <td>${b.branchName}</td>
        <td>${b.employeeCount} staff</td>
        <td style="color: var(--color-brand); font-weight: 600;">${window.EmployeeHub.utils.formatINR(b.grossTotal)}</td>
        <td style="color: var(--color-danger); font-weight: 600;">${window.EmployeeHub.utils.formatINR(b.deductionsTotal)}</td>
        <td style="color: var(--color-success); font-weight: 700;">${window.EmployeeHub.utils.formatINR(b.netTotal)}</td>
        <td>${renderStatusBadge(b.status)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.payroll.openBatchDetails('${b.id}')" title="View Snapshot Details">
              View
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.payroll.exportBatchCSV('${b.id}')" title="Export CSV Spreadsheet">
              CSV
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.payroll.openStatusTransitionModal('${b.id}')" title="Transition Status">
              Status
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    renderHistoryPaginationControls(totalCount, totalPages, startIndex);
  }

  function renderHistoryPaginationControls(totalCount, totalPages, startIndex) {
    const infoText = document.getElementById('historyPaginationInfo');
    const pagesContainer = document.getElementById('historyPaginationPages');
    const prevBtn = document.getElementById('btnHistoryPrevPage');
    const nextBtn = document.getElementById('btnHistoryNextPage');

    const endIndex = Math.min(startIndex + historyState.rowsPerPage, totalCount);

    if (infoText) {
      infoText.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} batches`;
    }

    if (prevBtn) {
      prevBtn.disabled = historyState.currentPage <= 1;
      prevBtn.onclick = () => {
        if (historyState.currentPage > 1) {
          historyState.currentPage--;
          renderHistoryTable();
        }
      };
    }

    if (nextBtn) {
      nextBtn.disabled = historyState.currentPage >= totalPages;
      nextBtn.onclick = () => {
        if (historyState.currentPage < totalPages) {
          historyState.currentPage++;
          renderHistoryTable();
        }
      };
    }

    if (pagesContainer) {
      let pagesHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
          <button class="btn-page ${i === historyState.currentPage ? 'active' : ''}" onclick="window.EmployeeHub.payroll.goHistoryPage(${i})">
            ${i}
          </button>
        `;
      }
      pagesContainer.innerHTML = pagesHtml;
    }
  }

  function goHistoryPage(page) {
    historyState.currentPage = page;
    renderHistoryTable();
  }

  function resetHistoryFilters() {
    historyState.searchQuery = '';
    historyState.monthFilter = 'ALL';
    historyState.branchFilter = 'ALL';
    historyState.statusFilter = 'ALL';
    historyState.currentPage = 1;

    const s = document.getElementById('historySearchInput');
    const m = document.getElementById('historyMonthFilter');
    const b = document.getElementById('historyBranchFilter');
    const st = document.getElementById('historyStatusFilter');

    if (s) s.value = '';
    if (m) m.value = 'ALL';
    if (b) b.value = 'ALL';
    if (st) st.value = 'ALL';

    renderHistoryTable();
  }

  function renderStatusBadge(status) {
    switch (status) {
      case 'Paid':
        return `<span class="badge badge-paid"><span class="badge-dot"></span> Paid (Demo)</span>`;
      case 'Finalized':
        return `<span class="badge badge-finalized"><span class="badge-dot"></span> Finalized</span>`;
      case 'Reviewed':
        return `<span class="badge badge-reviewed"><span class="badge-dot"></span> Reviewed</span>`;
      default:
        return `<span class="badge badge-draft"><span class="badge-dot"></span> Draft</span>`;
    }
  }

  // =========================================================================
  // 4. BATCH DETAILS MODAL & STATUS TRANSITION
  // =========================================================================

  function openBatchDetails(batchId) {
    const batch = window.EmployeeHub.payrollStore.getBatch(batchId);
    if (!batch) return;

    document.getElementById('batchDetailsModalTitle').textContent = `Payroll Snapshot: ${batch.period}`;
    document.getElementById('batchDetailsId').textContent = batch.id;
    document.getElementById('batchDetailsScope').textContent = batch.branchName;
    document.getElementById('batchDetailsStatus').innerHTML = renderStatusBadge(batch.status);
    document.getElementById('batchDetailsCreated').textContent = window.EmployeeHub.utils.formatDate(batch.createdAt);
    document.getElementById('batchDetailsGross').textContent = window.EmployeeHub.utils.formatINR(batch.grossTotal);
    document.getElementById('batchDetailsDed').textContent = window.EmployeeHub.utils.formatINR(batch.deductionsTotal);
    document.getElementById('batchDetailsNet').textContent = window.EmployeeHub.utils.formatINR(batch.netTotal);

    const tbody = document.getElementById('batchDetailsRecordsBody');
    if (tbody) {
      tbody.innerHTML = (batch.records || []).map(r => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="employee-avatar-circle" style="width: 26px; height: 26px; font-size: 0.6875rem;">${r.employeeInitials}</div>
              <div>
                <strong style="color: var(--color-text-primary); font-size: 0.8125rem;">${window.EmployeeHub.utils.escapeHTML(r.employeeName)}</strong>
                <span style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono); display: block;">${r.employeeId}</span>
              </div>
            </div>
          </td>
          <td>${r.designation}</td>
          <td>${r.branch}</td>
          <td>${window.EmployeeHub.utils.formatINR(r.basicSalary)}</td>
          <td style="color: var(--color-brand); font-weight: 600;">${window.EmployeeHub.utils.formatINR(r.grossSalary)}</td>
          <td style="color: var(--color-danger); font-weight: 600;">${window.EmployeeHub.utils.formatINR(r.totalDeductions)}</td>
          <td style="color: var(--color-success); font-weight: 700;">${window.EmployeeHub.utils.formatINR(r.netSalary)}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.payroll.viewPayslip('${batch.id}', '${r.employeeId}')">
              Payslip
            </button>
          </td>
        </tr>
      `).join('');
    }

    // Attach batch CSV export button
    const csvBtn = document.getElementById('btnBatchDetailsExportCSV');
    if (csvBtn) {
      csvBtn.onclick = () => exportBatchCSV(batch.id);
    }

    // Attach batch Print summary button
    const printBtn = document.getElementById('btnBatchDetailsPrint');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }

    window.EmployeeHub.modals.openModal('modalBatchDetails');
  }

  function openStatusTransitionModal(batchId) {
    const batch = window.EmployeeHub.payrollStore.getBatch(batchId);
    if (!batch) return;

    pendingStatusChange.batchId = batchId;

    document.getElementById('statusModalBatchId').textContent = batch.id;
    document.getElementById('statusModalCurrentStatus').textContent = batch.status;

    const select = document.getElementById('statusModalNewStatus');
    if (select) {
      select.value = batch.status;
    }

    window.EmployeeHub.modals.openModal('modalConfirmBatchStatus');
  }

  function executeStatusTransition() {
    if (!pendingStatusChange.batchId) return;

    const select = document.getElementById('statusModalNewStatus');
    const newStatus = select ? select.value : 'Reviewed';

    try {
      window.EmployeeHub.payrollStore.updateBatchStatus(pendingStatusChange.batchId, newStatus);
      window.EmployeeHub.modals.closeActiveModal();
      renderPayrollDashboard();
      renderHistoryTable();
      renderPayslipsTable();
      window.EmployeeHub.toast.show('Status Updated', `Batch status transitioned to "${newStatus}".`, 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Action Blocked', err.message, 'danger');
    }

    pendingStatusChange = { batchId: null, targetStatus: null };
  }

  // =========================================================================
  // 5. CSV EXPORT ENGINE
  // =========================================================================

  function exportBatchCSV(batchId) {
    const batch = window.EmployeeHub.payrollStore.getBatch(batchId);
    if (!batch || !batch.records) {
      window.EmployeeHub.toast.show('Export Error', 'Batch records not found.', 'danger');
      return;
    }

    const headers = [
      'Batch ID',
      'Pay Period',
      'Branch',
      'Employee ID',
      'Employee Name',
      'Designation',
      'Department',
      'Basic Salary (INR)',
      'Gross Salary (INR)',
      'Total Deductions (INR)',
      'Net Salary (INR)',
      'Status'
    ];

    const rows = batch.records.map(r => [
      `"${batch.id}"`,
      `"${batch.period}"`,
      `"${r.branch}"`,
      `"${r.employeeId}"`,
      `"${r.employeeName.replace(/"/g, '""')}"`,
      `"${r.designation.replace(/"/g, '""')}"`,
      `"${r.department.replace(/"/g, '""')}"`,
      r.basicSalary,
      r.grossSalary,
      r.totalDeductions,
      r.netSalary,
      `"${r.paymentStatus}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_${batch.period.replace(/\s+/g, '_')}_${batch.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.EmployeeHub.toast.show('CSV Exported', `Downloaded spreadsheet for ${batch.period}.`, 'success');
  }

  // =========================================================================
  // 6. EMPLOYEE PAYSLIPS DIRECTORY & VIEWER MODAL
  // =========================================================================

  function initPayslipsControls() {
    const search = document.getElementById('payslipsSearchInput');
    const periodSelect = document.getElementById('payslipsPeriodFilter');
    const branchSelect = document.getElementById('payslipsBranchFilter');

    if (search) {
      search.addEventListener('input', window.EmployeeHub.utils.debounce(() => {
        payslipsState.searchQuery = search.value.trim().toLowerCase();
        payslipsState.currentPage = 1;
        renderPayslipsTable();
      }, 200));
    }

    if (periodSelect) {
      periodSelect.addEventListener('change', () => {
        payslipsState.periodFilter = periodSelect.value;
        payslipsState.currentPage = 1;
        renderPayslipsTable();
      });
    }

    if (branchSelect) {
      branchSelect.addEventListener('change', () => {
        payslipsState.branchFilter = branchSelect.value;
        payslipsState.currentPage = 1;
        renderPayslipsTable();
      });
    }
  }

  function populatePayslipsDropdowns() {
    const periodSelect = document.getElementById('payslipsPeriodFilter');
    const branchSelect = document.getElementById('payslipsBranchFilter');

    const batches = window.EmployeeHub.payrollStore.getBatches();
    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];

    if (periodSelect) {
      const periods = Array.from(new Set(batches.map(b => b.period)));
      periodSelect.innerHTML = `<option value="ALL">All Pay Periods</option>` +
        periods.map(p => `<option value="${p}">${p}</option>`).join('');
    }

    if (branchSelect) {
      branchSelect.innerHTML = `<option value="ALL">All Branches</option>` +
        branches.map(b => `<option value="${window.EmployeeHub.utils.escapeHTML(b.name)}">${window.EmployeeHub.utils.escapeHTML(b.name)}</option>`).join('');
    }
  }

  function renderPayslipsTable() {
    populatePayslipsDropdowns();
    const tbody = document.getElementById('payslipsTableBody');
    const emptyState = document.getElementById('payslipsEmptyState');
    const pagination = document.getElementById('payslipsPagination');
    if (!tbody) return;

    let list = window.EmployeeHub.payrollStore.getAllPayslips();

    // Search filter
    if (payslipsState.searchQuery) {
      const q = payslipsState.searchQuery;
      list = list.filter(p =>
        p.employeeName.toLowerCase().includes(q) ||
        p.employeeId.toLowerCase().includes(q) ||
        p.designation.toLowerCase().includes(q) ||
        p.branch.toLowerCase().includes(q)
      );
    }

    // Period filter
    if (payslipsState.periodFilter !== 'ALL') {
      list = list.filter(p => p.period === payslipsState.periodFilter);
    }

    // Branch filter
    if (payslipsState.branchFilter !== 'ALL') {
      list = list.filter(p => p.branch === payslipsState.branchFilter);
    }

    const totalCount = list.length;

    if (totalCount === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (pagination) pagination.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';

    // Pagination slice
    const totalPages = Math.ceil(totalCount / payslipsState.rowsPerPage) || 1;
    if (payslipsState.currentPage > totalPages) payslipsState.currentPage = totalPages;
    const startIndex = (payslipsState.currentPage - 1) * payslipsState.rowsPerPage;
    const paginatedItems = list.slice(startIndex, startIndex + payslipsState.rowsPerPage);

    tbody.innerHTML = paginatedItems.map(p => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="employee-avatar-circle" style="width: 28px; height: 28px; font-size: 0.6875rem;">${p.employeeInitials}</div>
            <div>
              <strong style="color: var(--color-text-primary); font-size: 0.8125rem;">${window.EmployeeHub.utils.escapeHTML(p.employeeName)}</strong>
              <span style="font-size: 0.6875rem; color: var(--color-text-muted); font-family: var(--font-mono); display: block;">${p.employeeId}</span>
            </div>
          </div>
        </td>
        <td>${p.designation}</td>
        <td>${p.branch}</td>
        <td><strong>${p.period}</strong></td>
        <td style="color: var(--color-brand); font-weight: 600;">${window.EmployeeHub.utils.formatINR(p.grossSalary)}</td>
        <td style="color: var(--color-danger); font-weight: 600;">${window.EmployeeHub.utils.formatINR(p.totalDeductions)}</td>
        <td style="color: var(--color-success); font-weight: 700;">${window.EmployeeHub.utils.formatINR(p.netSalary)}</td>
        <td>${renderStatusBadge(p.paymentStatus || p.batchStatus)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.payroll.viewPayslip('${p.batchId}', '${p.employeeId}')">
            View Payslip
          </button>
        </td>
      </tr>
    `).join('');

    renderPayslipsPaginationControls(totalCount, totalPages, startIndex);
  }

  function renderPayslipsPaginationControls(totalCount, totalPages, startIndex) {
    const infoText = document.getElementById('payslipsPaginationInfo');
    const pagesContainer = document.getElementById('payslipsPaginationPages');
    const prevBtn = document.getElementById('btnPayslipsPrevPage');
    const nextBtn = document.getElementById('btnPayslipsNextPage');

    const endIndex = Math.min(startIndex + payslipsState.rowsPerPage, totalCount);

    if (infoText) {
      infoText.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} payslips`;
    }

    if (prevBtn) {
      prevBtn.disabled = payslipsState.currentPage <= 1;
      prevBtn.onclick = () => {
        if (payslipsState.currentPage > 1) {
          payslipsState.currentPage--;
          renderPayslipsTable();
        }
      };
    }

    if (nextBtn) {
      nextBtn.disabled = payslipsState.currentPage >= totalPages;
      nextBtn.onclick = () => {
        if (payslipsState.currentPage < totalPages) {
          payslipsState.currentPage++;
          renderPayslipsTable();
        }
      };
    }

    if (pagesContainer) {
      let pagesHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
          <button class="btn-page ${i === payslipsState.currentPage ? 'active' : ''}" onclick="window.EmployeeHub.payroll.goPayslipsPage(${i})">
            ${i}
          </button>
        `;
      }
      pagesContainer.innerHTML = pagesHtml;
    }
  }

  function goPayslipsPage(page) {
    payslipsState.currentPage = page;
    renderPayslipsTable();
  }

  function resetPayslipsFilters() {
    payslipsState.searchQuery = '';
    payslipsState.periodFilter = 'ALL';
    payslipsState.branchFilter = 'ALL';
    payslipsState.currentPage = 1;

    const s = document.getElementById('payslipsSearchInput');
    const p = document.getElementById('payslipsPeriodFilter');
    const b = document.getElementById('payslipsBranchFilter');

    if (s) s.value = '';
    if (p) p.value = 'ALL';
    if (b) b.value = 'ALL';

    renderPayslipsTable();
  }

  /**
   * View Immutable Payslip Modal
   */
  function viewPayslip(batchId, employeeId) {
    const payslip = window.EmployeeHub.payrollStore.getPayslip(batchId, employeeId);
    if (!payslip) {
      window.EmployeeHub.toast.show('Payslip Not Found', 'Could not locate employee record in this batch.', 'danger');
      return;
    }

    document.getElementById('slipPeriodTitle').textContent = `Payslip for ${payslip.period}`;
    document.getElementById('slipEmpName').textContent = payslip.employeeName;
    document.getElementById('slipEmpId').textContent = payslip.employeeId;
    document.getElementById('slipDesignation').textContent = payslip.designation;
    document.getElementById('slipDepartment').textContent = payslip.department;
    document.getElementById('slipBranch').textContent = payslip.branch;
    document.getElementById('slipBatchId').textContent = payslip.batchId;
    document.getElementById('slipPaymentStatus').textContent = payslip.paymentStatus || payslip.batchStatus;
    document.getElementById('slipGenDate').textContent = window.EmployeeHub.utils.formatDate(payslip.createdAt);

    // Earnings breakdown rows
    const earningsBody = document.getElementById('slipEarningsTableBody');
    if (earningsBody) {
      earningsBody.innerHTML = (payslip.earnings || []).map(e => `
        <tr>
          <td>${window.EmployeeHub.utils.escapeHTML(e.name)}</td>
          <td>${window.EmployeeHub.utils.formatINR(e.amount)}</td>
        </tr>
      `).join('');
    }

    // Deductions breakdown rows
    const deductionsBody = document.getElementById('slipDeductionsTableBody');
    if (deductionsBody) {
      deductionsBody.innerHTML = (payslip.deductions || []).map(d => `
        <tr>
          <td>${window.EmployeeHub.utils.escapeHTML(d.name)}</td>
          <td>${window.EmployeeHub.utils.formatINR(d.amount)}</td>
        </tr>
      `).join('');
    }

    // Totals
    document.getElementById('slipGrossSalary').textContent = window.EmployeeHub.utils.formatINR(payslip.grossSalary);
    document.getElementById('slipTotalDeductions').textContent = window.EmployeeHub.utils.formatINR(payslip.totalDeductions);
    document.getElementById('slipNetSalary').textContent = window.EmployeeHub.utils.formatINR(payslip.netSalary);
    document.getElementById('slipNetWords').textContent = `${numberToIndianWords(payslip.netSalary)} Only`;

    window.EmployeeHub.modals.openModal('modalPayslipViewer');
  }

  function numberToIndianWords(num) {
    if (!num || num === 0) return 'Zero Rupees';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
      if (n < 20) return a[n];
      const digit = n % 10;
      return b[Math.floor(n / 10)] + (digit !== 0 ? ' ' + a[digit] : ' ');
    }

    let words = '';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    const rem = num % 100;

    if (crore > 0) words += inWords(crore) + 'Crore ';
    if (lakh > 0) words += inWords(lakh) + 'Lakh ';
    if (thousand > 0) words += inWords(thousand) + 'Thousand ';
    if (hundred > 0) words += inWords(hundred) + 'Hundred ';
    if (rem > 0) words += inWords(rem);

    return words.trim() + ' Rupees';
  }

  return {
    initPayrollModule,
    refreshDashboard: renderPayrollDashboard,
    refreshHistory: renderHistoryTable,
    refreshPayslips: renderPayslipsTable,

    // Wizard
    openPayrollWizard,
    wizardNext,
    wizardPrev,
    toggleWizardSelectAll,
    toggleWizardEmployeeCheck,
    submitPayrollWizard,

    // History
    goHistoryPage,
    resetHistoryFilters,
    openBatchDetails,
    openStatusTransitionModal,
    executeStatusTransition,
    exportBatchCSV,

    // Payslips
    goPayslipsPage,
    resetPayslipsFilters,
    viewPayslip,
    printPayslip: () => window.print()
  };
})();
