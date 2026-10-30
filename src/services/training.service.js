/**
 * FLEETS HQ - Training & Competency Service
 * Data provider for the Training & Competency suite:
 * - overview (Training and Competency Dashboard 1.png)
 * - records (Training Records  2.png)
 * - competency (Competency Matrix 3.png)
 * - expiry (Training Expiry 4.png)
 * - plan (Training Plan 5.png)
 * - certificates
 * - reports
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMPLOYEES = [
  { id: 'local-emp-jaswant-001', name: 'Jaswant Singh', role: 'HGV Driver', avatar: '/img/avatars/jaswant.png?v=3' },
  { id: 'local-emp-driver-002', name: 'Pardeep Brar', role: 'HGV Driver', avatar: '/img/avatars/pardeep.png?v=3' },
  { id: 'local-emp-driver-001', name: 'Mulindwa Denis', role: 'HGV Driver', avatar: '/img/avatars/mulindwa.png?v=3' },
  { id: 'local-emp-nirmal-004', name: 'Nirmal Singh', role: 'HGV Driver', avatar: '/img/avatars/nirmal.png?v=3' },
  { id: 'local-emp-prince-005', name: 'Prince Kumar', role: 'HGV Driver', avatar: '/img/avatars/prince.png?v=3' },
  { id: 'local-emp-sahil-006', name: 'Sahil Kumar', role: 'HGV Driver', avatar: '/img/avatars/sahil.png?v=3' },
  { id: 'local-emp-driver-003', name: 'Jashanjot Singh', role: 'HGV Driver', avatar: '/img/avatars/jaswant.png?v=3' },
  { id: 'local-emp-amarjit-007', name: 'Amarjit Singh', role: 'HGV Driver', avatar: '/img/avatars/amarjit.png?v=3' },
  { id: 'local-emp-rolit-008', name: 'Rolit Soni', role: 'HGV Driver', avatar: '/img/avatars/rolit.png?v=3' },
  { id: 'local-emp-karan-009', name: 'Karan Singh', role: 'HGV Driver', avatar: '/img/avatars/sahil.png?v=3' },
];

function getEmp(name) {
  return EMPLOYEES.find(e => e.name.toLowerCase() === name.toLowerCase()) || {
    id: 'local-emp-jaswant-001',
    name,
    role: 'HGV Driver',
    avatar: '/img/avatars/jaswant.png?v=3'
  };
}

async function getTrainingData(activeTab = 'overview', options = {}) {
  // 1. Overview Tab Data (matches Training and Competency Dashboard 1.png)
  const overviewData = {
    kpis: [
      { id: 'total-emp', title: 'Total Employees', value: '28', sub: '4% vs last year', trend: 'up', color: 'blue', icon: 'grad-cap' },
      { id: 'compliant', title: 'Fully Compliant', value: '24', sub: '86% of workforce', color: 'green', icon: 'check-circle' },
      { id: 'expiring', title: 'Expiring Soon', value: '3', sub: 'Within 30 days', color: 'amber', icon: 'clock' },
      { id: 'overdue', title: 'Overdue', value: '2', sub: '7% of workforce', color: 'red', icon: 'alert-triangle' },
      { id: 'courses', title: 'Training Courses', value: '56', sub: 'Completed This Year', color: 'blue', icon: 'file-text' },
    ],
    complianceDonut: {
      percent: 86,
      label: 'Compliant',
      compliant: 24,
      expiringSoon: 3,
      overdue: 2,
      notStarted: 1,
    },
    mandatoryStatus: [
      { course: 'HGV Driver CPC', count: '25 / 28', percent: 89, greenPct: 80, amberPct: 9, textColor: '#16a34a' },
      { course: 'Tachograph Awareness', count: '26 / 28', percent: 93, greenPct: 85, amberPct: 8, textColor: '#16a34a' },
      { course: "Drivers' Hours (WTD)", count: '24 / 28', percent: 86, greenPct: 76, amberPct: 10, textColor: '#16a34a' },
      { course: 'Health & Safety', count: '27 / 28', percent: 96, greenPct: 90, amberPct: 6, textColor: '#16a34a' },
      { course: 'Manual Handling', count: '22 / 28', percent: 79, greenPct: 69, amberPct: 10, textColor: '#16a34a' },
      { course: 'First Aid', count: '18 / 28', percent: 64, greenPct: 50, amberPct: 14, textColor: '#d97706' },
    ],
    upcomingTraining: [
      { employee: getEmp('Prince Kumar'), course: 'Driver CPC (Module 2)', date: '22 May 2025', status: 'Scheduled' },
      { employee: getEmp('Sahil Kumar'), course: 'Tachograph Awareness', date: '24 May 2025', status: 'Scheduled' },
      { employee: getEmp('Mulindwa Denis'), course: 'First Aid', date: '28 May 2025', status: 'Scheduled' },
      { employee: getEmp('Jaswant Singh'), course: "Drivers' Hours (WTD)", date: '30 May 2025', status: 'Scheduled' },
    ],
    trainingRecords: [
      { id: 'TR-001', employee: getEmp('Jaswant Singh'), role: 'HGV Driver', course: 'Driver CPC (Module 1)', dateCompleted: '12 May 2023', expiryDate: '11 May 2028', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-002', employee: getEmp('Pardeep Brar'), role: 'HGV Driver', course: 'Tachograph Awareness', dateCompleted: '18 Apr 2024', expiryDate: '17 Apr 2029', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-003', employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', course: "Drivers' Hours (WTD)", dateCompleted: '28 Mar 2024', expiryDate: '27 Mar 2029', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-004', employee: getEmp('Nirmal Singh'), role: 'HGV Driver', course: 'Health & Safety', dateCompleted: '05 Jan 2024', expiryDate: '04 Jan 2029', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-005', employee: getEmp('Prince Kumar'), role: 'HGV Driver', course: 'Manual Handling', dateCompleted: '10 Feb 2024', expiryDate: '09 Feb 2027', status: 'Expiring Soon', statusBadge: 'badge-amber' },
      { id: 'TR-006', employee: getEmp('Sahil Kumar'), role: 'HGV Driver', course: 'First Aid', dateCompleted: '15 May 2022', expiryDate: '14 May 2025', status: 'Overdue', statusBadge: 'badge-red' },
      { id: 'TR-007', employee: getEmp('Amarjit Singh'), role: 'HGV Driver', course: 'Driver CPC (Module 4)', dateCompleted: '22 Jun 2023', expiryDate: '21 Jun 2028', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-008', employee: getEmp('Rolit Soni'), role: 'HGV Driver', course: 'ADR Training', dateCompleted: '12 Sep 2024', expiryDate: '11 Sep 2029', status: 'Valid', statusBadge: 'badge-green' },
    ],
    expiryTimeline: [
      { month: 'May', compliant: 5, expiring: 0, overdue: 2 },
      { month: 'Jun', compliant: 2, expiring: 1, overdue: 0 },
      { month: 'Jul', compliant: 3, expiring: 0, overdue: 1 },
      { month: 'Aug', compliant: 4, expiring: 0, overdue: 2 },
      { month: 'Sep', compliant: 3, expiring: 1, overdue: 1 },
      { month: 'Oct', compliant: 2, expiring: 0, overdue: 2.5 },
    ],
    trainingByTypeDonut: {
      total: 56,
      breakdown: [
        { label: 'Driver CPC', count: 18, color: '#2563eb' },
        { label: 'Tachograph', count: 10, color: '#3b82f6' },
        { label: 'Health & Safety', count: 8, color: '#f59e0b' },
        { label: 'Manual Handling', count: 6, color: '#10b981' },
        { label: 'First Aid', count: 6, color: '#84cc16' },
        { label: 'ADR', count: 4, color: '#a855f7' },
        { label: 'Other', count: 4, color: '#6366f1' },
      ]
    },
    competencyMatrixKeyRoles: [
      { competency: 'Driver CPC', hgv: '95%', hgvClass: 'badge-green-light', tm: '100%', tmClass: 'badge-green-light', mech: '-', office: '-' },
      { competency: 'Tachograph', hgv: '93%', hgvClass: 'badge-green-light', tm: '100%', tmClass: 'badge-green-light', mech: '-', office: '-' },
      { competency: "Drivers' Hours", hgv: '86%', hgvClass: 'badge-amber-light', tm: '100%', tmClass: 'badge-green-light', mech: '-', office: '-' },
      { competency: 'Health & Safety', hgv: '96%', hgvClass: 'badge-green-light', tm: '100%', tmClass: 'badge-green-light', mech: '100%', mechClass: 'badge-green-light', office: '92%', officeClass: 'badge-green-light' },
      { competency: 'Manual Handling', hgv: '79%', hgvClass: 'badge-amber-light', tm: '92%', tmClass: 'badge-green-light', mech: '100%', mechClass: 'badge-green-light', office: '88%', officeClass: 'badge-amber-light' },
      { competency: 'First Aid', hgv: '64%', hgvClass: 'badge-red-light', tm: '83%', tmClass: 'badge-amber-light', mech: '100%', mechClass: 'badge-green-light', office: '92%', officeClass: 'badge-green-light' },
    ]
  };

  // 2. Training Records Tab Data (matches Training Records  2.png)
  const recordsData = {
    kpis: [
      { id: 'total', title: 'Total Training Records', value: '56', sub: 'All Employees', color: 'blue', icon: 'grad-cap' },
      { id: 'valid', title: 'Valid / In Date', value: '48', sub: '86% of records', color: 'green', icon: 'check-circle' },
      { id: 'expiring', title: 'Expiring Soon', value: '5', sub: 'Within 30 days', color: 'amber', icon: 'clock' },
      { id: 'overdue', title: 'Overdue', value: '3', sub: 'Requires action', color: 'red', icon: 'alert-triangle' },
      { id: 'courses', title: 'Training Courses', value: '12', sub: 'Different course types', color: 'purple', icon: 'book' },
    ],
    records: [
      { id: 'TR-001', employee: getEmp('Jaswant Singh'), role: 'HGV Driver', course: 'Driver CPC (Module 1)', provider: 'JAUPT', dateCompleted: '12 May 2023', expiryDate: '11 May 2028', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-002', employee: getEmp('Pardeep Brar'), role: 'HGV Driver', course: 'Tachograph Awareness', provider: '256 Logistics', dateCompleted: '18 Apr 2024', expiryDate: '17 Apr 2029', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-003', employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', course: "Drivers' Hours (WTD)", provider: '256 Logistics', dateCompleted: '28 Mar 2024', expiryDate: '27 Mar 2029', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-004', employee: getEmp('Nirmal Singh'), role: 'HGV Driver', course: 'Health & Safety', provider: 'RTITB', dateCompleted: '05 Jan 2024', expiryDate: '04 Jan 2029', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-005', employee: getEmp('Prince Kumar'), role: 'HGV Driver', course: 'Manual Handling', provider: '256 Logistics', dateCompleted: '10 Feb 2024', expiryDate: '09 Feb 2027', status: 'Expiring Soon', statusBadge: 'badge-amber' },
      { id: 'TR-006', employee: getEmp('Sahil Kumar'), role: 'HGV Driver', course: 'First Aid', provider: 'St John Ambulance', dateCompleted: '15 May 2022', expiryDate: '14 May 2025', status: 'Overdue', statusBadge: 'badge-red' },
      { id: 'TR-007', employee: getEmp('Amarjit Singh'), role: 'HGV Driver', course: 'Driver CPC (Module 4)', provider: 'JAUPT', dateCompleted: '22 Jun 2023', expiryDate: '21 Jun 2028', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-008', employee: getEmp('Rolit Soni'), role: 'HGV Driver', course: 'ADR Training', provider: 'RTITB', dateCompleted: '12 Sep 2024', expiryDate: '11 Sep 2029', status: 'Valid', statusBadge: 'badge-green' },
      { id: 'TR-009', employee: getEmp('Sahil Kumar'), role: 'HGV Driver', course: 'Forklift (Counterbalance)', provider: 'RTITB', dateCompleted: '14 Jan 2024', expiryDate: '13 Jan 2027', status: 'Expiring Soon', statusBadge: 'badge-amber' },
      { id: 'TR-010', employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', course: 'Working at Height', provider: '256 Logistics', dateCompleted: '02 Feb 2024', expiryDate: '01 Feb 2027', status: 'Expiring Soon', statusBadge: 'badge-amber' },
    ],
    selectedEmployeeHistory: {
      employee: getEmp('Jaswant Singh'),
      role: 'HGV Driver - M1, Nottingham',
      courses: [
        { course: 'Driver CPC (Module 1)', dateCompleted: '12 May 2023', expiryDate: '11 May 2028', status: 'Valid', statusBadge: 'badge-green' },
        { course: 'Tachograph Awareness', dateCompleted: '20 Mar 2023', expiryDate: '19 Mar 2028', status: 'Valid', statusBadge: 'badge-green' },
        { course: "Drivers' Hours (WTD)", dateCompleted: '15 Jan 2024', expiryDate: '14 Jan 2029', status: 'Valid', statusBadge: 'badge-green' },
        { course: 'Manual Handling', dateCompleted: '10 Feb 2024', expiryDate: '09 Feb 2027', status: 'Expiring Soon', statusBadge: 'badge-amber' },
        { course: 'First Aid', dateCompleted: '05 May 2022', expiryDate: '04 May 2025', status: 'Overdue', statusBadge: 'badge-red' },
      ]
    },
    progressDonut: {
      percent: 86,
      valid: 48,
      validPercent: 86,
      expiring: 5,
      expiringPercent: 9,
      overdue: 3,
      overduePercent: 5,
    },
    upcomingExpiries: [
      { employee: getEmp('Prince Kumar'), course: 'Manual Handling', expiryDate: '09 Feb 2027', daysLeft: 20, status: 'Expiring Soon' },
      { employee: getEmp('Sahil Kumar'), course: 'First Aid', expiryDate: '14 May 2025', daysLeft: 25, status: 'Expiring Soon' },
      { employee: getEmp('Mulindwa Denis'), course: 'Working at Height', expiryDate: '01 Jun 2025', daysLeft: 27, status: 'Expiring Soon' },
      { employee: getEmp('Pardeep Brar'), course: 'Fire Safety', expiryDate: '05 Jun 2025', daysLeft: 29, status: 'Expiring Soon' },
      { employee: getEmp('Nirmal Singh'), course: 'Driver CPC (Module 3)', expiryDate: '08 Jun 2025', daysLeft: 30, status: 'Expiring Soon' },
    ]
  };

  // 3. Competency Matrix Tab Data (matches Competency Matrix 3.png)
  const competencyData = {
    categories: [
      { name: 'Driving & Licensing', color: '#2563eb', cols: ['HGV Licence', 'CPC (Mod 1)', 'CPC (Mod 2)', 'Tacho'] },
      { name: 'Health & Safety', color: '#10b981', cols: ['H&S Induction', 'Manual Handling', 'Working at Height'] },
      { name: 'Vehicle & Equipment', color: '#f59e0b', cols: ['Defect Reporting', 'First Aid', 'Fire Safety'] },
      { name: 'Compliance & Legal', color: '#8b5cf6', cols: ['WTD', 'ADR', 'FORKLIFT'] },
    ],
    matrix: [
      {
        employee: getEmp('Jaswant Singh'),
        role: 'HGV Driver',
        overall: 'Compliant',
        overallBadge: 'badge-green',
        cols: {
          'HGV Licence': { status: 'check', date: '01/04/2029' },
          'CPC (Mod 1)': { status: 'check', date: '12/05/2026' },
          'CPC (Mod 2)': { status: 'check', date: '15/06/2026' },
          'Tacho': { status: 'check', date: '20/04/2026' },
          'H&S Induction': { status: 'check', date: '14/01/2025' },
          'Manual Handling': { status: 'check', date: '14/01/2025' },
          'Working at Height': { status: 'check', date: '10/03/2025' },
          'Defect Reporting': { status: 'check', date: '12/02/2025' },
          'First Aid': { status: 'check', date: '05/05/2027' },
          'Fire Safety': { status: 'check', date: '05/05/2027' },
          'WTD': { status: 'check', date: '20/04/2026' },
          'ADR': { status: 'dash' },
          'FORKLIFT': { status: 'dash' },
        }
      },
      {
        employee: getEmp('Pardeep Brar'),
        role: 'HGV Driver',
        overall: 'Action Required',
        overallBadge: 'badge-amber',
        cols: {
          'HGV Licence': { status: 'check', date: '17/04/2029' },
          'CPC (Mod 1)': { status: 'check', date: '18/04/2026' },
          'CPC (Mod 2)': { status: 'check', date: '10/06/2026' },
          'Tacho': { status: 'check', date: '18/04/2026' },
          'H&S Induction': { status: 'alert', date: '02/02/2025' },
          'Manual Handling': { status: 'alert', date: '02/02/2025' },
          'Working at Height': { status: 'alert', date: '12/03/2025' },
          'Defect Reporting': { status: 'alert', date: '01/02/2025' },
          'First Aid': { status: 'alert', date: '14/05/2025' },
          'Fire Safety': { status: 'alert', date: '14/05/2025' },
          'WTD': { status: 'check', date: '18/04/2026' },
          'ADR': { status: 'dash' },
          'FORKLIFT': { status: 'dash' },
        }
      },
      {
        employee: getEmp('Mulindwa Denis'),
        role: 'HGV Driver',
        overall: 'Compliant',
        overallBadge: 'badge-green',
        cols: {
          'HGV Licence': { status: 'check', date: '27/03/2029' },
          'CPC (Mod 1)': { status: 'check', date: '28/03/2026' },
          'CPC (Mod 2)': { status: 'check', date: '20/04/2026' },
          'Tacho': { status: 'check', date: '28/03/2026' },
          'H&S Induction': { status: 'check', date: '10/01/2025' },
          'Manual Handling': { status: 'check', date: '10/01/2025' },
          'Working at Height': { status: 'dash' },
          'Defect Reporting': { status: 'check', date: '15/01/2025' },
          'First Aid': { status: 'check', date: '01/06/2026' },
          'Fire Safety': { status: 'check', date: '01/06/2026' },
          'WTD': { status: 'check', date: '28/04/2026' },
          'ADR': { status: 'check', date: '14/09/2026' },
          'FORKLIFT': { status: 'dash' },
        }
      },
      {
        employee: getEmp('Nirmal Singh'),
        role: 'HGV Driver',
        overall: 'Action Required',
        overallBadge: 'badge-amber',
        cols: {
          'HGV Licence': { status: 'check', date: '04/01/2029' },
          'CPC (Mod 1)': { status: 'check', date: '05/01/2026' },
          'CPC (Mod 2)': { status: 'alert', date: '15/01/2026' },
          'Tacho': { status: 'check', date: '05/01/2026' },
          'H&S Induction': { status: 'check', date: '12/12/2024' },
          'Manual Handling': { status: 'check', date: '12/12/2024' },
          'Working at Height': { status: 'dash' },
          'Defect Reporting': { status: 'check', date: '12/12/2024' },
          'First Aid': { status: 'check', date: '04/01/2027' },
          'Fire Safety': { status: 'check', date: '04/01/2027' },
          'WTD': { status: 'check', date: '05/01/2026' },
          'ADR': { status: 'dash' },
          'FORKLIFT': { status: 'dash' },
        }
      },
      {
        employee: getEmp('Prince Kumar'),
        role: 'HGV Driver',
        overall: 'Non Compliant',
        overallBadge: 'badge-red',
        cols: {
          'HGV Licence': { status: 'check', date: '09/02/2028' },
          'CPC (Mod 1)': { status: 'cross', date: '10/02/2025' },
          'CPC (Mod 2)': { status: 'check', date: '22/02/2026' },
          'Tacho': { status: 'cross', date: '10/02/2025' },
          'H&S Induction': { status: 'check', date: '18/12/2024' },
          'Manual Handling': { status: 'check', date: '18/12/2024' },
          'Working at Height': { status: 'check', date: '20/02/2025' },
          'Defect Reporting': { status: 'check', date: '20/12/2024' },
          'First Aid': { status: 'check', date: '09/02/2027' },
          'Fire Safety': { status: 'check', date: '09/02/2027' },
          'WTD': { status: 'cross', date: '10/02/2025' },
          'ADR': { status: 'dash' },
          'FORKLIFT': { status: 'dash' },
        }
      },
      {
        employee: getEmp('Sahil Kumar'),
        role: 'HGV Driver',
        overall: 'Compliant',
        overallBadge: 'badge-green',
        cols: {
          'HGV Licence': { status: 'check', date: '14/05/2029' },
          'CPC (Mod 1)': { status: 'check', date: '15/05/2026' },
          'CPC (Mod 2)': { status: 'check', date: '10/06/2026' },
          'Tacho': { status: 'check', date: '15/05/2026' },
          'H&S Induction': { status: 'check', date: '10/03/2025' },
          'Manual Handling': { status: 'check', date: '10/03/2025' },
          'Working at Height': { status: 'check', date: '11/03/2025' },
          'Defect Reporting': { status: 'check', date: '11/03/2025' },
          'First Aid': { status: 'check', date: '14/05/2027' },
          'Fire Safety': { status: 'check', date: '14/05/2027' },
          'WTD': { status: 'check', date: '15/05/2026' },
          'ADR': { status: 'check', date: '16/08/2026' },
          'FORKLIFT': { status: 'check', date: '01/09/2026' },
        }
      },
      {
        employee: getEmp('Amarjit Singh'),
        role: 'HGV Driver',
        overall: 'Action Required',
        overallBadge: 'badge-amber',
        cols: {
          'HGV Licence': { status: 'check', date: '21/06/2028' },
          'CPC (Mod 1)': { status: 'alert', date: '22/06/2025' },
          'CPC (Mod 2)': { status: 'alert', date: '18/07/2025' },
          'Tacho': { status: 'alert', date: '22/06/2025' },
          'H&S Induction': { status: 'check', date: '05/01/2025' },
          'Manual Handling': { status: 'check', date: '05/01/2025' },
          'Working at Height': { status: 'dash' },
          'Defect Reporting': { status: 'check', date: '05/01/2025' },
          'First Aid': { status: 'check', date: '21/06/2026' },
          'Fire Safety': { status: 'check', date: '21/06/2026' },
          'WTD': { status: 'alert', date: '22/06/2025' },
          'ADR': { status: 'dash' },
          'FORKLIFT': { status: 'dash' },
        }
      },
      {
        employee: getEmp('Rolit Soni'),
        role: 'HGV Driver',
        overall: 'Compliant',
        overallBadge: 'badge-green',
        cols: {
          'HGV Licence': { status: 'check', date: '11/09/2029' },
          'CPC (Mod 1)': { status: 'check', date: '12/09/2026' },
          'CPC (Mod 2)': { status: 'check', date: '23/09/2026' },
          'Tacho': { status: 'check', date: '12/09/2026' },
          'H&S Induction': { status: 'check', date: '14/01/2025' },
          'Manual Handling': { status: 'check', date: '14/01/2025' },
          'Working at Height': { status: 'check', date: '15/02/2025' },
          'Defect Reporting': { status: 'check', date: '14/01/2025' },
          'First Aid': { status: 'check', date: '11/09/2027' },
          'Fire Safety': { status: 'check', date: '11/09/2027' },
          'WTD': { status: 'check', date: '12/09/2026' },
          'ADR': { status: 'dash' },
          'FORKLIFT': { status: 'check', date: '20/11/2026' },
        }
      },
      {
        employee: getEmp('Sahil Kumar'),
        role: 'HGV Driver',
        overall: 'Non Compliant',
        overallBadge: 'badge-red',
        cols: {
          'HGV Licence': { status: 'check', date: '13/01/2027' },
          'CPC (Mod 1)': { status: 'cross', date: '14/01/2025' },
          'CPC (Mod 2)': { status: 'cross', date: '18/01/2025' },
          'Tacho': { status: 'cross', date: '14/01/2025' },
          'H&S Induction': { status: 'check', date: '03/01/2025' },
          'Manual Handling': { status: 'check', date: '03/01/2025' },
          'Working at Height': { status: 'dash' },
          'Defect Reporting': { status: 'check', date: '03/01/2025' },
          'First Aid': { status: 'check', date: '13/01/2026' },
          'Fire Safety': { status: 'check', date: '13/01/2026' },
          'WTD': { status: 'cross', date: '14/01/2025' },
          'ADR': { status: 'alert', date: '10/09/2025' },
          'FORKLIFT': { status: 'dash' },
        }
      },
      {
        employee: getEmp('Karan Singh'),
        role: 'HGV Driver',
        overall: 'Compliant',
        overallBadge: 'badge-green',
        cols: {
          'HGV Licence': { status: 'check', date: '05/02/2028' },
          'CPC (Mod 1)': { status: 'check', date: '06/02/2026' },
          'CPC (Mod 2)': { status: 'check', date: '18/02/2026' },
          'Tacho': { status: 'check', date: '06/02/2026' },
          'H&S Induction': { status: 'check', date: '11/12/2024' },
          'Manual Handling': { status: 'check', date: '11/12/2024' },
          'Working at Height': { status: 'check', date: '14/03/2025' },
          'Defect Reporting': { status: 'check', date: '11/12/2024' },
          'First Aid': { status: 'check', date: '05/02/2027' },
          'Fire Safety': { status: 'check', date: '05/02/2027' },
          'WTD': { status: 'check', date: '06/02/2026' },
          'ADR': { status: 'dash' },
          'FORKLIFT': { status: 'dash' },
        }
      },
    ],
    summaryDonut: {
      total: 56,
      compliant: 48,
      compliantPercent: 86,
      expiringSoon: 5,
      expiringPercent: 9,
      overdue: 3,
      overduePercent: 5,
    },
    categoryProgress: [
      { category: 'Driving & Licensing', percent: 90, greenPct: 68, amberPct: 16, redPct: 6 },
      { category: 'Health & Safety', percent: 85, greenPct: 62, amberPct: 15, redPct: 8 },
      { category: 'Vehicle & Equipment', percent: 80, greenPct: 54, amberPct: 16, redPct: 10 },
      { category: 'Compliance & Legal', percent: 82, greenPct: 56, amberPct: 16, redPct: 10 },
    ],
    upcomingExpiries: [
      { employee: getEmp('Prince Kumar'), competency: 'Tacho', expiryDate: '10 Feb 2025', daysLeft: 20, status: 'Overdue' },
      { employee: getEmp('Amarjit Singh'), competency: 'CPC (Mod 1)', expiryDate: '22 Jun 2025', daysLeft: 3, status: 'Expiring Soon' },
      { employee: getEmp('Amarjit Singh'), competency: 'CPC (Mod 2)', expiryDate: '18 Jul 2025', daysLeft: 29, status: 'Expiring Soon' },
      { employee: getEmp('Sahil Kumar'), competency: 'WTD', expiryDate: '14 Jan 2025', daysLeft: 5, status: 'Overdue' },
      { employee: getEmp('Sahil Kumar'), competency: 'ADR', expiryDate: '10 Sep 2025', daysLeft: 22, status: 'Expiring Soon' },
    ]
  };

  // 4. Training Expiry Tab Data (matches Training Expiry 4.png)
  const expiryData = {
    kpis: [
      { id: 'expired', title: 'Expired', value: '5', sub: 'Require immediate action', color: 'red', icon: 'calendar-x' },
      { id: 'due-30', title: 'Due in ≤ 30 days', value: '12', sub: 'Action required soon', color: 'amber-dark', icon: 'alert-triangle' },
      { id: 'due-90', title: 'Due in 31 – 90 days', value: '18', sub: 'Plan ahead', color: 'amber', icon: 'clock' },
      { id: 'due-180', title: 'Due in 91 – 180 days', value: '21', sub: 'On track', color: 'green', icon: 'calendar-check' },
      { id: 'total-exp', title: 'Total Expiring Items', value: '56', sub: 'All categories', color: 'blue', icon: 'file-text' },
    ],
    expiringItems: [
      { id: 'TR-006', employee: getEmp('Sahil Kumar'), role: 'HGV Driver', itemType: 'CPC', description: 'Driver CPC (Module 4)', expiryDate: '14 May 2025', daysLeft: -6, status: 'Expired', statusBadge: 'badge-red', actionText: 'Book Training' },
      { id: 'TR-005', employee: getEmp('Prince Kumar'), role: 'HGV Driver', itemType: 'Manual Handling', description: 'Manual Handling', expiryDate: '09 Feb 2027', daysLeft: -2, status: 'Expired', statusBadge: 'badge-red', actionText: 'Renew / Book' },
      { id: 'TR-002', employee: getEmp('Pardeep Brar'), role: 'HGV Driver', itemType: 'Tachograph', description: 'Tachograph Awareness', expiryDate: '24 May 2025', daysLeft: 4, status: 'Due Soon', statusBadge: 'badge-amber', actionText: 'Book Training' },
      { id: 'TR-010', employee: getEmp('Karan Singh'), role: 'HGV Driver', itemType: 'First Aid', description: 'First Aid at Work', expiryDate: '30 May 2025', daysLeft: 10, status: 'Due Soon', statusBadge: 'badge-amber', actionText: 'Book Training' },
      { id: 'MED-001', employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', itemType: 'Medical', description: 'HGV Medical (Group 2)', expiryDate: '05 Jun 2025', daysLeft: 16, status: 'Due Soon', statusBadge: 'badge-amber', actionText: 'Book Medical' },
      { id: 'TR-008', employee: getEmp('Rolit Soni'), role: 'HGV Driver', itemType: 'ADR', description: 'ADR (Base)', expiryDate: '12 Jun 2025', daysLeft: 23, status: 'Due Soon', statusBadge: 'badge-amber', actionText: 'Book Training' },
      { id: 'LIC-001', employee: getEmp('Jaswant Singh'), role: 'HGV Driver', itemType: 'Driving Licence', description: 'HGV Licence Check', expiryDate: '01 Jul 2025', daysLeft: 42, status: 'Due Later', statusBadge: 'badge-yellow', actionText: 'Check Document' },
      { id: 'TR-003', employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', itemType: 'CPC', description: 'Driver CPC (Module 1)', expiryDate: '28 Jul 2025', daysLeft: 68, status: 'Due Later', statusBadge: 'badge-yellow', actionText: 'Book Training' },
      { id: 'TR-004', employee: getEmp('Nirmal Singh'), role: 'HGV Driver', itemType: 'Health & Safety', description: 'Health & Safety', expiryDate: '05 Aug 2025', daysLeft: 76, status: 'Due Later', statusBadge: 'badge-yellow', actionText: 'Book Training' },
      { id: 'TR-007', employee: getEmp('Amarjit Singh'), role: 'HGV Driver', itemType: 'Working at Height', description: 'Working at Height', expiryDate: '01 Sep 2025', daysLeft: 99, status: 'Due Later', statusBadge: 'badge-yellow', actionText: 'Book Training' },
    ],
    categoriesBreakdown: [
      { itemType: 'Driver CPC', d0_30: 4, d31_90: 6, d91_180: 8, total: 18 },
      { itemType: 'Tachograph', d0_30: 3, d31_90: 4, d91_180: 6, total: 13 },
      { itemType: 'Medical', d0_30: 2, d31_90: 3, d91_180: 4, total: 9 },
      { itemType: 'First Aid', d0_30: 2, d31_90: 3, d91_180: 4, total: 9 },
      { itemType: 'Manual Handling', d0_30: 2, d31_90: 3, d91_180: 3, total: 8 },
      { itemType: 'ADR', d0_30: 1, d31_90: 2, d91_180: 3, total: 6 },
      { itemType: 'Driving Licence', d0_30: 1, d31_90: 2, d91_180: 2, total: 5 },
      { itemType: 'Other', d0_30: 2, d31_90: 5, d91_180: 7, total: 14 },
    ],
    timelineColumns: [
      { label: 'Expired', value: 5, color: '#ef4444' },
      { label: '0-30 Days', value: 12, color: '#f97316' },
      { label: '31-90 Days', value: 18, color: '#f59e0b' },
      { label: '91-180 Days', value: 21, color: '#10b981' },
    ],
    next30Detailed: [
      { date: '14 May 2025', dateColor: '#dc2626', employee: getEmp('Sahil Kumar'), item: 'CPC', description: 'Driver CPC (Module 4)' },
      { date: '24 May 2025', dateColor: '#ea580c', employee: getEmp('Pardeep Brar'), item: 'Tachograph', description: 'Tachograph Awareness' },
      { date: '30 May 2025', dateColor: '#d97706', employee: getEmp('Karan Singh'), item: 'First Aid', description: 'First Aid at Work' },
      { date: '05 Jun 2025', dateColor: '#d97706', employee: getEmp('Mulindwa Denis'), item: 'Medical', description: 'HGV Medical (Group 2)' },
      { date: '12 Jun 2025', dateColor: '#d97706', employee: getEmp('Rolit Soni'), item: 'ADR', description: 'ADR (Base)' },
      { date: '20 Jun 2025', dateColor: '#d97706', employee: getEmp('Nirmal Singh'), item: 'Manual Handling', description: 'Manual Handling' },
      { date: '22 Jun 2025', dateColor: '#d97706', employee: getEmp('Amarjit Singh'), item: 'Working at Height', description: 'Working at Height' },
      { date: '28 Jun 2025', dateColor: '#d97706', employee: getEmp('Prince Kumar'), item: 'CPC', description: 'Driver CPC (Module 2)' },
    ]
  };

  // 5. Training Plan Tab Data (matches Training Plan 5.png)
  const planData = {
    kpis: [
      { id: 'plan-emp', title: 'Total Employees', value: '56', sub: 'in training plan', color: 'blue', icon: 'grad-cap' },
      { id: 'plan-courses', title: 'Training Courses', value: '12', sub: 'Scheduled this year', color: 'purple', icon: 'book' },
      { id: 'plan-comp', title: 'Completed', value: '36', sub: '67% of planned', color: 'green', icon: 'check-circle' },
      { id: 'plan-prog', title: 'In Progress', value: '14', sub: '25% of planned', color: 'amber', icon: 'clock' },
      { id: 'plan-not', title: 'Not Started', value: '6', sub: '11% of planned', color: 'red', icon: 'calendar-x' },
    ],
    scheduleRows: [
      { id: 'TR-001', employee: getEmp('Jaswant Singh'), role: 'HGV Driver', course: 'Driver CPC (Module 1)', provider: 'JAUPT', gantt: { left: '2%', width: '31%', label: 'Driver CPC (Mod 1)', color: '#16a34a' } },
      { id: 'TR-002', employee: getEmp('Pardeep Brar'), role: 'HGV Driver', course: 'Tachograph Awareness', provider: '256 Logistics', gantt: { left: '29%', width: '18%', label: 'Tachograph', color: '#3b82f6' } },
      { id: 'TR-003', employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', course: "Drivers' Hours (WTD)", provider: 'RTITB', gantt: { left: '42%', width: '27%', label: "Drivers' Hours", color: '#f97316' } },
      { id: 'TR-004', employee: getEmp('Nirmal Singh'), role: 'HGV Driver', course: 'Health & Safety', provider: '256 Logistics', gantt: { left: '62%', width: '24%', label: 'Health & Safety', color: '#ef4444' } },
      { id: 'TR-005', employee: getEmp('Prince Kumar'), role: 'HGV Driver', course: 'Manual Handling', provider: '256 Logistics', gantt: { left: '28%', width: '25%', label: 'Manual Handling', color: '#8b5cf6' } },
      { id: 'TR-006', employee: getEmp('Sahil Kumar'), role: 'HGV Driver', course: 'First Aid', provider: 'St John Ambulance', gantt: { left: '66%', width: '26%', label: 'First Aid', color: '#facc15', textColor: '#1e293b' } },
      { id: 'TR-007', employee: getEmp('Amarjit Singh'), role: 'HGV Driver', course: 'ADR (Base)', provider: 'RTITB', gantt: { left: '33%', width: '29%', label: 'ADR (Base)', color: '#3b82f6' } },
      { id: 'TR-008', employee: getEmp('Rolit Soni'), role: 'HGV Driver', course: 'Driver CPC (Module 2)', provider: 'JAUPT', gantt: { left: '60%', width: '26%', label: 'Driver CPC (Mod 2)', color: '#16a34a' } },
      { id: 'TR-009', employee: getEmp('Karan Singh'), role: 'HGV Driver', course: 'Working at Height', provider: 'RTITB', gantt: { left: '67%', width: '26%', label: 'Working at Height', color: '#f97316' } },
      { id: 'TR-010', employee: getEmp('Sahil Kumar'), role: 'HGV Driver', course: 'Forklift (Counterbalance)', provider: '256 Logistics', gantt: { left: '64%', width: '20%', label: 'Forklift', color: '#8b5cf6' } },
    ],
    planOverviewDonut: {
      total: 56,
      completed: 36,
      completedPercent: 64,
      inProgress: 14,
      inProgressPercent: 25,
      notStarted: 6,
      notStartedPercent: 11,
    },
    monthlyPlanStacked: [
      { month: 'Jan', completed: 3, inProgress: 2, notStarted: 2 },
      { month: 'Feb', completed: 3, inProgress: 2, notStarted: 2 },
      { month: 'Mar', completed: 3, inProgress: 2, notStarted: 1 },
      { month: 'Apr', completed: 5, inProgress: 3, notStarted: 2 },
      { month: 'May', completed: 7, inProgress: 4, notStarted: 2.5 },
      { month: 'Jun', completed: 8, inProgress: 5, notStarted: 3.5 },
      { month: 'Jul', completed: 4, inProgress: 2, notStarted: 2 },
      { month: 'Aug', completed: 3.5, inProgress: 2, notStarted: 2 },
      { month: 'Sep', completed: 3, inProgress: 2, notStarted: 2.5 },
      { month: 'Oct', completed: 3, inProgress: 2, notStarted: 2 },
      { month: 'Nov', completed: 3, inProgress: 2, notStarted: 1.5 },
      { month: 'Dec', completed: 3.5, inProgress: 2, notStarted: 2 },
    ],
    trainingByType: [
      { name: 'Driver CPC', total: 12, percent: 80, color: '#16a34a' },
      { name: 'Tachograph Awareness', total: 8, percent: 56, color: '#2563eb' },
      { name: 'Health & Safety', total: 7, percent: 46, color: '#f97316' },
      { name: 'Manual Handling', total: 6, percent: 40, color: '#ef4444' },
      { name: 'First Aid', total: 6, percent: 40, color: '#8b5cf6' },
      { name: 'ADR', total: 5, percent: 34, color: '#eab308' },
      { name: 'Working at Height', total: 4, percent: 27, color: '#94a3b8' },
      { name: 'Forklift', total: 3, percent: 21, color: '#3b82f6' },
      { name: 'Other', total: 5, percent: 34, color: '#94a3b8' },
    ]
  };

  return {
    overview: overviewData,
    records: recordsData,
    competency: competencyData,
    expiry: expiryData,
    plan: planData,
    certificates: {
      certificatesList: [
        { id: 'CERT-001', employee: getEmp('Jaswant Singh'), course: 'Driver CPC (Module 1)', issueDate: '12 May 2023', expiryDate: '11 May 2028', certNumber: 'CPC-2023-9941', status: 'Valid' },
        { id: 'CERT-002', employee: getEmp('Pardeep Brar'), course: 'Tachograph Awareness', issueDate: '18 Apr 2024', expiryDate: '17 Apr 2029', certNumber: 'TA-2024-1182', status: 'Valid' },
        { id: 'CERT-003', employee: getEmp('Mulindwa Denis'), course: "Drivers' Hours (WTD)", issueDate: '28 Mar 2024', expiryDate: '27 Mar 2029', certNumber: 'WTD-2024-5541', status: 'Valid' },
        { id: 'CERT-004', employee: getEmp('Nirmal Singh'), course: 'Health & Safety Induction', issueDate: '05 Jan 2024', expiryDate: '04 Jan 2029', certNumber: 'HS-2024-8809', status: 'Valid' },
        { id: 'CERT-005', employee: getEmp('Prince Kumar'), course: 'Manual Handling at Depots', issueDate: '10 Feb 2024', expiryDate: '09 Feb 2027', certNumber: 'MH-2024-3321', status: 'Expiring Soon' },
      ]
    },
    reports: {
      trainingMatrixAudit: 'Training & Qualifications Matrix Audit Q2 2025',
      cpcComplianceReport: 'Driver CPC Periodic Training Status & 35-Hour Hours Log',
      annualSpendForecast: 'Training Budget Allocation & Vendor Invoicing 2025/26'
    }
  };
}

module.exports = {
  getTrainingData,
};
