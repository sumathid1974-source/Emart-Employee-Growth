/**
 * Attendance, Leave, Notification & Announcement Central Data Store
 * Namespace: window.EmployeeHub.attendanceStore
 * LocalStorage keys:
 *   - employeehub_attendance_records_v4
 *   - employeehub_attendance_settings_v4
 *   - employeehub_leave_types_v4
 *   - employeehub_leave_requests_v4
 *   - employeehub_announcements_v4
 *   - employeehub_notifications_v4
 *   - employeehub_notification_prefs_v4
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.attendanceStore = (function () {
  'use strict';

  const STORAGE_KEYS = {
    ATTENDANCE: 'employeehub_attendance_records_v4',
    SETTINGS: 'employeehub_attendance_settings_v4',
    LEAVE_TYPES: 'employeehub_leave_types_v4',
    LEAVE_REQUESTS: 'employeehub_leave_requests_v4',
    ANNOUNCEMENTS: 'employeehub_announcements_v4',
    NOTIFICATIONS: 'employeehub_notifications_v4',
    PREFERENCES: 'employeehub_notification_prefs_v4'
  };

  // Standard Attendance & Working Hours Settings (Demo)
  const DEFAULT_SETTINGS = {
    standardStartTime: '09:30',
    standardEndTime: '18:30',
    gracePeriodMinutes: 15,
    standardBreakMinutes: 60,
    expectedDailyHours: 8.0,
    workingDays: [1, 2, 3, 4, 5], // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
    holidays: [
      { date: '2026-01-26', name: 'Republic Day' },
      { date: '2026-08-15', name: 'Independence Day' },
      { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti' },
      { date: '2026-10-20', name: 'Dussehra / Vijayadashami' },
      { date: '2026-11-09', name: 'Diwali (Deepavali)' },
      { date: '2026-12-25', name: 'Christmas Day' }
    ]
  };

  // Default Configurable Leave Types
  const DEFAULT_LEAVE_TYPES = [
    {
      id: 'LT-CL',
      code: 'CL',
      name: 'Casual Leave',
      description: 'Short unplanned leave for personal or urgent domestic matters',
      type: 'Paid',
      annualQuota: 12,
      active: true,
      color: '#3b82f6'
    },
    {
      id: 'LT-SL',
      code: 'SL',
      name: 'Sick Leave',
      description: 'Leave for illness, medical appointments or recovery',
      type: 'Paid',
      annualQuota: 10,
      active: true,
      color: '#ef4444'
    },
    {
      id: 'LT-EL',
      code: 'EL',
      name: 'Earned / Annual Leave',
      description: 'Planned vacation or privilege leave accrued over service',
      type: 'Paid',
      annualQuota: 18,
      active: true,
      color: '#10b981'
    },
    {
      id: 'LT-LWP',
      code: 'LWP',
      name: 'Leave Without Pay',
      description: 'Unpaid extended leave approved on discretionary basis',
      type: 'Unpaid',
      annualQuota: 30,
      active: true,
      color: '#8b5cf6'
    }
  ];

  // Default Leave Requests (Pre-seeded for testing approval workflow & attendance sync)
  const DEFAULT_LEAVE_REQUESTS = [
    {
      id: 'LV-2026-001',
      employeeId: 'EMP-1002', // Amit Patel (Mumbai West)
      leaveTypeId: 'LT-EL',
      startDate: '2026-10-12',
      endDate: '2026-10-14',
      dayCount: 3,
      isHalfDay: false,
      reason: 'Family visit to Gujarat during festival holidays',
      status: 'Approved',
      submittedAt: '2026-10-05 11:30',
      reviewedBy: 'Rohan Deshmukh (Branch Head)',
      reviewedAt: '2026-10-06 14:15',
      reviewerComment: 'Approved. Amit has handed over critical sprint deliverables.'
    },
    {
      id: 'LV-2026-002',
      employeeId: 'EMP-1005', // Rahul Verma (Delhi NCR Hub)
      leaveTypeId: 'LT-SL',
      startDate: '2026-10-13',
      endDate: '2026-10-13',
      dayCount: 1,
      isHalfDay: false,
      reason: 'Severe viral flu and doctor consultation',
      status: 'Approved',
      submittedAt: '2026-10-12 20:45',
      reviewedBy: 'Ananya Saxena (Branch Head)',
      reviewedAt: '2026-10-13 08:30',
      reviewerComment: 'Get well soon. Please take rest.'
    },
    {
      id: 'LV-2026-003',
      employeeId: 'EMP-1001', // Priya Sharma (Bengaluru HQ)
      leaveTypeId: 'LT-CL',
      startDate: '2026-10-15',
      endDate: '2026-10-16',
      dayCount: 2,
      isHalfDay: false,
      reason: 'Attending sibling wedding ceremony in Mysore',
      status: 'Pending',
      submittedAt: '2026-10-11 16:20',
      reviewedBy: null,
      reviewedAt: null,
      reviewerComment: ''
    },
    {
      id: 'LV-2026-004',
      employeeId: 'EMP-1003', // Sunita Rao (Hyderabad Tech Park)
      leaveTypeId: 'LT-EL',
      startDate: '2026-10-22',
      endDate: '2026-10-23',
      dayCount: 2,
      isHalfDay: false,
      reason: 'Long weekend personal travel after Dussehra',
      status: 'Pending',
      submittedAt: '2026-10-13 10:00',
      reviewedBy: null,
      reviewedAt: null,
      reviewerComment: ''
    },
    {
      id: 'LV-2026-005',
      employeeId: 'EMP-1007', // Ankit Mehta (Ahmedabad)
      leaveTypeId: 'LT-CL',
      startDate: '2026-10-08',
      endDate: '2026-10-08',
      dayCount: 1,
      isHalfDay: false,
      reason: 'Bank loan paperwork and registrar office visit',
      status: 'Rejected',
      submittedAt: '2026-10-06 09:15',
      reviewedBy: 'Pooja Mehta (Branch Manager)',
      reviewedAt: '2026-10-07 10:00',
      reviewerComment: 'Quarterly client audit scheduled for this date. Please reschedule.'
    }
  ];

  // Default Company Announcements
  const DEFAULT_ANNOUNCEMENTS = [
    {
      id: 'ANN-2026-01',
      title: 'Diwali Festival Holiday & Annual Ex-Gratia Bonus',
      content: 'In celebration of Diwali, all EmployeeHub branches will observe official holidays on November 9 & 10, 2026. Annual festive bonuses will be credited along with October payroll disbursements.',
      category: 'Company News',
      targetAudience: 'all',
      targetBranchId: 'ALL',
      publishDate: '2026-10-10',
      expiryDate: '2026-11-15',
      status: 'Published',
      createdBy: 'Vikram Malhotra (Executive Director)'
    },
    {
      id: 'ANN-2026-02',
      title: 'Multibranch Hybrid Workplace & Attendance Regularization Policy',
      content: 'Starting October 15, all engineering and product teams are expected on-site 3 days a week. Attendance regularizations must be submitted via the portal within 48 hours of any check-in discrepancy.',
      category: 'Policy Update',
      targetAudience: 'all',
      targetBranchId: 'ALL',
      publishDate: '2026-10-08',
      expiryDate: '2026-12-31',
      status: 'Published',
      createdBy: 'Sunita Rao (HR Operations Lead)'
    },
    {
      id: 'ANN-2026-03',
      title: 'Bengaluru HQ Prestige Tech Park — Data Center Power Maintenance',
      content: 'Scheduled power maintenance is set for Sunday, October 18, 2026, from 02:00 to 08:00 IST at Bengaluru HQ. Local VPN gateway may experience intermittent failovers.',
      category: 'Urgent Notice',
      targetAudience: 'branch',
      targetBranchId: 'BLR-01',
      publishDate: '2026-10-12',
      expiryDate: '2026-10-19',
      status: 'Published',
      createdBy: 'Manish Joshi (DevOps Lead)'
    },
    {
      id: 'ANN-2026-04',
      title: 'Annual Corporate Health Checkup & Wellness Camp 2026',
      content: 'EmployeeHub has partnered with Apollo Clinics for free comprehensive annual health checkups across all 12 metro hubs. Registration is now open through your branch HR coordinator.',
      category: 'Company News',
      targetAudience: 'all',
      targetBranchId: 'ALL',
      publishDate: '2026-10-05',
      expiryDate: '2026-10-31',
      status: 'Published',
      createdBy: 'Kavita Krishnamurthy (HR Director)'
    },
    {
      id: 'ANN-2026-05',
      title: 'Q4 2026 Strategic Expansion & Campus Hiring Drive (Draft)',
      content: 'We are expanding our tier-2 branch hubs in Pune, Jaipur, and Chandigarh. Referral bonuses of ₹25,000 apply for Senior Backend and React engineers.',
      category: 'Company News',
      targetAudience: 'all',
      targetBranchId: 'ALL',
      publishDate: '2026-10-25',
      expiryDate: '2026-11-30',
      status: 'Draft',
      createdBy: 'Vikram Malhotra (Executive Director)'
    }
  ];

  // Default In-App Notifications
  const DEFAULT_NOTIFICATIONS = [
    {
      id: 'NTF-101',
      title: 'New Leave Request Submitted',
      message: 'Priya Sharma (EMP-1001) requested 2 days of Casual Leave (Oct 15 - Oct 16).',
      category: 'leave',
      timestamp: '2026-10-11 16:20',
      read: false,
      relatedEmployeeId: 'EMP-1001',
      relatedBranchId: 'BLR-01'
    },
    {
      id: 'NTF-102',
      title: 'Leave Request Approved',
      message: 'Amit Patel (EMP-1002) has been approved for 3 days of Earned Leave by Rohan Deshmukh.',
      category: 'leave',
      timestamp: '2026-10-06 14:15',
      read: true,
      relatedEmployeeId: 'EMP-1002',
      relatedBranchId: 'BOM-01'
    },
    {
      id: 'NTF-103',
      title: 'Attendance Exception: Late Arrival',
      message: 'Rajesh Kumar (EMP-1004) checked in at 10:14 AM (Grace period exceeded by 29 mins).',
      category: 'attendance',
      timestamp: '2026-10-13 10:15',
      read: false,
      relatedEmployeeId: 'EMP-1004',
      relatedBranchId: 'BLR-01'
    },
    {
      id: 'NTF-104',
      title: 'Company Announcement Published',
      message: 'New broadcast: "Diwali Festival Holiday & Annual Ex-Gratia Bonus" published company-wide.',
      category: 'announcement',
      timestamp: '2026-10-10 09:30',
      read: true,
      relatedEmployeeId: null,
      relatedBranchId: 'ALL'
    },
    {
      id: 'NTF-105',
      title: 'Payroll Batch Status Updated',
      message: 'Batch BATCH-2026-10-ALL-0344 was moved to Reviewed by Finance Operations.',
      category: 'payroll',
      timestamp: '2026-10-13 12:40',
      read: false,
      relatedEmployeeId: null,
      relatedBranchId: 'ALL'
    },
    {
      id: 'NTF-106',
      title: 'Upcoming Approved Leave Alert',
      message: 'Rahul Verma (EMP-1005) is On Approved Leave today (Oct 13, 2026).',
      category: 'leave',
      timestamp: '2026-10-13 08:35',
      read: false,
      relatedEmployeeId: 'EMP-1005',
      relatedBranchId: 'DEL-01'
    }
  ];

  const DEFAULT_PREFERENCES = {
    attendance: true,
    leave: true,
    payroll: true,
    announcement: true
  };

  /**
   * Helper to format Date to YYYY-MM-DD
   */
  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generate realistic 7-day seed attendance records (Oct 7 - Oct 13, 2026)
   */
  function generateSeedAttendance() {
    const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const records = [];
    const dates = [
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10', // Saturday (some present / off)
      '2026-10-11', // Sunday (weekend / holiday)
      '2026-10-12',
      '2026-10-13'  // Today
    ];

    let recIdCounter = 1000;

    dates.forEach(date => {
      const dObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dObj.getDay(); // 0=Sun, 6=Sat
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;

      employees.forEach((emp, empIdx) => {
        recIdCounter++;
        const id = `ATT-${recIdCounter}`;

        // Check if employee is on approved leave on this date
        const isApprovedLeave = (emp.id === 'EMP-1002' && (date === '2026-10-12' || date === '2026-10-13' || date === '2026-10-14')) ||
                                (emp.id === 'EMP-1005' && date === '2026-10-13');

        if (isSunday) {
          records.push({
            id,
            employeeId: emp.id,
            date,
            checkIn: '',
            checkOut: '',
            breakMinutes: 0,
            workHours: 0,
            status: 'Holiday',
            notes: 'Weekly Off (Sunday)'
          });
          return;
        }

        if (isApprovedLeave) {
          records.push({
            id,
            employeeId: emp.id,
            date,
            checkIn: '',
            checkOut: '',
            breakMinutes: 0,
            workHours: 0,
            status: 'On leave',
            notes: 'Approved Leave (Synced via Leave Management)'
          });
          return;
        }

        if (isSaturday) {
          // Half of employees work flex/off on Saturday
          if (empIdx % 2 === 0) {
            records.push({
              id,
              employeeId: emp.id,
              date,
              checkIn: '',
              checkOut: '',
              breakMinutes: 0,
              workHours: 0,
              status: 'Holiday',
              notes: 'Alternate Saturday Off'
            });
          } else {
            records.push({
              id,
              employeeId: emp.id,
              date,
              checkIn: '09:40',
              checkOut: '14:30',
              breakMinutes: 30,
              workHours: 4.3,
              status: 'Half-day',
              notes: 'Weekend Half-Day Shift'
            });
          }
          return;
        }

        // Regular Weekdays: realistic distribution
        // Emp 4 is Late today (Oct 13)
        if (emp.id === 'EMP-1004' && date === '2026-10-13') {
          records.push({
            id,
            employeeId: emp.id,
            date,
            checkIn: '10:14',
            checkOut: '19:15',
            breakMinutes: 60,
            workHours: 8.0,
            status: 'Late',
            notes: 'Traffic delay on Outer Ring Road'
          });
        } else if (emp.id === 'EMP-1008' && (date === '2026-10-09' || date === '2026-10-13')) {
          // Occasional Absent
          records.push({
            id,
            employeeId: emp.id,
            date,
            checkIn: '',
            checkOut: '',
            breakMinutes: 0,
            workHours: 0,
            status: 'Absent',
            notes: 'Unplanned absence / sick'
          });
        } else if (empIdx % 7 === 0 && date === '2026-10-08') {
          records.push({
            id,
            employeeId: emp.id,
            date,
            checkIn: '09:55',
            checkOut: '18:50',
            breakMinutes: 60,
            workHours: 7.9,
            status: 'Late',
            notes: 'Late arrival by 10 mins beyond grace'
          });
        } else if (empIdx % 9 === 0 && date === '2026-10-12') {
          records.push({
            id,
            employeeId: emp.id,
            date,
            checkIn: '09:20',
            checkOut: '14:00',
            breakMinutes: 30,
            workHours: 4.2,
            status: 'Half-day',
            notes: 'Personal half-day permission'
          });
        } else {
          // Standard Present
          const inMins = 15 + (empIdx % 20); // 09:15 to 09:35
          const inStr = `09:${String(inMins).padStart(2, '0')}`;
          const outStr = `18:${String(30 + (empIdx % 15)).padStart(2, '0')}`;
          records.push({
            id,
            employeeId: emp.id,
            date,
            checkIn: inStr,
            checkOut: outStr,
            breakMinutes: 60,
            workHours: 8.2,
            status: inMins > 45 ? 'Late' : 'Present',
            notes: 'Standard biometric check-in'
          });
        }
      });
    });

    return records;
  }

  // =========================================================================
  // INITIALIZATION & SAFE LOCALSTORAGE
  // =========================================================================

  function getStored(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.warn('Storage read failed for', key, e);
      return defaultVal;
    }
  }

  function setStored(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage write failed for', key, e);
    }
  }

  function init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setStored(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVE_TYPES)) {
      setStored(STORAGE_KEYS.LEAVE_TYPES, DEFAULT_LEAVE_TYPES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
      setStored(STORAGE_KEYS.LEAVE_REQUESTS, DEFAULT_LEAVE_REQUESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      setStored(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      setStored(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PREFERENCES)) {
      setStored(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      const seeds = generateSeedAttendance();
      setStored(STORAGE_KEYS.ATTENDANCE, seeds);
    }
  }

  // =========================================================================
  // CALCULATION UTILITIES
  // =========================================================================

  /**
   * Calculate working hours from check-in and check-out strings ("HH:MM")
   */
  function calculateWorkingHours(checkIn, checkOut, breakMinutes = 60) {
    if (!checkIn || !checkOut) return 0;
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);

    const inTotal = inH * 60 + inM;
    const outTotal = outH * 60 + outM;

    if (outTotal <= inTotal) return 0; // Check-out must follow check-in

    const diffMinutes = Math.max(0, (outTotal - inTotal) - (Number(breakMinutes) || 0));
    return Number((diffMinutes / 60).toFixed(2));
  }

  /**
   * Determine attendance status based on times and settings
   */
  function determineStatus(checkIn, checkOut, breakMins = 60) {
    if (!checkIn && !checkOut) return 'Absent';

    const settings = getAttendanceSettings();
    const [stdH, stdM] = (settings.standardStartTime || '09:30').split(':').map(Number);
    const graceMins = Number(settings.gracePeriodMinutes) || 15;
    const thresholdMinutes = stdH * 60 + stdM + graceMins;

    const [inH, inM] = checkIn.split(':').map(Number);
    const actualInMinutes = inH * 60 + inM;

    const hours = calculateWorkingHours(checkIn, checkOut, breakMins);

    if (hours > 0 && hours < 5.0) {
      return 'Half-day';
    }

    if (actualInMinutes > thresholdMinutes) {
      return 'Late';
    }

    return 'Present';
  }

  /**
   * Check if date is a non-working day or holiday
   */
  function isNonWorkingDate(dateStr) {
    const settings = getAttendanceSettings();
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();

    // Check weekly off
    const workingDays = settings.workingDays || [1, 2, 3, 4, 5];
    if (!workingDays.includes(day)) return true;

    // Check holiday list
    const holidays = settings.holidays || [];
    if (holidays.some(h => h.date === dateStr)) return true;

    return false;
  }

  /**
   * Calculate working leave days between start and end date (inclusive)
   */
  function calculateLeaveDays(startDate, endDate, isHalfDay = false) {
    if (!startDate || !endDate) return 0;
    if (isHalfDay) return 0.5;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    if (end < start) return 0;

    let count = 0;
    const curr = new Date(start);

    while (curr <= end) {
      const dateStr = formatDate(curr);
      if (!isNonWorkingDate(dateStr)) {
        count++;
      }
      curr.setDate(curr.getDate() + 1);
    }

    return count;
  }

  // =========================================================================
  // ATTENDANCE METHODS
  // =========================================================================

  function getAttendanceRecords(filter = {}) {
    const list = getStored(STORAGE_KEYS.ATTENDANCE, []);
    return list.filter(item => {
      if (filter.employeeId && item.employeeId !== filter.employeeId) return false;
      if (filter.date && item.date !== filter.date) return false;
      if (filter.startDate && item.date < filter.startDate) return false;
      if (filter.endDate && item.date > filter.endDate) return false;
      if (filter.status && filter.status !== 'ALL' && item.status !== filter.status) return false;
      return true;
    });
  }

  function saveAttendanceRecord(record) {
    const list = getStored(STORAGE_KEYS.ATTENDANCE, []);
    const idx = list.findIndex(r => r.employeeId === record.employeeId && r.date === record.date);

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record };
    } else {
      record.id = record.id || `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      list.push(record);
    }

    setStored(STORAGE_KEYS.ATTENDANCE, list);
    return record;
  }

  function bulkSaveAttendance(records) {
    const list = getStored(STORAGE_KEYS.ATTENDANCE, []);

    records.forEach(newRec => {
      const idx = list.findIndex(r => r.employeeId === newRec.employeeId && r.date === newRec.date);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...newRec };
      } else {
        newRec.id = newRec.id || `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        list.push(newRec);
      }
    });

    setStored(STORAGE_KEYS.ATTENDANCE, list);
    return true;
  }

  function deleteAttendanceRecord(id) {
    const list = getStored(STORAGE_KEYS.ATTENDANCE, []);
    const filtered = list.filter(r => r.id !== id);
    setStored(STORAGE_KEYS.ATTENDANCE, filtered);
    return true;
  }

  /**
   * Compute aggregated attendance stats for a specific date and branch
   */
  function getAttendanceStats(dateStr = '2026-10-13', branchName = 'ALL') {
    const allEmployees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
    const activeEmployees = allEmployees.filter(e => e.status === 'Active');

    const filteredEmployees = branchName === 'ALL'
      ? activeEmployees
      : activeEmployees.filter(e => e.branch === branchName);

    const empIdSet = new Set(filteredEmployees.map(e => e.id));
    const records = getAttendanceRecords({ date: dateStr }).filter(r => empIdSet.has(r.employeeId));

    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let onLeave = 0;
    let holiday = 0;

    records.forEach(r => {
      if (r.status === 'Present') present++;
      else if (r.status === 'Late') { present++; late++; }
      else if (r.status === 'Half-day') { present += 0.5; halfDay++; }
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'On leave') onLeave++;
      else if (r.status === 'Holiday') holiday++;
    });

    const totalEmployees = filteredEmployees.length;
    // Employees who don't have a record yet default to Unmarked / Absent
    const unmarked = Math.max(0, totalEmployees - records.length);
    if (unmarked > 0 && !isNonWorkingDate(dateStr)) {
      absent += unmarked;
    }

    const workingHeadcount = totalEmployees - holiday;
    const attendancePercentage = workingHeadcount > 0
      ? Math.min(100, Math.round(((present) / workingHeadcount) * 100))
      : 0;

    return {
      date: dateStr,
      branch: branchName,
      totalActive: totalEmployees,
      present,
      absent,
      late,
      halfDay,
      onLeave,
      holiday,
      unmarked,
      attendancePercentage
    };
  }

  // =========================================================================
  // LEAVE MANAGEMENT METHODS
  // =========================================================================

  function getLeaveTypes() {
    return getStored(STORAGE_KEYS.LEAVE_TYPES, DEFAULT_LEAVE_TYPES);
  }

  function saveLeaveType(type) {
    const types = getLeaveTypes();
    const idx = types.findIndex(t => t.id === type.id);
    if (idx >= 0) {
      types[idx] = { ...types[idx], ...type };
    } else {
      type.id = type.id || `LT-${Date.now().toString(36).toUpperCase()}`;
      types.push(type);
    }
    setStored(STORAGE_KEYS.LEAVE_TYPES, types);
    return type;
  }

  function getLeaveRequests(filter = {}) {
    const list = getStored(STORAGE_KEYS.LEAVE_REQUESTS, DEFAULT_LEAVE_REQUESTS);
    return list.filter(item => {
      if (filter.employeeId && item.employeeId !== filter.employeeId) return false;
      if (filter.status && filter.status !== 'ALL' && item.status !== filter.status) return false;
      if (filter.leaveTypeId && filter.leaveTypeId !== 'ALL' && item.leaveTypeId !== filter.leaveTypeId) return false;
      return true;
    });
  }

  /**
   * Calculate leave balance for an employee across all types or a specific type
   */
  function getEmployeeLeaveBalance(employeeId, leaveTypeId = null) {
    const types = getLeaveTypes();
    const requests = getLeaveRequests({ employeeId });

    const balanceMap = {};

    types.forEach(t => {
      balanceMap[t.id] = {
        typeId: t.id,
        code: t.code,
        name: t.name,
        allocated: t.annualQuota,
        approvedUsed: 0,
        pending: 0,
        remaining: t.annualQuota,
        isUnpaid: t.type === 'Unpaid'
      };
    });

    requests.forEach(req => {
      if (!balanceMap[req.leaveTypeId]) return;
      if (req.status === 'Approved') {
        balanceMap[req.leaveTypeId].approvedUsed += req.dayCount;
      } else if (req.status === 'Pending') {
        balanceMap[req.leaveTypeId].pending += req.dayCount;
      }
    });

    Object.values(balanceMap).forEach(b => {
      b.remaining = Math.max(0, b.allocated - b.approvedUsed);
    });

    if (leaveTypeId) {
      return balanceMap[leaveTypeId] || null;
    }
    return balanceMap;
  }

  /**
   * Check for overlapping leave requests for an employee
   */
  function checkLeaveOverlap(employeeId, startDate, endDate, excludeRequestId = null) {
    const requests = getLeaveRequests({ employeeId });
    return requests.find(r => {
      if (excludeRequestId && r.id === excludeRequestId) return false;
      if (r.status === 'Rejected' || r.status === 'Cancelled') return false;
      return (startDate <= r.endDate && endDate >= r.startDate);
    });
  }

  /**
   * Submit a new leave request
   */
  function submitLeaveRequest(request) {
    const requests = getStored(STORAGE_KEYS.LEAVE_REQUESTS, DEFAULT_LEAVE_REQUESTS);

    request.id = request.id || `LV-2026-${String(requests.length + 1).padStart(3, '0')}`;
    request.submittedAt = request.submittedAt || new Date().toISOString().replace('T', ' ').slice(0, 16);
    request.status = request.status || 'Pending';
    request.reviewedBy = null;
    request.reviewedAt = null;
    request.reviewerComment = '';

    requests.unshift(request);
    setStored(STORAGE_KEYS.LEAVE_REQUESTS, requests);

    // Create Notification for Admin/Branch Manager
    const employee = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployeeById(request.employeeId) : null;
    const leaveTypes = getLeaveTypes();
    const lType = leaveTypes.find(t => t.id === request.leaveTypeId);

    addNotification({
      title: 'New Leave Request Received',
      message: `${employee ? employee.name : request.employeeId} applied for ${request.dayCount} day(s) of ${lType ? lType.name : 'Leave'} (${request.startDate} to ${request.endDate}).`,
      category: 'leave',
      relatedEmployeeId: request.employeeId,
      relatedBranchId: employee ? employee.branch : 'ALL'
    });

    return request;
  }

  /**
   * Update leave request status (Approve, Reject, Cancel)
   * On Approve: Automatically updates Attendance Records to 'On leave'
   */
  function updateLeaveRequestStatus(requestId, newStatus, reviewerComment = '', reviewerName = 'Vikram Malhotra (Admin)') {
    const requests = getStored(STORAGE_KEYS.LEAVE_REQUESTS, DEFAULT_LEAVE_REQUESTS);
    const req = requests.find(r => r.id === requestId);
    if (!req) return null;

    const previousStatus = req.status;
    req.status = newStatus;
    req.reviewerComment = reviewerComment;
    req.reviewedBy = reviewerName;
    req.reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setStored(STORAGE_KEYS.LEAVE_REQUESTS, requests);

    const employee = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployeeById(req.employeeId) : null;
    const empName = employee ? employee.name : req.employeeId;

    // ATTENDANCE INTEGRATION:
    if (newStatus === 'Approved') {
      syncApprovedLeaveToAttendance(req);

      addNotification({
        title: 'Leave Request Approved',
        message: `Leave request for ${empName} (${req.dayCount} days, ${req.startDate} to ${req.endDate}) has been approved.`,
        category: 'leave',
        relatedEmployeeId: req.employeeId,
        relatedBranchId: employee ? employee.branch : 'ALL'
      });
    } else if (newStatus === 'Rejected') {
      addNotification({
        title: 'Leave Request Rejected',
        message: `Leave request for ${empName} was rejected. Reason: ${reviewerComment || 'Operational priorities'}.`,
        category: 'leave',
        relatedEmployeeId: req.employeeId,
        relatedBranchId: employee ? employee.branch : 'ALL'
      });
    }

    return req;
  }

  /**
   * Synchronize an approved leave request into attendance records
   */
  function syncApprovedLeaveToAttendance(leaveReq) {
    const start = new Date(leaveReq.startDate + 'T00:00:00');
    const end = new Date(leaveReq.endDate + 'T00:00:00');
    const curr = new Date(start);

    while (curr <= end) {
      const dateStr = formatDate(curr);
      // Skip non-working days & holidays
      if (!isNonWorkingDate(dateStr)) {
        saveAttendanceRecord({
          employeeId: leaveReq.employeeId,
          date: dateStr,
          checkIn: '',
          checkOut: '',
          breakMinutes: 0,
          workHours: 0,
          status: 'On leave',
          notes: `Approved Leave (${leaveReq.id}): ${leaveReq.reason || 'Personal'}`
        });
      }
      curr.setDate(curr.getDate() + 1);
    }
  }

  // =========================================================================
  // ANNOUNCEMENTS
  // =========================================================================

  function getAnnouncements(filter = {}) {
    const list = getStored(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    return list.filter(item => {
      if (filter.status && filter.status !== 'ALL' && item.status !== filter.status) return false;
      if (filter.category && filter.category !== 'ALL' && item.category !== filter.category) return false;
      if (filter.branch && filter.branch !== 'ALL') {
        if (item.targetAudience === 'branch' && item.targetBranchId !== filter.branch) return false;
      }
      return true;
    });
  }

  function saveAnnouncement(announcement) {
    const list = getStored(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    const isNew = !announcement.id;

    if (!isNew) {
      const idx = list.findIndex(a => a.id === announcement.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...announcement };
      } else {
        list.push(announcement);
      }
    } else {
      announcement.id = `ANN-${new Date().getFullYear()}-${String(list.length + 1).padStart(2, '0')}`;
      list.unshift(announcement);
    }

    setStored(STORAGE_KEYS.ANNOUNCEMENTS, list);

    // If published, trigger in-app notification
    if (announcement.status === 'Published') {
      addNotification({
        title: `Announcement: ${announcement.title}`,
        message: announcement.content.length > 120 ? announcement.content.slice(0, 117) + '...' : announcement.content,
        category: 'announcement',
        relatedEmployeeId: null,
        relatedBranchId: announcement.targetAudience === 'branch' ? announcement.targetBranchId : 'ALL'
      });
    }

    return announcement;
  }

  function deleteAnnouncement(id) {
    const list = getStored(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    const filtered = list.filter(a => a.id !== id);
    setStored(STORAGE_KEYS.ANNOUNCEMENTS, filtered);
    return true;
  }

  // =========================================================================
  // NOTIFICATION METHODS
  // =========================================================================

  function getNotifications(filter = {}) {
    const list = getStored(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const prefs = getNotificationPreferences();

    return list.filter(n => {
      // Respect notification category preferences
      if (n.category && prefs[n.category] === false) return false;

      if (filter.category && filter.category !== 'ALL' && n.category !== filter.category) return false;
      if (filter.readState === 'unread' && n.read) return false;
      if (filter.readState === 'read' && !n.read) return false;
      if (filter.employeeId && n.relatedEmployeeId && n.relatedEmployeeId !== filter.employeeId) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      }
      return true;
    });
  }

  function addNotification(notif) {
    const list = getStored(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    notif.id = notif.id || `NTF-${Date.now()}`;
    notif.timestamp = notif.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 16);
    notif.read = false;

    list.unshift(notif);
    // Keep max 50 notifications in demo storage
    if (list.length > 50) list.pop();

    setStored(STORAGE_KEYS.NOTIFICATIONS, list);

    // Dispatch custom event to trigger badge updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('employeehub:notification-added', { detail: notif }));
    }
    return notif;
  }

  function markNotificationRead(id) {
    const list = getStored(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const notif = list.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, list);
    }
    return true;
  }

  function markAllNotificationsRead() {
    const list = getStored(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    list.forEach(n => { n.read = true; });
    setStored(STORAGE_KEYS.NOTIFICATIONS, list);
    return true;
  }

  function deleteNotification(id) {
    const list = getStored(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const filtered = list.filter(n => n.id !== id);
    setStored(STORAGE_KEYS.NOTIFICATIONS, filtered);
    return true;
  }

  function getNotificationPreferences() {
    return getStored(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
  }

  function saveNotificationPreferences(prefs) {
    setStored(STORAGE_KEYS.PREFERENCES, prefs);
    return prefs;
  }

  // =========================================================================
  // SETTINGS & HOLIDAYS
  // =========================================================================

  function getAttendanceSettings() {
    return getStored(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  function saveAttendanceSettings(settings) {
    setStored(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  }

  function addHoliday(holiday) {
    const settings = getAttendanceSettings();
    settings.holidays = settings.holidays || [];
    settings.holidays.push(holiday);
    settings.holidays.sort((a, b) => a.date.localeCompare(b.date));
    saveAttendanceSettings(settings);
    return holiday;
  }

  function removeHoliday(dateStr) {
    const settings = getAttendanceSettings();
    settings.holidays = (settings.holidays || []).filter(h => h.date !== dateStr);
    saveAttendanceSettings(settings);
    return true;
  }

  return {
    init,
    // Attendance
    getAttendanceRecords,
    saveAttendanceRecord,
    bulkSaveAttendance,
    deleteAttendanceRecord,
    getAttendanceStats,
    calculateWorkingHours,
    determineStatus,
    isNonWorkingDate,
    calculateLeaveDays,
    // Leave Management
    getLeaveTypes,
    saveLeaveType,
    getLeaveRequests,
    submitLeaveRequest,
    updateLeaveRequestStatus,
    getEmployeeLeaveBalance,
    checkLeaveOverlap,
    // Announcements
    getAnnouncements,
    saveAnnouncement,
    deleteAnnouncement,
    // Notifications
    getNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    getNotificationPreferences,
    saveNotificationPreferences,
    // Settings & Calendar
    getAttendanceSettings,
    saveAttendanceSettings,
    addHoliday,
    removeHoliday
  };
})();
