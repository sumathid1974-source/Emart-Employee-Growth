/**
 * EmployeeHub — Phase 5: Growth & Performance Data Store
 * Namespace: window.EmployeeHub.growthStore
 * 
 * Manages Review Cycles, Appraisals, Goals, Development Plans,
 * Skills Matrix, Training & Learning, Promotion Recommendations,
 * Career Paths, and Feedback with LocalStorage persistence.
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.growthStore = (function () {
  'use strict';

  // LocalStorage Keys
  const STORAGE_KEY_CYCLES = 'employeehub_review_cycles_v5';
  const STORAGE_KEY_APPRAISALS = 'employeehub_appraisals_v5';
  const STORAGE_KEY_GOALS = 'employeehub_goals_v5';
  const STORAGE_KEY_DEV_PLANS = 'employeehub_dev_plans_v5';
  const STORAGE_KEY_SKILLS_LIB = 'employeehub_skills_library_v5';
  const STORAGE_KEY_EMP_SKILLS = 'employeehub_employee_skills_v5';
  const STORAGE_KEY_COURSES = 'employeehub_training_courses_v5';
  const STORAGE_KEY_ENROLLMENTS = 'employeehub_course_enrollments_v5';
  const STORAGE_KEY_PROMOTIONS = 'employeehub_promotion_reviews_v5';
  const STORAGE_KEY_CAREER_PATHS = 'employeehub_career_paths_v5';
  const STORAGE_KEY_FEEDBACK = 'employeehub_feedback_v5';

  // Criteria Configuration with Weights
  const APPRAISAL_CRITERIA = [
    { id: 'jobKnowledge', name: 'Job Knowledge & Expertise', weight: 0.20, desc: 'Technical depth, domain expertise, and role proficiency.' },
    { id: 'qualityOfWork', name: 'Quality & Accuracy of Work', weight: 0.20, desc: 'Standard of output, error minimization, and thoroughness.' },
    { id: 'productivity', name: 'Productivity & Execution', weight: 0.15, desc: 'Timeliness of delivery, volume of work, and deadline compliance.' },
    { id: 'communication', name: 'Communication & Stakeholder Management', weight: 0.10, desc: 'Clarity, listening skills, written and verbal transparency.' },
    { id: 'teamwork', name: 'Teamwork & Collaboration', weight: 0.10, desc: 'Cross-functional cooperation, helping peers, positive culture.' },
    { id: 'reliability', name: 'Reliability & Accountability', weight: 0.10, desc: 'Dependability, ownership of outcomes, consistent attendance.' },
    { id: 'leadership', name: 'Leadership & Initiative', weight: 0.05, desc: 'Proactive problem solving, mentoring others, driving change.' },
    { id: 'goalAchievement', name: 'Goal & KPI Achievement', weight: 0.10, desc: 'Quantitative completion rate of assigned OKRs.' }
  ];

  // Rating Scale Definitions (1 to 5)
  const RATING_SCALE_DESCRIPTIONS = {
    1: 'Needs Significant Development — Rarely meets performance standards.',
    2: 'Developing / Inconsistent — Occasionally meets standards; requires coaching.',
    3: 'Meets Role Expectations — Consistently achieves targets and meets standards.',
    4: 'Exceeds Expectations — Frequently surpasses objectives; demonstrates mastery.',
    5: 'Outstanding / Role Model — Exceptional contributor and organizational role model.'
  };

  // Proficiency Scale
  const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Default Seed Skills Library
  const DEFAULT_SKILLS = [
    { id: 'SKILL-01', name: 'Cloud Architecture (AWS/GCP/Azure)', category: 'Technical', desc: 'Design of resilient, scalable cloud infrastructure and services.', roleFamily: 'Engineering / Infrastructure' },
    { id: 'SKILL-02', name: 'Distributed Systems & Microservices', category: 'Technical', desc: 'Event-driven design, high-concurrency systems, Kafka, Redis.', roleFamily: 'Engineering' },
    { id: 'SKILL-03', name: 'Frontend Architecture (React/JS/CSS)', category: 'Technical', desc: 'High-performance UI design, component systems, web standards.', roleFamily: 'Engineering' },
    { id: 'SKILL-04', name: 'Kubernetes & Container Orchestration', category: 'Technical', desc: 'Cluster management, CI/CD pipelines, Docker, Helm.', roleFamily: 'Infrastructure' },
    { id: 'SKILL-05', name: 'Database Architecture & Query Tuning', category: 'Technical', desc: 'PostgreSQL, MySQL, indexing, query optimization, sharding.', roleFamily: 'Engineering' },
    { id: 'SKILL-06', name: 'Product Roadmapping & PRD Writing', category: 'Functional', desc: 'User persona definition, user stories, feature prioritization.', roleFamily: 'Product' },
    { id: 'SKILL-07', name: 'UX Research & Rapid Prototyping', category: 'Functional', desc: 'Wireframing, usability tests, design tokens, Figma.', roleFamily: 'Product' },
    { id: 'SKILL-08', name: 'Statutory Payroll & Indian Labor Laws', category: 'Functional', desc: 'EPF, ESIC, TDS, Professional Tax compliance and HR governance.', roleFamily: 'Human Resources' },
    { id: 'SKILL-09', name: 'Financial Modelling & Budgeting', category: 'Functional', desc: 'P&L analysis, branch Capex/Opex forecasting, variance audits.', roleFamily: 'Finance' },
    { id: 'SKILL-10', name: 'Enterprise B2B Deal Closing', category: 'Functional', desc: 'Pipeline management, client negotiation, C-level presentations.', roleFamily: 'Sales' },
    { id: 'SKILL-11', name: 'Strategic Thinking & OKR Formulation', category: 'Leadership', desc: 'Aligning team objectives with organizational multi-year vision.', roleFamily: 'All Leadership' },
    { id: 'SKILL-12', name: 'Team Mentorship & People Development', category: 'Leadership', desc: 'Constructive 1-on-1s, coaching, performance improvement plans.', roleFamily: 'All Leadership' },
    { id: 'SKILL-13', name: 'Cross-Functional Stakeholder Alignment', category: 'Soft Skills', desc: 'Navigating organizational dynamics, achieving consensus.', roleFamily: 'All' },
    { id: 'SKILL-14', name: 'Complex Problem Solving & Root Cause', category: 'Soft Skills', desc: '5-Whys analysis, incident postmortems, structured logic.', roleFamily: 'All' },
    { id: 'SKILL-15', name: 'Information Security & Compliance Audits', category: 'Technical', desc: 'ISO 27001, SOC2, vulnerability assessments, security policy.', roleFamily: 'Infrastructure' },
    { id: 'SKILL-16', name: 'Corporate Legal Contracting & NDA Governance', category: 'Functional', desc: 'Vendor SLAs, commercial terms, compliance risk mitigation.', roleFamily: 'Legal' }
  ];

  // Default Seed Review Cycles
  const DEFAULT_CYCLES = [
    {
      id: 'RC-2026-Q3',
      name: 'Q3 2026 Performance Appraisal Cycle',
      period: 'Q3 2026',
      startDate: '2026-09-15',
      endDate: '2026-10-25',
      deadline: '2026-10-20',
      targetScope: 'All Branches',
      status: 'Active',
      description: 'Quarterly review cycle focusing on Q3 OKR deliverables, technical competency calibrations, and promotion readiness evaluations.',
      createdBy: 'HR Central Operations'
    },
    {
      id: 'RC-2026-MID',
      name: 'Mid-Year 2026 Leadership & Growth Review',
      period: 'H1 2026',
      startDate: '2026-06-01',
      endDate: '2026-07-20',
      deadline: '2026-07-15',
      targetScope: 'All Branches',
      status: 'Completed',
      description: 'Mid-year 360-degree review across branch heads, leads, and staff engineers.',
      createdBy: 'Kavita Krishnamurthy'
    },
    {
      id: 'RC-2026-ANN',
      name: 'Annual 2026 Organizational Growth Cycle',
      period: 'Annual 2026',
      startDate: '2026-11-01',
      endDate: '2026-12-20',
      deadline: '2026-12-15',
      targetScope: 'All Branches',
      status: 'Draft',
      description: 'Comprehensive annual appraisal cycle determining FY27 salary bands, promotions, and strategic talent pipelines.',
      createdBy: 'HR Central Operations'
    }
  ];

  // Default Seed Training Courses
  const DEFAULT_COURSES = [
    {
      id: 'TRN-101',
      name: 'Cloud Architecture Masterclass (AWS & Kubernetes)',
      category: 'Technical',
      trainer: 'Praveen Kulkarni (Principal Cloud Architect)',
      deliveryMethod: 'Virtual Live',
      startDate: '2026-10-01',
      endDate: '2026-10-28',
      durationHours: 32,
      capacity: 25,
      skillsCovered: ['Cloud Architecture (AWS/GCP/Azure)', 'Kubernetes & Container Orchestration'],
      completionCriteria: 'Pass architectural design exam (>=80%) & deploy capstone cluster.',
      status: 'In Progress',
      description: 'Deep dive into fault-tolerant multi-region VPC design, Kubernetes ingress, and zero-downtime rolling updates.'
    },
    {
      id: 'TRN-102',
      name: 'Executive Leadership & People Management',
      category: 'Leadership',
      trainer: 'Dr. Meenakshi Raman (Leadership Academy)',
      deliveryMethod: 'Hybrid Workshop',
      startDate: '2026-10-15',
      endDate: '2026-11-10',
      durationHours: 20,
      capacity: 15,
      skillsCovered: ['Team Mentorship & People Development', 'Strategic Thinking & OKR Formulation'],
      completionCriteria: 'Submission of team talent growth charter & 360 coaching simulation.',
      status: 'Open',
      description: 'Empowering engineering leads and branch heads with constructive feedback strategies, psychological safety, and coaching.'
    },
    {
      id: 'TRN-103',
      name: 'Modern Web Engineering & React 19 Standards',
      category: 'Technical',
      trainer: 'Frontend Excellence Guild',
      deliveryMethod: 'Self-Paced',
      startDate: '2026-08-01',
      endDate: '2026-09-30',
      durationHours: 24,
      capacity: 30,
      skillsCovered: ['Frontend Architecture (React/JS/CSS)', 'Distributed Systems & Microservices'],
      completionCriteria: 'Build an accessible design token library and complete 5 performance benchmarks.',
      status: 'Completed',
      description: 'Advanced modern web application engineering, vanilla CSS design tokens, web components, and Core Web Vitals.'
    },
    {
      id: 'TRN-104',
      name: 'Enterprise Cybersecurity & ISO 27001 Compliance',
      category: 'Technical',
      trainer: 'Sanjay Deshmukh (CISO Advisor)',
      deliveryMethod: 'Virtual Live',
      startDate: '2026-10-20',
      endDate: '2026-11-15',
      durationHours: 16,
      capacity: 35,
      skillsCovered: ['Information Security & Compliance Audits'],
      completionCriteria: 'Security hygiene quiz (>=90%) and secure code review audit submission.',
      status: 'Open',
      description: 'Threat modelling, least-privilege RBAC policies, data encryption at rest, and nationwide branch security audits.'
    },
    {
      id: 'TRN-105',
      name: 'Strategic Financial Planning & Capex Governance',
      category: 'Functional',
      trainer: 'Deepa Menon (Senior Financial Lead)',
      deliveryMethod: 'In-Person',
      startDate: '2026-11-05',
      endDate: '2026-11-25',
      durationHours: 18,
      capacity: 15,
      skillsCovered: ['Financial Modelling & Budgeting'],
      completionCriteria: 'Complete branch budget variance simulation.',
      status: 'Planned',
      description: 'Multi-branch cost optimization, cloud expenditure management, and tax planning.'
    },
    {
      id: 'TRN-106',
      name: 'Cross-Functional Stakeholder Negotiation',
      category: 'Soft Skills',
      trainer: 'Corporate Communications Center',
      deliveryMethod: 'Self-Paced',
      startDate: '2026-07-01',
      endDate: '2026-08-31',
      durationHours: 12,
      capacity: 40,
      skillsCovered: ['Cross-Functional Stakeholder Alignment', 'Complex Problem Solving & Root Cause'],
      completionCriteria: 'Complete case studies on high-stakes conflict resolution.',
      status: 'Completed',
      description: 'Handling competing priorities across sales, engineering, and finance with win-win negotiation methodologies.'
    }
  ];

  // Default Career Paths
  const DEFAULT_CAREER_PATHS = [
    {
      id: 'CP-ENG',
      track: 'Engineering & Technology',
      description: 'Dual-track career progression for individual contributors and engineering leaders.',
      levels: [
        {
          role: 'Junior Software Engineer (L3)',
          nextRole: 'Software Engineer (L4)',
          experienceYears: '1 - 2 yrs',
          requiredSkills: ['Frontend Architecture (React/JS/CSS)', 'Complex Problem Solving & Root Cause'],
          suggestedCourses: ['TRN-103'],
          checkpoint: 'Demonstrate independent feature delivery and zero regression commits.'
        },
        {
          role: 'Software Engineer (L4)',
          nextRole: 'Senior Software Engineer (L5)',
          experienceYears: '2 - 4 yrs',
          requiredSkills: ['Distributed Systems & Microservices', 'Database Architecture & Query Tuning'],
          suggestedCourses: ['TRN-101'],
          checkpoint: 'Lead design of core backend microservices and mentor junior developers.'
        },
        {
          role: 'Senior Software Engineer (L5)',
          nextRole: 'Staff Software Engineer / Tech Lead (L6)',
          experienceYears: '4 - 7 yrs',
          requiredSkills: ['Cloud Architecture (AWS/GCP/Azure)', 'Kubernetes & Container Orchestration', 'Cross-Functional Stakeholder Alignment'],
          suggestedCourses: ['TRN-101', 'TRN-102'],
          checkpoint: 'Own cross-branch architectural initiatives, SLA guarantees, and multi-team technical roadmaps.'
        },
        {
          role: 'Staff Software Engineer (L6)',
          nextRole: 'Principal Architect (L7) / VP Engineering',
          experienceYears: '7+ yrs',
          requiredSkills: ['Strategic Thinking & OKR Formulation', 'Team Mentorship & People Development', 'Information Security & Compliance Audits'],
          suggestedCourses: ['TRN-102', 'TRN-104'],
          checkpoint: 'Company-wide technology vision, patented system innovations, and executive steering committee leadership.'
        }
      ]
    },
    {
      id: 'CP-PROD',
      track: 'Product & Design',
      description: 'Progression for product strategists, user researchers, and product managers.',
      levels: [
        {
          role: 'Associate Product Manager',
          nextRole: 'Product Manager',
          experienceYears: '1 - 2 yrs',
          requiredSkills: ['UX Research & Rapid Prototyping', 'Complex Problem Solving & Root Cause'],
          suggestedCourses: ['TRN-106'],
          checkpoint: 'Write rigorous PRDs and coordinate bi-weekly sprint deliverables.'
        },
        {
          role: 'Product Manager',
          nextRole: 'Senior Product Manager',
          experienceYears: '3 - 5 yrs',
          requiredSkills: ['Product Roadmapping & PRD Writing', 'Cross-Functional Stakeholder Alignment'],
          suggestedCourses: ['TRN-102'],
          checkpoint: 'Lead end-to-end launch of multibranch product modules with measurable adoption lift.'
        },
        {
          role: 'Senior Product Manager',
          nextRole: 'Lead PM / Director of Product',
          experienceYears: '5+ yrs',
          requiredSkills: ['Strategic Thinking & OKR Formulation', 'Team Mentorship & People Development', 'Enterprise B2B Deal Closing'],
          suggestedCourses: ['TRN-102', 'TRN-106'],
          checkpoint: 'Define multi-year SaaS platform roadmap and direct portfolio-level revenue streams.'
        }
      ]
    },
    {
      id: 'CP-HR',
      track: 'People & Operations',
      description: 'Progression from talent operations to organizational human resources leadership.',
      levels: [
        {
          role: 'HR Executive',
          nextRole: 'HR Generalist / Operations Lead',
          experienceYears: '1 - 3 yrs',
          requiredSkills: ['Statutory Payroll & Indian Labor Laws', 'Cross-Functional Stakeholder Alignment'],
          suggestedCourses: ['TRN-104'],
          checkpoint: 'Flawless execution of monthly attendance, leaves, and payroll records.'
        },
        {
          role: 'HR Operations Lead',
          nextRole: 'Branch HR Head / Talent Director',
          experienceYears: '3 - 6 yrs',
          requiredSkills: ['Team Mentorship & People Development', 'Strategic Thinking & OKR Formulation'],
          suggestedCourses: ['TRN-102'],
          checkpoint: 'Oversee multi-branch compliance audits, retention programs, and employee satisfaction scores > 85%.'
        }
      ]
    }
  ];

  // Helper to load or initialize storage
  function loadStorage(key, defaultData) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`[GrowthStore] Error reading ${key} from LocalStorage:`, e);
    }
    try {
      localStorage.setItem(key, JSON.stringify(defaultData));
    } catch (e) {
      console.warn(`[GrowthStore] Error saving default to ${key}:`, e);
    }
    return defaultData;
  }

  function saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[GrowthStore] Error saving ${key} to LocalStorage:`, e);
    }
  }

  // Generate seed goals
  function generateDefaultGoals() {
    return [
      {
        id: 'G-1001',
        title: 'Migrate Core Payroll Calculations to Worker Engine',
        description: 'Decouple client thread locks by moving batch deductions and tax computations into web workers.',
        employeeId: 'EMP-1001',
        employeeName: 'Priya Sharma',
        department: 'Engineering',
        branch: 'Bengaluru HQ',
        category: 'Technical',
        startDate: '2026-07-01',
        targetDate: '2026-10-30',
        measurementMethod: 'Quantitative',
        targetValue: '100% Worker Offload',
        currentProgress: 90,
        priority: 'High',
        owner: 'Priya Sharma',
        status: 'In Progress',
        milestones: [
          { title: 'Tax math worker isolation', completed: true },
          { title: 'Benchmark 5000 employee batch', completed: true },
          { title: 'Full rollback test suite', completed: false }
        ],
        updates: [
          { date: '2026-10-05', note: 'Worker architecture completed. Execution time lowered from 840ms to 42ms.' }
        ]
      },
      {
        id: 'G-1002',
        title: 'Launch Self-Service ESS Phase 4 Portal Adoption',
        description: 'Achieve at least 80% employee engagement on self-service leave and punch views within 30 days of launch.',
        employeeId: 'EMP-1002',
        employeeName: 'Amit Patel',
        department: 'Product',
        branch: 'Mumbai West',
        category: 'Product',
        startDate: '2026-08-01',
        targetDate: '2026-11-15',
        measurementMethod: 'Quantitative',
        targetValue: '85% Active Adoption',
        currentProgress: 75,
        priority: 'High',
        owner: 'Amit Patel',
        status: 'In Progress',
        milestones: [
          { title: 'User testing with 4 branch teams', completed: true },
          { title: 'Feedback resolution', completed: true },
          { title: 'Pan-India launch circular', completed: false }
        ],
        updates: [
          { date: '2026-10-10', note: 'Pilot rollouts in Mumbai and Bengaluru HQ passed with 92% satisfaction.' }
        ]
      },
      {
        id: 'G-1003',
        title: 'Standardize All Branch Holiday Calendars for FY27',
        description: 'Audit state-specific gazetted public holidays and configure holiday calendar across all 12 branches.',
        employeeId: 'EMP-1003',
        employeeName: 'Sunita Rao',
        department: 'Human Resources',
        branch: 'Hyderabad Tech Park',
        category: 'Operational',
        startDate: '2026-09-01',
        targetDate: '2026-10-25',
        measurementMethod: 'Quantitative',
        targetValue: '12 Branches Approved',
        currentProgress: 100,
        priority: 'Medium',
        owner: 'Sunita Rao',
        status: 'Completed',
        milestones: [
          { title: 'Compile state labor notifications', completed: true },
          { title: 'Input into Holiday Calendar Manager', completed: true },
          { title: 'Executive HR approval', completed: true }
        ],
        updates: [
          { date: '2026-10-02', note: 'All branch managers signed off on regional festivals.' }
        ]
      },
      {
        id: 'G-1004',
        title: 'Multi-Region High Availability Disaster Recovery Setup',
        description: 'Establish automated failover between AWS Mumbai and Hyderabad data center regions with RTO < 5m.',
        employeeId: 'EMP-1004',
        employeeName: 'Rajesh Nair',
        department: 'Infrastructure',
        branch: 'Delhi NCR Hub',
        category: 'Technical',
        startDate: '2026-07-15',
        targetDate: '2026-10-15',
        measurementMethod: 'Qualitative',
        targetValue: 'Zero-loss Failover',
        currentProgress: 95,
        priority: 'Urgent',
        owner: 'Rajesh Nair',
        status: 'In Progress',
        milestones: [
          { title: 'Cross-region read replica deployment', completed: true },
          { title: 'Route53 automated health checks', completed: true },
          { title: 'Drill test execution', completed: false }
        ],
        updates: [
          { date: '2026-10-08', note: 'Live simulation planned for Saturday midnight maintenance window.' }
        ]
      },
      {
        id: 'G-1005',
        title: 'Automate Pan-India Statutory TDS Reconciliation',
        description: 'Integrate Form 24Q quarterly filing preview and reduce manual tax adjustments to zero.',
        employeeId: 'EMP-1005',
        employeeName: 'Deepa Menon',
        department: 'Finance',
        branch: 'Chennai Central',
        category: 'Operational',
        startDate: '2026-08-15',
        targetDate: '2026-11-30',
        measurementMethod: 'Quantitative',
        targetValue: '100% Auto-Reconciliation',
        currentProgress: 60,
        priority: 'High',
        owner: 'Deepa Menon',
        status: 'In Progress',
        milestones: [
          { title: 'Verify tax slab rules for FY26-27', completed: true },
          { title: 'Build export template for TRACES', completed: false }
        ],
        updates: [
          { date: '2026-09-28', note: 'Draft specifications created and shared with legal.' }
        ]
      },
      {
        id: 'G-1006',
        title: 'API Gateway Rate Limiting & Latency Reduction',
        description: 'Optimize backend response times to p99 < 120ms across branch check-in endpoints.',
        employeeId: 'EMP-1006',
        employeeName: 'Vikram Malhotra',
        department: 'Engineering',
        branch: 'Bengaluru HQ',
        category: 'Technical',
        startDate: '2026-09-01',
        targetDate: '2026-10-20',
        measurementMethod: 'Quantitative',
        targetValue: 'p99 < 120ms',
        currentProgress: 80,
        priority: 'High',
        owner: 'Vikram Malhotra',
        status: 'In Progress',
        milestones: [
          { title: 'Redis token bucket implementation', completed: true },
          { title: 'Load testing with 10k virtual users', completed: true },
          { title: 'Production rollout', completed: false }
        ],
        updates: [
          { date: '2026-10-11', note: 'Latency benchmarked at 88ms under peak load.' }
        ]
      },
      {
        id: 'G-1007',
        title: 'Design System 2.0 Dark Mode & Accessibility Audit',
        description: 'Attain WCAG 2.1 AA compliance across all dashboard screens and modals.',
        employeeId: 'EMP-1007',
        employeeName: 'Neha Deshmukh',
        department: 'Product',
        branch: 'Mumbai West',
        category: 'Innovation',
        startDate: '2026-08-01',
        targetDate: '2026-10-31',
        measurementMethod: 'Quantitative',
        targetValue: '100% WCAG 2.1 AA',
        currentProgress: 85,
        priority: 'Medium',
        owner: 'Neha Deshmukh',
        status: 'In Progress',
        milestones: [
          { title: 'Color contrast audit', completed: true },
          { title: 'Keyboard focus rings standardization', completed: true },
          { title: 'Screen reader testing', completed: false }
        ],
        updates: [
          { date: '2026-10-09', note: 'Contrast ratios on primary badges updated.' }
        ]
      },
      {
        id: 'G-1008',
        title: 'Zero-Downtime Database Migration Pipeline',
        description: 'Establish automated Liquibase schema change automation with instant rollback guardrails.',
        employeeId: 'EMP-1008',
        employeeName: 'Karthik Iyer',
        department: 'Infrastructure',
        branch: 'Pune Hinjewadi',
        category: 'Technical',
        startDate: '2026-07-01',
        targetDate: '2026-09-30',
        measurementMethod: 'Qualitative',
        targetValue: 'Zero Outage Pipeline',
        currentProgress: 100,
        priority: 'High',
        owner: 'Karthik Iyer',
        status: 'Completed',
        milestones: [
          { title: 'Script validations in staging', completed: true },
          { title: 'Pipeline trigger in CI/CD', completed: true },
          { title: 'Documentation & runbook', completed: true }
        ],
        updates: [
          { date: '2026-09-25', note: 'Successfully completed without any downtime.' }
        ]
      },
      {
        id: 'G-1011',
        title: 'End-to-End Test Automation Coverage > 85%',
        description: 'Build comprehensive regression suite covering all attendance, leave, and payroll wizard flows.',
        employeeId: 'EMP-1011',
        employeeName: 'Divya Sundaram',
        department: 'Engineering',
        branch: 'Bengaluru HQ',
        category: 'Technical',
        startDate: '2026-08-15',
        targetDate: '2026-11-15',
        measurementMethod: 'Quantitative',
        targetValue: '85% Coverage',
        currentProgress: 70,
        priority: 'Medium',
        owner: 'Divya Sundaram',
        status: 'In Progress',
        milestones: [
          { title: 'Payroll test cases', completed: true },
          { title: 'Attendance daily roster tests', completed: true },
          { title: 'Leave balance assertions', completed: false }
        ],
        updates: [
          { date: '2026-10-07', note: '142 automated scenarios currently green in CI.' }
        ]
      },
      {
        id: 'G-1014',
        title: 'Deploy SD-WAN Across Northern Branches',
        description: 'Upgrade network reliability and dual-ISP redundancy across Delhi, Chandigarh, and Jaipur sites.',
        employeeId: 'EMP-1014',
        employeeName: 'Manish Aggarwal',
        department: 'Infrastructure',
        branch: 'Delhi NCR Hub',
        category: 'Operational',
        startDate: '2026-09-01',
        targetDate: '2026-11-20',
        measurementMethod: 'Quantitative',
        targetValue: '3 Branches Deployed',
        currentProgress: 65,
        priority: 'High',
        owner: 'Manish Aggarwal',
        status: 'In Progress',
        milestones: [
          { title: 'Delhi NCR installation', completed: true },
          { title: 'Chandigarh cutover', completed: true },
          { title: 'Jaipur configuration', completed: false }
        ],
        updates: [
          { date: '2026-10-04', note: 'Delhi and Chandigarh live on redundant fiber.' }
        ]
      }
    ];
  }

  // Generate seed Appraisals
  function generateDefaultAppraisals() {
    return [
      {
        id: 'APR-1001-Q3',
        cycleId: 'RC-2026-Q3',
        cycleName: 'Q3 2026 Performance Appraisal Cycle',
        employeeId: 'EMP-1001',
        employeeName: 'Priya Sharma',
        designation: 'Staff Software Engineer',
        department: 'Engineering',
        branch: 'Bengaluru HQ',
        reviewerId: 'EMP-MGR-01',
        reviewerName: 'Kavita Krishnamurthy',
        reviewPeriod: 'Q3 2026',
        status: 'Completed',
        selfAssessmentSubmitted: true,
        selfAssessmentDate: '2026-09-28',
        managerReviewDate: '2026-10-10',
        selfRatings: {
          jobKnowledge: 5,
          qualityOfWork: 5,
          productivity: 5,
          communication: 4,
          teamwork: 5,
          reliability: 5,
          leadership: 5,
          goalAchievement: 5
        },
        selfComments: 'Spearheaded worker engine architecture, mentored 3 senior engineers, and ensured zero downtime for the multibranch payroll rollout.',
        selfAchievements: 'Completed worker offload for payroll engine; authored design doc for multibranch concurrency.',
        selfChallenges: 'Balancing hands-on architecture with increasing cross-branch technical consultations.',
        selfSupportRequested: 'Support for attending International Distributed Systems Summit.',
        managerRatings: {
          jobKnowledge: 5,
          qualityOfWork: 5,
          productivity: 5,
          communication: 5,
          teamwork: 5,
          reliability: 5,
          leadership: 5,
          goalAchievement: 5
        },
        overallScore: 5.0,
        keyStrengths: 'Exceptional architectural foresight, unyielding commitment to code quality, natural technical leadership across multiple engineering squads.',
        areasForImprovement: 'Delegate exploratory tasks to senior engineers to free up bandwidth for org-wide strategic tech vision.',
        reviewerComments: 'Priya is a standout talent and an engineering pillar at EmployeeHub. Her technical leadership on the payroll engine saved weeks of development time.',
        developmentRecommendations: 'Recommend for promotion to Principal Software Engineer (L6). Enroll in Executive Leadership Coaching.',
        promotionRecommendation: 'Recommended for Discussion'
      },
      {
        id: 'APR-1002-Q3',
        cycleId: 'RC-2026-Q3',
        cycleName: 'Q3 2026 Performance Appraisal Cycle',
        employeeId: 'EMP-1002',
        employeeName: 'Amit Patel',
        designation: 'Senior Product Manager',
        department: 'Product',
        branch: 'Mumbai West',
        reviewerId: 'EMP-MGR-02',
        reviewerName: 'Rohan Deshmukh',
        reviewPeriod: 'Q3 2026',
        status: 'Completed',
        selfAssessmentSubmitted: true,
        selfAssessmentDate: '2026-09-26',
        managerReviewDate: '2026-10-08',
        selfRatings: {
          jobKnowledge: 5,
          qualityOfWork: 5,
          productivity: 4,
          communication: 5,
          teamwork: 5,
          reliability: 5,
          leadership: 5,
          goalAchievement: 4
        },
        selfComments: 'Delivered customer-centric PRDs and led collaborative cross-functional product discovery with branch heads.',
        selfAchievements: 'Launched Phase 4 Self-Service and Notification center roadmap.',
        selfChallenges: 'Managing competing feature requests from 12 branch locations simultaneously.',
        selfSupportRequested: 'Advanced product analytics tools and instrumentation.',
        managerRatings: {
          jobKnowledge: 5,
          qualityOfWork: 5,
          productivity: 5,
          communication: 5,
          teamwork: 5,
          reliability: 4,
          leadership: 5,
          goalAchievement: 4
        },
        overallScore: 4.8,
        keyStrengths: 'Mastery over product roadmaps, deep empathy for operational staff, highly articulate communication.',
        areasForImprovement: 'Improve quantitative milestone tracking to avoid end-of-quarter delivery crunches.',
        reviewerComments: 'Amit has demonstrated tremendous maturity and ownership. A clear candidate for Lead Product Manager.',
        developmentRecommendations: 'Transition ownership of individual modules to associate PMs and focus on multi-branch monetization.',
        promotionRecommendation: 'Recommended for Discussion'
      },
      {
        id: 'APR-1003-Q3',
        cycleId: 'RC-2026-Q3',
        cycleName: 'Q3 2026 Performance Appraisal Cycle',
        employeeId: 'EMP-1003',
        employeeName: 'Sunita Rao',
        designation: 'HR Operations Lead',
        department: 'Human Resources',
        branch: 'Hyderabad Tech Park',
        reviewerId: 'EMP-MGR-03',
        reviewerName: 'Suresh Reddy',
        reviewPeriod: 'Q3 2026',
        status: 'Completed',
        selfAssessmentSubmitted: true,
        selfAssessmentDate: '2026-09-25',
        managerReviewDate: '2026-10-05',
        selfRatings: {
          jobKnowledge: 5,
          qualityOfWork: 5,
          productivity: 5,
          communication: 5,
          teamwork: 5,
          reliability: 5,
          leadership: 4,
          goalAchievement: 5
        },
        selfComments: 'Achieved 100% statutory compliance across all operating units and led nationwide leave policy standardization.',
        selfAchievements: 'Unified leave quotas and holiday calendars without a single branch grievance.',
        selfChallenges: 'Navigating varying state holiday notifications with tight turnarounds.',
        selfSupportRequested: 'Labor law compliance updates subscription.',
        managerRatings: {
          jobKnowledge: 5,
          qualityOfWork: 5,
          productivity: 5,
          communication: 5,
          teamwork: 5,
          reliability: 5,
          leadership: 4,
          goalAchievement: 5
        },
        overallScore: 4.9,
        keyStrengths: 'Flawless compliance governance, unmatched empathy, systematic organizational skills.',
        areasForImprovement: 'Expand involvement in tech-driven HR automation initiatives.',
        reviewerComments: 'Sunita is indispensable to branch operations. Highly recommended for Branch HR Head.',
        developmentRecommendations: 'Assign as mentor for regional HR executives.',
        promotionRecommendation: 'Approved for Next-Step Review'
      },
      {
        id: 'APR-1004-Q3',
        cycleId: 'RC-2026-Q3',
        cycleName: 'Q3 2026 Performance Appraisal Cycle',
        employeeId: 'EMP-1004',
        employeeName: 'Rajesh Nair',
        designation: 'Cloud Solutions Architect',
        department: 'Infrastructure',
        branch: 'Delhi NCR Hub',
        reviewerId: 'EMP-MGR-04',
        reviewerName: 'Ananya Saxena',
        reviewPeriod: 'Q3 2026',
        status: 'Completed',
        selfAssessmentSubmitted: true,
        selfAssessmentDate: '2026-09-22',
        managerReviewDate: '2026-10-02',
        selfRatings: {
          jobKnowledge: 5,
          qualityOfWork: 4,
          productivity: 5,
          communication: 4,
          teamwork: 4,
          reliability: 5,
          leadership: 5,
          goalAchievement: 5
        },
        selfComments: 'Maintained 99.98% platform uptime and led high availability multi-region infrastructure architecture.',
        selfAchievements: 'Automated infrastructure backups and disaster recovery failover pipelines.',
        selfChallenges: 'Balancing infrastructure cost containment with rapid branch expansion.',
        selfSupportRequested: 'Kubernetes cloud certification renewal.',
        managerRatings: {
          jobKnowledge: 5,
          qualityOfWork: 5,
          productivity: 4,
          communication: 4,
          teamwork: 4,
          reliability: 5,
          leadership: 5,
          goalAchievement: 5
        },
        overallScore: 4.6,
        keyStrengths: 'Rock-solid technical execution, calm under critical incident pressure, thorough cloud knowledge.',
        areasForImprovement: 'Document architectural decision records (ADRs) more proactively for external contractors.',
        reviewerComments: 'Rajesh continues to be our most dependable infrastructure anchor.',
        developmentRecommendations: 'Lead the cloud FinOps cost governance program in Q4.',
        promotionRecommendation: 'Under Review'
      },
      {
        id: 'APR-1006-Q3',
        cycleId: 'RC-2026-Q3',
        cycleName: 'Q3 2026 Performance Appraisal Cycle',
        employeeId: 'EMP-1006',
        employeeName: 'Vikram Malhotra',
        designation: 'Lead Backend Engineer',
        department: 'Engineering',
        branch: 'Bengaluru HQ',
        reviewerId: 'EMP-MGR-01',
        reviewerName: 'Kavita Krishnamurthy',
        reviewPeriod: 'Q3 2026',
        status: 'Submitted',
        selfAssessmentSubmitted: true,
        selfAssessmentDate: '2026-10-01',
        managerReviewDate: '',
        selfRatings: {
          jobKnowledge: 5,
          qualityOfWork: 4,
          productivity: 5,
          communication: 4,
          teamwork: 4,
          reliability: 5,
          leadership: 4,
          goalAchievement: 4
        },
        selfComments: 'Focused on API rate limiting, database sharding, and latency optimization. Ready for managerial appraisal review.',
        selfAchievements: 'Reduced API response times by 35% on high-traffic punch endpoints.',
        selfChallenges: 'Complex data synchronization during peak morning punch hours.',
        selfSupportRequested: 'High performance database optimization workshop.',
        managerRatings: null,
        overallScore: null,
        keyStrengths: '',
        areasForImprovement: '',
        reviewerComments: '',
        developmentRecommendations: '',
        promotionRecommendation: 'Under Review'
      },
      {
        id: 'APR-1007-Q3',
        cycleId: 'RC-2026-Q3',
        cycleName: 'Q3 2026 Performance Appraisal Cycle',
        employeeId: 'EMP-1007',
        employeeName: 'Neha Deshmukh',
        designation: 'UX Design Lead',
        department: 'Product',
        branch: 'Mumbai West',
        reviewerId: 'EMP-MGR-02',
        reviewerName: 'Rohan Deshmukh',
        reviewPeriod: 'Q3 2026',
        status: 'Submitted',
        selfAssessmentSubmitted: true,
        selfAssessmentDate: '2026-10-02',
        managerReviewDate: '',
        selfRatings: {
          jobKnowledge: 5,
          qualityOfWork: 5,
          productivity: 4,
          communication: 4,
          teamwork: 5,
          reliability: 4,
          leadership: 4,
          goalAchievement: 4
        },
        selfComments: 'Standardized typography, color tokens, and accessible modal patterns across the entire application.',
        selfAchievements: 'Created unified component library tokens reducing UI inconsistencies to zero.',
        selfChallenges: 'Ensuring design compliance across multiple concurrently developed modules.',
        selfSupportRequested: 'Design systems conference attendance.',
        managerRatings: null,
        overallScore: null,
        keyStrengths: '',
        areasForImprovement: '',
        reviewerComments: '',
        developmentRecommendations: '',
        promotionRecommendation: 'Under Review'
      },
      {
        id: 'APR-1008-Q3',
        cycleId: 'RC-2026-Q3',
        cycleName: 'Q3 2026 Performance Appraisal Cycle',
        employeeId: 'EMP-1008',
        employeeName: 'Karthik Iyer',
        designation: 'DevOps & SRE Specialist',
        department: 'Infrastructure',
        branch: 'Pune Hinjewadi',
        reviewerId: 'EMP-MGR-05',
        reviewerName: 'Manish Joshi',
        reviewPeriod: 'Q3 2026',
        status: 'Draft',
        selfAssessmentSubmitted: false,
        selfAssessmentDate: '',
        managerReviewDate: '',
        selfRatings: null,
        selfComments: '',
        selfAchievements: '',
        selfChallenges: '',
        selfSupportRequested: '',
        managerRatings: null,
        overallScore: null,
        keyStrengths: '',
        areasForImprovement: '',
        reviewerComments: '',
        developmentRecommendations: '',
        promotionRecommendation: 'Not Reviewed'
      }
    ];
  }

  // Generate seed Individual Development Plans (IDP)
  function generateDefaultDevPlans() {
    return [
      {
        id: 'IDP-1001',
        employeeId: 'EMP-1001',
        employeeName: 'Priya Sharma',
        designation: 'Staff Software Engineer',
        branch: 'Bengaluru HQ',
        careerObjective: 'Advance to Principal Software Engineer (L6) and spearhead enterprise distributed systems architecture.',
        targetRole: 'Principal Software Engineer (L6)',
        targetSkill: 'Strategic Thinking & OKR Formulation',
        currentStrengths: 'Distributed systems, concurrency patterns, web workers, rigorous code reviews.',
        developmentAreas: 'Executive presence, cross-branch organizational strategy, patent disclosures.',
        mentor: 'Kavita Krishnamurthy (VP Engineering)',
        reviewNotes: 'Exceptional progress. Completed 3 of 4 action items in Q3.',
        progress: 75,
        status: 'Active',
        actionItems: [
          {
            id: 'ACT-1',
            action: 'Lead enterprise architectural review board sessions',
            learningActivity: 'Bi-weekly technical architecture governance reviews',
            mentor: 'Kavita Krishnamurthy',
            targetDate: '2026-10-31',
            status: 'Completed'
          },
          {
            id: 'ACT-2',
            action: 'Complete Executive Leadership Workshop',
            learningActivity: 'TRN-102 Course enrollment',
            mentor: 'HR Leadership Academy',
            targetDate: '2026-11-10',
            status: 'In Progress'
          },
          {
            id: 'ACT-3',
            action: 'Publish whitepaper on High-Throughput HRMS Calculations',
            learningActivity: 'Author internal technical whitepaper and benchmark report',
            mentor: 'Praveen Kulkarni',
            targetDate: '2026-12-15',
            status: 'Pending'
          }
        ]
      },
      {
        id: 'IDP-1002',
        employeeId: 'EMP-1002',
        employeeName: 'Amit Patel',
        designation: 'Senior Product Manager',
        branch: 'Mumbai West',
        careerObjective: 'Advance to Lead Product Manager overseeing multi-branch operational productivity applications.',
        targetRole: 'Lead Product Manager',
        targetSkill: 'Team Mentorship & People Development',
        currentStrengths: 'PRD synthesis, customer discovery, empathetic cross-functional coordination.',
        developmentAreas: 'Data-driven quantitative OKR instrumentation, delegation to associate PMs.',
        mentor: 'Rohan Deshmukh (Branch Director)',
        reviewNotes: 'Strong leadership on Phase 4 launch. Coaching 1 associate PM.',
        progress: 80,
        status: 'Active',
        actionItems: [
          {
            id: 'ACT-4',
            action: 'Define North Star metric for employee self-service portal',
            learningActivity: 'Instrumentation of ESS telemetry & retention funnels',
            mentor: 'Rohan Deshmukh',
            targetDate: '2026-10-25',
            status: 'Completed'
          },
          {
            id: 'ACT-5',
            action: 'Mentor Associate PM on writing PRDs',
            learningActivity: 'Weekly 1-on-1 coaching & PRD peer reviews',
            mentor: 'Amit Patel',
            targetDate: '2026-11-30',
            status: 'In Progress'
          }
        ]
      },
      {
        id: 'IDP-1003',
        employeeId: 'EMP-1003',
        employeeName: 'Sunita Rao',
        designation: 'HR Operations Lead',
        branch: 'Hyderabad Tech Park',
        careerObjective: 'Transition to Branch HR Head with autonomous oversight over regional talent, recruitment, and retention.',
        targetRole: 'Branch HR Head',
        targetSkill: 'Strategic Workforce Planning',
        currentStrengths: 'Statutory compliance, labor relations, employee grievance resolution.',
        developmentAreas: 'Strategic compensation structuring, leadership succession planning.',
        mentor: 'Suresh Reddy (Branch Manager)',
        reviewNotes: 'Ready for higher responsibility. Excellent compliance record.',
        progress: 90,
        status: 'Active',
        actionItems: [
          {
            id: 'ACT-6',
            action: 'Design regional retention program for high-turnover tech roles',
            learningActivity: 'Analyze exit interview data and implement stay-interviews',
            mentor: 'Suresh Reddy',
            targetDate: '2026-10-20',
            status: 'Completed'
          },
          {
            id: 'ACT-7',
            action: 'Attend National HR Leadership Summit',
            learningActivity: 'Executive networking & labor law panel participation',
            mentor: 'HR Central',
            targetDate: '2026-11-15',
            status: 'In Progress'
          }
        ]
      },
      {
        id: 'IDP-1006',
        employeeId: 'EMP-1006',
        employeeName: 'Vikram Malhotra',
        designation: 'Lead Backend Engineer',
        branch: 'Bengaluru HQ',
        careerObjective: 'Grow into Staff Software Engineer specializing in low-latency systems and database scalability.',
        targetRole: 'Staff Software Engineer (L6)',
        targetSkill: 'Cloud Architecture (AWS/GCP/Azure)',
        currentStrengths: 'Node.js, PostgreSQL query tuning, caching architectures.',
        developmentAreas: 'Multi-region failover, Kubernetes orchestration, mentorship.',
        mentor: 'Priya Sharma (Staff Engineer)',
        reviewNotes: 'Enrolled in Cloud Architecture Masterclass.',
        progress: 60,
        status: 'Active',
        actionItems: [
          {
            id: 'ACT-8',
            action: 'Complete Cloud Architecture Masterclass',
            learningActivity: 'TRN-101 Course enrollment and capstone project',
            mentor: 'Praveen Kulkarni',
            targetDate: '2026-10-28',
            status: 'In Progress'
          },
          {
            id: 'ACT-9',
            action: 'Refactor punch synchronization database queries',
            learningActivity: 'Query execution plan analysis and index partitioning',
            mentor: 'Priya Sharma',
            targetDate: '2026-11-15',
            status: 'In Progress'
          }
        ]
      }
    ];
  }

  // Generate seed Employee Skills Matrix
  function generateDefaultEmployeeSkills() {
    return [
      // EMP-1001: Priya Sharma (Staff Engineer)
      { employeeId: 'EMP-1001', skillId: 'SKILL-01', skillName: 'Cloud Architecture (AWS/GCP/Azure)', proficiency: 'Expert', verifiedBy: 'Kavita Krishnamurthy', lastAssessed: '2026-10-01' },
      { employeeId: 'EMP-1001', skillId: 'SKILL-02', skillName: 'Distributed Systems & Microservices', proficiency: 'Expert', verifiedBy: 'Kavita Krishnamurthy', lastAssessed: '2026-10-01' },
      { employeeId: 'EMP-1001', skillId: 'SKILL-03', skillName: 'Frontend Architecture (React/JS/CSS)', proficiency: 'Advanced', verifiedBy: 'Kavita Krishnamurthy', lastAssessed: '2026-09-15' },
      { employeeId: 'EMP-1001', skillId: 'SKILL-04', skillName: 'Kubernetes & Container Orchestration', proficiency: 'Advanced', verifiedBy: 'Rajesh Nair', lastAssessed: '2026-08-20' },
      { employeeId: 'EMP-1001', skillId: 'SKILL-11', skillName: 'Strategic Thinking & OKR Formulation', proficiency: 'Advanced', verifiedBy: 'Kavita Krishnamurthy', lastAssessed: '2026-09-01' },
      { employeeId: 'EMP-1001', skillId: 'SKILL-12', skillName: 'Team Mentorship & People Development', proficiency: 'Expert', verifiedBy: 'Kavita Krishnamurthy', lastAssessed: '2026-10-01' },

      // EMP-1002: Amit Patel (Senior PM)
      { employeeId: 'EMP-1002', skillId: 'SKILL-06', skillName: 'Product Roadmapping & PRD Writing', proficiency: 'Expert', verifiedBy: 'Rohan Deshmukh', lastAssessed: '2026-09-20' },
      { employeeId: 'EMP-1002', skillId: 'SKILL-07', skillName: 'UX Research & Rapid Prototyping', proficiency: 'Advanced', verifiedBy: 'Neha Deshmukh', lastAssessed: '2026-09-10' },
      { employeeId: 'EMP-1002', skillId: 'SKILL-11', skillName: 'Strategic Thinking & OKR Formulation', proficiency: 'Advanced', verifiedBy: 'Rohan Deshmukh', lastAssessed: '2026-09-25' },
      { employeeId: 'EMP-1002', skillId: 'SKILL-13', skillName: 'Cross-Functional Stakeholder Alignment', proficiency: 'Expert', verifiedBy: 'Rohan Deshmukh', lastAssessed: '2026-10-02' },

      // EMP-1003: Sunita Rao (HR Lead)
      { employeeId: 'EMP-1003', skillId: 'SKILL-08', skillName: 'Statutory Payroll & Indian Labor Laws', proficiency: 'Expert', verifiedBy: 'Suresh Reddy', lastAssessed: '2026-09-25' },
      { employeeId: 'EMP-1003', skillId: 'SKILL-12', skillName: 'Team Mentorship & People Development', proficiency: 'Advanced', verifiedBy: 'Suresh Reddy', lastAssessed: '2026-09-20' },
      { employeeId: 'EMP-1003', skillId: 'SKILL-13', skillName: 'Cross-Functional Stakeholder Alignment', proficiency: 'Advanced', verifiedBy: 'Suresh Reddy', lastAssessed: '2026-09-15' },

      // EMP-1004: Rajesh Nair (Cloud Architect)
      { employeeId: 'EMP-1004', skillId: 'SKILL-01', skillName: 'Cloud Architecture (AWS/GCP/Azure)', proficiency: 'Expert', verifiedBy: 'Ananya Saxena', lastAssessed: '2026-09-18' },
      { employeeId: 'EMP-1004', skillId: 'SKILL-04', skillName: 'Kubernetes & Container Orchestration', proficiency: 'Expert', verifiedBy: 'Ananya Saxena', lastAssessed: '2026-09-18' },
      { employeeId: 'EMP-1004', skillId: 'SKILL-15', skillName: 'Information Security & Compliance Audits', proficiency: 'Advanced', verifiedBy: 'Ananya Saxena', lastAssessed: '2026-08-30' },

      // EMP-1006: Vikram Malhotra (Lead Backend)
      { employeeId: 'EMP-1006', skillId: 'SKILL-02', skillName: 'Distributed Systems & Microservices', proficiency: 'Advanced', verifiedBy: 'Priya Sharma', lastAssessed: '2026-09-10' },
      { employeeId: 'EMP-1006', skillId: 'SKILL-05', skillName: 'Database Architecture & Query Tuning', proficiency: 'Advanced', verifiedBy: 'Priya Sharma', lastAssessed: '2026-09-10' },
      { employeeId: 'EMP-1006', skillId: 'SKILL-01', skillName: 'Cloud Architecture (AWS/GCP/Azure)', proficiency: 'Intermediate', verifiedBy: 'Priya Sharma', lastAssessed: '2026-08-15' },

      // EMP-1007: Neha Deshmukh (UX Lead)
      { employeeId: 'EMP-1007', skillId: 'SKILL-07', skillName: 'UX Research & Rapid Prototyping', proficiency: 'Expert', verifiedBy: 'Amit Patel', lastAssessed: '2026-09-05' },
      { employeeId: 'EMP-1007', skillId: 'SKILL-03', skillName: 'Frontend Architecture (React/JS/CSS)', proficiency: 'Advanced', verifiedBy: 'Amit Patel', lastAssessed: '2026-09-05' },

      // EMP-1011: Divya Sundaram (QA Lead)
      { employeeId: 'EMP-1011', skillId: 'SKILL-03', skillName: 'Frontend Architecture (React/JS/CSS)', proficiency: 'Intermediate', verifiedBy: 'Vikram Malhotra', lastAssessed: '2026-08-10' },
      { employeeId: 'EMP-1011', skillId: 'SKILL-14', skillName: 'Complex Problem Solving & Root Cause', proficiency: 'Advanced', verifiedBy: 'Vikram Malhotra', lastAssessed: '2026-09-01' }
    ];
  }

  // Generate seed Course Enrollments
  function generateDefaultEnrollments() {
    return [
      {
        id: 'ENR-101-01',
        courseId: 'TRN-101',
        courseName: 'Cloud Architecture Masterclass (AWS & Kubernetes)',
        employeeId: 'EMP-1006',
        employeeName: 'Vikram Malhotra',
        branch: 'Bengaluru HQ',
        enrolledDate: '2026-09-25',
        progress: 75,
        attendanceRate: 90,
        status: 'In Progress',
        completedDate: '',
        certificateIssued: false
      },
      {
        id: 'ENR-101-02',
        courseId: 'TRN-101',
        courseName: 'Cloud Architecture Masterclass (AWS & Kubernetes)',
        employeeId: 'EMP-1008',
        employeeName: 'Karthik Iyer',
        branch: 'Pune Hinjewadi',
        enrolledDate: '2026-09-25',
        progress: 85,
        attendanceRate: 95,
        status: 'In Progress',
        completedDate: '',
        certificateIssued: false
      },
      {
        id: 'ENR-102-01',
        courseId: 'TRN-102',
        courseName: 'Executive Leadership & People Management',
        employeeId: 'EMP-1001',
        employeeName: 'Priya Sharma',
        branch: 'Bengaluru HQ',
        enrolledDate: '2026-10-02',
        progress: 30,
        attendanceRate: 100,
        status: 'In Progress',
        completedDate: '',
        certificateIssued: false
      },
      {
        id: 'ENR-102-02',
        courseId: 'TRN-102',
        courseName: 'Executive Leadership & People Management',
        employeeId: 'EMP-1002',
        employeeName: 'Amit Patel',
        branch: 'Mumbai West',
        enrolledDate: '2026-10-04',
        progress: 25,
        attendanceRate: 100,
        status: 'In Progress',
        completedDate: '',
        certificateIssued: false
      },
      {
        id: 'ENR-103-01',
        courseId: 'TRN-103',
        courseName: 'Modern Web Engineering & React 19 Standards',
        employeeId: 'EMP-1001',
        employeeName: 'Priya Sharma',
        branch: 'Bengaluru HQ',
        enrolledDate: '2026-08-05',
        progress: 100,
        attendanceRate: 100,
        status: 'Completed',
        completedDate: '2026-09-20',
        certificateIssued: true
      },
      {
        id: 'ENR-103-02',
        courseId: 'TRN-103',
        courseName: 'Modern Web Engineering & React 19 Standards',
        employeeId: 'EMP-1007',
        employeeName: 'Neha Deshmukh',
        branch: 'Mumbai West',
        enrolledDate: '2026-08-05',
        progress: 100,
        attendanceRate: 95,
        status: 'Completed',
        completedDate: '2026-09-22',
        certificateIssued: true
      },
      {
        id: 'ENR-106-01',
        courseId: 'TRN-106',
        courseName: 'Cross-Functional Stakeholder Negotiation',
        employeeId: 'EMP-1003',
        employeeName: 'Sunita Rao',
        branch: 'Hyderabad Tech Park',
        enrolledDate: '2026-07-10',
        progress: 100,
        attendanceRate: 100,
        status: 'Completed',
        completedDate: '2026-08-25',
        certificateIssued: true
      }
    ];
  }

  // Generate seed Promotion Recommendations
  function generateDefaultPromotions() {
    return [
      {
        id: 'PROM-1001',
        employeeId: 'EMP-1001',
        employeeName: 'Priya Sharma',
        currentDesignation: 'Staff Software Engineer',
        proposedRole: 'Principal Software Engineer (L6)',
        department: 'Engineering',
        branch: 'Bengaluru HQ',
        tenure: '5 yrs 7 mos',
        appraisalScore: 5.0,
        goalCompletionRate: 90,
        skillsCount: 6,
        trainingHoursCompleted: 56,
        devPlanProgress: 75,
        status: 'Recommended for Discussion',
        evaluatedBy: 'Kavita Krishnamurthy (VP Engineering)',
        evaluationDate: '2026-10-10',
        notes: 'Priya has architected the core calculating engines across Payroll and Attendance. She exemplifies L6 technical leadership, cross-squad mentorship, and deep domain mastery. Human confirmation recommended for Q4 promotion committee review.',
        readinessLevel: 'High (Immediate Advancement Candidate)',
        humanConfirmed: false
      },
      {
        id: 'PROM-1002',
        employeeId: 'EMP-1002',
        employeeName: 'Amit Patel',
        currentDesignation: 'Senior Product Manager',
        proposedRole: 'Lead Product Manager',
        department: 'Product',
        branch: 'Mumbai West',
        tenure: '4 yrs 9 mos',
        appraisalScore: 4.8,
        goalCompletionRate: 85,
        skillsCount: 4,
        trainingHoursCompleted: 44,
        devPlanProgress: 80,
        status: 'Recommended for Discussion',
        evaluatedBy: 'Rohan Deshmukh (Branch Director)',
        evaluationDate: '2026-10-08',
        notes: 'Amit has demonstrated exceptional platform stewardship and delivered seamless PRDs across multibranch modules. Ready to guide associate product managers and expand strategic product lines.',
        readinessLevel: 'High (Advancement Candidate)',
        humanConfirmed: false
      },
      {
        id: 'PROM-1003',
        employeeId: 'EMP-1003',
        employeeName: 'Sunita Rao',
        currentDesignation: 'HR Operations Lead',
        proposedRole: 'Branch HR Head',
        department: 'Human Resources',
        branch: 'Hyderabad Tech Park',
        tenure: '6 yrs 2 mos',
        appraisalScore: 4.9,
        goalCompletionRate: 100,
        skillsCount: 3,
        trainingHoursCompleted: 36,
        devPlanProgress: 90,
        status: 'Approved for Next-Step Review',
        evaluatedBy: 'Suresh Reddy (Branch Manager)',
        evaluationDate: '2026-10-05',
        notes: 'Sunita maintains an impeccable compliance track record across 12 branch entities. Committee approved to move her forward for formal executive panel interview in November.',
        readinessLevel: 'Very High (Approved for Next Stage)',
        humanConfirmed: true
      },
      {
        id: 'PROM-1004',
        employeeId: 'EMP-1004',
        employeeName: 'Rajesh Nair',
        currentDesignation: 'Cloud Solutions Architect',
        proposedRole: 'Head of Cloud Infrastructure',
        department: 'Infrastructure',
        branch: 'Delhi NCR Hub',
        tenure: '6 yrs 11 mos',
        appraisalScore: 4.6,
        goalCompletionRate: 95,
        skillsCount: 3,
        trainingHoursCompleted: 48,
        devPlanProgress: 70,
        status: 'Under Review',
        evaluatedBy: 'Ananya Saxena (Branch Manager)',
        evaluationDate: '2026-10-02',
        notes: 'Rajesh holds our cloud infrastructure together with 99.98% reliability. Currently assessing capacity for managing junior network engineers across northern hubs.',
        readinessLevel: 'Medium (Under Deliberation)',
        humanConfirmed: false
      }
    ];
  }

  // Generate seed Feedback and Recognition
  function generateDefaultFeedback() {
    return [
      {
        id: 'FB-01',
        senderId: 'EMP-1002',
        senderName: 'Amit Patel',
        recipientId: 'EMP-1001',
        recipientName: 'Priya Sharma',
        type: 'Recognition',
        badge: 'Innovation Star',
        category: 'Technical Excellence',
        message: 'Massive kudos to Priya for optimizing the multibranch payroll calculation engine! Her design made our product demo completely instantaneous.',
        date: '2026-10-11',
        visibility: 'Public', // Public or Manager Only
        relatedGoalId: 'G-1001'
      },
      {
        id: 'FB-02',
        senderId: 'EMP-MGR-01',
        senderName: 'Kavita Krishnamurthy',
        recipientId: 'EMP-1001',
        recipientName: 'Priya Sharma',
        type: 'Manager Note',
        badge: 'Leadership Impact',
        category: 'Mentorship',
        message: 'Internal review note: Priya has demonstrated natural capability to elevate senior engineers around her. Her patience during architectural review sessions is exemplary.',
        date: '2026-10-10',
        visibility: 'Manager Only',
        relatedGoalId: ''
      },
      {
        id: 'FB-03',
        senderId: 'EMP-1003',
        senderName: 'Sunita Rao',
        recipientId: 'EMP-1002',
        recipientName: 'Amit Patel',
        type: 'Recognition',
        badge: 'Customer Champion',
        category: 'Collaboration',
        message: 'Amit is always receptive to operational feedback and designed the ESS leave views with such simplicity that branch staff adopted it immediately.',
        date: '2026-10-09',
        visibility: 'Public',
        relatedGoalId: 'G-1002'
      },
      {
        id: 'FB-04',
        senderId: 'EMP-1001',
        senderName: 'Priya Sharma',
        recipientId: 'EMP-1006',
        recipientName: 'Vikram Malhotra',
        type: 'Recognition',
        badge: 'Team Player',
        category: 'Execution',
        message: 'Vikram worked through the weekend to optimize morning biometric punch indexing. Outstanding dedication to platform uptime!',
        date: '2026-10-08',
        visibility: 'Public',
        relatedGoalId: 'G-1006'
      },
      {
        id: 'FB-05',
        senderId: 'EMP-MGR-03',
        senderName: 'Suresh Reddy',
        recipientId: 'EMP-1003',
        recipientName: 'Sunita Rao',
        type: 'Recognition',
        badge: 'Consistent Achiever',
        category: 'Operational Rigor',
        message: 'Sunita standardized nationwide leave policies and public holidays across 12 distinct branch states without a single payroll dispute. Pure professionalism.',
        date: '2026-10-06',
        visibility: 'Public',
        relatedGoalId: 'G-1003'
      }
    ];
  }

  // State caches
  let reviewCycles = [];
  let appraisals = [];
  let goals = [];
  let devPlans = [];
  let skillsLibrary = [];
  let employeeSkills = [];
  let trainingCourses = [];
  let courseEnrollments = [];
  let promotionReviews = [];
  let careerPaths = [];
  let feedbackRecords = [];

  function init() {
    reviewCycles = loadStorage(STORAGE_KEY_CYCLES, DEFAULT_CYCLES);
    appraisals = loadStorage(STORAGE_KEY_APPRAISALS, generateDefaultAppraisals());
    goals = loadStorage(STORAGE_KEY_GOALS, generateDefaultGoals());
    devPlans = loadStorage(STORAGE_KEY_DEV_PLANS, generateDefaultDevPlans());
    skillsLibrary = loadStorage(STORAGE_KEY_SKILLS_LIB, DEFAULT_SKILLS);
    employeeSkills = loadStorage(STORAGE_KEY_EMP_SKILLS, generateDefaultEmployeeSkills());
    trainingCourses = loadStorage(STORAGE_KEY_COURSES, DEFAULT_COURSES);
    courseEnrollments = loadStorage(STORAGE_KEY_ENROLLMENTS, generateDefaultEnrollments());
    promotionReviews = loadStorage(STORAGE_KEY_PROMOTIONS, generateDefaultPromotions());
    careerPaths = loadStorage(STORAGE_KEY_CAREER_PATHS, DEFAULT_CAREER_PATHS);
    feedbackRecords = loadStorage(STORAGE_KEY_FEEDBACK, generateDefaultFeedback());
  }

  // Calculate Overall Weighted Score for an appraisal
  function calculateAppraisalScore(ratings) {
    if (!ratings) return 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;

    APPRAISAL_CRITERIA.forEach(crit => {
      const val = parseFloat(ratings[crit.id]) || 0;
      if (val > 0) {
        totalWeightedScore += val * crit.weight;
        totalWeight += crit.weight;
      }
    });

    if (totalWeight === 0) return 0;
    return parseFloat((totalWeightedScore / totalWeight).toFixed(1));
  }

  return {
    init,

    // Metadata & Scales
    getCriteria: () => APPRAISAL_CRITERIA,
    getRatingDescriptions: () => RATING_SCALE_DESCRIPTIONS,
    getProficiencyLevels: () => PROFICIENCY_LEVELS,

    // ==========================================
    // Review Cycles
    // ==========================================
    getReviewCycles: () => reviewCycles,
    getReviewCycleById: (id) => reviewCycles.find(c => c.id === id),
    addReviewCycle: (cycle) => {
      const newCycle = {
        id: cycle.id || `RC-${Date.now().toString().slice(-6)}`,
        name: cycle.name,
        period: cycle.period,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        deadline: cycle.deadline,
        targetScope: cycle.targetScope || 'All Branches',
        status: cycle.status || 'Active',
        description: cycle.description || '',
        createdBy: cycle.createdBy || 'HR Operations'
      };
      reviewCycles.unshift(newCycle);
      saveStorage(STORAGE_KEY_CYCLES, reviewCycles);

      // Trigger In-App Notification
      if (window.EmployeeHub.attendanceStore) {
        window.EmployeeHub.attendanceStore.addNotification({
          category: 'Growth',
          type: 'Review Cycle',
          title: `New Performance Review Cycle: ${newCycle.name}`,
          message: `The ${newCycle.name} (${newCycle.period}) has been launched with a submission deadline of ${newCycle.deadline}.`,
          branch: newCycle.targetScope
        });
      }

      return newCycle;
    },
    updateReviewCycle: (id, updates) => {
      const idx = reviewCycles.findIndex(c => c.id === id);
      if (idx !== -1) {
        reviewCycles[idx] = { ...reviewCycles[idx], ...updates };
        saveStorage(STORAGE_KEY_CYCLES, reviewCycles);
        return reviewCycles[idx];
      }
      return null;
    },

    // ==========================================
    // Appraisals
    // ==========================================
    getAppraisals: () => appraisals,
    getAppraisalById: (id) => appraisals.find(a => a.id === id),
    getAppraisalsByEmployee: (empId) => appraisals.filter(a => a.employeeId === empId),
    getAppraisalsByCycle: (cycleId) => appraisals.filter(a => a.cycleId === cycleId),
    saveAppraisal: (appraisalData) => {
      let existingIdx = appraisals.findIndex(a => a.id === appraisalData.id);
      let record;

      if (existingIdx !== -1) {
        record = { ...appraisals[existingIdx], ...appraisalData };
        // Recalculate score if manager ratings are present
        if (record.managerRatings) {
          record.overallScore = calculateAppraisalScore(record.managerRatings);
        }
        appraisals[existingIdx] = record;
      } else {
        const id = appraisalData.id || `APR-${Date.now().toString().slice(-6)}`;
        record = {
          ...appraisalData,
          id,
          overallScore: appraisalData.managerRatings ? calculateAppraisalScore(appraisalData.managerRatings) : null
        };
        appraisals.unshift(record);
      }

      saveStorage(STORAGE_KEY_APPRAISALS, appraisals);

      // Generate in-app notifications
      if (window.EmployeeHub.attendanceStore) {
        if (record.status === 'Submitted' && record.selfAssessmentSubmitted) {
          window.EmployeeHub.attendanceStore.addNotification({
            category: 'Growth',
            type: 'Appraisal Self-Assessment',
            title: `Self-Assessment Submitted: ${record.employeeName}`,
            message: `${record.employeeName} submitted their self-assessment for ${record.reviewPeriod}. Awaiting manager review.`,
            employeeId: record.employeeId,
            branch: record.branch
          });
        } else if (record.status === 'Completed') {
          window.EmployeeHub.attendanceStore.addNotification({
            category: 'Growth',
            type: 'Appraisal Completed',
            title: `Appraisal Finalized: ${record.employeeName}`,
            message: `Manager review completed with an overall calibrated score of ${record.overallScore} / 5.0.`,
            employeeId: record.employeeId,
            branch: record.branch
          });
        }
      }

      return record;
    },
    calculateAppraisalScore,

    // ==========================================
    // Goals & OKRs
    // ==========================================
    getGoals: () => goals,
    getGoalById: (id) => goals.find(g => g.id === id),
    getGoalsByEmployee: (empId) => goals.filter(g => g.employeeId === empId),
    saveGoal: (goalData) => {
      const idx = goals.findIndex(g => g.id === goalData.id);
      let record;
      if (idx !== -1) {
        record = { ...goals[idx], ...goalData };
        goals[idx] = record;
      } else {
        record = {
          ...goalData,
          id: goalData.id || `G-${Date.now().toString().slice(-6)}`,
          milestones: goalData.milestones || [],
          updates: goalData.updates || []
        };
        goals.unshift(record);

        if (window.EmployeeHub.attendanceStore) {
          window.EmployeeHub.attendanceStore.addNotification({
            category: 'Growth',
            type: 'Goal Assigned',
            title: `New Goal Assigned: ${record.title}`,
            message: `Assigned to ${record.employeeName} with target completion by ${record.targetDate}.`,
            employeeId: record.employeeId,
            branch: record.branch
          });
        }
      }
      saveStorage(STORAGE_KEY_GOALS, goals);
      return record;
    },
    updateGoalProgress: (id, progress, status, updateNote) => {
      const goal = goals.find(g => g.id === id);
      if (goal) {
        goal.currentProgress = Math.min(100, Math.max(0, parseInt(progress) || 0));
        if (status) goal.status = status;
        if (updateNote) {
          goal.updates = goal.updates || [];
          goal.updates.unshift({
            date: new Date().toISOString().slice(0, 10),
            note: updateNote
          });
        }
        if (goal.currentProgress >= 100 && goal.status !== 'Completed') {
          goal.status = 'Completed';
          if (window.EmployeeHub.attendanceStore) {
            window.EmployeeHub.attendanceStore.addNotification({
              category: 'Growth',
              type: 'Goal Completed',
              title: `Goal Achieved: ${goal.title}`,
              message: `${goal.employeeName} reached 100% completion on goal "${goal.title}".`,
              employeeId: goal.employeeId,
              branch: goal.branch
            });
          }
        }
        saveStorage(STORAGE_KEY_GOALS, goals);
        return goal;
      }
      return null;
    },

    // ==========================================
    // Individual Development Plans (IDP)
    // ==========================================
    getDevPlans: () => devPlans,
    getDevPlanByEmployee: (empId) => devPlans.find(p => p.employeeId === empId),
    saveDevPlan: (planData) => {
      const idx = devPlans.findIndex(p => p.id === planData.id || p.employeeId === planData.employeeId);
      let record;
      if (idx !== -1) {
        record = { ...devPlans[idx], ...planData };
        devPlans[idx] = record;
      } else {
        record = {
          ...planData,
          id: planData.id || `IDP-${Date.now().toString().slice(-6)}`,
          actionItems: planData.actionItems || [],
          progress: planData.progress || 0,
          status: planData.status || 'Active'
        };
        devPlans.unshift(record);
      }
      saveStorage(STORAGE_KEY_DEV_PLANS, devPlans);
      return record;
    },

    // ==========================================
    // Skills Matrix & Library
    // ==========================================
    getSkillsLibrary: () => skillsLibrary,
    getEmployeeSkills: () => employeeSkills,
    getSkillsForEmployee: (empId) => employeeSkills.filter(s => s.employeeId === empId),
    addSkillToLibrary: (skill) => {
      const newSkill = {
        id: skill.id || `SKILL-${Date.now().toString().slice(-4)}`,
        name: skill.name,
        category: skill.category || 'Technical',
        desc: skill.desc || '',
        roleFamily: skill.roleFamily || 'General'
      };
      skillsLibrary.push(newSkill);
      saveStorage(STORAGE_KEY_SKILLS_LIB, skillsLibrary);
      return newSkill;
    },
    assignSkillToEmployee: (assignment) => {
      const idx = employeeSkills.findIndex(s => s.employeeId === assignment.employeeId && s.skillId === assignment.skillId);
      if (idx !== -1) {
        employeeSkills[idx] = { ...employeeSkills[idx], ...assignment, lastAssessed: new Date().toISOString().slice(0, 10) };
      } else {
        employeeSkills.push({
          ...assignment,
          lastAssessed: new Date().toISOString().slice(0, 10)
        });
      }
      saveStorage(STORAGE_KEY_EMP_SKILLS, employeeSkills);
      return assignment;
    },

    // ==========================================
    // Training & Courses
    // ==========================================
    getCourses: () => trainingCourses,
    getCourseById: (id) => trainingCourses.find(c => c.id === id),
    getEnrollments: () => courseEnrollments,
    getEnrollmentsByCourse: (courseId) => courseEnrollments.filter(e => e.courseId === courseId),
    getEnrollmentsByEmployee: (empId) => courseEnrollments.filter(e => e.employeeId === empId),
    saveCourse: (courseData) => {
      const idx = trainingCourses.findIndex(c => c.id === courseData.id);
      let record;
      if (idx !== -1) {
        record = { ...trainingCourses[idx], ...courseData };
        trainingCourses[idx] = record;
      } else {
        record = {
          ...courseData,
          id: courseData.id || `TRN-${Date.now().toString().slice(-4)}`,
          status: courseData.status || 'Planned'
        };
        trainingCourses.unshift(record);
      }
      saveStorage(STORAGE_KEY_COURSES, trainingCourses);
      return record;
    },
    enrollEmployee: (courseId, employee) => {
      const course = trainingCourses.find(c => c.id === courseId);
      if (!course) throw new Error('Training course not found.');

      const existing = courseEnrollments.find(e => e.courseId === courseId && e.employeeId === employee.id);
      if (existing) {
        throw new Error(`${employee.name} is already enrolled in this course.`);
      }

      const activeEnrollments = courseEnrollments.filter(e => e.courseId === courseId);
      if (course.capacity && activeEnrollments.length >= course.capacity) {
        console.warn(`[GrowthStore] Warning: Course ${course.name} capacity exceeded (${activeEnrollments.length}/${course.capacity}).`);
      }

      const enrollment = {
        id: `ENR-${Date.now().toString().slice(-6)}`,
        courseId,
        courseName: course.name,
        employeeId: employee.id,
        employeeName: employee.name,
        branch: employee.branch,
        enrolledDate: new Date().toISOString().slice(0, 10),
        progress: 0,
        attendanceRate: 100,
        status: 'In Progress',
        completedDate: '',
        certificateIssued: false
      };

      courseEnrollments.unshift(enrollment);
      saveStorage(STORAGE_KEY_ENROLLMENTS, courseEnrollments);

      if (window.EmployeeHub.attendanceStore) {
        window.EmployeeHub.attendanceStore.addNotification({
          category: 'Growth',
          type: 'Training Enrolled',
          title: `Enrolled in Course: ${course.name}`,
          message: `${employee.name} enrolled in "${course.name}". Starts ${course.startDate}.`,
          employeeId: employee.id,
          branch: employee.branch
        });
      }

      return enrollment;
    },
    updateEnrollmentStatus: (enrollmentId, status, progress, certificateIssued) => {
      const enr = courseEnrollments.find(e => e.id === enrollmentId);
      if (enr) {
        enr.status = status;
        if (progress !== undefined) enr.progress = parseInt(progress) || 0;
        if (certificateIssued !== undefined) enr.certificateIssued = !!certificateIssued;
        if (status === 'Completed' && !enr.completedDate) {
          enr.completedDate = new Date().toISOString().slice(0, 10);
          enr.progress = 100;
          enr.certificateIssued = true;

          if (window.EmployeeHub.attendanceStore) {
            window.EmployeeHub.attendanceStore.addNotification({
              category: 'Growth',
              type: 'Training Completed',
              title: `Training Completed: ${enr.courseName}`,
              message: `${enr.employeeName} completed "${enr.courseName}" and received completion credential.`,
              employeeId: enr.employeeId,
              branch: enr.branch
            });
          }
        }
        saveStorage(STORAGE_KEY_ENROLLMENTS, courseEnrollments);
        return enr;
      }
      return null;
    },

    // ==========================================
    // Promotion Recommendations (Explainable & Human Review)
    // ==========================================
    getPromotions: () => promotionReviews,
    getPromotionById: (id) => promotionReviews.find(p => p.id === id),
    savePromotionReview: (reviewData) => {
      const idx = promotionReviews.findIndex(p => p.id === reviewData.id);
      let record;
      if (idx !== -1) {
        record = { ...promotionReviews[idx], ...reviewData };
        promotionReviews[idx] = record;
      } else {
        record = {
          ...reviewData,
          id: reviewData.id || `PROM-${Date.now().toString().slice(-6)}`,
          humanConfirmed: false
        };
        promotionReviews.unshift(record);
      }
      saveStorage(STORAGE_KEY_PROMOTIONS, promotionReviews);
      return record;
    },
    confirmPromotionStatus: (id, newStatus, reviewerNotes, reviewerName) => {
      const promo = promotionReviews.find(p => p.id === id);
      if (promo) {
        promo.status = newStatus;
        promo.notes = reviewerNotes || promo.notes;
        promo.humanConfirmed = true;
        promo.evaluationDate = new Date().toISOString().slice(0, 10);
        promo.evaluatedBy = reviewerName || 'Executive Talent Committee';

        saveStorage(STORAGE_KEY_PROMOTIONS, promotionReviews);

        if (window.EmployeeHub.attendanceStore) {
          window.EmployeeHub.attendanceStore.addNotification({
            category: 'Growth',
            type: 'Promotion Status',
            title: `Promotion Review Update: ${promo.employeeName}`,
            message: `Talent Committee updated promotion candidacy to "${newStatus}" for role "${promo.proposedRole}".`,
            employeeId: promo.employeeId,
            branch: promo.branch
          });
        }
        return promo;
      }
      return null;
    },

    // ==========================================
    // Career Paths
    // ==========================================
    getCareerPaths: () => careerPaths,

    // ==========================================
    // Feedback & Recognition
    // ==========================================
    getFeedback: (employeeId = null, includePrivate = true) => {
      let list = feedbackRecords;
      if (employeeId) {
        list = list.filter(f => f.recipientId === employeeId);
      }
      if (!includePrivate) {
        list = list.filter(f => f.visibility === 'Public');
      }
      return list;
    },
    addFeedback: (item) => {
      const record = {
        id: `FB-${Date.now().toString().slice(-6)}`,
        senderId: item.senderId || 'EMP-DEMO',
        senderName: item.senderName || 'Anonymous Peer',
        recipientId: item.recipientId,
        recipientName: item.recipientName,
        type: item.type || 'Recognition',
        badge: item.badge || 'Team Player',
        category: item.category || 'Appreciation',
        message: item.message,
        date: new Date().toISOString().slice(0, 10),
        visibility: item.visibility || 'Public',
        relatedGoalId: item.relatedGoalId || ''
      };
      feedbackRecords.unshift(record);
      saveStorage(STORAGE_KEY_FEEDBACK, feedbackRecords);

      if (window.EmployeeHub.attendanceStore && record.visibility === 'Public') {
        window.EmployeeHub.attendanceStore.addNotification({
          category: 'Growth',
          type: 'Kudos Received',
          title: `Kudos for ${record.recipientName}!`,
          message: `${record.senderName} awarded ${record.badge} badge: "${record.message}"`,
          employeeId: record.recipientId
        });
      }

      return record;
    },

    // ==========================================
    // Dynamic Growth Dashboard Analytics
    // ==========================================
    getGrowthSummary: () => {
      const employees = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getEmployees() : [];
      const totalEmployees = employees.length || 20;

      // Active IDPs
      const activeDevPlans = devPlans.filter(p => p.status === 'Active').length;

      // Completed Appraisals in latest cycle
      const activeCycle = reviewCycles.find(c => c.status === 'Active') || reviewCycles[0];
      const cycleAppraisals = activeCycle ? appraisals.filter(a => a.cycleId === activeCycle.id) : appraisals;
      const completedAppraisals = cycleAppraisals.filter(a => a.status === 'Completed').length;
      const completionRate = cycleAppraisals.length > 0 ? Math.round((completedAppraisals / cycleAppraisals.length) * 100) : 0;

      // Goals summary
      const activeGoals = goals.filter(g => g.status === 'In Progress' || g.status === 'Completed');
      const meetingGoalsCount = goals.filter(g => g.currentProgress >= 70).length;
      const meetingGoalsPct = goals.length > 0 ? Math.round((meetingGoalsCount / goals.length) * 100) : 0;

      // Employees requiring development support
      const reqSupportCount = appraisals.filter(a => a.overallScore !== null && a.overallScore < 3.0).length;

      // Training participation
      const enrolledEmployees = new Set(courseEnrollments.map(e => e.employeeId)).size;
      const completedEnrollments = courseEnrollments.filter(e => e.status === 'Completed').length;

      // Skills gap summary
      // Count of intermediate/beginner in required core skills
      const skillGaps = employeeSkills.filter(s => s.proficiency === 'Beginner' || s.proficiency === 'Intermediate').length;

      // Promotion candidates pending review
      const pendingPromotions = promotionReviews.filter(p => p.status === 'Recommended for Discussion' || p.status === 'Under Review').length;

      // Rating distribution (1 to 5)
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      appraisals.forEach(a => {
        if (a.overallScore) {
          const scoreFloor = Math.min(5, Math.max(1, Math.round(a.overallScore)));
          distribution[scoreFloor] = (distribution[scoreFloor] || 0) + 1;
        }
      });

      // Branch-wise performance
      const branchScores = {};
      appraisals.forEach(a => {
        if (a.overallScore && a.branch) {
          if (!branchScores[a.branch]) {
            branchScores[a.branch] = { total: 0, count: 0, name: a.branch };
          }
          branchScores[a.branch].total += a.overallScore;
          branchScores[a.branch].count += 1;
        }
      });
      const branchPerformance = Object.values(branchScores).map(b => ({
        branch: b.name,
        averageScore: parseFloat((b.total / b.count).toFixed(2)),
        reviewedCount: b.count
      }));

      return {
        totalEmployees,
        activeDevPlans,
        completionRate,
        meetingGoalsPct,
        reqSupportCount,
        enrolledEmployees,
        completedEnrollments,
        skillGaps,
        pendingPromotions,
        distribution,
        branchPerformance,
        activeCycleName: activeCycle ? activeCycle.name : 'Current Cycle',
        deadline: activeCycle ? activeCycle.deadline : '2026-10-20'
      };
    }
  };
})();
