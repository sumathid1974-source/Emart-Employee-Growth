/**
 * Workforce Analytics & Chart.js Visualizations
 * Namespace: window.EmployeeHub.charts
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.charts = (function () {
  'use strict';

  let branchChartInstance = null;
  let payrollChartInstance = null;

  /**
   * Initialize both dashboard charts
   */
  function initCharts() {
    initBranchDistributionChart();
    initPayrollTrendsChart();
  }

  /**
   * Chart 1: Employee Distribution by Branch (Horizontal/Vertical Bar Chart)
   */
  function initBranchDistributionChart() {
    const canvas = document.getElementById('branchDistributionChart');
    if (!canvas) return;

    // Filter active branches with employee count > 0
    const activeBranches = window.EmployeeHub.mockData.branches
      .filter(b => b.employeeCount > 0)
      .slice(0, 7);

    const labels = activeBranches.map(b => b.name.replace(' HQ', '').replace(' Hub', ''));
    const dataValues = activeBranches.map(b => b.employeeCount);

    if (typeof Chart === 'undefined') {
      renderSvgFallbackBranch(canvas, activeBranches);
      return;
    }

    if (branchChartInstance) {
      branchChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    branchChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Employees',
          data: dataValues,
          backgroundColor: [
            '#4f46e5',
            '#6366f1',
            '#818cf8',
            '#3b82f6',
            '#60a5fa',
            '#0ea5e9',
            '#38bdf8'
          ],
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 34
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Inter', size: 12, weight: '600' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return ` Headcount: ${context.parsed.y} employees`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#64748b'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#64748b',
              stepSize: 100
            }
          }
        }
      }
    });
  }

  /**
   * Chart 2: Monthly Payroll Overview (6 Months in INR)
   */
  function initPayrollTrendsChart() {
    const canvas = document.getElementById('payrollTrendsChart');
    if (!canvas) return;

    const payrollData = window.EmployeeHub.mockData.payrollHistory;
    const labels = payrollData.map(p => p.month);
    const dataValues = payrollData.map(p => p.amount);

    if (typeof Chart === 'undefined') {
      renderSvgFallbackPayroll(canvas, payrollData);
      return;
    }

    if (payrollChartInstance) {
      payrollChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Create subtle gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.22)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.00)');

    payrollChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Payroll Disbursement',
          data: dataValues,
          borderColor: '#4f46e5',
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#4f46e5',
          pointBorderWidth: 2,
          pointRadius: 4.5,
          pointHoverRadius: 6.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Inter', size: 12, weight: '600' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const val = context.parsed.y;
                return ` Disbursement: ${window.EmployeeHub.utils.formatINR(val)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#64748b'
            }
          },
          y: {
            beginAtZero: false,
            min: 4000000,
            grid: {
              color: '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#64748b',
              callback: function (value) {
                return '₹' + (value / 100000).toFixed(1) + 'L';
              }
            }
          }
        }
      }
    });
  }

  /**
   * Graceful pure SVG fallback for branch chart if Chart.js is unavailable
   */
  function renderSvgFallbackBranch(canvas, activeBranches) {
    const parent = canvas.parentElement;
    parent.innerHTML = `
      <div style="height: 100%; display: flex; align-items: flex-end; justify-content: space-around; gap: 8px; padding-top: 20px;">
        ${activeBranches.map(b => {
          const heightPct = Math.round((b.employeeCount / 400) * 85);
          return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; height: 100%; justify-content: flex-end;">
              <span style="font-size: 11px; font-weight: 600; color: #475569;">${b.employeeCount}</span>
              <div style="width: 80%; max-width: 32px; height: ${heightPct}%; background: #4f46e5; border-radius: 6px 6px 0 0;"></div>
              <span style="font-size: 10px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 48px;">${b.city}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Graceful pure SVG fallback for payroll chart if Chart.js is unavailable
   */
  function renderSvgFallbackPayroll(canvas, payrollData) {
    const parent = canvas.parentElement;
    parent.innerHTML = `
      <div style="height: 100%; display: flex; align-items: flex-end; justify-content: space-around; gap: 8px; padding-top: 20px;">
        ${payrollData.map(p => {
          const heightPct = Math.round(((p.amount - 4000000) / 1000000) * 80) + 15;
          return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; height: 100%; justify-content: flex-end;">
              <span style="font-size: 10px; font-weight: 600; color: #475569;">${p.formatted}</span>
              <div style="width: 80%; max-width: 32px; height: ${heightPct}%; background: #6366f1; border-radius: 6px 6px 0 0;"></div>
              <span style="font-size: 10px; color: #64748b;">${p.month.split(' ')[0]}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  return {
    initCharts,
    initBranchDistributionChart,
    initPayrollTrendsChart
  };
})();
