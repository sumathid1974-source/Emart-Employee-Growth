/**
 * EmployeeHub — Phase 5: Employee Growth & Performance Management Controller
 * Namespace: window.EmployeeHub.growth
 */
window.EmployeeHub = window.EmployeeHub || {};
if (window.EmployeeHub.utils) {
  window.EmployeeHub.utils.escapeHtml = window.EmployeeHub.utils.escapeHtml || window.EmployeeHub.utils.escapeHTML || function(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
}

window.EmployeeHub.growth = (function () {
  'use strict';

  let performanceDistChartInstance = null;
  let currentActiveTab = 'dashboard';
  let activeAppraisalId = null;
  let activeAppraisalPerspective = 'manager'; // 'employee' or 'manager'

  // Temporary modal rating state
  let currentModalRatings = {};

  /**
   * Initialize Growth Module
   */
  function initGrowthModule() {
    if (window.EmployeeHub.growthStore) {
      window.EmployeeHub.growthStore.init();
    }
    setupEventListeners();
  }

  function setupEventListeners() {
    // Sub-navigation clicks within Growth Suite
    document.querySelectorAll('[data-growth-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-growth-tab');
        switchGrowthTab(tab);
      });
    });
  }

  /**
   * Switch between Growth sub-views / tabs
   */
  function switchGrowthTab(tabName) {
    currentActiveTab = tabName;

    // Update subnav buttons
    document.querySelectorAll('[data-growth-tab]').forEach(btn => {
      if (btn.getAttribute('data-growth-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle tab panels
    document.querySelectorAll('.growth-tab-panel').forEach(panel => {
      panel.style.display = 'none';
    });
    const activePanel = document.getElementById(`panelGrowth_${tabName}`);
    if (activePanel) {
      activePanel.style.display = 'block';
    }

    // Sync sidebar active link
    const tabToView = {
      dashboard: 'view-growth-dashboard',
      reviews: 'view-reviews',
      goals: 'view-goals',
      devplans: 'view-dev-plans',
      skills: 'view-skills-matrix',
      training: 'view-training',
      promotions: 'view-promotions',
      career: 'view-career-paths',
      feedback: 'view-feedback',
      reports: 'view-growth-reports'
    };
    const targetView = tabToView[tabName];
    if (targetView) {
      document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        if (link.getAttribute('data-view-target') === targetView) {
          link.classList.add('active');
        } else if (link.getAttribute('data-view-target') && (link.getAttribute('data-view-target').startsWith('view-growth') || ['view-reviews', 'view-goals', 'view-dev-plans', 'view-skills-matrix', 'view-training', 'view-promotions', 'view-career-paths', 'view-feedback', 'view-growth-reports'].includes(link.getAttribute('data-view-target')))) {
          link.classList.remove('active');
        }
      });
    }

    // Sync URL hash seamlessly
    const tabToHash = {
      dashboard: 'growth-dashboard',
      reviews: 'reviews',
      goals: 'goals',
      devplans: 'dev-plans',
      skills: 'skills-matrix',
      training: 'training',
      promotions: 'promotions',
      career: 'career-paths',
      feedback: 'feedback',
      reports: 'growth-reports'
    };
    if (tabToHash[tabName] && window.location.hash !== `#${tabToHash[tabName]}`) {
      try {
        history.replaceState(null, '', `#${tabToHash[tabName]}`);
      } catch (e) {}
    }

    // Trigger tab specific renders
    switch (tabName) {
      case 'dashboard':
        renderGrowthDashboard();
        break;
      case 'reviews':
        renderReviewCyclesAndAppraisals();
        break;
      case 'goals':
        renderGoals();
        break;
      case 'devplans':
        renderDevPlans();
        break;
      case 'skills':
        renderSkillsMatrix();
        break;
      case 'training':
        renderTrainingCourses();
        break;
      case 'promotions':
        renderPromotionReviews();
        break;
      case 'career':
        renderCareerPaths();
        break;
      case 'feedback':
        renderFeedbackAndRecognition();
        break;
      case 'reports':
        renderGrowthReports();
        break;
      default:
        renderGrowthDashboard();
    }
  }

  // =========================================================================
  // 1. GROWTH DASHBOARD
  // =========================================================================
  function renderGrowthDashboard() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    const summary = store.getGrowthSummary();

    // Populate KPI cards
    const elActivePlans = document.getElementById('kpiGrowthActivePlans');
    if (elActivePlans) elActivePlans.textContent = summary.activeDevPlans;

    const elReviewRate = document.getElementById('kpiGrowthReviewRate');
    if (elReviewRate) elReviewRate.textContent = `${summary.completionRate}%`;

    const elMeetingGoals = document.getElementById('kpiGrowthMeetingGoals');
    if (elMeetingGoals) elMeetingGoals.textContent = `${summary.meetingGoalsPct}%`;

    const elReqSupport = document.getElementById('kpiGrowthReqSupport');
    if (elReqSupport) elReqSupport.textContent = summary.reqSupportCount;

    const elTrainingPart = document.getElementById('kpiGrowthTrainingPart');
    if (elTrainingPart) elTrainingPart.textContent = `${summary.enrolledEmployees} enrolled`;

    const elSkillGaps = document.getElementById('kpiGrowthSkillGaps');
    if (elSkillGaps) elSkillGaps.textContent = summary.skillGaps;

    const elPromoCandidates = document.getElementById('kpiGrowthPromoCandidates');
    if (elPromoCandidates) elPromoCandidates.textContent = summary.pendingPromotions;

    // Render Performance Rating Distribution Chart (Chart.js)
    renderDistributionChart(summary.distribution);

    // Render Branch-Wise Performance Summary Table
    renderBranchPerformanceTable(summary.branchPerformance);

    // Render Upcoming Deadlines List
    renderUpcomingDeadlines();

    // Render Recent Development Activity
    renderRecentActivityStream();
  }

  function renderDistributionChart(distribution) {
    const canvas = document.getElementById('chartPerformanceDistribution');
    if (!canvas || typeof Chart === 'undefined') return;

    if (performanceDistChartInstance) {
      performanceDistChartInstance.destroy();
    }

    const labels = [
      '1.0 - Needs Dev',
      '2.0 - Developing',
      '3.0 - Meets Expectations',
      '4.0 - Exceeds Expectations',
      '5.0 - Role Model'
    ];
    const dataVals = [
      distribution[1] || 0,
      distribution[2] || 0,
      distribution[3] || 0,
      distribution[4] || 0,
      distribution[5] || 0
    ];

    performanceDistChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Employees in Rating Tier',
          data: dataVals,
          backgroundColor: [
            'rgba(239, 68, 68, 0.75)',
            'rgba(245, 158, 11, 0.75)',
            'rgba(59, 130, 246, 0.75)',
            'rgba(79, 70, 229, 0.85)',
            'rgba(16, 185, 129, 0.85)'
          ],
          borderColor: [
            '#ef4444',
            '#f59e0b',
            '#3b82f6',
            '#4f46e5',
            '#10b981'
          ],
          borderWidth: 1.5,
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
              label: (ctx) => ` ${ctx.parsed.y} employees (${Math.round((ctx.parsed.y / (dataVals.reduce((a,b)=>a+b,0) || 1))*100)}%)`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#64748b' },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          x: {
            ticks: { color: '#475569', font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderBranchPerformanceTable(branchList) {
    const tbody = document.getElementById('tbodyGrowthBranchSummary');
    if (!tbody) return;

    if (!branchList || branchList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 16px;">No branch reviews recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = branchList.map(b => {
      const scoreBadgeClass = b.averageScore >= 4.5 ? 'badge-success' : (b.averageScore >= 3.5 ? 'badge-primary' : 'badge-warning');
      return `
        <tr>
          <td style="font-weight: 600;">${window.EmployeeHub.utils.escapeHtml(b.branch)}</td>
          <td>${b.reviewedCount} staff evaluated</td>
          <td>
            <span class="badge ${scoreBadgeClass}">
              ★ ${b.averageScore} / 5.0
            </span>
          </td>
          <td>
            <div class="progress-track" style="max-width: 120px;">
              <div class="progress-fill fill-success" style="width: ${(b.averageScore / 5.0) * 100}%;"></div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderUpcomingDeadlines() {
    const container = document.getElementById('listUpcomingDeadlines');
    if (!container) return;

    const cycles = window.EmployeeHub.growthStore.getReviewCycles().filter(c => c.status === 'Active' || c.status === 'Draft');
    const goals = window.EmployeeHub.growthStore.getGoals().filter(g => g.status === 'In Progress').slice(0, 3);

    let html = '';

    cycles.forEach(c => {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--color-bg-subtle); border-radius: var(--radius-md); margin-bottom: 8px;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHtml(c.name)}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Cycle Submission Deadline</div>
          </div>
          <span class="badge badge-warning" style="font-size: 0.6875rem;">Due ${c.deadline}</span>
        </div>
      `;
    });

    goals.forEach(g => {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--color-bg-subtle); border-radius: var(--radius-md); margin-bottom: 8px;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHtml(g.title)}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">${window.EmployeeHub.utils.escapeHtml(g.employeeName)} (${g.department})</div>
          </div>
          <span class="badge badge-neutral" style="font-size: 0.6875rem;">Target ${g.targetDate}</span>
        </div>
      `;
    });

    container.innerHTML = html || '<p class="text-muted" style="font-size: 0.8125rem;">No pressing deadlines this week.</p>';
  }

  function renderRecentActivityStream() {
    const container = document.getElementById('listGrowthRecentActivity');
    if (!container) return;

    const appraisals = window.EmployeeHub.growthStore.getAppraisals().slice(0, 3);
    const feedback = window.EmployeeHub.growthStore.getFeedback(null, false).slice(0, 2);

    let items = [];

    appraisals.forEach(a => {
      items.push({
        title: `${a.employeeName} — Appraisal ${a.status}`,
        meta: `${a.designation} • ${a.branch}`,
        date: a.managerReviewDate || a.selfAssessmentDate || 'Recent',
        tag: a.overallScore ? `★ ${a.overallScore}` : a.status
      });
    });

    feedback.forEach(f => {
      items.push({
        title: `Kudos: ${f.senderName} ➜ ${f.recipientName}`,
        meta: `${f.badge} • "${f.message.slice(0, 45)}..."`,
        date: f.date,
        tag: f.badge
      });
    });

    container.innerHTML = items.map(item => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--color-border-subtle);">
        <div>
          <div style="font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHtml(item.title)}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">${window.EmployeeHub.utils.escapeHtml(item.meta)}</div>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-brand" style="font-size: 0.6875rem;">${item.tag}</span>
          <div style="font-size: 0.6875rem; color: var(--color-text-muted); margin-top: 2px;">${item.date}</div>
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 2. PERFORMANCE REVIEWS & APPRAISALS
  // =========================================================================
  function renderReviewCyclesAndAppraisals() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    // Render cycles list
    const cyclesContainer = document.getElementById('gridReviewCycles');
    if (cyclesContainer) {
      const cycles = store.getReviewCycles();
      cyclesContainer.innerHTML = cycles.map(c => {
        const statusBadge = c.status === 'Active' ? 'badge-success' : (c.status === 'Completed' ? 'badge-primary' : 'badge-neutral');
        const cycleAppraisals = store.getAppraisalsByCycle(c.id);
        const completed = cycleAppraisals.filter(a => a.status === 'Completed').length;
        const total = cycleAppraisals.length || 1;
        const pct = Math.round((completed / total) * 100);

        return `
          <div class="card" style="padding: 18px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between;">
              <div>
                <h4 style="font-size: 1rem; font-weight: 700; margin: 0; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHtml(c.name)}</h4>
                <span style="font-size: 0.75rem; color: var(--color-text-muted);">${c.period} • Scope: ${c.targetScope}</span>
              </div>
              <span class="badge ${statusBadge}">${c.status}</span>
            </div>
            <p style="font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0; line-height: 1.4;">${window.EmployeeHub.utils.escapeHtml(c.description)}</p>
            <div style="background: var(--color-bg-subtle); padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.75rem; display: flex; justify-content: space-between;">
              <span>Deadline: <strong>${c.deadline}</strong></span>
              <span>Reviews Completed: <strong>${completed}/${total} (${pct}%)</strong></span>
            </div>
            <div class="progress-track">
              <div class="progress-fill fill-success" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render appraisals table
    const tbody = document.getElementById('tbodyAppraisalsList');
    if (tbody) {
      const appraisals = store.getAppraisals();
      tbody.innerHTML = appraisals.map(a => {
        const scoreBadge = a.overallScore ? `<span class="badge ${a.overallScore >= 4.5 ? 'badge-success' : (a.overallScore >= 3.5 ? 'badge-primary' : 'badge-warning')}">★ ${a.overallScore} / 5.0</span>` : '<span class="badge badge-neutral">Pending Review</span>';
        const promoBadge = a.promotionRecommendation ? `<span class="badge badge-brand" style="font-size: 0.6875rem;">${a.promotionRecommendation}</span>` : '—';
        const statusBadge = a.status === 'Completed' ? 'badge-success' : (a.status === 'Submitted' ? 'badge-warning' : 'badge-neutral');

        return `
          <tr>
            <td>
              <div style="font-weight: 600; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHtml(a.employeeName)}</div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); font-family: var(--font-mono);">${a.employeeId}</div>
            </td>
            <td>${window.EmployeeHub.utils.escapeHtml(a.designation)}<br><span style="font-size: 0.75rem; color: var(--color-text-muted);">${a.department} • ${a.branch}</span></td>
            <td>${window.EmployeeHub.utils.escapeHtml(a.cycleName)}</td>
            <td><span class="badge ${statusBadge}">${a.status}</span></td>
            <td>${scoreBadge}</td>
            <td>${promoBadge}</td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.growth.openAppraisalModal('${a.id}', 'manager')">
                  Manager Review
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.growth.openAppraisalModal('${a.id}', 'employee')">
                  Self-Assess
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  /**
   * Open Structured Appraisal Form Modal with Dual Perspectives
   */
  function openAppraisalModal(appraisalId, perspective = 'manager') {
    activeAppraisalId = appraisalId;
    activeAppraisalPerspective = perspective;

    const store = window.EmployeeHub.growthStore;
    const appraisal = store.getAppraisalById(appraisalId);
    if (!appraisal) return;

    // Set Header Info
    document.getElementById('appraisalModalEmployeeName').textContent = appraisal.employeeName;
    document.getElementById('appraisalModalEmployeeMeta').textContent = `${appraisal.designation} • ${appraisal.department} • ${appraisal.branch} (${appraisal.reviewPeriod})`;

    // Initialize currentModalRatings
    currentModalRatings = (perspective === 'manager' && appraisal.managerRatings) 
      ? { ...appraisal.managerRatings } 
      : (appraisal.selfRatings ? { ...appraisal.selfRatings } : {});

    // Update Role Perspective Tab Buttons
    updatePerspectiveTabs(perspective);

    // Render Criteria Scoring List
    renderAppraisalCriteriaInputs(perspective, appraisal);

    // Update Score Banner
    updateScoreBanner();

    // Fill Commentary Fields
    document.getElementById('appraisalKeyStrengths').value = appraisal.keyStrengths || '';
    document.getElementById('appraisalAreasForImprovement').value = appraisal.areasForImprovement || '';
    document.getElementById('appraisalReviewerComments').value = appraisal.reviewerComments || '';
    document.getElementById('appraisalDevRecommendations').value = appraisal.developmentRecommendations || '';

    // Self-assessment comment block
    const selfCommentDisplay = document.getElementById('appraisalSelfCommentsDisplay');
    if (selfCommentDisplay) {
      selfCommentDisplay.textContent = appraisal.selfComments || 'No self-assessment comments submitted yet.';
    }

    // Open Modal
    window.EmployeeHub.modals.openModal('modalAppraisalForm');
  }

  function updatePerspectiveTabs(perspective) {
    activeAppraisalPerspective = perspective;
    const tabMgr = document.getElementById('btnRolePerspectiveManager');
    const tabEmp = document.getElementById('btnRolePerspectiveEmployee');

    if (perspective === 'manager') {
      if (tabMgr) tabMgr.classList.add('active');
      if (tabEmp) tabEmp.classList.remove('active');
      document.getElementById('sectionManagerReviewFeedback').style.display = 'block';
      document.getElementById('sectionSelfAssessmentFeedback').style.display = 'none';
      document.getElementById('btnCompleteAppraisalAction').textContent = 'Finalize & Complete Appraisal';
    } else {
      if (tabMgr) tabMgr.classList.remove('active');
      if (tabEmp) tabEmp.classList.add('active');
      document.getElementById('sectionManagerReviewFeedback').style.display = 'none';
      document.getElementById('sectionSelfAssessmentFeedback').style.display = 'block';
      document.getElementById('btnCompleteAppraisalAction').textContent = 'Submit Self-Assessment';
    }
  }

  function renderAppraisalCriteriaInputs(perspective, appraisal) {
    const container = document.getElementById('listAppraisalCriteria');
    if (!container) return;

    const criteria = window.EmployeeHub.growthStore.getCriteria();
    const descriptions = window.EmployeeHub.growthStore.getRatingDescriptions();

    container.innerHTML = criteria.map(crit => {
      const currentVal = currentModalRatings[crit.id] || 0;
      const weightPct = Math.round(crit.weight * 100);

      const ratingButtons = [1, 2, 3, 4, 5].map(star => {
        const isSelected = currentVal === star;
        return `
          <button type="button" class="rating-option-btn ${isSelected ? 'selected' : ''}" 
            onclick="window.EmployeeHub.growth.setCriteriaRating('${crit.id}', ${star})"
            title="${descriptions[star]}">
            <span class="rating-num">${star} ★</span>
            <span class="rating-label">${star === 1 ? 'Needs Dev' : (star === 5 ? 'Role Model' : (star === 3 ? 'Meets' : ''))}</span>
          </button>
        `;
      }).join('');

      return `
        <div class="rating-criteria-card">
          <div class="rating-criteria-header">
            <div>
              <div class="rating-criteria-title">${window.EmployeeHub.utils.escapeHtml(crit.name)}</div>
              <div class="rating-criteria-desc">${window.EmployeeHub.utils.escapeHtml(crit.desc)}</div>
            </div>
            <span class="rating-weight-badge">Weight: ${weightPct}%</span>
          </div>
          <div class="rating-selector-group">
            ${ratingButtons}
          </div>
        </div>
      `;
    }).join('');
  }

  function setCriteriaRating(criteriaId, rating) {
    currentModalRatings[criteriaId] = rating;
    const appraisal = window.EmployeeHub.growthStore.getAppraisalById(activeAppraisalId);
    renderAppraisalCriteriaInputs(activeAppraisalPerspective, appraisal);
    updateScoreBanner();
  }

  function updateScoreBanner() {
    const scoreValEl = document.getElementById('appraisalOverallScoreVal');
    if (!scoreValEl) return;

    const score = window.EmployeeHub.growthStore.calculateAppraisalScore(currentModalRatings);
    scoreValEl.textContent = score > 0 ? score.toFixed(1) : '--';
  }

  function saveAppraisalModal(isFinalSubmit = false) {
    const store = window.EmployeeHub.growthStore;
    const appraisal = store.getAppraisalById(activeAppraisalId);
    if (!appraisal) return;

    const score = store.calculateAppraisalScore(currentModalRatings);

    if (activeAppraisalPerspective === 'employee') {
      // Saving Employee Self Assessment
      appraisal.selfRatings = { ...currentModalRatings };
      appraisal.selfComments = document.getElementById('inputSelfAssessmentComments').value || appraisal.selfComments;
      if (isFinalSubmit) {
        appraisal.selfAssessmentSubmitted = true;
        appraisal.selfAssessmentDate = new Date().toISOString().slice(0, 10);
        appraisal.status = 'Submitted';
      }
    } else {
      // Saving Manager Review
      appraisal.managerRatings = { ...currentModalRatings };
      appraisal.overallScore = score;
      appraisal.keyStrengths = document.getElementById('appraisalKeyStrengths').value;
      appraisal.areasForImprovement = document.getElementById('appraisalAreasForImprovement').value;
      appraisal.reviewerComments = document.getElementById('appraisalReviewerComments').value;
      appraisal.developmentRecommendations = document.getElementById('appraisalDevRecommendations').value;

      if (isFinalSubmit) {
        appraisal.status = 'Completed';
        appraisal.managerReviewDate = new Date().toISOString().slice(0, 10);
      }
    }

    store.saveAppraisal(appraisal);
    window.EmployeeHub.modals.closeActiveModal();
    window.EmployeeHub.app.showToast(`Appraisal successfully ${isFinalSubmit ? 'completed and submitted' : 'saved as draft'}.`, 'success');
    renderReviewCyclesAndAppraisals();
    renderGrowthDashboard();
  }

  // =========================================================================
  // 3. GOALS & OKRs
  // =========================================================================
  function renderGoals() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    const goals = store.getGoals();
    const container = document.getElementById('gridGoalsList');
    if (!container) return;

    container.innerHTML = goals.map(g => {
      const statusBadge = g.status === 'Completed' ? 'badge-success' : (g.status === 'At Risk' ? 'badge-danger' : 'badge-primary');
      const progressFill = g.currentProgress >= 100 ? 'fill-success' : (g.currentProgress >= 60 ? '' : 'fill-warning');

      const milestonesHtml = (g.milestones || []).map(m => `
        <div class="milestone-item ${m.completed ? 'completed' : ''}">
          <input type="checkbox" ${m.completed ? 'checked' : ''} disabled>
          <span>${window.EmployeeHub.utils.escapeHtml(m.title)}</span>
        </div>
      `).join('');

      return `
        <div class="goal-card">
          <div class="goal-card-header">
            <div>
              <span class="goal-category-tag">${g.category}</span>
              <h4 class="goal-title" style="margin-top: 4px;">${window.EmployeeHub.utils.escapeHtml(g.title)}</h4>
            </div>
            <span class="badge ${statusBadge}">${g.status}</span>
          </div>
          <p style="font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0; line-height: 1.4;">${window.EmployeeHub.utils.escapeHtml(g.description)}</p>
          
          <div class="goal-meta-grid">
            <div class="goal-meta-item">
              <span class="goal-meta-label">Owner</span>
              <span class="goal-meta-val">${window.EmployeeHub.utils.escapeHtml(g.employeeName)}</span>
            </div>
            <div class="goal-meta-item">
              <span class="goal-meta-label">Branch</span>
              <span class="goal-meta-val">${g.branch}</span>
            </div>
            <div class="goal-meta-item">
              <span class="goal-meta-label">Target Date</span>
              <span class="goal-meta-val">${g.targetDate}</span>
            </div>
            <div class="goal-meta-item">
              <span class="goal-meta-label">Priority</span>
              <span class="goal-meta-val">${g.priority}</span>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px;">
              <span>Progress: ${g.currentProgress}%</span>
              <span>${g.targetValue || ''}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${progressFill}" style="width: ${g.currentProgress}%;"></div>
            </div>
          </div>

          ${milestonesHtml ? `<div class="milestone-list">${milestonesHtml}</div>` : ''}

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.growth.promptUpdateGoalProgress('${g.id}')">
              Update Progress
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function promptUpdateGoalProgress(goalId) {
    const goal = window.EmployeeHub.growthStore.getGoalById(goalId);
    if (!goal) return;

    const newProg = prompt(`Update progress for "${goal.title}" (Current: ${goal.currentProgress}%):`, goal.currentProgress);
    if (newProg !== null) {
      const val = parseInt(newProg);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        const note = prompt('Optional progress milestone note:', '');
        const newStatus = val >= 100 ? 'Completed' : (val < 40 ? 'At Risk' : 'In Progress');
        window.EmployeeHub.growthStore.updateGoalProgress(goalId, val, newStatus, note);
        window.EmployeeHub.app.showToast(`Goal updated to ${val}% completion.`, 'success');
        renderGoals();
        renderGrowthDashboard();
      }
    }
  }

  function openCreateGoalModal() {
    const empSelect = document.getElementById('newGoalEmployeeSelect');
    if (empSelect && window.EmployeeHub.dataStore) {
      const employees = window.EmployeeHub.dataStore.getEmployees();
      empSelect.innerHTML = employees.map(e => `<option value="${e.id}">${e.name} (${e.designation} • ${e.branch})</option>`).join('');
    }
    window.EmployeeHub.modals.openModal('modalGoalForm');
  }

  function handleCreateGoalSubmit(e) {
    e.preventDefault();
    const empSelect = document.getElementById('newGoalEmployeeSelect');
    const empId = empSelect.value;
    const emp = window.EmployeeHub.dataStore.getEmployeeById(empId);

    const goalData = {
      title: document.getElementById('newGoalTitle').value,
      description: document.getElementById('newGoalDesc').value,
      employeeId: empId,
      employeeName: emp ? emp.name : 'Employee',
      department: emp ? emp.department : 'General',
      branch: emp ? emp.branch : 'Bengaluru HQ',
      category: document.getElementById('newGoalCategory').value,
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: document.getElementById('newGoalTargetDate').value,
      measurementMethod: 'Quantitative',
      targetValue: document.getElementById('newGoalTargetValue').value || '100%',
      currentProgress: 0,
      priority: document.getElementById('newGoalPriority').value,
      owner: emp ? emp.name : 'Employee',
      status: 'In Progress',
      milestones: []
    };

    window.EmployeeHub.growthStore.saveGoal(goalData);
    window.EmployeeHub.modals.closeActiveModal();
    window.EmployeeHub.app.showToast('Goal assigned successfully.', 'success');
    renderGoals();
    renderGrowthDashboard();
  }

  // =========================================================================
  // 4. INDIVIDUAL DEVELOPMENT PLANS (IDP)
  // =========================================================================
  function renderDevPlans() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    const plans = store.getDevPlans();
    const container = document.getElementById('gridDevPlansList');
    if (!container) return;

    container.innerHTML = plans.map(p => {
      const actionItemsHtml = (p.actionItems || []).map(act => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--color-bg-subtle); border-radius: var(--radius-sm); font-size: 0.75rem;">
          <div>
            <strong>${window.EmployeeHub.utils.escapeHtml(act.action)}</strong>
            <div style="color: var(--color-text-muted);">Mentor: ${act.mentor} • Target: ${act.targetDate}</div>
          </div>
          <span class="badge ${act.status === 'Completed' ? 'badge-success' : 'badge-neutral'}">${act.status}</span>
        </div>
      `).join('');

      return `
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h4 style="font-size: 1.0625rem; font-weight: 700; color: var(--color-text-primary); margin: 0;">${window.EmployeeHub.utils.escapeHtml(p.employeeName)}</h4>
              <span style="font-size: 0.75rem; color: var(--color-text-muted);">${p.designation} • ${p.branch}</span>
            </div>
            <span class="badge badge-primary">Target: ${p.targetRole}</span>
          </div>

          <div style="font-size: 0.8125rem; line-height: 1.4; color: var(--color-text-secondary); background: var(--color-bg-app); padding: 10px; border-radius: var(--radius-md);">
            <strong>Career Objective:</strong> ${window.EmployeeHub.utils.escapeHtml(p.careerObjective)}
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px;">
              <span>Plan Completion: ${p.progress}%</span>
              <span>Mentor: ${p.mentor}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill fill-success" style="width: ${p.progress}%;"></div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
            <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted);">Development Action Items</span>
            ${actionItemsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 5. SKILLS MATRIX & COMPETENCY LIBRARY
  // =========================================================================
  function renderSkillsMatrix() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    // Skills Library
    const libContainer = document.getElementById('gridSkillsLibrary');
    if (libContainer) {
      const skills = store.getSkillsLibrary();
      libContainer.innerHTML = skills.map(s => `
        <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h5 style="font-size: 0.9375rem; font-weight: 700; margin: 0; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHtml(s.name)}</h5>
            <span class="badge badge-neutral" style="font-size: 0.6875rem;">${s.category}</span>
          </div>
          <p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 0; line-height: 1.4;">${window.EmployeeHub.utils.escapeHtml(s.desc)}</p>
          <div style="font-size: 0.6875rem; color: var(--color-brand); font-weight: 600; margin-top: 4px;">Family: ${s.roleFamily}</div>
        </div>
      `).join('');
    }

    // Employee Skills Table
    const tbody = document.getElementById('tbodyEmployeeSkillsMatrix');
    if (tbody) {
      const empSkills = store.getEmployeeSkills();
      const empMap = {};
      empSkills.forEach(es => {
        if (!empMap[es.employeeId]) empMap[es.employeeId] = [];
        empMap[es.employeeId].push(es);
      });

      const rows = Object.entries(empMap).map(([empId, sList]) => {
        const emp = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployeeById(empId) : null;
        const badgesHtml = sList.map(s => {
          const badgeClass = `skill-badge-${s.proficiency.toLowerCase()}`;
          return `<span class="skill-badge ${badgeClass}">${s.skillName} • ${s.proficiency}</span>`;
        }).join(' ');

        return `
          <tr>
            <td style="font-weight: 600;">${emp ? emp.name : empId}<br><span style="font-size: 0.75rem; color: var(--color-text-muted);">${emp ? emp.designation : ''}</span></td>
            <td>${emp ? emp.branch : '--'}</td>
            <td><div style="display: flex; flex-wrap: wrap; gap: 6px;">${badgesHtml}</div></td>
          </tr>
        `;
      });

      tbody.innerHTML = rows.join('') || '<tr><td colspan="3" class="text-center text-muted">No employee skill records found.</td></tr>';
    }
  }

  // =========================================================================
  // 6. TRAINING & LEARNING MANAGEMENT
  // =========================================================================
  function renderTrainingCourses() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    const courses = store.getCourses();
    const container = document.getElementById('gridTrainingCourses');
    if (!container) return;

    container.innerHTML = courses.map(c => {
      const enrollments = store.getEnrollmentsByCourse(c.id);
      const enrolledCount = enrollments.length;
      const capPct = c.capacity ? Math.min(100, Math.round((enrolledCount / c.capacity) * 100)) : 0;
      const statusBadge = c.status === 'Completed' ? 'badge-neutral' : (c.status === 'In Progress' ? 'badge-primary' : 'badge-success');

      return `
        <div class="course-card">
          <div class="course-card-header">
            <span class="course-pill">${c.category} • ${c.deliveryMethod}</span>
            <span class="badge ${statusBadge}">${c.status}</span>
          </div>
          <div class="course-card-body">
            <h4 class="course-title">${window.EmployeeHub.utils.escapeHtml(c.name)}</h4>
            <p style="font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0; line-height: 1.4;">${window.EmployeeHub.utils.escapeHtml(c.description)}</p>
            
            <div style="background: var(--color-bg-subtle); padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.75rem;">
              <div><strong>Trainer:</strong> ${window.EmployeeHub.utils.escapeHtml(c.trainer)}</div>
              <div><strong>Duration:</strong> ${c.durationHours} hours (${c.startDate} to ${c.endDate})</div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px;">
                <span>Enrolled: ${enrolledCount} / ${c.capacity} staff</span>
                <span>${capPct}% Full</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill ${capPct >= 90 ? 'fill-warning' : 'fill-success'}" style="width: ${capPct}%;"></div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: auto; padding-top: 8px;">
              <button class="btn btn-primary btn-sm" onclick="window.EmployeeHub.growth.openEnrollModal('${c.id}')">
                Enroll Employee
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function openEnrollModal(courseId) {
    const course = window.EmployeeHub.growthStore.getCourseById(courseId);
    if (!course) return;

    document.getElementById('enrollCourseName').textContent = course.name;
    document.getElementById('enrollCourseId').value = course.id;

    const empSelect = document.getElementById('enrollEmployeeSelect');
    if (empSelect && window.EmployeeHub.dataStore) {
      const employees = window.EmployeeHub.dataStore.getEmployees();
      empSelect.innerHTML = employees.map(e => `<option value="${e.id}">${e.name} (${e.designation} • ${e.branch})</option>`).join('');
    }

    window.EmployeeHub.modals.openModal('modalCourseEnrollment');
  }

  function handleEnrollSubmit(e) {
    e.preventDefault();
    const courseId = document.getElementById('enrollCourseId').value;
    const empId = document.getElementById('enrollEmployeeSelect').value;
    const emp = window.EmployeeHub.dataStore.getEmployeeById(empId);

    try {
      window.EmployeeHub.growthStore.enrollEmployee(courseId, emp);
      window.EmployeeHub.modals.closeActiveModal();
      window.EmployeeHub.app.showToast(`Successfully enrolled ${emp.name} in course.`, 'success');
      renderTrainingCourses();
      renderGrowthDashboard();
    } catch (err) {
      alert(err.message);
    }
  }

  // =========================================================================
  // 7. PROMOTION RECOMMENDATIONS (Explainable & Human Review)
  // =========================================================================
  function renderPromotionReviews() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    const candidates = store.getPromotions();
    const container = document.getElementById('gridPromotionReviews');
    if (!container) return;

    container.innerHTML = candidates.map(p => {
      const statusBadge = p.status === 'Approved for Next-Step Review' ? 'badge-success' : (p.status === 'Recommended for Discussion' ? 'badge-brand' : 'badge-warning');

      return `
        <div class="promo-dossier-card ${p.status === 'Recommended for Discussion' ? 'highlight' : ''}">
          <div class="promo-dossier-header">
            <div>
              <h4 class="promo-candidate-name">${window.EmployeeHub.utils.escapeHtml(p.employeeName)}</h4>
              <div class="promo-candidate-role">${p.currentDesignation} ➜ <strong>${p.proposedRole}</strong></div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">${p.department} • ${p.branch} • Tenure: ${p.tenure}</div>
            </div>
            <span class="badge ${statusBadge}">${p.status}</span>
          </div>

          <div class="promo-stat-pill-group">
            <span class="promo-stat-pill">★ Appraisal: <strong>${p.appraisalScore} / 5.0</strong></span>
            <span class="promo-stat-pill">Goals: <strong>${p.goalCompletionRate}%</strong></span>
            <span class="promo-stat-pill">Skills Verified: <strong>${p.skillsCount}</strong></span>
            <span class="promo-stat-pill">Training Completed: <strong>${p.trainingHoursCompleted} hrs</strong></span>
            <span class="promo-stat-pill">Dev Plan Progress: <strong>${p.devPlanProgress}%</strong></span>
          </div>

          <div class="promo-explain-box">
            <strong>Committee Evaluation Rationale:</strong><br>
            ${window.EmployeeHub.utils.escapeHtml(p.notes)}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--color-border); padding-top: 12px; margin-top: 4px;">
            <span style="font-size: 0.75rem; color: var(--color-text-muted);">
              ${p.humanConfirmed ? `Confirmed by ${p.evaluatedBy} on ${p.evaluationDate}` : 'Requires Human Confirmation'}
            </span>
            <button class="btn btn-primary btn-sm" onclick="window.EmployeeHub.growth.openPromotionConfirmModal('${p.id}')">
              Review & Confirm Decision
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function openPromotionConfirmModal(promoId) {
    const promo = window.EmployeeHub.growthStore.getPromotionById(promoId);
    if (!promo) return;

    document.getElementById('promoModalCandidateName').textContent = promo.employeeName;
    document.getElementById('promoModalProposedRole').textContent = promo.proposedRole;
    document.getElementById('promoModalId').value = promo.id;
    document.getElementById('promoModalStatusSelect').value = promo.status;
    document.getElementById('promoModalReviewerNotes').value = promo.notes;

    window.EmployeeHub.modals.openModal('modalPromotionReview');
  }

  function handlePromotionConfirmSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('promoModalId').value;
    const newStatus = document.getElementById('promoModalStatusSelect').value;
    const notes = document.getElementById('promoModalReviewerNotes').value;
    const reviewerName = document.getElementById('promoModalReviewerName').value || 'Executive Talent Committee';

    window.EmployeeHub.growthStore.confirmPromotionStatus(id, newStatus, notes, reviewerName);
    window.EmployeeHub.modals.closeActiveModal();
    window.EmployeeHub.app.showToast('Promotion readiness status confirmed.', 'success');
    renderPromotionReviews();
    renderGrowthDashboard();
  }

  // =========================================================================
  // 8. CAREER PATHS
  // =========================================================================
  function renderCareerPaths() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    const paths = store.getCareerPaths();
    const container = document.getElementById('containerCareerPaths');
    if (!container) return;

    container.innerHTML = paths.map(path => {
      const stepsHtml = path.levels.map((lvl, idx) => `
        <div class="career-step-node">
          <div class="career-step-marker">${idx + 1}</div>
          <div class="career-step-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <h5 style="font-size: 0.9375rem; font-weight: 700; margin: 0; color: var(--color-text-primary);">${lvl.role} ➜ ${lvl.nextRole}</h5>
              <span class="badge badge-neutral">${lvl.experienceYears}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 8px;">
              <strong>Prerequisite Milestone:</strong> ${lvl.checkpoint}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${lvl.requiredSkills.map(sk => `<span class="badge badge-primary" style="font-size: 0.6875rem;">${sk}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('');

      return `
        <div class="card" style="padding: 20px; margin-bottom: 24px;">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0;">${path.track}</h3>
          <p style="font-size: 0.8125rem; color: var(--color-text-muted); margin: 0 0 16px 0;">${path.description}</p>
          <div class="career-path-flow">
            ${stepsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 9. FEEDBACK & RECOGNITION
  // =========================================================================
  function renderFeedbackAndRecognition() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    const feedbackList = store.getFeedback(null, true);
    const container = document.getElementById('gridFeedbackList');
    if (!container) return;

    container.innerHTML = feedbackList.map(f => `
      <div class="kudos-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="kudos-badge-flag">★ ${f.badge}</span>
          <span class="badge ${f.visibility === 'Public' ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.6875rem;">${f.visibility}</span>
        </div>
        <div class="kudos-quote">"${window.EmployeeHub.utils.escapeHtml(f.message)}"</div>
        <div class="kudos-author-row">
          <span>Awarded to: <strong>${f.recipientName}</strong></span>
          <span>From: ${f.senderName} (${f.date})</span>
        </div>
      </div>
    `).join('');
  }

  function openSendFeedbackModal() {
    const empSelect = document.getElementById('feedbackRecipientSelect');
    if (empSelect && window.EmployeeHub.dataStore) {
      const employees = window.EmployeeHub.dataStore.getEmployees();
      empSelect.innerHTML = employees.map(e => `<option value="${e.id}">${e.name} (${e.designation} • ${e.branch})</option>`).join('');
    }
    window.EmployeeHub.modals.openModal('modalFeedbackForm');
  }

  function handleSendFeedbackSubmit(e) {
    e.preventDefault();
    const recipientId = document.getElementById('feedbackRecipientSelect').value;
    const recipient = window.EmployeeHub.dataStore.getEmployeeById(recipientId);

    const feedbackData = {
      senderId: 'EMP-CURRENT',
      senderName: document.getElementById('feedbackSenderName').value || 'Peer Colleague',
      recipientId: recipientId,
      recipientName: recipient ? recipient.name : 'Colleague',
      badge: document.getElementById('feedbackBadgeSelect').value,
      message: document.getElementById('feedbackMessage').value,
      visibility: document.getElementById('feedbackVisibilitySelect').value
    };

    window.EmployeeHub.growthStore.addFeedback(feedbackData);
    window.EmployeeHub.modals.closeActiveModal();
    window.EmployeeHub.app.showToast('Feedback and recognition sent!', 'success');
    renderFeedbackAndRecognition();
    renderGrowthDashboard();
  }

  // =========================================================================
  // 10. GROWTH REPORTS & CSV EXPORT
  // =========================================================================
  function renderGrowthReports() {
    const store = window.EmployeeHub.growthStore;
    if (!store) return;

    const tbody = document.getElementById('tbodyGrowthReports');
    if (!tbody) return;

    const appraisals = store.getAppraisals();
    tbody.innerHTML = appraisals.map(a => `
      <tr>
        <td style="font-weight: 600;">${window.EmployeeHub.utils.escapeHtml(a.employeeName)}</td>
        <td>${a.designation}</td>
        <td>${a.branch}</td>
        <td>${a.cycleName}</td>
        <td>${a.overallScore ? `★ ${a.overallScore} / 5.0` : 'Pending'}</td>
        <td>${a.promotionRecommendation || 'Standard Track'}</td>
        <td><span class="badge ${a.status === 'Completed' ? 'badge-success' : 'badge-neutral'}">${a.status}</span></td>
      </tr>
    `).join('');
  }

  function exportGrowthReportCSV() {
    const store = window.EmployeeHub.growthStore;
    const appraisals = store.getAppraisals();

    const headers = ['Employee ID', 'Employee Name', 'Designation', 'Branch', 'Review Period', 'Overall Score', 'Status', 'Promotion Recommendation'];
    const rows = appraisals.map(a => [
      a.employeeId,
      `"${a.employeeName.replace(/"/g, '""')}"`,
      `"${a.designation.replace(/"/g, '""')}"`,
      `"${a.branch.replace(/"/g, '""')}"`,
      `"${a.cycleName.replace(/"/g, '""')}"`,
      a.overallScore || 'N/A',
      a.status,
      `"${(a.promotionRecommendation || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EmployeeHub_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    initGrowthModule,
    switchGrowthTab,
    renderGrowthDashboard,
    renderReviewCyclesAndAppraisals,
    openAppraisalModal,
    updatePerspectiveTabs,
    setCriteriaRating,
    saveAppraisalModal,
    renderGoals,
    promptUpdateGoalProgress,
    openCreateGoalModal,
    handleCreateGoalSubmit,
    renderDevPlans,
    renderSkillsMatrix,
    renderTrainingCourses,
    openEnrollModal,
    handleEnrollSubmit,
    renderPromotionReviews,
    openPromotionConfirmModal,
    handlePromotionConfirmSubmit,
    renderCareerPaths,
    renderFeedbackAndRecognition,
    openSendFeedbackModal,
    handleSendFeedbackSubmit,
    renderGrowthReports,
    exportGrowthReportCSV
  };
})();
