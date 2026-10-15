/**
 * Centralized Data Store with LocalStorage Persistence
 * Namespace: window.EmployeeHub.dataStore
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.dataStore = (function () {
  'use strict';

  const STORAGE_KEY_BRANCHES = 'employeehub_branches_v2';
  const STORAGE_KEY_EMPLOYEES = 'employeehub_employees_v2';

  // Default seed branches
  const DEFAULT_BRANCHES = [
    {
      id: "BR-BLR-01",
      name: "Bengaluru HQ",
      code: "BLR-01",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560103",
      address: "Prestige Tech Park, Marathahalli Outer Ring Rd, Bengaluru",
      manager: "Kavita Krishnamurthy",
      email: "blr.branch@employeehub.demo",
      phone: "+91 80 4123 9001",
      status: "Active",
      capacity: 450,
      departments: ["Engineering", "Product", "Human Resources", "Finance", "Legal"]
    },
    {
      id: "BR-BOM-01",
      name: "Mumbai West",
      code: "BOM-01",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400051",
      address: "Bandra Kurla Complex (BKC), Tower 3, Mumbai",
      manager: "Rohan Deshmukh",
      email: "mumbai.branch@employeehub.demo",
      phone: "+91 22 2654 8812",
      status: "Active",
      capacity: 300,
      departments: ["Operations", "Finance", "Sales", "Product", "Human Resources"]
    },
    {
      id: "BR-DEL-01",
      name: "Delhi NCR Hub",
      code: "DEL-01",
      city: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
      address: "Cyber City, DLF Phase 2, Sector 24, Gurugram",
      manager: "Ananya Saxena",
      email: "delhi.branch@employeehub.demo",
      phone: "+91 124 456 7890",
      status: "Active",
      capacity: 250,
      departments: ["Sales", "Engineering", "Operations", "Infrastructure"]
    },
    {
      id: "BR-HYD-01",
      name: "Hyderabad Tech Park",
      code: "HYD-01",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500081",
      address: "HITEC City, Madhapur, Hyderabad",
      manager: "Suresh Reddy",
      email: "hyd.branch@employeehub.demo",
      phone: "+91 40 6789 2341",
      status: "Active",
      capacity: 220,
      departments: ["Infrastructure", "Engineering", "Human Resources"]
    },
    {
      id: "BR-MAA-01",
      name: "Chennai Central",
      code: "MAA-01",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600113",
      address: "Tidel Park, Rajiv Gandhi Salai, Taramani, Chennai",
      manager: "Venkatesh Subramanian",
      email: "chennai.branch@employeehub.demo",
      phone: "+91 44 2254 1120",
      status: "Active",
      capacity: 180,
      departments: ["Engineering", "Finance", "Infrastructure"]
    },
    {
      id: "BR-PNQ-01",
      name: "Pune Hinjewadi",
      code: "PNQ-01",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411057",
      address: "Rajiv Gandhi Infotech Park, Phase 1, Hinjewadi, Pune",
      manager: "Manish Joshi",
      email: "pune.branch@employeehub.demo",
      phone: "+91 20 6678 3344",
      status: "Active",
      capacity: 120,
      departments: ["Engineering", "Operations"]
    },
    {
      id: "BR-CCU-01",
      name: "Kolkata East",
      code: "CCU-01",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700091",
      address: "Sector V, Salt Lake City, Electronic Complex, Kolkata",
      manager: "Subhashis Banerjee",
      email: "kolkata.branch@employeehub.demo",
      phone: "+91 33 2357 9081",
      status: "Active",
      capacity: 80,
      departments: ["Operations", "Technical Support"]
    },
    {
      id: "BR-AMD-01",
      name: "Ahmedabad West",
      code: "AMD-01",
      city: "Ahmedabad",
      state: "Gujarat",
      postalCode: "380015",
      address: "SG Highway, Prahlad Nagar Trade Center, Ahmedabad",
      manager: "Bhavin Shah",
      email: "ahmedabad.branch@employeehub.demo",
      phone: "+91 79 4001 2233",
      status: "Inactive",
      capacity: 100,
      departments: ["Operations (Upcoming)"]
    },
    {
      id: "BR-JAI-01",
      name: "Jaipur Tech Hub",
      code: "JAI-01",
      city: "Jaipur",
      state: "Rajasthan",
      postalCode: "302037",
      address: "Mahindra World City, SEZ Zone, Jaipur",
      manager: "Narendra Singh",
      email: "jaipur.branch@employeehub.demo",
      phone: "+91 141 398 7654",
      status: "Inactive",
      capacity: 90,
      departments: ["Customer Support (Site Readiness)"]
    },
    {
      id: "BR-COK-01",
      name: "Kochi Infopark",
      code: "COK-01",
      city: "Kochi",
      state: "Kerala",
      postalCode: "682042",
      address: "Infopark Phase 2, Kakkanad, Kochi",
      manager: "Mathew Thomas",
      email: "kochi.branch@employeehub.demo",
      phone: "+91 484 298 1234",
      status: "Inactive",
      capacity: 75,
      departments: ["AI Lab (Commissioning)"]
    },
    {
      id: "BR-IXC-01",
      name: "Chandigarh IT Park",
      code: "IXC-01",
      city: "Chandigarh",
      state: "Punjab/UT",
      postalCode: "160101",
      address: "Rajiv Gandhi Chandigarh Technology Park, Kishangarh",
      manager: "Gurpreet Kaur",
      email: "chandigarh.branch@employeehub.demo",
      phone: "+91 172 505 4321",
      status: "Inactive",
      capacity: 60,
      departments: ["Design Lab (Upcoming)"]
    },
    {
      id: "BR-IDR-01",
      name: "Indore Super Corridor",
      code: "IDR-01",
      city: "Indore",
      state: "Madhya Pradesh",
      postalCode: "452005",
      address: "Super Corridor, Financial City Campus, Indore",
      manager: "Alok Agrawal",
      email: "indore.branch@employeehub.demo",
      phone: "+91 731 422 6677",
      status: "Inactive",
      capacity: 80,
      departments: ["Tier-2 Operations Hub"]
    }
  ];

  // Default seed employees (20 employees across branches)
  const DEFAULT_EMPLOYEES = [
    {
      id: "EMP-1001",
      name: "Priya Sharma",
      initials: "PS",
      email: "priya.sharma@employeehub.demo",
      phone: "+91 98450 12345",
      designation: "Staff Software Engineer",
      department: "Engineering",
      branch: "Bengaluru HQ",
      joiningDate: "2021-03-15",
      dob: "1992-06-14",
      gender: "Female",
      city: "Bengaluru",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Kavita Krishnamurthy",
      basicSalary: 85000,
      rating: 5.0,
      reviewDate: "2026-10-10",
      promotionStatus: "Recommended for Promotion (Principal L6)"
    },
    {
      id: "EMP-1002",
      name: "Amit Patel",
      initials: "AP",
      email: "amit.patel@employeehub.demo",
      phone: "+91 98201 67890",
      designation: "Senior Product Manager",
      department: "Product",
      branch: "Mumbai West",
      joiningDate: "2022-01-10",
      dob: "1990-11-23",
      gender: "Male",
      city: "Mumbai",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Rohan Deshmukh",
      basicSalary: 95000,
      rating: 4.8,
      reviewDate: "2026-10-08",
      promotionStatus: "Recommended for Promotion (Lead PM)"
    },
    {
      id: "EMP-1003",
      name: "Sunita Rao",
      initials: "SR",
      email: "sunita.rao@employeehub.demo",
      phone: "+91 98490 23456",
      designation: "HR Operations Lead",
      department: "Human Resources",
      branch: "Hyderabad Tech Park",
      joiningDate: "2020-08-01",
      dob: "1988-04-19",
      gender: "Female",
      city: "Hyderabad",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Suresh Reddy",
      basicSalary: 65000,
      rating: 4.9,
      reviewDate: "2026-10-05",
      promotionStatus: "Recommended for Promotion (Branch HR Head)"
    },
    {
      id: "EMP-1004",
      name: "Rajesh Nair",
      initials: "RN",
      email: "rajesh.nair@employeehub.demo",
      phone: "+91 98110 34567",
      designation: "Cloud Solutions Architect",
      department: "Infrastructure",
      branch: "Delhi NCR Hub",
      joiningDate: "2019-11-20",
      dob: "1986-09-08",
      gender: "Male",
      city: "Gurugram",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Ananya Saxena",
      basicSalary: 110000,
      rating: 4.6,
      reviewDate: "2026-10-02",
      promotionStatus: "Recommended for Promotion (Principal Architect)"
    },
    {
      id: "EMP-1005",
      name: "Deepa Iyer",
      initials: "DI",
      email: "deepa.iyer@employeehub.demo",
      phone: "+91 98401 45678",
      designation: "Lead Financial Analyst",
      department: "Finance",
      branch: "Chennai Central",
      joiningDate: "2021-06-18",
      dob: "1993-02-11",
      gender: "Female",
      city: "Chennai",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Venkatesh Subramanian",
      basicSalary: 72000,
      rating: 4.7,
      reviewDate: "2026-09-28",
      promotionStatus: "Recommended for Promotion (Senior Finance Lead)"
    },
    {
      id: "EMP-1006",
      name: "Vikram Soni",
      initials: "VS",
      email: "vikram.soni@employeehub.demo",
      phone: "+91 98230 56789",
      designation: "Engineering Manager",
      department: "Engineering",
      branch: "Pune Hinjewadi",
      joiningDate: "2020-04-12",
      dob: "1987-12-05",
      gender: "Male",
      city: "Pune",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Manish Joshi",
      basicSalary: 105000,
      rating: 4.8,
      reviewDate: "2026-09-20",
      promotionStatus: "Recommended for Promotion (Associate Director)"
    },
    {
      id: "EMP-1007",
      name: "Ananya Sen",
      initials: "AS",
      email: "ananya.sen@employeehub.demo",
      phone: "+91 98300 67890",
      designation: "Technical Support Specialist",
      department: "Operations",
      branch: "Kolkata East",
      joiningDate: "2022-07-01",
      dob: "1995-07-30",
      gender: "Female",
      city: "Kolkata",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Subhashis Banerjee",
      basicSalary: 42000,
      rating: 3.8,
      reviewDate: "2026-08-15",
      promotionStatus: "Standard Growth Path"
    },
    {
      id: "EMP-1008",
      name: "Karthik Raman",
      initials: "KR",
      email: "karthik.raman@employeehub.demo",
      phone: "+91 98452 78901",
      designation: "Senior DevOps Engineer",
      department: "Engineering",
      branch: "Bengaluru HQ",
      joiningDate: "2021-09-05",
      dob: "1991-03-25",
      gender: "Male",
      city: "Bengaluru",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Kavita Krishnamurthy",
      basicSalary: 78000,
      rating: 4.2,
      reviewDate: "2026-09-10",
      promotionStatus: "Recommended for Promotion (Staff DevOps)"
    },
    {
      id: "EMP-1009",
      name: "Pooja Hegde",
      initials: "PH",
      email: "pooja.hegde@employeehub.demo",
      phone: "+91 98453 89012",
      designation: "UI/UX Product Designer",
      department: "Product",
      branch: "Bengaluru HQ",
      joiningDate: "2022-03-22",
      dob: "1994-08-17",
      gender: "Female",
      city: "Bengaluru",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Amit Patel",
      basicSalary: 68000,
      rating: 4.5,
      reviewDate: "2026-08-25",
      promotionStatus: "Recommended for Promotion (Lead Designer)"
    },
    {
      id: "EMP-1010",
      name: "Manish Joshi",
      initials: "MJ",
      email: "manish.joshi@employeehub.demo",
      phone: "+91 98220 90123",
      designation: "QA Automation Lead",
      department: "Engineering",
      branch: "Pune Hinjewadi",
      joiningDate: "2021-05-14",
      dob: "1989-10-02",
      gender: "Male",
      city: "Pune",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Vikram Soni",
      basicSalary: 62000,
      rating: 4.1,
      reviewDate: "2026-07-18",
      promotionStatus: "Recommended for Promotion (QA Manager)"
    },
    {
      id: "EMP-1011",
      name: "Neha Deshmukh",
      initials: "ND",
      email: "neha.deshmukh@employeehub.demo",
      phone: "+91 98202 01234",
      designation: "Talent Acquisition Specialist",
      department: "Human Resources",
      branch: "Mumbai West",
      joiningDate: "2023-02-15",
      dob: "1996-01-12",
      gender: "Female",
      city: "Mumbai",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Rohan Deshmukh",
      basicSalary: 48000,
      rating: 3.9,
      reviewDate: "2026-06-30",
      promotionStatus: "Standard Growth Path"
    },
    {
      id: "EMP-1012",
      name: "Rohan Varma",
      initials: "RV",
      email: "rohan.varma@employeehub.demo",
      phone: "+91 98112 12345",
      designation: "Enterprise Account Executive",
      department: "Sales",
      branch: "Delhi NCR Hub",
      joiningDate: "2020-10-10",
      dob: "1989-05-09",
      gender: "Male",
      city: "Gurugram",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Ananya Saxena",
      basicSalary: 75000,
      rating: 4.3,
      reviewDate: "2026-08-04",
      promotionStatus: "Recommended for Promotion (Sales Director)"
    },
    {
      id: "EMP-1013",
      name: "Divya Krishnan",
      initials: "DK",
      email: "divya.krishnan@employeehub.demo",
      phone: "+91 98402 23456",
      designation: "Backend Engineer",
      department: "Engineering",
      branch: "Chennai Central",
      joiningDate: "2023-01-08",
      dob: "1997-09-14",
      gender: "Female",
      city: "Chennai",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Deepa Iyer",
      basicSalary: 55000,
      rating: 4.0,
      reviewDate: "2026-09-01",
      promotionStatus: "Recommended for Promotion (Senior Engineer)"
    },
    {
      id: "EMP-1014",
      name: "Suresh Reddy",
      initials: "SR",
      email: "suresh.reddy@employeehub.demo",
      phone: "+91 98492 34567",
      designation: "Security Compliance Officer",
      department: "Infrastructure",
      branch: "Hyderabad Tech Park",
      joiningDate: "2019-05-30",
      dob: "1985-11-29",
      gender: "Male",
      city: "Hyderabad",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Rajesh Nair",
      basicSalary: 88000,
      rating: 4.4,
      reviewDate: "2026-06-15",
      promotionStatus: "Recommended for Promotion (Head of InfoSec)"
    },
    {
      id: "EMP-1015",
      name: "Arpan Mukherjee",
      initials: "AM",
      email: "arpan.m@employeehub.demo",
      phone: "+91 98302 45678",
      designation: "Customer Operations Associate",
      department: "Operations",
      branch: "Kolkata East",
      joiningDate: "2023-04-12",
      dob: "1998-04-03",
      gender: "Male",
      city: "Kolkata",
      employmentType: "Contract",
      status: "Active",
      reportingManager: "Subhashis Banerjee",
      basicSalary: 35000,
      rating: 3.5,
      reviewDate: "2026-05-20",
      promotionStatus: "Standard Growth Path"
    },
    {
      id: "EMP-1016",
      name: "Sneha Kulkarni",
      initials: "SK",
      email: "sneha.k@employeehub.demo",
      phone: "+91 98454 56789",
      designation: "Legal Counsel",
      department: "Legal",
      branch: "Bengaluru HQ",
      joiningDate: "2021-11-01",
      dob: "1990-08-22",
      gender: "Female",
      city: "Bengaluru",
      employmentType: "Part-time",
      status: "Active",
      reportingManager: "Kavita Krishnamurthy",
      basicSalary: 60000,
      rating: 4.2,
      reviewDate: "2026-07-10",
      promotionStatus: "Standard Growth Path"
    },
    {
      id: "EMP-1017",
      name: "Tanvi Mehta",
      initials: "TM",
      email: "tanvi.mehta@employeehub.demo",
      phone: "+91 98203 67890",
      designation: "Marketing Specialist",
      department: "Product",
      branch: "Mumbai West",
      joiningDate: "2022-09-18",
      dob: "1995-12-19",
      gender: "Female",
      city: "Mumbai",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Amit Patel",
      basicSalary: 52000,
      rating: 3.7,
      reviewDate: "2026-06-25",
      promotionStatus: "Standard Growth Path"
    },
    {
      id: "EMP-1018",
      name: "Arjun Kapoor",
      initials: "AK",
      email: "arjun.kapoor@employeehub.demo",
      phone: "+91 98113 78901",
      designation: "Frontend Developer",
      department: "Engineering",
      branch: "Delhi NCR Hub",
      joiningDate: "2023-06-01",
      dob: "1997-03-08",
      gender: "Male",
      city: "Gurugram",
      employmentType: "Full-time",
      status: "Active",
      reportingManager: "Rajesh Nair",
      basicSalary: 50000,
      rating: 3.9,
      reviewDate: "2026-05-15",
      promotionStatus: "Standard Growth Path"
    },
    {
      id: "EMP-1019",
      name: "Harish Balaji",
      initials: "HB",
      email: "harish.b@employeehub.demo",
      phone: "+91 98403 89012",
      designation: "Network Operations Engineer",
      department: "Infrastructure",
      branch: "Chennai Central",
      joiningDate: "2022-12-10",
      dob: "1994-05-16",
      gender: "Male",
      city: "Chennai",
      employmentType: "Contract",
      status: "Active",
      reportingManager: "Venkatesh Subramanian",
      basicSalary: 40000,
      rating: 3.6,
      reviewDate: "2026-04-18",
      promotionStatus: "Standard Growth Path"
    },
    {
      id: "EMP-1020",
      name: "Meera Nambiar",
      initials: "MN",
      email: "meera.nambiar@employeehub.demo",
      phone: "+91 98493 90123",
      designation: "Associate HR Generalist",
      department: "Human Resources",
      branch: "Hyderabad Tech Park",
      joiningDate: "2024-01-15",
      dob: "1999-10-04",
      gender: "Female",
      city: "Hyderabad",
      employmentType: "Full-time",
      status: "Inactive",
      reportingManager: "Sunita Rao",
      basicSalary: 38000,
      rating: 3.2,
      reviewDate: "2026-03-12",
      promotionStatus: "Standard Growth Path"
    }
  ];

  let branches = [];
  let employees = [];

  function loadFromStorage() {
    try {
      const storedBranches = localStorage.getItem(STORAGE_KEY_BRANCHES);
      const storedEmployees = localStorage.getItem(STORAGE_KEY_EMPLOYEES);

      branches = storedBranches ? JSON.parse(storedBranches) : JSON.parse(JSON.stringify(DEFAULT_BRANCHES));
      employees = storedEmployees ? JSON.parse(storedEmployees) : JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
    } catch (e) {
      console.warn('Failed to load from LocalStorage, using defaults:', e);
      branches = JSON.parse(JSON.stringify(DEFAULT_BRANCHES));
      employees = JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
    }
    syncBranchEmployeeCounts();
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_BRANCHES, JSON.stringify(branches));
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.warn('Failed to save to LocalStorage:', e);
    }
  }

  /**
   * Re-compute branch employee counts and payroll summaries dynamically from current employee dataset!
   */
  function syncBranchEmployeeCounts() {
    branches.forEach(branch => {
      const branchEmployees = employees.filter(e => e.branch === branch.name);
      branch.employeeCount = branchEmployees.length;
      branch.activeEmployeeCount = branchEmployees.filter(e => e.status === 'Active').length;
      branch.monthlyPayroll = branchEmployees.reduce((sum, e) => sum + (e.basicSalary || 0), 0);
    });
  }

  // Initialize data
  loadFromStorage();

  // Helper to generate unique initials
  function getInitials(name) {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return {
    // Branch operations
    getBranches() {
      syncBranchEmployeeCounts();
      return [...branches];
    },
    getBranch(id) {
      syncBranchEmployeeCounts();
      return branches.find(b => b.id === id || b.code === id) || null;
    },
    getBranchByName(name) {
      syncBranchEmployeeCounts();
      return branches.find(b => b.name === name) || null;
    },
    addBranch(branchData) {
      // Validate unique code
      const existing = branches.find(b => b.code.toLowerCase() === branchData.code.trim().toLowerCase());
      if (existing) {
        throw new Error(`Branch Code "${branchData.code}" is already in use by ${existing.name}.`);
      }
      const newId = `BR-${branchData.code.toUpperCase()}-${String(branches.length + 1).padStart(2, '0')}`;
      const newBranch = {
        id: newId,
        name: branchData.name.trim(),
        code: branchData.code.trim().toUpperCase(),
        city: branchData.city.trim(),
        state: branchData.state.trim(),
        postalCode: branchData.postalCode ? branchData.postalCode.trim() : "",
        address: branchData.address.trim(),
        manager: branchData.manager ? branchData.manager.trim() : "Unassigned",
        email: branchData.email ? branchData.email.trim() : `${branchData.code.toLowerCase()}@employeehub.demo`,
        phone: branchData.phone ? branchData.phone.trim() : "",
        status: branchData.status || "Active",
        capacity: Number(branchData.capacity) || 100,
        departments: branchData.departments || ["Operations"]
      };
      branches.push(newBranch);
      syncBranchEmployeeCounts();
      saveToStorage();
      return newBranch;
    },
    updateBranch(id, updatedData) {
      const index = branches.findIndex(b => b.id === id);
      if (index === -1) throw new Error("Branch not found.");

      // Check code uniqueness against other branches
      if (updatedData.code) {
        const codeConflict = branches.find(b => b.id !== id && b.code.toLowerCase() === updatedData.code.trim().toLowerCase());
        if (codeConflict) {
          throw new Error(`Branch Code "${updatedData.code}" is already used by ${codeConflict.name}.`);
        }
      }

      const oldName = branches[index].name;
      const newName = updatedData.name ? updatedData.name.trim() : oldName;

      // If branch name changed, update employee references automatically!
      if (oldName !== newName) {
        employees.forEach(e => {
          if (e.branch === oldName) e.branch = newName;
        });
      }

      branches[index] = {
        ...branches[index],
        ...updatedData,
        name: newName,
        code: updatedData.code ? updatedData.code.trim().toUpperCase() : branches[index].code
      };

      syncBranchEmployeeCounts();
      saveToStorage();
      return branches[index];
    },
    toggleBranchStatus(id) {
      const branch = branches.find(b => b.id === id);
      if (!branch) throw new Error("Branch not found.");
      branch.status = branch.status === 'Active' ? 'Inactive' : 'Active';
      saveToStorage();
      return branch;
    },
    deleteBranch(id) {
      const branch = branches.find(b => b.id === id);
      if (!branch) throw new Error("Branch not found.");

      // Safety check: Cannot delete branch with assigned employees!
      const assigned = employees.filter(e => e.branch === branch.name);
      if (assigned.length > 0) {
        throw new Error(`Cannot delete branch "${branch.name}". It currently has ${assigned.length} assigned employee(s). Please reassign or deactivate employees first.`);
      }

      branches = branches.filter(b => b.id !== id);
      saveToStorage();
      return true;
    },

    // Employee operations
    getEmployees() {
      return [...employees];
    },
    getEmployee(id) {
      return employees.find(e => e.id === id) || null;
    },
    getEmployeeById(id) {
      return employees.find(e => e.id === id) || null;
    },
    getEmployeesByBranch(branchName) {
      return employees.filter(e => e.branch === branchName);
    },
    generateEmployeeId() {
      const numIds = employees
        .map(e => parseInt(e.id.replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));
      const nextNum = (numIds.length > 0 ? Math.max(...numIds) : 1000) + 1;
      return `EMP-${nextNum}`;
    },
    addEmployee(empData) {
      // Validate unique ID
      const empId = empData.id ? empData.id.trim() : this.generateEmployeeId();
      if (employees.some(e => e.id.toLowerCase() === empId.toLowerCase())) {
        throw new Error(`Employee ID "${empId}" already exists.`);
      }

      // Validate email uniqueness
      if (employees.some(e => e.email.toLowerCase() === empData.email.trim().toLowerCase())) {
        throw new Error(`Corporate Email "${empData.email}" is already registered to another employee.`);
      }

      // Validate branch exists and is active
      const branch = branches.find(b => b.name === empData.branch);
      if (!branch) {
        throw new Error(`Selected branch "${empData.branch}" does not exist.`);
      }
      if (branch.status !== 'Active') {
        throw new Error(`Cannot assign employee to inactive branch "${branch.name}".`);
      }

      const newEmp = {
        id: empId,
        name: empData.name.trim(),
        initials: getInitials(empData.name),
        email: empData.email.trim().toLowerCase(),
        phone: empData.phone ? empData.phone.trim() : "",
        designation: empData.designation.trim(),
        department: empData.department.trim(),
        branch: branch.name,
        joiningDate: empData.joiningDate || new Date().toISOString().split('T')[0],
        dob: empData.dob || "",
        gender: empData.gender || "Decline to specify",
        city: empData.city ? empData.city.trim() : branch.city,
        employmentType: empData.employmentType || "Full-time",
        status: empData.status || "Active",
        reportingManager: empData.reportingManager ? empData.reportingManager.trim() : branch.manager,
        basicSalary: Number(empData.basicSalary) || 45000,
        rating: Number(empData.rating) || 3.5,
        reviewDate: empData.reviewDate || "",
        promotionStatus: (Number(empData.rating) >= 4.0) ? "Recommended for Promotion" : "Standard Growth Path"
      };

      employees.unshift(newEmp);
      syncBranchEmployeeCounts();
      saveToStorage();
      return newEmp;
    },
    updateEmployee(id, updatedData) {
      const index = employees.findIndex(e => e.id === id);
      if (index === -1) throw new Error("Employee not found.");

      // Check email uniqueness if email is changed
      if (updatedData.email) {
        const conflict = employees.find(e => e.id !== id && e.email.toLowerCase() === updatedData.email.trim().toLowerCase());
        if (conflict) {
          throw new Error(`Email "${updatedData.email}" is already used by ${conflict.name}.`);
        }
      }

      // Check branch validity if branch is changed
      if (updatedData.branch) {
        const branch = branches.find(b => b.name === updatedData.branch);
        if (!branch) throw new Error(`Branch "${updatedData.branch}" does not exist.`);
      }

      const current = employees[index];
      const newName = updatedData.name ? updatedData.name.trim() : current.name;

      employees[index] = {
        ...current,
        ...updatedData,
        name: newName,
        initials: getInitials(newName),
        basicSalary: updatedData.basicSalary !== undefined ? Number(updatedData.basicSalary) : current.basicSalary
      };

      syncBranchEmployeeCounts();
      saveToStorage();
      return employees[index];
    },
    toggleEmployeeStatus(id) {
      const emp = employees.find(e => e.id === id);
      if (!emp) throw new Error("Employee not found.");
      emp.status = emp.status === 'Active' ? 'Inactive' : 'Active';
      syncBranchEmployeeCounts();
      saveToStorage();
      return emp;
    },
    deleteEmployee(id) {
      const index = employees.findIndex(e => e.id === id);
      if (index === -1) throw new Error("Employee not found.");
      const deleted = employees.splice(index, 1)[0];
      syncBranchEmployeeCounts();
      saveToStorage();
      return deleted;
    },

    // Metadata lookups
    getDepartments() {
      const depts = new Set();
      employees.forEach(e => { if (e.department) depts.add(e.department); });
      branches.forEach(b => { if (b.departments) b.departments.forEach(d => depts.add(d)); });
      return Array.from(depts).sort();
    },
    getEmploymentTypes() {
      return ["Full-time", "Part-time", "Contract", "Intern"];
    },

    // Reset to demo defaults
    resetDemoData() {
      branches = JSON.parse(JSON.stringify(DEFAULT_BRANCHES));
      employees = JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
      syncBranchEmployeeCounts();
      saveToStorage();
    }
  };
})();
