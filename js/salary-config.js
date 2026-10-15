/**
 * Salary Configuration Module Controller
 * Namespace: window.EmployeeHub.salaryConfig
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.salaryConfig = (function () {
  'use strict';

  let currentTab = 'structures'; // 'structures' | 'components'
  let editingStructureId = null;
  let editingComponentId = null;
  let pendingDeleteStructId = null;
  let pendingDeleteCompId = null;

  function initSalaryConfigModule() {
    initTabs();
    initBuilderEvents();
    renderStructures();
    renderComponents();
  }

  function initTabs() {
    document.querySelectorAll('.subtab-btn[data-subtab]').forEach(btn => {
      btn.addEventListener('click', function () {
        const tab = btn.getAttribute('data-subtab');
        switchTab(tab);
      });
    });
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.subtab-btn[data-subtab]').forEach(btn => {
      if (btn.getAttribute('data-subtab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const structPanel = document.getElementById('panelSalaryStructures');
    const compPanel = document.getElementById('panelSalaryComponents');

    if (structPanel) structPanel.style.display = tab === 'structures' ? 'block' : 'none';
    if (compPanel) compPanel.style.display = tab === 'components' ? 'block' : 'none';

    if (tab === 'structures') renderStructures();
    if (tab === 'components') renderComponents();
  }

  // =========================================================================
  // SALARY STRUCTURES SECTION
  // =========================================================================

  function renderStructures() {
    const container = document.getElementById('salaryStructuresContainer');
    if (!container) return;

    const structures = window.EmployeeHub.payrollStore.getStructures();
    if (structures.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-title">No Salary Structures Found</div>
          <p class="empty-state-desc">Create your first reusable organizational salary structure template.</p>
          <button class="btn btn-primary btn-sm" onclick="window.EmployeeHub.salaryConfig.openCreateStructure()">
            Create Salary Structure
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = structures.map(s => {
      const calc = window.EmployeeHub.payrollStore.calculateSalary(s.benchmarkBasic, s.id);
      const assignedCount = window.EmployeeHub.payrollStore.getAssignedEmployeesCount(s.id);
      const components = window.EmployeeHub.payrollStore.getComponents();

      // Collect component preview badges
      const compPills = Object.entries(s.components || {}).map(([cId, config]) => {
        const comp = components.find(c => c.id === cId);
        if (!comp) return '';
        const isEarning = comp.type === 'earning';
        const displayVal = config.amountType === 'percentage' ? `${config.value}%` : `₹${window.EmployeeHub.utils.formatNumber(config.value)}`;
        return `
          <span class="structure-comp-pill ${isEarning ? 'earning' : 'deduction'}" title="${comp.name}">
            ${comp.code || comp.name}: ${displayVal}
          </span>
        `;
      }).filter(Boolean).join('');

      return `
        <div class="structure-card">
          <div>
            <div class="structure-header">
              <div class="structure-title-box">
                <h4>${window.EmployeeHub.utils.escapeHTML(s.name)}</h4>
                <p>${window.EmployeeHub.utils.escapeHTML(s.description || 'Standard compensation template')}</p>
              </div>
              <span class="badge badge-brand" style="font-family: var(--font-mono); font-size: 0.6875rem;">
                ${s.id}
              </span>
            </div>

            <!-- Benchmark & Calculated Totals -->
            <div class="structure-benchmark" style="margin: 14px 0;">
              <div>
                <span style="font-size: 0.6875rem; text-transform: uppercase; color: #166534; font-weight: 600; display: block;">Benchmark Basic</span>
                <strong>${window.EmployeeHub.utils.formatINR(s.benchmarkBasic)}</strong>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.6875rem; text-transform: uppercase; color: #166534; font-weight: 600; display: block;">Est. Net Take-Home</span>
                <strong style="color: #047857; font-size: 1.125rem;">${window.EmployeeHub.utils.formatINR(calc.netSalary)}</strong>
              </div>
            </div>

            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 6px; font-weight: 600;">
              Configured Components (${Object.keys(s.components || {}).length}):
            </div>
            <div class="structure-components-preview">
              ${compPills || '<span style="font-size: 0.75rem; color: var(--color-text-muted);">Standard base components</span>'}
            </div>
          </div>

          <div class="structure-footer">
            <span class="structure-assigned-badge">
              <strong>${assignedCount}</strong> employees assigned
            </span>
            <div class="structure-actions">
              <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.salaryConfig.openEditStructure('${s.id}')" title="Edit Template">
                Edit
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.salaryConfig.duplicateStructure('${s.id}')" title="Duplicate as Template">
                Duplicate
              </button>
              <button class="btn btn-ghost btn-sm text-danger" onclick="window.EmployeeHub.salaryConfig.confirmDeleteStructure('${s.id}')" title="Delete Template">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // STRUCTURE BUILDER MODAL WITH LIVE BREAKDOWN
  // =========================================================================

  function initBuilderEvents() {
    const basicInput = document.getElementById('structBuilderBasic');
    if (basicInput) {
      basicInput.addEventListener('input', updateBuilderLiveBreakdown);
    }
  }

  function openCreateStructure() {
    editingStructureId = null;
    const modal = document.getElementById('modalStructureBuilder');
    if (!modal) return;

    document.getElementById('structBuilderModalTitle').textContent = 'Create Salary Structure Template';
    document.getElementById('structBuilderName').value = '';
    document.getElementById('structBuilderDesc').value = '';
    document.getElementById('structBuilderBasic').value = 50000;

    renderBuilderComponentInputs({});
    updateBuilderLiveBreakdown();
    window.EmployeeHub.modals.openModal('modalStructureBuilder');
  }

  function openEditStructure(structId) {
    const struct = window.EmployeeHub.payrollStore.getStructure(structId);
    if (!struct) return;

    editingStructureId = structId;
    const modal = document.getElementById('modalStructureBuilder');
    if (!modal) return;

    document.getElementById('structBuilderModalTitle').textContent = `Edit "${struct.name}"`;
    document.getElementById('structBuilderName').value = struct.name;
    document.getElementById('structBuilderDesc').value = struct.description || '';
    document.getElementById('structBuilderBasic').value = struct.benchmarkBasic || 50000;

    renderBuilderComponentInputs(struct.components || {});
    updateBuilderLiveBreakdown();
    window.EmployeeHub.modals.openModal('modalStructureBuilder');
  }

  function renderBuilderComponentInputs(activeConfig) {
    const container = document.getElementById('structBuilderComponentsList');
    if (!container) return;

    const components = window.EmployeeHub.payrollStore.getComponents().filter(c => c.id !== 'comp-basic' && c.status === 'Active');

    container.innerHTML = components.map(c => {
      const existing = activeConfig[c.id];
      const val = existing !== undefined ? existing.value : c.defaultValue;
      const type = existing ? existing.amountType : c.amountType;

      return `
        <div class="form-row" style="align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--color-border-subtle);" data-comp-id="${c.id}">
          <div style="flex: 2;">
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--color-text-primary);">
              ${window.EmployeeHub.utils.escapeHTML(c.name)}
              <span class="badge ${c.type === 'earning' ? 'badge-success' : 'badge-danger'}" style="font-size: 0.625rem; margin-left: 6px;">
                ${c.type}
              </span>
            </div>
            <small style="color: var(--color-text-muted); font-size: 0.6875rem;">
              ${c.amountType === 'percentage' ? `Percentage of ${c.percentageBase || 'Basic'}` : 'Fixed amount in ₹'}
            </small>
          </div>
          <div style="flex: 1; min-width: 120px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <input type="number" class="form-input builder-comp-val" data-comp-id="${c.id}" value="${val}" min="0" step="${type === 'percentage' ? '0.5' : '100'}" style="padding: 6px 10px; font-size: 0.8125rem;">
              <span style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted);">
                ${type === 'percentage' ? '%' : '₹'}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach real-time recalculation listeners
    container.querySelectorAll('.builder-comp-val').forEach(input => {
      input.addEventListener('input', updateBuilderLiveBreakdown);
    });
  }

  function getBuilderFormComponentsData() {
    const componentsConfig = {};
    const components = window.EmployeeHub.payrollStore.getComponents();

    document.querySelectorAll('#structBuilderComponentsList .builder-comp-val').forEach(input => {
      const compId = input.getAttribute('data-comp-id');
      const comp = components.find(c => c.id === compId);
      if (comp) {
        componentsConfig[compId] = {
          value: Math.max(0, Number(input.value) || 0),
          amountType: comp.amountType
        };
      }
    });

    return componentsConfig;
  }

  function updateBuilderLiveBreakdown() {
    const basicInput = document.getElementById('structBuilderBasic');
    const basic = Math.max(0, Number(basicInput ? basicInput.value : 0) || 0);
    const overrides = getBuilderFormComponentsData();

    const calc = window.EmployeeHub.payrollStore.calculateSalary(basic, null, overrides);

    const grossElem = document.getElementById('builderLiveGross');
    const dedElem = document.getElementById('builderLiveDed');
    const netElem = document.getElementById('builderLiveNet');

    if (grossElem) grossElem.textContent = window.EmployeeHub.utils.formatINR(calc.grossSalary);
    if (dedElem) dedElem.textContent = window.EmployeeHub.utils.formatINR(calc.totalDeductions);
    if (netElem) netElem.textContent = window.EmployeeHub.utils.formatINR(calc.netSalary);
  }

  function handleStructureBuilderSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('structBuilderName').value.trim();
    const desc = document.getElementById('structBuilderDesc').value.trim();
    const basic = Number(document.getElementById('structBuilderBasic').value) || 50000;

    if (!name) {
      window.EmployeeHub.toast.show('Validation Error', 'Structure name is required.', 'danger');
      return;
    }

    const compData = getBuilderFormComponentsData();

    try {
      if (editingStructureId) {
        window.EmployeeHub.payrollStore.updateStructure(editingStructureId, {
          name,
          description: desc,
          benchmarkBasic: basic,
          components: compData
        });
        window.EmployeeHub.toast.show('Structure Updated', `Updated "${name}" successfully.`, 'success');
      } else {
        window.EmployeeHub.payrollStore.addStructure({
          name,
          description: desc,
          benchmarkBasic: basic,
          components: compData
        });
        window.EmployeeHub.toast.show('Structure Created', `New template "${name}" is now available.`, 'success');
      }

      window.EmployeeHub.modals.closeActiveModal();
      renderStructures();
    } catch (err) {
      window.EmployeeHub.toast.show('Error', err.message, 'danger');
    }
  }

  function duplicateStructure(structId) {
    try {
      const copy = window.EmployeeHub.payrollStore.duplicateStructure(structId);
      renderStructures();
      window.EmployeeHub.toast.show('Structure Duplicated', `Created "${copy.name}".`, 'info');
    } catch (err) {
      window.EmployeeHub.toast.show('Error', err.message, 'danger');
    }
  }

  function confirmDeleteStructure(structId) {
    const struct = window.EmployeeHub.payrollStore.getStructure(structId);
    if (!struct) return;

    pendingDeleteStructId = structId;
    document.getElementById('deleteStructureName').textContent = struct.name;
    window.EmployeeHub.modals.openModal('modalConfirmDeleteStructure');
  }

  function executeDeleteStructure() {
    if (!pendingDeleteStructId) return;
    try {
      window.EmployeeHub.payrollStore.deleteStructure(pendingDeleteStructId);
      window.EmployeeHub.modals.closeActiveModal();
      renderStructures();
      window.EmployeeHub.toast.show('Structure Removed', 'Salary template removed.', 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Cannot Delete', err.message, 'danger');
    }
    pendingDeleteStructId = null;
  }

  // =========================================================================
  // SALARY COMPONENTS SECTION
  // =========================================================================

  function renderComponents() {
    const tbody = document.getElementById('salaryComponentsTableBody');
    if (!tbody) return;

    const components = window.EmployeeHub.payrollStore.getComponents();

    tbody.innerHTML = components.map(c => {
      const isEarning = c.type === 'earning';
      const typeBadge = isEarning
        ? '<span class="badge badge-success"><span class="badge-dot"></span> Earning</span>'
        : '<span class="badge badge-danger"><span class="badge-dot"></span> Deduction</span>';

      const calcRule = c.amountType === 'percentage'
        ? `<span style="font-weight: 600; color: var(--color-brand);">${c.defaultValue}%</span> of ${c.percentageBase === 'gross' ? 'Gross Pay' : 'Basic Pay'}`
        : `<span style="font-weight: 600; font-family: var(--font-mono);">₹${window.EmployeeHub.utils.formatNumber(c.defaultValue)}</span> (Fixed)`;

      return `
        <tr>
          <td>
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 600; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(c.name)}</span>
              <small style="color: var(--color-text-muted); font-size: 0.6875rem;">${window.EmployeeHub.utils.escapeHTML(c.description || '')}</small>
            </div>
          </td>
          <td>
            <span class="badge badge-neutral" style="font-family: var(--font-mono); font-size: 0.6875rem;">
              ${c.code || c.id}
            </span>
          </td>
          <td>${typeBadge}</td>
          <td>${calcRule}</td>
          <td>
            <span class="badge ${c.status === 'Active' ? 'badge-success' : 'badge-neutral'}">
              ${c.status}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary btn-sm" onclick="window.EmployeeHub.salaryConfig.openEditComponent('${c.id}')" title="Edit Component">
                Edit
              </button>
              ${c.isSystem ? '' : `
                <button class="btn btn-ghost btn-sm text-danger" onclick="window.EmployeeHub.salaryConfig.confirmDeleteComponent('${c.id}')" title="Delete Component">
                  Delete
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openAddComponent() {
    editingComponentId = null;
    const modal = document.getElementById('modalComponentForm');
    if (!modal) return;

    document.getElementById('compFormModalTitle').textContent = 'Add Salary Component';
    document.getElementById('compFormName').value = '';
    document.getElementById('compFormCode').value = '';
    document.getElementById('compFormType').value = 'earning';
    document.getElementById('compFormAmountType').value = 'percentage';
    document.getElementById('compFormBase').value = 'basic';
    document.getElementById('compFormDefaultValue').value = 10;
    document.getElementById('compFormStatus').value = 'Active';
    document.getElementById('compFormDesc').value = '';

    window.EmployeeHub.modals.openModal('modalComponentForm');
  }

  function openEditComponent(compId) {
    const comp = window.EmployeeHub.payrollStore.getComponent(compId);
    if (!comp) return;

    editingComponentId = compId;
    const modal = document.getElementById('modalComponentForm');
    if (!modal) return;

    document.getElementById('compFormModalTitle').textContent = `Edit Component "${comp.name}"`;
    document.getElementById('compFormName').value = comp.name;
    document.getElementById('compFormCode').value = comp.code || '';
    document.getElementById('compFormType').value = comp.type;
    document.getElementById('compFormAmountType').value = comp.amountType;
    document.getElementById('compFormBase').value = comp.percentageBase || 'basic';
    document.getElementById('compFormDefaultValue').value = comp.defaultValue;
    document.getElementById('compFormStatus').value = comp.status;
    document.getElementById('compFormDesc').value = comp.description || '';

    window.EmployeeHub.modals.openModal('modalComponentForm');
  }

  function handleComponentFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('compFormName').value.trim();
    const code = document.getElementById('compFormCode').value.trim();
    const type = document.getElementById('compFormType').value;
    const amountType = document.getElementById('compFormAmountType').value;
    const percentageBase = document.getElementById('compFormBase').value;
    const defaultValue = Number(document.getElementById('compFormDefaultValue').value) || 0;
    const status = document.getElementById('compFormStatus').value;
    const description = document.getElementById('compFormDesc').value.trim();

    if (!name) {
      window.EmployeeHub.toast.show('Validation Error', 'Component name is required.', 'danger');
      return;
    }

    try {
      if (editingComponentId) {
        window.EmployeeHub.payrollStore.updateComponent(editingComponentId, {
          name, code, type, amountType, percentageBase, defaultValue, status, description
        });
        window.EmployeeHub.toast.show('Component Updated', `Updated "${name}".`, 'success');
      } else {
        window.EmployeeHub.payrollStore.addComponent({
          name, code, type, amountType, percentageBase, defaultValue, status, description
        });
        window.EmployeeHub.toast.show('Component Added', `Created new component "${name}".`, 'success');
      }

      window.EmployeeHub.modals.closeActiveModal();
      renderComponents();
      renderStructures();
    } catch (err) {
      window.EmployeeHub.toast.show('Error', err.message, 'danger');
    }
  }

  function confirmDeleteComponent(compId) {
    const comp = window.EmployeeHub.payrollStore.getComponent(compId);
    if (!comp) return;

    pendingDeleteCompId = compId;
    document.getElementById('deleteComponentName').textContent = comp.name;
    window.EmployeeHub.modals.openModal('modalConfirmDeleteComponent');
  }

  function executeDeleteComponent() {
    if (!pendingDeleteCompId) return;
    try {
      window.EmployeeHub.payrollStore.deleteComponent(pendingDeleteCompId);
      window.EmployeeHub.modals.closeActiveModal();
      renderComponents();
      renderStructures();
      window.EmployeeHub.toast.show('Component Deleted', 'Component removed from active configuration.', 'success');
    } catch (err) {
      window.EmployeeHub.toast.show('Cannot Delete', err.message, 'danger');
    }
    pendingDeleteCompId = null;
  }

  return {
    initSalaryConfigModule,
    refresh: () => {
      renderStructures();
      renderComponents();
    },
    switchTab,
    openCreateStructure,
    openEditStructure,
    handleStructureBuilderSubmit,
    duplicateStructure,
    confirmDeleteStructure,
    executeDeleteStructure,
    openAddComponent,
    openEditComponent,
    handleComponentFormSubmit,
    confirmDeleteComponent,
    executeDeleteComponent
  };
})();
