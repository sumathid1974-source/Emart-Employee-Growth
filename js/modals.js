/**
 * Modal Dialog Management & Quick Action Handlers
 * Namespace: window.EmployeeHub.modals
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.modals = (function () {
  'use strict';

  let activeModalId = null;

  /**
   * Open modal by ID
   * @param {string} modalId
   */
  function openModal(modalId) {
    closeActiveModal();
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('active');
    activeModalId = modalId;
    document.body.style.overflow = 'hidden';

    // Focus first input or close button
    const focusable = modal.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])');
    if (focusable) {
      setTimeout(() => focusable.focus(), 50);
    }
  }

  /**
   * Close active modal
   */
  function closeActiveModal() {
    if (!activeModalId) return;
    const modal = document.getElementById(activeModalId);
    if (modal) {
      modal.classList.remove('active');
    }
    activeModalId = null;
    document.body.style.overflow = '';
  }

  /**
   * Initialize modal event listeners (ESC key, backdrop clicks)
   */
  function initModalListeners() {
    // Backdrop click to close
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('modal-backdrop')) {
        closeActiveModal();
      }
      if (e.target.closest('[data-modal-close]')) {
        closeActiveModal();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeModalId) {
        closeActiveModal();
      }
    });

    // Rating star handler in Performance Review modal
    const ratingInput = document.getElementById('reviewRatingInput');
    if (ratingInput) {
      ratingInput.addEventListener('input', updateReviewRecommendationBadge);
    }

    // Salary calculation preview in Payroll modal
    const basicSalaryInput = document.getElementById('payrollBasicInput');
    if (basicSalaryInput) {
      basicSalaryInput.addEventListener('input', updatePayrollCalculationPreview);
    }
  }

  /**
   * Dynamically update promotion recommendation badge when rating is typed/changed
   */
  function updateReviewRecommendationBadge() {
    const ratingInput = document.getElementById('reviewRatingInput');
    const badgeContainer = document.getElementById('reviewPromotionNotice');
    if (!ratingInput || !badgeContainer) return;

    const rating = parseFloat(ratingInput.value);
    if (rating >= 4.0 && rating <= 5.0) {
      badgeContainer.style.display = 'block';
      badgeContainer.className = 'badge badge-success';
      badgeContainer.innerHTML = '⭐ Rating qualifies employee for Automatic Promotion Recommendation';
    } else if (rating > 0 && rating < 4.0) {
      badgeContainer.style.display = 'block';
      badgeContainer.className = 'badge badge-neutral';
      badgeContainer.innerHTML = 'Standard performance review — does not flag for promotion';
    } else {
      badgeContainer.style.display = 'none';
    }
  }

  /**
   * Dynamically calculate demo payroll figures (HRA 40%, Allowances 10%, PF 12%, Tax 5%)
   */
  function updatePayrollCalculationPreview() {
    const basicInput = document.getElementById('payrollBasicInput');
    if (!basicInput) return;

    const basic = parseFloat(basicInput.value) || 0;
    const hra = Math.round(basic * 0.40);
    const allowances = Math.round(basic * 0.10);
    const gross = basic + hra + allowances;
    const pf = Math.round(basic * 0.12);
    const tax = Math.round(gross * 0.05);
    const net = gross - pf - tax;

    const hraElem = document.getElementById('calcHra');
    const allowElem = document.getElementById('calcAllowances');
    const grossElem = document.getElementById('calcGross');
    const pfElem = document.getElementById('calcPf');
    const taxElem = document.getElementById('calcTax');
    const netElem = document.getElementById('calcNet');

    if (hraElem) hraElem.textContent = window.EmployeeHub.utils.formatINR(hra);
    if (allowElem) allowElem.textContent = window.EmployeeHub.utils.formatINR(allowances);
    if (grossElem) grossElem.textContent = window.EmployeeHub.utils.formatINR(gross);
    if (pfElem) pfElem.textContent = window.EmployeeHub.utils.formatINR(pf);
    if (taxElem) taxElem.textContent = window.EmployeeHub.utils.formatINR(tax);
    if (netElem) netElem.textContent = window.EmployeeHub.utils.formatINR(net);
  }

  /**
   * Open Branch Details modal
   * @param {string} branchId
   */
  function openBranchDetails(branchId) {
    const branch = window.EmployeeHub.mockData.branches.find(b => b.id === branchId);
    if (!branch) return;

    const modal = document.getElementById('modalBranchDetails');
    if (!modal) return;

    document.getElementById('branchDetailTitle').textContent = branch.name;
    document.getElementById('branchDetailCode').textContent = branch.code;
    document.getElementById('branchDetailCity').textContent = `${branch.city}, ${branch.state}`;
    document.getElementById('branchDetailManager').textContent = branch.manager;
    document.getElementById('branchDetailEmail').textContent = branch.email;
    document.getElementById('branchDetailPhone').textContent = branch.phone;
    document.getElementById('branchDetailEmployees').textContent = `${branch.employeeCount} active members`;
    document.getElementById('branchDetailPayroll').textContent = window.EmployeeHub.utils.formatINR(branch.monthlyPayroll);
    document.getElementById('branchDetailAddress').textContent = branch.address;

    const statusBadge = document.getElementById('branchDetailStatus');
    statusBadge.className = branch.status === 'Active' ? 'badge badge-success' : 'badge badge-warning';
    statusBadge.innerHTML = `<span class="badge-dot"></span> ${branch.status}`;

    const deptList = document.getElementById('branchDetailDepts');
    deptList.innerHTML = branch.departments
      .map(d => `<span class="badge badge-brand">${window.EmployeeHub.utils.escapeHTML(d)}</span>`)
      .join(' ');

    openModal('modalBranchDetails');
  }

  /**
   * Handle Quick Action Submissions (Demo mode feedback)
   */
  function handleFormSubmit(formId, successTitle, successMsg) {
    const form = document.getElementById(formId);
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    closeActiveModal();
    window.EmployeeHub.toast.show(successTitle, successMsg, 'success');
    form.reset();
  }

  return {
    openModal,
    closeActiveModal,
    initModalListeners,
    openBranchDetails,
    openAddEmployee: () => openModal('modalAddEmployee'),
    openAddBranch: () => openModal('modalAddBranch'),
    openRecordReview: () => openModal('modalRecordReview'),
    openGeneratePayroll: () => {
      openModal('modalGeneratePayroll');
      updatePayrollCalculationPreview();
    },
    openSendNotification: () => openModal('modalSendNotification'),
    openQuickActionsMenu: () => openModal('modalQuickActionsMenu'),
    handleFormSubmit
  };
})();
