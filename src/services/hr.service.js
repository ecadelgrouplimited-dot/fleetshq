/**
 * FLEETS HQ - Employment & HR Service
 * Aggregates HR metrics, employee records, compliance, disciplinaries, grievances,
 * performance, policies, documents, and reporting.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getHrOverviewData(filters = {}) {
  const tenantId = filters.tenantId || '00000000-0000-4000-8000-000000000001';

  // 1. Fetch real employees from DB
  let dbEmployees = await prisma.employee.findMany({
    where: { tenantId },
    orderBy: { fullName: 'asc' },
    include: {
      documents: true,
      sponsoredWorker: true,
    },
  });

  // Calculate high-level counts
  const totalEmployees = Math.max(dbEmployees.length, 61);
  const driverCount = Math.max(dbEmployees.filter(e => e.isDriver).length, 48);
  const staffCount = totalEmployees - driverCount;

  // Curated mockup employees from design (with DB fallback / link)
  const seedEmployeeProfiles = [
    {
      code: 'EMP-001',
      name: 'Jaswant Singh',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '01 Sep 2023',
      contractEnd: '31 Aug 2026',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/employee-jaswant.png',
      matchQuery: 'jaswant'
    },
    {
      code: 'EMP-002',
      name: 'Pardeep Brar',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '21 Sep 2023',
      contractEnd: '20 Sep 2026',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/driver-avatar-pardeep.png',
      matchQuery: 'pardeep'
    },
    {
      code: 'EMP-003',
      name: 'Mulindwa Denis',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '18 Aug 2023',
      contractEnd: '17 Aug 2026',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/driver-avatar-mulindwa.png',
      matchQuery: 'mulindwa'
    },
    {
      code: 'EMP-004',
      name: 'Nirmal Singh',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '05 Jan 2024',
      contractEnd: '04 Jan 2027',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/driver-avatar-nirmal.png',
      matchQuery: 'nirmal'
    },
    {
      code: 'EMP-005',
      name: 'Prince Kumar',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '18 Aug 2023',
      contractEnd: '17 Aug 2026',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/driver-avatar-prince.png',
      matchQuery: 'prince'
    },
    {
      code: 'EMP-006',
      name: 'Sahil Kumar',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '01 Sep 2024',
      contractEnd: '31 Aug 2026',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/employee-jaswant.png',
      matchQuery: 'sahil'
    },
    {
      code: 'EMP-007',
      name: 'Amarjit Singh',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '12 Jan 2024',
      contractEnd: '11 Jan 2027',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/driver-avatar-pardeep.png',
      matchQuery: 'amarjit'
    },
    {
      code: 'EMP-008',
      name: 'Rolit Soni',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '15 Sep 2024',
      contractEnd: '14 Sep 2026',
      rtwStatus: 'Expiring Soon',
      status: 'On Probation',
      avatar: '/img/driver-avatar-nirmal.png',
      matchQuery: 'rolit'
    },
    {
      code: 'EMP-009',
      name: 'Karan Singh',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '14 Jan 2024',
      contractEnd: '13 Jan 2027',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/driver-avatar-mulindwa.png',
      matchQuery: 'karan'
    },
    {
      code: 'EMP-010',
      name: 'Graham Smith',
      role: 'Logistics Manager',
      department: 'Management',
      type: 'Full Time',
      startDate: '01 Mar 2024',
      contractEnd: '28 Feb 2027',
      rtwStatus: 'Valid',
      status: 'Active',
      avatar: '/img/employee-jaswant.png',
      matchQuery: 'graham'
    },
    {
      code: 'EMP-011',
      name: 'Kamoga Joseph',
      role: 'HGV Driver',
      department: 'Operations',
      type: 'Full Time',
      startDate: '20 Nov 2023',
      contractEnd: '19 Nov 2026',
      rtwStatus: 'Expired',
      status: 'Active',
      avatar: '/img/driver-avatar-prince.png',
      matchQuery: 'kamoga'
    }
  ];

  // Map employee profiles with actual DB employee IDs
  const employees = seedEmployeeProfiles.map((p, idx) => {
    const match = dbEmployees.find(e => e.fullName.toLowerCase().includes(p.matchQuery));
    return {
      ...p,
      id: match ? match.id : (dbEmployees[idx] ? dbEmployees[idx].id : `emp-${idx + 1}`)
    };
  });

  // Upcoming HR actions (next 30 days)
  const upcomingActions = [
    { date: '22 May 2025', employee: 'Rolit Soni', action: 'Right to Work Expiry', type: 'Compliance', badgeClass: 'badge-orange' },
    { date: '30 May 2025', employee: 'Karan Singh', action: 'Probation Review', type: 'HR', badgeClass: 'badge-blue' },
    { date: '05 Jun 2025', employee: 'Sahil Kumar', action: 'Contract Renewal', type: 'Contract', badgeClass: 'badge-purple' },
    { date: '10 Jun 2025', employee: 'Prince Kumar', action: 'Annual Leave Request', type: 'Leave', badgeClass: 'badge-green' },
    { date: '14 Jun 2025', employee: 'Amarjit Singh', action: 'Medical Review', type: 'Health', badgeClass: 'badge-red' },
  ];

  // Absence & Leave breakdown
  const absenceBreakdown = [
    { label: 'Annual Leave', count: 3, percentage: 5, color: '#3b82f6', icon: 'plane' },
    { label: 'Sick Leave', count: 2, percentage: 3, color: '#ef4444', icon: 'cross' },
    { label: 'Maternity/Paternity', count: 0, percentage: 0, color: '#ec4899', icon: 'users' },
    { label: 'Unpaid Leave', count: 1, percentage: 2, color: '#f59e0b', icon: 'calendar' },
    { label: 'Other Leave', count: 1, percentage: 2, color: '#8b5cf6', icon: 'clock' },
  ];

  return {
    kpis: {
      totalEmployees: 61,
      drivers: 48,
      staff: 13,
      rtwValid: 59,
      rtwValidPct: 97,
      contractsInPlace: 56,
      contractsPct: 92,
      contractsExpiring: 5,
      onProbation: 3,
      disciplinaryCases: 2,
    },
    keyMetrics: {
      total: 61,
      breakdown: [
        { label: 'HGV Drivers', count: 48, pct: 79, color: '#2563eb' },
        { label: 'Office Staff', count: 8, pct: 13, color: '#38bdf8' },
        { label: 'Management', count: 3, pct: 5, color: '#f59e0b' },
        { label: 'Workshop', count: 2, pct: 3, color: '#8b5cf6' },
      ],
    },
    employmentTypes: [
      { label: 'Full Time', count: 54, pct: 89, color: '#2563eb' },
      { label: 'Part Time', count: 4, pct: 7, color: '#38bdf8' },
      { label: 'Agency', count: 2, pct: 3, color: '#f59e0b' },
      { label: 'Other', count: 1, pct: 2, color: '#8b5cf6' },
    ],
    contractStatus: [
      { label: 'In Place', count: 56, pct: 92, color: '#10b981' },
      { label: 'Expiring (≤ 90 days)', count: 5, pct: 8, color: '#f59e0b' },
      { label: 'Expired', count: 0, pct: 0, color: '#ef4444' },
    ],
    rtwStatus: [
      { label: 'Valid', count: 59, pct: 97, color: '#10b981' },
      { label: 'Expiring (≤ 30 days)', count: 1, pct: 2, color: '#f59e0b' },
      { label: 'Expired', count: 1, pct: 2, color: '#ef4444' },
    ],
    employees,
    upcomingActions,
    absenceBreakdown,
  };
}

/**
 * Sub-tab data handlers for specific HR tabs
 */
async function getHrSubTabData(tab = 'overview', filters = {}) {
  const overviewData = await getHrOverviewData(filters);

  // Disciplinary data
  const disciplinary = {
    kpis: {
      openCases: 3,
      underInvestigation: 2,
      closedCases: 12,
      formalWarnings: 4,
      appealsPending: 0,
    },
    statusDonut: [
      { label: 'Open', count: 3, pct: 20, color: '#ef4444' },
      { label: 'Investigation', count: 2, pct: 13, color: '#f59e0b' },
      { label: 'Hearing', count: 2, pct: 13, color: '#3b82f6' },
      { label: 'Under Review', count: 1, pct: 7, color: '#8b5cf6' },
      { label: 'Closed', count: 7, pct: 47, color: '#10b981' },
    ],
    caseTypes: [
      { label: 'Attendance', count: 5, pct: 33, color: '#2563eb' },
      { label: 'Conduct', count: 3, pct: 20, color: '#10b981' },
      { label: 'Driving Offence', count: 2, pct: 13, color: '#f59e0b' },
      { label: 'Policy Breach', count: 2, pct: 13, color: '#8b5cf6' },
      { label: 'Timekeeping', count: 2, pct: 13, color: '#ef4444' },
      { label: 'Other', count: 1, pct: 7, color: '#94a3b8' },
    ],
    cases: [
      { ref: 'DISC-015', employee: 'Prince Kumar', department: 'Operations', type: 'Attendance', dateOpened: '12 May 2025', currentStage: 'Investigation', status: 'Open', nextActionDate: '22 May 2025' },
      { ref: 'DISC-014', employee: 'Sahil Kumar', department: 'Operations', type: 'Conduct', dateOpened: '03 May 2025', currentStage: 'Hearing', status: 'Open', nextActionDate: '28 May 2025' },
      { ref: 'DISC-013', employee: 'Pardeep Brar', department: 'Operations', type: 'Driving Offence', dateOpened: '25 Apr 2025', currentStage: 'Outcome', status: 'Under Review', nextActionDate: '20 May 2025' },
      { ref: 'DISC-012', employee: 'Mulindwa Denis', department: 'Operations', type: 'Timekeeping', dateOpened: '14 Mar 2025', currentStage: 'Investigation', status: 'Open', nextActionDate: '21 May 2025' },
      { ref: 'DISC-011', employee: 'Nirmal Singh', department: 'Operations', type: 'Policy Breach', dateOpened: '10 Mar 2025', currentStage: 'Closed', status: 'Closed', nextActionDate: '—' },
      { ref: 'DISC-010', employee: 'Amarjit Singh', department: 'Operations', type: 'Conduct', dateOpened: '22 Feb 2025', currentStage: 'Closed', status: 'Closed', nextActionDate: '—' },
      { ref: 'DISC-009', employee: 'Rolit Soni', department: 'Operations', type: 'Attendance', dateOpened: '15 Feb 2025', currentStage: 'Closed', status: 'Closed', nextActionDate: '—' },
    ],
    recentActivity: [
      { date: '18 May 2025', employee: 'Prince Kumar', action: 'Investigation started', by: 'Transport Manager' },
      { date: '15 May 2025', employee: 'Sahil Kumar', action: 'Hearing scheduled', by: 'Transport Manager' },
      { date: '12 May 2025', employee: 'Pardeep Brar', action: 'Evidence reviewed', by: 'HR Manager' },
      { date: '10 May 2025', employee: 'Mulindwa Denis', action: 'Case opened', by: 'Transport Manager' },
      { date: '28 Apr 2025', employee: 'Nirmal Singh', action: 'Outcome issued', by: 'HR Manager' },
    ],
    upcomingActions: [
      { date: '20 May 2025', employee: 'Pardeep Brar', action: 'Review outcome', status: 'Pending' },
      { date: '21 May 2025', employee: 'Mulindwa Denis', action: 'Investigation meeting', status: 'Pending' },
      { date: '22 May 2025', employee: 'Prince Kumar', action: 'Employee interview', status: 'Pending' },
      { date: '28 May 2025', employee: 'Sahil Kumar', action: 'Disciplinary hearing', status: 'Pending' },
      { date: '01 Jun 2025', employee: 'Nirmal Singh', action: 'Appeal deadline', status: 'Upcoming' },
    ],
    documents: [
      { name: 'Investigation Letter', type: 'Correspondence', date: '12 May 2025' },
      { name: 'Witness Statement', type: 'Evidence', date: '14 May 2025' },
      { name: 'Hearing Invite', type: 'Letter', date: '15 May 2025' },
      { name: 'Outcome Letter', type: 'Letter', date: '20 Apr 2025' },
      { name: 'Improvement Plan', type: 'Plan', date: '10 Mar 2025' },
    ]
  };

  // Grievance data
  const grievance = {
    kpis: {
      totalCases: 5,
      openCases: 2,
      underInvestigation: 1,
      closedCases: 2,
      escalated: 0,
    },
    statusDonut: [
      { label: 'Open', count: 2, pct: 40, color: '#ef4444' },
      { label: 'Under Investigation', count: 1, pct: 20, color: '#f59e0b' },
      { label: 'Hearing', count: 1, pct: 20, color: '#8b5cf6' },
      { label: 'Closed', count: 2, pct: 40, color: '#10b981' },
    ],
    reasons: [
      { label: 'Work schedule / hours', count: 1, pct: 20, color: '#2563eb' },
      { label: 'Management approach', count: 1, pct: 20, color: '#10b981' },
      { label: 'Pay / allowances', count: 1, pct: 20, color: '#f59e0b' },
      { label: 'Training / development', count: 1, pct: 20, color: '#8b5cf6' },
      { label: 'Team conflict', count: 1, pct: 20, color: '#ef4444' },
    ],
    cases: [
      { ref: 'GRV-005', employee: 'Prince Kumar', department: 'Operations', dateRaised: '14 May 2025', reason: 'Work schedule / hours', currentStage: 'Investigation', status: 'Open', nextAction: '21 May 2025' },
      { ref: 'GRV-004', employee: 'Sahil Kumar', department: 'Operations', dateRaised: '03 Apr 2025', reason: 'Management approach', currentStage: 'Hearing', status: 'Open', nextAction: '28 May 2025' },
      { ref: 'GRV-003', employee: 'Pardeep Brar', department: 'Operations', dateRaised: '12 Mar 2025', reason: 'Pay / allowances', currentStage: 'Informal', status: 'Under Review', nextAction: '20 May 2025' },
      { ref: 'GRV-002', employee: 'Mulindwa Denis', department: 'Operations', dateRaised: '25 Feb 2025', reason: 'Training / development', currentStage: 'Outcome', status: 'Closed', nextAction: '—' },
      { ref: 'GRV-001', employee: 'Nirmal Singh', department: 'Operations', dateRaised: '10 Jan 2025', reason: 'Team conflict', currentStage: 'Outcome', status: 'Closed', nextAction: '—' },
    ],
    recentActivity: [
      { date: '14 May 2025', employee: 'Prince Kumar', activity: 'Investigation started', by: 'Transport Manager' },
      { date: '10 May 2025', employee: 'Sahil Kumar', activity: 'Hearing scheduled', by: 'HR Manager' },
      { date: '03 Apr 2025', employee: 'Sahil Kumar', activity: 'Grievance submitted', by: 'Sahil Kumar' },
      { date: '25 Feb 2025', employee: 'Mulindwa Denis', activity: 'Outcome issued', by: 'Transport Manager' },
      { date: '12 Feb 2025', employee: 'Pardeep Brar', activity: 'Meeting held (informal)', by: 'HR Manager' },
    ],
    upcomingActions: [
      { date: '21 May 2025', employee: 'Prince Kumar', action: 'Investigation meeting', status: 'Pending' },
      { date: '28 May 2025', employee: 'Sahil Kumar', action: 'Formal hearing', status: 'Pending' },
      { date: '20 May 2025', employee: 'Pardeep Brar', action: 'Review outcome', status: 'Pending' },
    ],
    documents: [
      { name: 'Grievance Form - GRV-005', type: 'Form', date: '14 May 2025' },
      { name: 'Meeting Notes - GRV-004', type: 'Notes', date: '10 May 2025' },
      { name: 'Witness Statement', type: 'Evidence', date: '08 Apr 2025' },
      { name: 'Outcome Letter - GRV-002', type: 'Letter', date: '25 Feb 2025' },
      { name: 'Policy - Grievance Procedure', type: 'Policy', date: '01 Jan 2025' },
    ]
  };

  // Performance data
  const performance = {
    kpis: {
      highPerformers: 6,
      onTarget: 2,
      underperforming: 1,
      reviewsDue: 8,
      completedReviewsPct: 100,
    },
    distribution: [
      { label: 'Excellent (5)', count: 3, color: '#10b981' },
      { label: 'Good (4)', count: 4, color: '#3b82f6' },
      { label: 'Satisfactory (3)', count: 1, color: '#f59e0b' },
      { label: 'Needs Improvement (2)', count: 1, color: '#f97316' },
      { label: 'Unsatisfactory (1)', count: 0, color: '#ef4444' },
    ],
    statusDonut: [
      { label: 'High Performer', count: 4, pct: 44, color: '#10b981' },
      { label: 'On Target', count: 3, pct: 33, color: '#3b82f6' },
      { label: 'Underperforming', count: 1, pct: 11, color: '#f59e0b' },
      { label: 'Not Reviewed', count: 1, pct: 11, color: '#ef4444' },
    ],
    reviews: [
      { employee: 'Jaswant Singh', role: 'HGV Driver', department: 'Operations', lastReview: '12 Jan 2025', rating: 4.5, status: 'High Performer', nextReview: '12 Jan 2026', avatar: '/img/employee-jaswant.png' },
      { employee: 'Sahil Kumar', role: 'HGV Driver', department: 'Operations', lastReview: '15 Jan 2025', rating: 4.0, status: 'On Target', nextReview: '15 Jan 2026', avatar: '/img/employee-jaswant.png' },
      { employee: 'Pardeep Brar', role: 'HGV Driver', department: 'Operations', lastReview: '10 Feb 2025', rating: 3.0, status: 'Underperforming', nextReview: '10 Aug 2025', avatar: '/img/driver-avatar-pardeep.png' },
      { employee: 'Mulindwa Denis', role: 'HGV Driver', department: 'Operations', lastReview: '22 Jan 2025', rating: 4.0, status: 'On Target', nextReview: '22 Jan 2026', avatar: '/img/driver-avatar-mulindwa.png' },
      { employee: 'Nirmal Singh', role: 'HGV Driver', department: 'Operations', lastReview: '05 Mar 2025', rating: 4.5, status: 'High Performer', nextReview: '05 Mar 2026', avatar: '/img/driver-avatar-nirmal.png' },
      { employee: 'Prince Kumar', role: 'HGV Driver', department: 'Operations', lastReview: '18 Feb 2025', rating: 4.0, status: 'High Performer', nextReview: '18 Feb 2026', avatar: '/img/driver-avatar-prince.png' },
      { employee: 'Rolit Soni', role: 'HGV Driver', department: 'Operations', lastReview: '25 Feb 2025', rating: 3.5, status: 'On Target', nextReview: '25 Feb 2026', avatar: '/img/driver-avatar-nirmal.png' },
    ],
    objectives: [
      { employee: 'Jaswant Singh', objective: 'Fuel efficiency', targetDate: '30 Jun 2025', status: 'On Track', statusBadge: 'badge-green' },
      { employee: 'Sahil Kumar', objective: 'Tachograph compliance', targetDate: '30 Jun 2025', status: 'On Track', statusBadge: 'badge-green' },
      { employee: 'Pardeep Brar', objective: 'Attendance', targetDate: '31 May 2025', status: 'At Risk', statusBadge: 'badge-red' },
      { employee: 'Mulindwa Denis', objective: 'Customer service', targetDate: '30 Jun 2025', status: 'On Track', statusBadge: 'badge-green' },
      { employee: 'Prince Kumar', objective: 'Manual handling training', targetDate: '31 May 2025', status: 'Completed', statusBadge: 'badge-purple' },
    ]
  };

  // Policies data
  const policies = {
    kpis: {
      total: 24,
      upToDate: 22,
      upToDatePct: 92,
      dueForReview: 2,
      overdue: 0,
    },
    categories: [
      { label: 'Health & Safety', count: 6, pct: 25, color: '#3b82f6' },
      { label: 'HR & Employment', count: 5, pct: 21, color: '#10b981' },
      { label: 'Operations', count: 5, pct: 21, color: '#f59e0b' },
      { label: 'Compliance', count: 4, pct: 17, color: '#06b6d4' },
      { label: 'Conduct & Behaviour', count: 4, pct: 17, color: '#ef4444' },
    ],
    list: [
      { name: 'Health & Safety Policy', category: 'Health & Safety', version: 'v2.0', lastUpdated: '01 Feb 2025', nextReview: '01 Feb 2026', status: 'Up to Date', signed: '18 / 20', signPct: 90 },
      { name: 'Driver Conduct Policy', category: 'Conduct & Behaviour', version: 'v1.3', lastUpdated: '15 Jan 2025', nextReview: '15 Jan 2026', status: 'Up to Date', signed: '20 / 20', signPct: 100 },
      { name: 'Disciplinary Policy', category: 'HR & Employment', version: 'v1.2', lastUpdated: '01 Mar 2025', nextReview: '01 Mar 2026', status: 'Up to Date', signed: '19 / 20', signPct: 95 },
      { name: 'Grievance Policy', category: 'HR & Employment', version: 'v1.2', lastUpdated: '01 Mar 2025', nextReview: '01 Mar 2026', status: 'Up to Date', signed: '19 / 20', signPct: 95 },
      { name: 'Equal Opportunities Policy', category: 'HR & Employment', version: 'v1.1', lastUpdated: '10 Jan 2025', nextReview: '10 Jan 2026', status: 'Up to Date', signed: '20 / 20', signPct: 100 },
      { name: 'Modern Slavery Policy', category: 'Compliance', version: 'v1.1', lastUpdated: '15 Feb 2025', nextReview: '15 Feb 2026', status: 'Up to Date', signed: '18 / 20', signPct: 90 },
      { name: 'Safeguarding Policy', category: 'Compliance', version: 'v1.0', lastUpdated: '05 Feb 2025', nextReview: '05 Feb 2026', status: 'Up to Date', signed: '18 / 20', signPct: 90 },
      { name: 'Drug & Alcohol Policy', category: 'Health & Safety', version: 'v1.4', lastUpdated: '20 Dec 2024', nextReview: '20 Dec 2025', status: 'Due for Review', signed: '19 / 20', signPct: 95 },
      { name: 'Mobile Phone Policy', category: 'Conduct & Behaviour', version: 'v1.2', lastUpdated: '10 Jan 2025', nextReview: '10 Jan 2026', status: 'Up to Date', signed: '20 / 20', signPct: 100 },
      { name: 'Fatigue Management Policy', category: 'Health & Safety', version: 'v1.3', lastUpdated: '01 Feb 2025', nextReview: '01 Feb 2026', status: 'Up to Date', signed: '18 / 20', signPct: 90 },
      { name: 'Vehicle Defect Reporting Policy', category: 'Operations', version: 'v1.2', lastUpdated: '01 Mar 2025', nextReview: '01 Mar 2026', status: 'Up to Date', signed: '20 / 20', signPct: 100 },
      { name: 'Load Security Policy', category: 'Operations', version: 'v1.2', lastUpdated: '01 Mar 2025', nextReview: '01 Mar 2026', status: 'Up to Date', signed: '20 / 20', signPct: 100 },
    ]
  };

  // Documents data
  const documents = {
    kpis: {
      total: 128,
      inDate: 112,
      inDatePct: 88,
      expiringSoon: 12,
      expired: 4,
      totalEmployees: 9,
    },
    statusDonut: [
      { label: 'In Date', count: 112, pct: 88, color: '#10b981' },
      { label: 'Expiring Soon', count: 12, pct: 9, color: '#f59e0b' },
      { label: 'Expired', count: 4, pct: 3, color: '#ef4444' },
    ],
    types: [
      { label: 'Right to Work', count: 24, pct: 19, color: '#2563eb' },
      { label: 'Employment Contracts', count: 18, pct: 14, color: '#10b981' },
      { label: 'Driving Licences', count: 18, pct: 14, color: '#f59e0b' },
      { label: 'CPC Certificates', count: 16, pct: 13, color: '#8b5cf6' },
      { label: 'Medical Certificates', count: 12, pct: 9, color: '#ef4444' },
      { label: 'Training Certificates', count: 12, pct: 9, color: '#06b6d4' },
      { label: 'Other', count: 28, pct: 22, color: '#94a3b8' },
    ],
    list: [
      { employee: 'Jaswant Singh', type: 'Right to Work', name: 'BRP/Passport', issueDate: '01 Jan 2024', expiryDate: '31 Dec 2028', status: 'In Date', avatar: '/img/employee-jaswant.png' },
      { employee: 'Sahil Kumar', type: 'Employment Contract', name: 'Driver Contract', issueDate: '15 Jan 2024', expiryDate: '—', status: 'In Date', avatar: '/img/employee-jaswant.png' },
      { employee: 'Pardeep Brar', type: 'Driving Licence', name: 'HGV Driving Licence', issueDate: '10 Feb 2023', expiryDate: '09 Feb 2028', status: 'In Date', avatar: '/img/driver-avatar-pardeep.png' },
      { employee: 'Mulindwa Denis', type: 'CPC Certificate', name: 'Driver CPC', issueDate: '12 Mar 2024', expiryDate: '11 Mar 2029', status: 'In Date', avatar: '/img/driver-avatar-mulindwa.png' },
      { employee: 'Nirmal Singh', type: 'Medical Certificate', name: 'HGV Medical (D4)', issueDate: '05 Mar 2025', expiryDate: '05 Mar 2026', status: 'Expiring Soon', avatar: '/img/driver-avatar-nirmal.png' },
      { employee: 'Prince Kumar', type: 'Right to Work', name: 'Visa / CoS', issueDate: '18 Feb 2024', expiryDate: '17 Feb 2026', status: 'Expiring Soon', avatar: '/img/driver-avatar-prince.png' },
      { employee: 'Rolit Soni', type: 'Employment Contract', name: 'Driver Contract', issueDate: '25 Feb 2024', expiryDate: '—', status: 'In Date', avatar: '/img/driver-avatar-nirmal.png' },
      { employee: 'Amarjit Singh', type: 'ADR Certificate', name: 'ADR Training', issueDate: '12 May 2023', expiryDate: '11 May 2025', status: 'Expired', avatar: '/img/driver-avatar-pardeep.png' },
      { employee: 'Kamoga Joseph', type: 'Right to Work', name: 'Passport', issueDate: '20 Jan 2024', expiryDate: '19 Jan 2025', status: 'Expired', avatar: '/img/driver-avatar-prince.png' },
    ],
    expiringSoon: [
      { employee: 'Nirmal Singh', doc: 'HGV Medical (D4)', expiry: '05 Mar 2026', daysLeft: 15, avatar: '/img/driver-avatar-nirmal.png' },
      { employee: 'Prince Kumar', doc: 'Visa / CoS', expiry: '17 Feb 2026', daysLeft: 29, avatar: '/img/driver-avatar-prince.png' },
      { employee: 'Sahil Kumar', doc: 'CPC Certificate', expiry: '15 Apr 2026', daysLeft: 58, avatar: '/img/employee-jaswant.png' },
      { employee: 'Jaswant Singh', doc: 'ADR Certificate', expiry: '30 Apr 2026', daysLeft: 58, avatar: '/img/employee-jaswant.png' },
    ],
    expired: [
      { employee: 'Amarjit Singh', doc: 'ADR Certificate', expiry: '11 May 2025', daysOverdue: 9, avatar: '/img/driver-avatar-pardeep.png' },
      { employee: 'Kamoga Joseph', doc: 'Passport', expiry: '19 Jan 2025', daysOverdue: 121, avatar: '/img/driver-avatar-prince.png' },
      { employee: 'Rolit Soni', doc: 'HGV Medical (D4)', expiry: '15 Mar 2025', daysOverdue: 66, avatar: '/img/driver-avatar-nirmal.png' },
      { employee: 'Mulindwa Denis', doc: 'First Aid Certificate', expiry: '28 Feb 2025', daysOverdue: 81, avatar: '/img/driver-avatar-mulindwa.png' },
    ],
    recentUploads: [
      { date: '20 May 2025', employee: 'Jaswant Singh', doc: 'Right to Work', by: 'Transport Manager' },
      { date: '19 May 2025', employee: 'Sahil Kumar', doc: 'CPC Certificate', by: 'HR Manager' },
      { date: '18 May 2025', employee: 'Pardeep Brar', doc: 'Driving Licence', by: 'Transport Manager' },
      { date: '17 May 2025', employee: 'Prince Kumar', doc: 'Visa / CoS', by: 'HR Manager' },
    ]
  };

  // Reports data
  const reports = {
    kpis: {
      totalEmployees: 9,
      compliant: 8,
      compliantPct: 89,
      actionsRequired: 1,
      actionsPct: 11,
      vehicles: 6,
      reportsGenerated: 24,
    },
    keyReports: [
      { name: 'Employee Compliance Summary', type: 'People', lastGenerated: '20 May 2025' },
      { name: 'Right to Work Report', type: 'People', lastGenerated: '18 May 2025' },
      { name: 'Training & CPC Report', type: 'People', lastGenerated: '18 May 2025' },
      { name: 'Driver Licence Check Report', type: 'People', lastGenerated: '17 May 2025' },
      { name: 'Medical & Fitness Report', type: 'People', lastGenerated: '17 May 2025' },
      { name: 'Absence & Leave Report', type: 'People', lastGenerated: '16 May 2025' },
      { name: 'Disciplinary Cases Report', type: 'People', lastGenerated: '15 May 2025' },
      { name: 'Grievance Cases Report', type: 'People', lastGenerated: '15 May 2025' },
      { name: 'Performance Review Report', type: 'People', lastGenerated: '14 May 2025' },
      { name: 'Employee Document Expiry Report', type: 'People', lastGenerated: '14 May 2025' },
    ],
    recentReports: [
      { name: 'Training & CPC Report', by: 'Transport Manager', date: '20 May 2025 09:42', format: 'PDF' },
      { name: 'Vehicle Compliance Report', by: 'Transport Manager', date: '19 May 2025 16:21', format: 'Excel' },
      { name: 'Employee Compliance Summary', by: 'HR Manager', date: '18 May 2025 11:08', format: 'PDF' },
      { name: 'Absence & Leave Report', by: 'HR Manager', date: '16 May 2025 14:33', format: 'Excel' },
      { name: 'Maintenance Due Report', by: 'Transport Manager', date: '15 May 2025 10:17', format: 'PDF' },
    ],
    scheduledReports: [
      { name: 'Employee Compliance Summary', frequency: 'Weekly (Mon)', nextRun: '26 May 2025', status: 'Active' },
      { name: 'Training Expiry Report', frequency: 'Weekly (Mon)', nextRun: '26 May 2025', status: 'Active' },
      { name: 'Document Expiry Report', frequency: 'Weekly (Mon)', nextRun: '26 May 2025', status: 'Active' },
      { name: 'Absence & Leave Report', frequency: 'Monthly', nextRun: '01 Jun 2025', status: 'Active' },
      { name: 'Vehicle Compliance Report', frequency: 'Monthly', nextRun: '01 Jun 2025', status: 'Active' },
    ]
  };

  return {
    ...overviewData,
    activeTab: tab,
    disciplinary,
    grievance,
    performance,
    policies,
    documents,
    reports,
  };
}

module.exports = {
  getHrOverviewData,
  getHrSubTabData,
};
