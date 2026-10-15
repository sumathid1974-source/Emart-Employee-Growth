/**
 * Comprehensive Enterprise Mock Datasets
 * Namespace: window.EmployeeHub.mockData
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.mockData = (function () {
  'use strict';

  // Summary statistics for Dashboard Overview
  const summaryStats = {
    totalBranches: {
      value: 12,
      activeCount: 10,
      inactiveCount: 2,
      metaText: "10 active across 8 states",
      trendText: "+2 branches this year",
      trendType: "neutral"
    },
    totalEmployees: {
      value: 1248,
      metaText: "1,198 in previous month",
      trendText: "+4.2% MoM growth",
      trendType: "up"
    },
    promotionCandidates: {
      value: 86,
      metaText: "Performance rating 4 or 5",
      trendText: "Top 6.9% of workforce",
      trendType: "neutral"
    },
    monthlyPayroll: {
      value: 4875000,
      formatted: "₹48,75,000",
      metaText: "Disbursed for Oct 2026",
      trendText: "+2.8% vs Sep 2026",
      trendType: "up"
    }
  };

  // 12 Branches across India
  const branches = [
    {
      id: "BR-BLR-01",
      name: "Bengaluru HQ",
      code: "BLR-01",
      city: "Bengaluru",
      state: "Karnataka",
      address: "Prestige Tech Park, Marathahalli Outer Ring Rd, Bengaluru 560103",
      manager: "Kavita Krishnamurthy",
      email: "blr.branch@employeehub.demo",
      phone: "+91 80 4123 9001",
      employeeCount: 380,
      monthlyPayroll: 1520000,
      status: "Active",
      departments: ["Engineering", "Product", "HR", "Finance", "Legal"]
    },
    {
      id: "BR-BOM-01",
      name: "Mumbai West",
      code: "BOM-01",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Bandra Kurla Complex (BKC), Tower 3, Mumbai 400051",
      manager: "Rohan Deshmukh",
      email: "mumbai.branch@employeehub.demo",
      phone: "+91 22 2654 8812",
      employeeCount: 245,
      monthlyPayroll: 980000,
      status: "Active",
      departments: ["Operations", "Finance", "Sales", "Customer Success"]
    },
    {
      id: "BR-DEL-01",
      name: "Delhi NCR Hub",
      code: "DEL-01",
      city: "Gurugram",
      state: "Haryana",
      address: "Cyber City, DLF Phase 2, Sector 24, Gurugram 122002",
      manager: "Ananya Saxena",
      email: "delhi.branch@employeehub.demo",
      phone: "+91 124 456 7890",
      employeeCount: 210,
      monthlyPayroll: 840000,
      status: "Active",
      departments: ["Government Affairs", "Sales", "Engineering", "Operations"]
    },
    {
      id: "BR-HYD-01",
      name: "Hyderabad Tech Park",
      code: "HYD-01",
      city: "Hyderabad",
      state: "Telangana",
      address: "HITEC City, Madhapur, Hyderabad 500081",
      manager: "Suresh Reddy",
      email: "hyd.branch@employeehub.demo",
      phone: "+91 40 6789 2341",
      employeeCount: 175,
      monthlyPayroll: 680000,
      status: "Active",
      departments: ["Cloud Infrastructure", "Security", "Engineering"]
    },
    {
      id: "BR-MAA-01",
      name: "Chennai Central",
      code: "MAA-01",
      city: "Chennai",
      state: "Tamil Nadu",
      address: "Tidel Park, Rajiv Gandhi Salai, Taramani, Chennai 600113",
      manager: "Venkatesh Subramanian",
      email: "chennai.branch@employeehub.demo",
      phone: "+91 44 2254 1120",
      employeeCount: 120,
      monthlyPayroll: 475000,
      status: "Active",
      departments: ["QA & Testing", "Engineering", "HR Operations"]
    },
    {
      id: "BR-PNQ-01",
      name: "Pune Hinjewadi",
      code: "PNQ-01",
      city: "Pune",
      state: "Maharashtra",
      address: "Rajiv Gandhi Infotech Park, Phase 1, Hinjewadi, Pune 411057",
      manager: "Manish Joshi",
      email: "pune.branch@employeehub.demo",
      phone: "+91 20 6678 3344",
      employeeCount: 78,
      monthlyPayroll: 260000,
      status: "Active",
      departments: ["DevOps", "Data Science", "Engineering"]
    },
    {
      id: "BR-CCU-01",
      name: "Kolkata East",
      code: "CCU-01",
      city: "Kolkata",
      state: "West Bengal",
      address: "Sector V, Salt Lake City, Electronic Complex, Kolkata 700091",
      manager: "Subhashis Banerjee",
      email: "kolkata.branch@employeehub.demo",
      phone: "+91 33 2357 9081",
      employeeCount: 40,
      monthlyPayroll: 120000,
      status: "Active",
      departments: ["Technical Support", "BPO & Operations"]
    },
    {
      id: "BR-AMD-01",
      name: "Ahmedabad West",
      code: "AMD-01",
      city: "Ahmedabad",
      state: "Gujarat",
      address: "SG Highway, Prahlad Nagar Trade Center, Ahmedabad 380015",
      manager: "Bhavin Shah",
      email: "ahmedabad.branch@employeehub.demo",
      phone: "+91 79 4001 2233",
      employeeCount: 0,
      monthlyPayroll: 0,
      status: "Inactive",
      departments: ["Operations (Upcoming Q1)"]
    },
    {
      id: "BR-JAI-01",
      name: "Jaipur Tech Hub",
      code: "JAI-01",
      city: "Jaipur",
      state: "Rajasthan",
      address: "Mahindra World City, SEZ Zone, Jaipur 302037",
      manager: "Narendra Singh",
      email: "jaipur.branch@employeehub.demo",
      phone: "+91 141 398 7654",
      employeeCount: 0,
      monthlyPayroll: 0,
      status: "Inactive",
      departments: ["Customer Support (Site Readiness)"]
    },
    {
      id: "BR-COK-01",
      name: "Kochi Infopark",
      code: "COK-01",
      city: "Kochi",
      state: "Kerala",
      address: "Infopark Phase 2, Kakkanad, Kochi 682042",
      manager: "Mathew Thomas",
      email: "kochi.branch@employeehub.demo",
      phone: "+91 484 298 1234",
      employeeCount: 0,
      monthlyPayroll: 0,
      status: "Inactive",
      departments: ["AI Lab (Commissioning)"]
    },
    {
      id: "BR-IXC-01",
      name: "Chandigarh IT Park",
      code: "IXC-01",
      city: "Chandigarh",
      state: "Punjab/UT",
      address: "Rajiv Gandhi Chandigarh Technology Park, Kishangarh 160101",
      manager: "Gurpreet Kaur",
      email: "chandigarh.branch@employeehub.demo",
      phone: "+91 172 505 4321",
      employeeCount: 0,
      monthlyPayroll: 0,
      status: "Inactive",
      departments: ["Design Lab (Upcoming)"]
    },
    {
      id: "BR-IDR-01",
      name: "Indore Super Corridor",
      code: "IDR-01",
      city: "Indore",
      state: "Madhya Pradesh",
      address: "Super Corridor, Financial City Campus, Indore 452005",
      manager: "Alok Agrawal",
      email: "indore.branch@employeehub.demo",
      phone: "+91 731 422 6677",
      employeeCount: 0,
      monthlyPayroll: 0,
      status: "Inactive",
      departments: ["Tier-2 Operations Hub"]
    }
  ];

  // Monthly Payroll History (6 Months)
  const payrollHistory = [
    { month: "May 2026", amount: 4420000, formatted: "₹44.20 Lakhs", headcount: 1140 },
    { month: "Jun 2026", amount: 4510000, formatted: "₹45.10 Lakhs", headcount: 1162 },
    { month: "Jul 2026", amount: 4630000, formatted: "₹46.30 Lakhs", headcount: 1190 },
    { month: "Aug 2026", amount: 4700000, formatted: "₹47.00 Lakhs", headcount: 1215 },
    { month: "Sep 2026", amount: 4740000, formatted: "₹47.40 Lakhs", headcount: 1228 },
    { month: "Oct 2026", amount: 4875000, formatted: "₹48.75 Lakhs", headcount: 1248 }
  ];

  // Promotion candidates preview (ratings 4 or 5)
  const promotionCandidates = [
    {
      id: "EMP-1024",
      name: "Priya Sharma",
      initials: "PS",
      designation: "Staff Software Engineer",
      department: "Engineering",
      branch: "Bengaluru HQ",
      rating: 5.0,
      reviewDate: "10 Oct 2026",
      status: "Recommended for Promotion",
      nextRole: "Principal Engineer (L6)",
      reviewer: "Kavita Krishnamurthy"
    },
    {
      id: "EMP-1089",
      name: "Amit Patel",
      initials: "AP",
      designation: "Senior Product Manager",
      department: "Product",
      branch: "Mumbai West",
      rating: 4.8,
      reviewDate: "08 Oct 2026",
      status: "Recommended for Promotion",
      nextRole: "Director of Product",
      reviewer: "Rohan Deshmukh"
    },
    {
      id: "EMP-1142",
      name: "Sunita Rao",
      initials: "SR",
      designation: "HR Operations Lead",
      department: "Human Resources",
      branch: "Hyderabad Tech Park",
      rating: 4.9,
      reviewDate: "05 Oct 2026",
      status: "Recommended for Promotion",
      nextRole: "Regional HR Manager",
      reviewer: "Suresh Reddy"
    },
    {
      id: "EMP-1205",
      name: "Rajesh Nair",
      initials: "RN",
      designation: "Cloud Solutions Architect",
      department: "Infrastructure",
      branch: "Delhi NCR Hub",
      rating: 4.6,
      reviewDate: "02 Oct 2026",
      status: "Recommended for Promotion",
      nextRole: "Chief Architect - Cloud",
      reviewer: "Ananya Saxena"
    },
    {
      id: "EMP-1288",
      name: "Deepa Iyer",
      initials: "DI",
      designation: "Lead Financial Analyst",
      department: "Finance",
      branch: "Chennai Central",
      rating: 4.7,
      reviewDate: "28 Sep 2026",
      status: "Recommended for Promotion",
      nextRole: "Associate Director - Finance",
      reviewer: "Venkatesh Subramanian"
    }
  ];

  // Announcements and Notifications
  let notifications = [
    {
      id: "NOTIF-001",
      title: "Q3 FY27 Performance Review Submissions Due",
      message: "Branch managers are requested to complete all employee performance evaluations by October 25, 2026.",
      targetBranch: "All Branches",
      targetScope: "all",
      createdAt: "2 hours ago",
      timestamp: "2026-10-13T18:30:00",
      read: false,
      priority: "high",
      channels: ["In-App", "Email (Simulated)"]
    },
    {
      id: "NOTIF-002",
      title: "Diwali Festival Office Operations & Holiday Schedule",
      message: "Official circular regarding nationwide branch operations and paid festival holidays has been published.",
      targetBranch: "All Branches",
      targetScope: "all",
      createdAt: "1 day ago",
      timestamp: "2026-10-12T10:00:00",
      read: false,
      priority: "medium",
      channels: ["In-App"]
    },
    {
      id: "NOTIF-003",
      title: "Bengaluru HQ Office Expansion - Floor 4 Inauguration",
      message: "The new 200-seat engineering wing opens this Friday. Employee workstation reallocations are underway.",
      targetBranch: "Bengaluru HQ",
      targetScope: "branch",
      createdAt: "2 days ago",
      timestamp: "2026-10-11T14:15:00",
      read: false,
      priority: "medium",
      channels: ["In-App", "SMS (Simulated)"]
    },
    {
      id: "NOTIF-004",
      title: "October 2026 Payroll Cycle Processed & Disbursed",
      message: "Net salary calculations of ₹48,75,000 for 1,248 active staff have been reconciled with Head Office Finance.",
      targetBranch: "All Branches",
      targetScope: "all",
      createdAt: "3 days ago",
      timestamp: "2026-10-10T16:45:00",
      read: true,
      priority: "low",
      channels: ["In-App"]
    },
    {
      id: "NOTIF-005",
      title: "Mandatory Fire & Safety Drill at Mumbai West",
      message: "Branch safety audit and emergency evacuation drill scheduled for Wednesday 11:30 AM at BKC Tower 3.",
      targetBranch: "Mumbai West",
      targetScope: "branch",
      createdAt: "4 days ago",
      timestamp: "2026-10-09T09:00:00",
      read: true,
      priority: "low",
      channels: ["In-App", "Email (Simulated)"]
    }
  ];

  // Activity Timeline Events
  const activityTimeline = [
    {
      id: "ACT-01",
      title: "New Employee Onboarded",
      desc: "Priya Sharma added to Bengaluru HQ as Staff Software Engineer.",
      time: "15 minutes ago",
      type: "employee"
    },
    {
      id: "ACT-02",
      title: "Performance Review Completed",
      desc: "Amit Patel (Mumbai West) received a 4.8 rating and promotion flag.",
      time: "2 hours ago",
      type: "growth"
    },
    {
      id: "ACT-03",
      title: "Multibranch Announcement Broadcasted",
      desc: "Q3 Performance Review deadline sent across all 12 branches.",
      time: "4 hours ago",
      type: "notification"
    },
    {
      id: "ACT-04",
      title: "October Payroll Summary Approved",
      desc: "Head Office Administrator signed off on monthly disbursement of ₹48.75L.",
      time: "Yesterday, 5:30 PM",
      type: "payroll"
    },
    {
      id: "ACT-05",
      title: "Branch Capacity Reconfigured",
      desc: "Pune Hinjewadi authorized workstation count increased to 120 seats.",
      time: "2 days ago",
      type: "branch"
    }
  ];

    // Search index items (combining branches, employees, quick actions)
  function getSearchIndex() {
    const items = [];

    // Branches from dataStore
    const branchList = (window.EmployeeHub.dataStore && typeof window.EmployeeHub.dataStore.getBranches === 'function')
      ? window.EmployeeHub.dataStore.getBranches()
      : branches;

    branchList.forEach(b => {
      items.push({
        type: "Branch",
        title: `${b.name} (${b.code})`,
        subtitle: `${b.city}, ${b.state} • ${b.employeeCount} Staff • ${b.status}`,
        action: () => {
          if (window.EmployeeHub.branches && window.EmployeeHub.branches.viewBranchDetails) {
            window.EmployeeHub.branches.viewBranchDetails(b.id);
          } else {
            window.EmployeeHub.modals.openBranchDetails(b.id);
          }
        }
      });
    });

    // Employees from dataStore
    const empList = (window.EmployeeHub.dataStore && typeof window.EmployeeHub.dataStore.getEmployees === 'function')
      ? window.EmployeeHub.dataStore.getEmployees()
      : [];

    empList.forEach(e => {
      items.push({
        type: "Employee",
        title: `${e.name} (${e.id})`,
        subtitle: `${e.designation} • ${e.department} • ${e.branch}`,
        action: () => {
          if (window.EmployeeHub.employees && window.EmployeeHub.employees.viewProfile) {
            window.EmployeeHub.employees.viewProfile(e.id);
          }
        }
      });
    });

    // Quick Actions
    const quickActions = [
      { title: "Add Employee", subtitle: "Onboard new employee record to branch", action: () => window.EmployeeHub.employees.openAddEmployee() },
      { title: "Add Branch", subtitle: "Register new company office location", action: () => window.EmployeeHub.branches.openAddBranch() },
      { title: "Record Performance Review", subtitle: "Submit appraisal and promotion rating", action: () => window.EmployeeHub.modals.openRecordReview() },
      { title: "Generate Payroll", subtitle: "Calculate monthly salaries and deductions", action: () => window.EmployeeHub.modals.openGeneratePayroll() },
      { title: "Send Notification", subtitle: "Broadcast multibranch circular", action: () => window.EmployeeHub.modals.openSendNotification() }
    ];

    quickActions.forEach(qa => {
      items.push({
        type: "Quick Action",
        title: qa.title,
        subtitle: qa.subtitle,
        action: qa.action
      });
    });

    return items;
  }

  return {
    summaryStats,
    get branches() {
      if (window.EmployeeHub.dataStore && typeof window.EmployeeHub.dataStore.getBranches === 'function') {
        return window.EmployeeHub.dataStore.getBranches();
      }
      return branches;
    },
    payrollHistory,
    promotionCandidates,
    getNotifications: () => notifications,
    markNotificationAsRead: (id) => {
      const item = notifications.find(n => n.id === id);
      if (item) item.read = true;
    },
    markAllNotificationsAsRead: () => {
      notifications.forEach(n => n.read = true);
    },
    addNotification: (notif) => {
      notifications.unshift(notif);
    },
    activityTimeline,
    getSearchIndex
  };
})();
