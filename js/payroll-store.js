/**
 * Centralized Payroll Store & Salary Engine with LocalStorage Persistence
 * Namespace: window.EmployeeHub.payrollStore
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.payrollStore = (function () {
  'use strict';

  const STORAGE_KEY_COMPONENTS = 'employeehub_salary_components_v3';
  const STORAGE_KEY_STRUCTURES = 'employeehub_salary_structures_v3';
  const STORAGE_KEY_ASSIGNMENTS = 'employeehub_employee_salaries_v3';
  const STORAGE_KEY_BATCHES = 'employeehub_payroll_batches_v3';

  // 1. Default Salary Components
  const DEFAULT_COMPONENTS = [
    {
      id: 'comp-basic',
      name: 'Basic Salary',
      code: 'BASIC',
      type: 'earning',
      amountType: 'fixed',
      percentageBase: null,
      defaultValue: 45000,
      status: 'Active',
      isSystem: true,
      description: 'Core fixed taxable salary component forming the basis for allowances and PF calculations.'
    },
    {
      id: 'comp-hra',
      name: 'House Rent Allowance (HRA)',
      code: 'HRA',
      type: 'earning',
      amountType: 'percentage',
      percentageBase: 'basic',
      defaultValue: 40,
      status: 'Active',
      isSystem: true,
      description: 'Housing allowance calculated as a percentage of Basic Salary (40% default for non-metro/metro blend).'
    },
    {
      id: 'comp-conveyance',
      name: 'Conveyance Allowance',
      code: 'CONV',
      type: 'earning',
      amountType: 'fixed',
      percentageBase: null,
      defaultValue: 1600,
      status: 'Active',
      isSystem: true,
      description: 'Fixed monthly commute and travel allowance.'
    },
    {
      id: 'comp-medical',
      name: 'Medical Allowance',
      code: 'MED',
      type: 'earning',
      amountType: 'fixed',
      percentageBase: null,
      defaultValue: 1250,
      status: 'Active',
      isSystem: true,
      description: 'Fixed monthly statutory medical stipend for outpatient expenses.'
    },
    {
      id: 'comp-special',
      name: 'Special / Other Allowance',
      code: 'SPECIAL',
      type: 'earning',
      amountType: 'percentage',
      percentageBase: 'basic',
      defaultValue: 10,
      status: 'Active',
      isSystem: true,
      description: 'Flexible supplemental earning component tailored to position tier.'
    },
    {
      id: 'comp-bonus',
      name: 'Performance Bonus',
      code: 'BONUS',
      type: 'earning',
      amountType: 'percentage',
      percentageBase: 'basic',
      defaultValue: 5,
      status: 'Active',
      isSystem: true,
      description: 'Performance-linked monthly variable bonus component.'
    },
    {
      id: 'comp-pf',
      name: 'Provident Fund (EPF)',
      code: 'PF',
      type: 'deduction',
      amountType: 'percentage',
      percentageBase: 'basic',
      defaultValue: 12,
      status: 'Active',
      isSystem: true,
      description: 'Statutory Employees Provident Fund deduction (12% of Basic Salary).'
    },
    {
      id: 'comp-ptax',
      name: 'Professional Tax (PT)',
      code: 'PTAX',
      type: 'deduction',
      amountType: 'fixed',
      percentageBase: null,
      defaultValue: 200,
      status: 'Active',
      isSystem: true,
      description: 'State municipal professional tax levied on salaried employees.'
    },
    {
      id: 'comp-itax',
      name: 'Income Tax (TDS)',
      code: 'TDS',
      type: 'deduction',
      amountType: 'percentage',
      percentageBase: 'gross',
      defaultValue: 5,
      status: 'Active',
      isSystem: true,
      description: 'Estimated monthly Tax Deducted at Source (5% demo rate of Gross Salary).'
    },
    {
      id: 'comp-other-ded',
      name: 'Other Deductions',
      code: 'OTHER_DED',
      type: 'deduction',
      amountType: 'fixed',
      percentageBase: null,
      defaultValue: 0,
      status: 'Active',
      isSystem: true,
      description: 'Voluntary deductions including employee benevolent fund or loan recovery.'
    }
  ];

  // 2. Default Salary Structures
  const DEFAULT_STRUCTURES = [
    {
      id: 'struct-exec',
      name: 'Executive Leadership Band',
      description: 'Tailored for Department Heads, Directors, and Technical Architects with higher bonus and allowance ratios.',
      benchmarkBasic: 85000,
      components: {
        'comp-hra': { value: 50, amountType: 'percentage' },
        'comp-conveyance': { value: 3200, amountType: 'fixed' },
        'comp-medical': { value: 2500, amountType: 'fixed' },
        'comp-special': { value: 20, amountType: 'percentage' },
        'comp-bonus': { value: 15, amountType: 'percentage' },
        'comp-pf': { value: 12, amountType: 'percentage' },
        'comp-ptax': { value: 200, amountType: 'fixed' },
        'comp-itax': { value: 10, amountType: 'percentage' },
        'comp-other-ded': { value: 0, amountType: 'fixed' }
      },
      createdAt: '2026-08-01'
    },
    {
      id: 'struct-tech-sr',
      name: 'Senior Engineering & Technical',
      description: 'Standard package for Tech Leads, Senior Engineers, Product Managers, and Specialists.',
      benchmarkBasic: 60000,
      components: {
        'comp-hra': { value: 40, amountType: 'percentage' },
        'comp-conveyance': { value: 1600, amountType: 'fixed' },
        'comp-medical': { value: 1250, amountType: 'fixed' },
        'comp-special': { value: 15, amountType: 'percentage' },
        'comp-bonus': { value: 8, amountType: 'percentage' },
        'comp-pf': { value: 12, amountType: 'percentage' },
        'comp-ptax': { value: 200, amountType: 'fixed' },
        'comp-itax': { value: 5, amountType: 'percentage' },
        'comp-other-ded': { value: 0, amountType: 'fixed' }
      },
      createdAt: '2026-08-01'
    },
    {
      id: 'struct-assoc',
      name: 'Associate & Operations Level',
      description: 'Designed for Developers, Operations Coordinators, HR Specialists, and Financial Analysts.',
      benchmarkBasic: 40000,
      components: {
        'comp-hra': { value: 40, amountType: 'percentage' },
        'comp-conveyance': { value: 1600, amountType: 'fixed' },
        'comp-medical': { value: 1250, amountType: 'fixed' },
        'comp-special': { value: 10, amountType: 'percentage' },
        'comp-bonus': { value: 5, amountType: 'percentage' },
        'comp-pf': { value: 12, amountType: 'percentage' },
        'comp-ptax': { value: 200, amountType: 'fixed' },
        'comp-itax': { value: 5, amountType: 'percentage' },
        'comp-other-ded': { value: 0, amountType: 'fixed' }
      },
      createdAt: '2026-08-01'
    },
    {
      id: 'struct-contract',
      name: 'Fixed Contract & Support Staff',
      description: 'Flat allowance package for fixed-term contractors and support team members.',
      benchmarkBasic: 28000,
      components: {
        'comp-hra': { value: 40, amountType: 'percentage' },
        'comp-conveyance': { value: 1200, amountType: 'fixed' },
        'comp-medical': { value: 1000, amountType: 'fixed' },
        'comp-special': { value: 5, amountType: 'percentage' },
        'comp-bonus': { value: 0, amountType: 'percentage' },
        'comp-pf': { value: 12, amountType: 'percentage' },
        'comp-ptax': { value: 200, amountType: 'fixed' },
        'comp-itax': { value: 0, amountType: 'percentage' },
        'comp-other-ded': { value: 0, amountType: 'fixed' }
      },
      createdAt: '2026-08-01'
    }
  ];

  // In-memory collections
  let components = [];
  let structures = [];
  let assignments = {}; // { empId: { structureId, basicSalary } }
  let batches = [];

  /**
   * Initialize Store from LocalStorage or Defaults
   */
  function initStore() {
    loadComponents();
    loadStructures();
    loadAssignments();
    loadBatches();
  }

  function loadComponents() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMPONENTS);
      if (stored) {
        components = JSON.parse(stored);
      } else {
        components = JSON.parse(JSON.stringify(DEFAULT_COMPONENTS));
        saveComponents();
      }
    } catch (e) {
      components = JSON.parse(JSON.stringify(DEFAULT_COMPONENTS));
    }
  }

  function saveComponents() {
    try {
      localStorage.setItem(STORAGE_KEY_COMPONENTS, JSON.stringify(components));
    } catch (e) {
      console.warn('Failed to save salary components to LocalStorage:', e);
    }
  }

  function loadStructures() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STRUCTURES);
      if (stored) {
        structures = JSON.parse(stored);
      } else {
        structures = JSON.parse(JSON.stringify(DEFAULT_STRUCTURES));
        saveStructures();
      }
    } catch (e) {
      structures = JSON.parse(JSON.stringify(DEFAULT_STRUCTURES));
    }
  }

  function saveStructures() {
    try {
      localStorage.setItem(STORAGE_KEY_STRUCTURES, JSON.stringify(structures));
    } catch (e) {
      console.warn('Failed to save salary structures to LocalStorage:', e);
    }
  }

  function loadAssignments() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (stored) {
        assignments = JSON.parse(stored);
      } else {
        assignments = seedDefaultAssignments();
        saveAssignments();
      }
    } catch (e) {
      assignments = seedDefaultAssignments();
    }
  }

  function saveAssignments() {
    try {
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
    } catch (e) {
      console.warn('Failed to save salary assignments to LocalStorage:', e);
    }
  }

  function seedDefaultAssignments() {
    const map = {};
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];

    employees.forEach(emp => {
      let structId = 'struct-assoc';
      const role = (emp.designation || '').toLowerCase();

      if (role.includes('director') || role.includes('head') || role.includes('architect') || role.includes('principal')) {
        structId = 'struct-exec';
      } else if (role.includes('senior') || role.includes('lead') || role.includes('manager')) {
        structId = 'struct-tech-sr';
      } else if (emp.employmentType === 'Contract') {
        structId = 'struct-contract';
      }

      const struct = DEFAULT_STRUCTURES.find(s => s.id === structId);
      map[emp.id] = {
        structureId: structId,
        basicSalary: Number(emp.basicSalary) || (struct ? struct.benchmarkBasic : 40000),
        assignedAt: '2026-08-01'
      };
    });

    return map;
  }

  function loadBatches() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BATCHES);
      if (stored) {
        batches = JSON.parse(stored);
      } else {
        batches = seedDefaultBatches();
        saveBatches();
      }
    } catch (e) {
      batches = seedDefaultBatches();
    }
  }

  function saveBatches() {
    try {
      localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(batches));
    } catch (e) {
      console.warn('Failed to save payroll batches to LocalStorage:', e);
    }
  }

  /**
   * Seed realistic historical batches with immutable calculated snapshots
   */
  function seedDefaultBatches() {
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    if (employees.length === 0) return [];

    // Helper to build snapshot records
    function buildRecords(empList, overrideStatus) {
      return empList.map(emp => {
        const assignment = assignments[emp.id] || { structureId: 'struct-assoc', basicSalary: emp.basicSalary || 40000 };
        const calc = calculateSalary(assignment.basicSalary, assignment.structureId);
        return {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeInitials: emp.initials,
          designation: emp.designation,
          department: emp.department,
          branch: emp.branch,
          email: emp.email,
          basicSalary: calc.basicSalary,
          earnings: calc.earnings,
          deductions: calc.deductions,
          grossSalary: calc.grossSalary,
          totalDeductions: calc.totalDeductions,
          netSalary: calc.netSalary,
          paymentStatus: overrideStatus || 'Paid'
        };
      });
    }

    const activeEmps = employees.filter(e => e.status === 'Active');
    const blrEmps = activeEmps.filter(e => e.branch === 'Bengaluru HQ');

    const recsAug = buildRecords(activeEmps.slice(0, 18), 'Paid');
    const grossAug = recsAug.reduce((sum, r) => sum + r.grossSalary, 0);
    const dedAug = recsAug.reduce((sum, r) => sum + r.totalDeductions, 0);

    const recsSep = buildRecords(activeEmps, 'Paid');
    const grossSep = recsSep.reduce((sum, r) => sum + r.grossSalary, 0);
    const dedSep = recsSep.reduce((sum, r) => sum + r.totalDeductions, 0);

    const recsOct = buildRecords(blrEmps, 'Reviewed');
    const grossOct = recsOct.reduce((sum, r) => sum + r.grossSalary, 0);
    const dedOct = recsOct.reduce((sum, r) => sum + r.totalDeductions, 0);

    return [
      {
        id: 'BATCH-2026-08-ALL',
        month: 'August',
        year: 2026,
        period: 'August 2026',
        branch: 'ALL',
        branchName: 'All 12 Branches',
        status: 'Paid',
        employeeCount: recsAug.length,
        grossTotal: grossAug,
        deductionsTotal: dedAug,
        netTotal: grossAug - dedAug,
        createdAt: '2026-08-28T10:00:00Z',
        finalizedAt: '2026-08-30T17:30:00Z',
        paidAt: '2026-09-01T09:15:00Z',
        notes: 'Regular August nationwide payroll run. Bank transfer confirmed.',
        records: recsAug
      },
      {
        id: 'BATCH-2026-09-ALL',
        month: 'September',
        year: 2026,
        period: 'September 2026',
        branch: 'ALL',
        branchName: 'All 12 Branches',
        status: 'Paid',
        employeeCount: recsSep.length,
        grossTotal: grossSep,
        deductionsTotal: dedSep,
        netTotal: grossSep - dedSep,
        createdAt: '2026-09-28T11:00:00Z',
        finalizedAt: '2026-09-29T16:45:00Z',
        paidAt: '2026-10-01T09:30:00Z',
        notes: 'Regular September nationwide payroll run with performance bonus inclusion.',
        records: recsSep
      },
      {
        id: 'BATCH-2026-10-BLR',
        month: 'October',
        year: 2026,
        period: 'October 2026',
        branch: 'Bengaluru HQ',
        branchName: 'Bengaluru HQ',
        status: 'Reviewed',
        employeeCount: recsOct.length,
        grossTotal: grossOct,
        deductionsTotal: dedOct,
        netTotal: grossOct - dedOct,
        createdAt: '2026-10-10T14:20:00Z',
        finalizedAt: null,
        paidAt: null,
        notes: 'Pre-approval run for Bengaluru technology hub staff.',
        records: recsOct
      }
    ];
  }

  // =========================================================================
  // SALARY CALCULATION ENGINE
  // =========================================================================

  /**
   * Calculate salary breakdown given a basic salary and structure (or custom overrides)
   * Formula:
   * Gross Salary = Basic Salary + Total Allowances + Bonuses
   * Total Deductions = Sum of applicable deductions
   * Net Salary = Gross Salary - Total Deductions
   */
  function calculateSalary(basicSalary, structureId, customOverrides) {
    const basic = Math.max(0, Number(basicSalary) || 0);
    const struct = structures.find(s => s.id === structureId) || structures[0];
    const structComponents = (struct && struct.components) ? struct.components : {};

    const activeComps = components.filter(c => c.status === 'Active');
    const earnings = [];
    const deductions = [];

    // 1. Calculate Earnings
    let grossSalary = basic;

    // Add Basic as first earning row
    earnings.push({
      id: 'comp-basic',
      name: 'Basic Salary',
      code: 'BASIC',
      type: 'earning',
      amount: basic,
      rateDisplay: 'Fixed Base'
    });

    activeComps.filter(c => c.type === 'earning' && c.id !== 'comp-basic').forEach(comp => {
      let config = customOverrides && customOverrides[comp.id] ? customOverrides[comp.id] : structComponents[comp.id];
      let val = config ? Number(config.value) : Number(comp.defaultValue);
      let amountType = config && config.amountType ? config.amountType : comp.amountType;

      let calculatedAmount = 0;
      let rateDisplay = '';

      if (amountType === 'percentage') {
        calculatedAmount = Math.round((basic * val) / 100);
        rateDisplay = `${val}% of Basic`;
      } else {
        calculatedAmount = Math.round(val);
        rateDisplay = `₹${window.EmployeeHub.utils.formatNumber(val)}`;
      }

      grossSalary += calculatedAmount;

      earnings.push({
        id: comp.id,
        name: comp.name,
        code: comp.code || comp.name,
        type: 'earning',
        amount: calculatedAmount,
        rateDisplay
      });
    });

    // 2. Calculate Deductions (Gross is now known for gross-based deductions like TDS)
    let totalDeductions = 0;

    activeComps.filter(c => c.type === 'deduction').forEach(comp => {
      let config = customOverrides && customOverrides[comp.id] ? customOverrides[comp.id] : structComponents[comp.id];
      let val = config ? Number(config.value) : Number(comp.defaultValue);
      let amountType = config && config.amountType ? config.amountType : comp.amountType;

      let calculatedAmount = 0;
      let rateDisplay = '';

      if (amountType === 'percentage') {
        const base = comp.percentageBase === 'gross' ? grossSalary : basic;
        calculatedAmount = Math.round((base * val) / 100);
        rateDisplay = `${val}% of ${comp.percentageBase === 'gross' ? 'Gross' : 'Basic'}`;
      } else {
        calculatedAmount = Math.round(val);
        rateDisplay = `₹${window.EmployeeHub.utils.formatNumber(val)}`;
      }

      totalDeductions += calculatedAmount;

      deductions.push({
        id: comp.id,
        name: comp.name,
        code: comp.code || comp.name,
        type: 'deduction',
        amount: calculatedAmount,
        rateDisplay
      });
    });

    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
      basicSalary: basic,
      earnings,
      deductions,
      grossSalary,
      totalDeductions,
      netSalary
    };
  }

  // =========================================================================
  // PUBLIC CRUD & LOOKUPS
  // =========================================================================

  return {
    init: initStore,

    // Components
    getComponents() {
      if (components.length === 0) initStore();
      return JSON.parse(JSON.stringify(components));
    },
    getComponent(id) {
      if (components.length === 0) initStore();
      return components.find(c => c.id === id);
    },
    addComponent(compData) {
      if (!compData.name || !compData.name.trim()) throw new Error('Component name is required.');
      const id = 'comp-' + compData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) + '-' + Date.now().toString().slice(-4);
      
      const newComp = {
        id,
        name: compData.name.trim(),
        code: (compData.code || compData.name.slice(0, 4)).toUpperCase().trim(),
        type: compData.type === 'deduction' ? 'deduction' : 'earning',
        amountType: compData.amountType === 'percentage' ? 'percentage' : 'fixed',
        percentageBase: compData.amountType === 'percentage' ? (compData.percentageBase || 'basic') : null,
        defaultValue: Math.max(0, Number(compData.defaultValue) || 0),
        status: compData.status === 'Inactive' ? 'Inactive' : 'Active',
        isSystem: false,
        description: (compData.description || '').trim()
      };

      components.push(newComp);
      saveComponents();
      return newComp;
    },
    updateComponent(id, updatedData) {
      const index = components.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Component not found.');
      
      const current = components[index];
      components[index] = {
        ...current,
        name: updatedData.name ? updatedData.name.trim() : current.name,
        code: updatedData.code ? updatedData.code.trim().toUpperCase() : current.code,
        type: updatedData.type || current.type,
        amountType: updatedData.amountType || current.amountType,
        percentageBase: updatedData.amountType === 'percentage' ? (updatedData.percentageBase || current.percentageBase || 'basic') : null,
        defaultValue: updatedData.defaultValue !== undefined ? Math.max(0, Number(updatedData.defaultValue)) : current.defaultValue,
        status: updatedData.status || current.status,
        description: updatedData.description !== undefined ? updatedData.description.trim() : current.description
      };

      saveComponents();
      return components[index];
    },
    deleteComponent(id) {
      const comp = components.find(c => c.id === id);
      if (!comp) throw new Error('Component not found.');
      if (comp.isSystem) throw new Error('Core system components cannot be deleted. You can set status to Inactive instead.');

      components = components.filter(c => c.id !== id);
      saveComponents();
      return comp;
    },

    // Structures
    getStructures() {
      if (structures.length === 0) initStore();
      return JSON.parse(JSON.stringify(structures));
    },
    getStructure(id) {
      if (structures.length === 0) initStore();
      return structures.find(s => s.id === id);
    },
    addStructure(structData) {
      if (!structData.name || !structData.name.trim()) throw new Error('Structure name is required.');
      const id = 'struct-' + structData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15) + '-' + Date.now().toString().slice(-4);

      const newStruct = {
        id,
        name: structData.name.trim(),
        description: (structData.description || '').trim(),
        benchmarkBasic: Math.max(1000, Number(structData.benchmarkBasic) || 40000),
        components: structData.components || {},
        createdAt: new Date().toISOString().split('T')[0]
      };

      structures.push(newStruct);
      saveStructures();
      return newStruct;
    },
    updateStructure(id, updatedData) {
      const index = structures.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Structure not found.');

      structures[index] = {
        ...structures[index],
        name: updatedData.name ? updatedData.name.trim() : structures[index].name,
        description: updatedData.description !== undefined ? updatedData.description.trim() : structures[index].description,
        benchmarkBasic: updatedData.benchmarkBasic !== undefined ? Math.max(1000, Number(updatedData.benchmarkBasic)) : structures[index].benchmarkBasic,
        components: updatedData.components || structures[index].components
      };

      saveStructures();
      return structures[index];
    },
    duplicateStructure(id) {
      const src = structures.find(s => s.id === id);
      if (!src) throw new Error('Source structure not found.');

      const newId = 'struct-' + Date.now().toString().slice(-6);
      const copy = {
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        name: `${src.name} (Copy)`,
        createdAt: new Date().toISOString().split('T')[0]
      };

      structures.push(copy);
      saveStructures();
      return copy;
    },
    deleteStructure(id) {
      const index = structures.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Structure not found.');
      if (structures.length <= 1) throw new Error('Cannot delete the last remaining salary structure.');

      const deleted = structures.splice(index, 1)[0];
      saveStructures();
      return deleted;
    },

    // Employee Assignments
    getEmployeeSalary(empId) {
      if (Object.keys(assignments).length === 0) initStore();
      if (assignments[empId]) return assignments[empId];

      // Fallback: look up in employees
      const emp = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployee(empId) : null;
      const defaultStruct = structures[0] || DEFAULT_STRUCTURES[0];
      return {
        structureId: defaultStruct.id,
        basicSalary: emp ? emp.basicSalary : 40000,
        assignedAt: '2026-08-01'
      };
    },
    setEmployeeSalary(empId, data) {
      if (!empId) throw new Error('Employee ID is required.');
      assignments[empId] = {
        structureId: data.structureId || (structures[0] ? structures[0].id : 'struct-assoc'),
        basicSalary: Math.max(0, Number(data.basicSalary) || 40000),
        assignedAt: new Date().toISOString().split('T')[0]
      };

      // Also sync basic salary on employee record if dataStore is loaded
      if (window.EmployeeHub.dataStore) {
        try {
          window.EmployeeHub.dataStore.updateEmployee(empId, { basicSalary: assignments[empId].basicSalary });
        } catch (e) {
          // ignore if employee not yet in store
        }
      }

      saveAssignments();
      return assignments[empId];
    },
    getAssignedEmployeesCount(structId) {
      if (Object.keys(assignments).length === 0) initStore();
      return Object.values(assignments).filter(a => a.structureId === structId).length;
    },

    // Calculation Engine
    calculateSalary,

    // Batches
    getBatches() {
      if (batches.length === 0) initStore();
      return JSON.parse(JSON.stringify(batches));
    },
    getBatch(id) {
      if (batches.length === 0) initStore();
      return batches.find(b => b.id === id);
    },
    findDuplicateBatch(month, year, branch) {
      if (batches.length === 0) initStore();
      return batches.find(b => b.month.toLowerCase() === month.toLowerCase() && Number(b.year) === Number(year) && (b.branch === branch || (branch === 'ALL' && b.branch === 'ALL')));
    },
    createBatch(batchData) {
      const month = batchData.month || 'October';
      const year = Number(batchData.year) || 2026;
      const branch = batchData.branch || 'ALL';
      const branchName = branch === 'ALL' ? 'All 12 Branches' : branch;

      const codeSuffix = branch === 'ALL' ? 'ALL' : branch.slice(0, 3).toUpperCase();
      const id = `BATCH-${year}-${(new Date(`${month} 1, 2026`).getMonth() + 1).toString().padStart(2, '0')}-${codeSuffix}-${Date.now().toString().slice(-4)}`;

      const newBatch = {
        id,
        month,
        year,
        period: `${month} ${year}`,
        branch,
        branchName,
        status: batchData.status || 'Draft',
        employeeCount: batchData.records ? batchData.records.length : 0,
        grossTotal: batchData.grossTotal || 0,
        deductionsTotal: batchData.deductionsTotal || 0,
        netTotal: (batchData.grossTotal || 0) - (batchData.deductionsTotal || 0),
        createdAt: new Date().toISOString(),
        finalizedAt: batchData.status === 'Finalized' || batchData.status === 'Paid' ? new Date().toISOString() : null,
        paidAt: batchData.status === 'Paid' ? new Date().toISOString() : null,
        notes: batchData.notes || `Payroll run for ${month} ${year}`,
        records: batchData.records || []
      };

      batches.unshift(newBatch);
      saveBatches();
      return newBatch;
    },
    updateBatchStatus(batchId, newStatus) {
      const batch = batches.find(b => b.id === batchId);
      if (!batch) throw new Error('Payroll batch not found.');

      if (batch.status === 'Paid' && newStatus !== 'Paid') {
        throw new Error('Completed (Paid) payroll records are permanently archived and locked.');
      }

      batch.status = newStatus;
      if (newStatus === 'Finalized' && !batch.finalizedAt) {
        batch.finalizedAt = new Date().toISOString();
      }
      if (newStatus === 'Paid' && !batch.paidAt) {
        batch.paidAt = new Date().toISOString();
      }

      // Sync record statuses
      if (batch.records) {
        batch.records.forEach(r => { r.paymentStatus = newStatus; });
      }

      saveBatches();
      return batch;
    },
    deleteBatch(batchId) {
      const index = batches.findIndex(b => b.id === batchId);
      if (index === -1) throw new Error('Payroll batch not found.');

      const batch = batches[index];
      if (batch.status === 'Finalized' || batch.status === 'Paid') {
        throw new Error(`Cannot delete a ${batch.status} batch. Finalized payroll records are locked for audit integrity.`);
      }

      batches.splice(index, 1);
      saveBatches();
      return batch;
    },

    // Payslip Lookups
    getAllPayslips() {
      if (batches.length === 0) initStore();
      const payslips = [];
      batches.forEach(b => {
        if (b.records) {
          b.records.forEach(r => {
            payslips.push({
              ...r,
              batchId: b.id,
              period: b.period,
              batchStatus: b.status,
              createdAt: b.createdAt
            });
          });
        }
      });
      return payslips;
    },
    getPayslip(batchId, empId) {
      const batch = batches.find(b => b.id === batchId);
      if (!batch || !batch.records) return null;
      const rec = batch.records.find(r => r.employeeId === empId);
      if (!rec) return null;
      return {
        ...rec,
        batchId: batch.id,
        period: batch.period,
        batchStatus: batch.status,
        createdAt: batch.createdAt,
        finalizedAt: batch.finalizedAt,
        paidAt: batch.paidAt
      };
    },

    // Dashboard Analytics
    getDashboardMetrics() {
      if (batches.length === 0) initStore();

      // Recent finalized / paid batches or latest batch
      const latestBatch = batches[0];
      const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
      const activeEmployees = employees.filter(e => e.status === 'Active');

      // Calculate total monthly payroll based on latest run or active roster
      let totalMonthlyPayroll = 0;
      let totalDeductions = 0;
      let totalGross = 0;
      let employeesInPayroll = activeEmployees.length;

      if (latestBatch) {
        totalMonthlyPayroll = latestBatch.netTotal;
        totalDeductions = latestBatch.deductionsTotal;
        totalGross = latestBatch.grossTotal;
        employeesInPayroll = latestBatch.employeeCount;
      } else {
        activeEmployees.forEach(emp => {
          const s = calculateSalary(emp.basicSalary || 45000, 'struct-assoc');
          totalMonthlyPayroll += s.netSalary;
          totalDeductions += s.totalDeductions;
          totalGross += s.grossSalary;
        });
      }

      const averageSalary = employeesInPayroll > 0 ? Math.round(totalMonthlyPayroll / employeesInPayroll) : 0;

      // Pending batches: Draft or Reviewed
      const pendingBatchesCount = batches.filter(b => b.status === 'Draft' || b.status === 'Reviewed').length;

      // Paid vs Unpaid
      let paidTotal = 0;
      let unpaidTotal = 0;
      batches.forEach(b => {
        if (b.status === 'Paid') {
          paidTotal += b.netTotal;
        } else {
          unpaidTotal += b.netTotal;
        }
      });

      return {
        totalMonthlyPayroll,
        employeesInPayroll,
        averageSalary,
        totalDeductions,
        totalGross,
        pendingBatchesCount,
        paidTotal,
        unpaidTotal,
        batchesCount: batches.length
      };
    },

    // Reset fallback
    resetDemoData() {
      components = JSON.parse(JSON.stringify(DEFAULT_COMPONENTS));
      structures = JSON.parse(JSON.stringify(DEFAULT_STRUCTURES));
      assignments = seedDefaultAssignments();
      batches = seedDefaultBatches();
      saveComponents();
      saveStructures();
      saveAssignments();
      saveBatches();
    }
  };
})();
