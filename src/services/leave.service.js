/**
 * FLEETS HQ - Leave & Absence Service
 * Data provider for the Leave & Absence suite:
 * - overview (Leave & Absence 1.png)
 * - requests (Leave and absence 2.png)
 * - calendar (Holiday Calendar 3.png)
 * - sickness (Sickness Records 4.png)
 * - other (Other Leave 5.png)
 * - trends (Trends Analytics 6.png)
 * - reports
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMPLOYEES = [
  { id: 'local-emp-jaswant-001', name: 'Jaswant Singh', role: 'HGV Driver', avatar: '/img/avatars/jaswant.png' },
  { id: 'local-emp-driver-002', name: 'Pardeep Brar', role: 'HGV Driver', avatar: '/img/avatars/pardeep.png' },
  { id: 'local-emp-driver-001', name: 'Mulindwa Denis', role: 'HGV Driver', avatar: '/img/avatars/mulindwa.png' },
  { id: 'local-emp-nirmal-004', name: 'Nirmal Singh', role: 'HGV Driver', avatar: '/img/avatars/nirmal.png' },
  { id: 'local-emp-prince-005', name: 'Prince Kumar', role: 'HGV Driver', avatar: '/img/avatars/prince.png' },
  { id: 'local-emp-sahil-006', name: 'Sahil Kumar', role: 'HGV Driver', avatar: '/img/avatars/sahil.png' },
  { id: 'local-emp-driver-003', name: 'Jashanjot Singh', role: 'HGV Driver', avatar: '/img/avatars/jaswant.png' },
  { id: 'local-emp-amarjit-007', name: 'Amarjit Singh', role: 'HGV Driver', avatar: '/img/avatars/amarjit.png' },
  { id: 'local-emp-rolit-008', name: 'Rolit Soni', role: 'HGV Driver', avatar: '/img/avatars/rolit.png' },
  { id: 'local-emp-karan-009', name: 'Karan Singh', role: 'HGV Driver', avatar: '/img/avatars/sahil.png' },
];

function getEmp(name) {
  return EMPLOYEES.find(e => e.name.toLowerCase() === name.toLowerCase()) || {
    id: 'local-emp-jaswant-001',
    name,
    role: 'HGV Driver',
    avatar: '/img/avatars/jaswant.png'
  };
}

async function getLeaveData(activeTab = 'overview', options = {}) {
  // Common stats across views
  const kpis = {
    overview: [
      { id: 'holiday', title: 'On Holiday', value: '24', sub: 'Out of 28 employees', color: 'green', icon: 'calendar' },
      { id: 'sick', title: 'Sick / Absent', value: '3', sub: 'Out of 28 employees', color: 'red', icon: 'medical' },
      { id: 'other', title: 'Other Leave', value: '1', sub: 'Out of 28 employees', color: 'amber', icon: 'hourglass' },
      { id: 'total', title: 'Total Employees', value: '28', sub: 'Active Workforce', color: 'blue', icon: 'users' },
    ],
    requests: [
      { id: 'total', title: 'Total Requests', value: '32', sub: 'This Year', color: 'blue', icon: 'grid' },
      { id: 'approved', title: 'Approved', value: '18', sub: 'Confirmed', color: 'green', icon: 'check' },
      { id: 'pending', title: 'Pending', value: '7', sub: 'Action Required', color: 'amber', icon: 'clock' },
      { id: 'rejected', title: 'Rejected', value: '4', sub: 'Declined', color: 'red', icon: 'x' },
      { id: 'cancelled', title: 'Cancelled', value: '3', sub: 'By Employee', color: 'slate', icon: 'minus' },
    ],
    sickness: [
      { id: 'current', title: 'Currently Off Sick', value: '3', sub: 'Out of 28 employees', color: 'red', icon: 'medical' },
      { id: 'episodes', title: 'Sickness Episodes', value: '12', sub: 'This Year', color: 'blue', icon: 'calendar' },
      { id: 'days', title: 'Total Days Lost', value: '64', sub: 'This Year', color: 'green', icon: 'calendar-lost' },
      { id: 'avg', title: 'Average Days Per Episode', value: '2.3', sub: 'This Year', color: 'amber', icon: 'chart-line' },
    ],
    other: [
      { id: 'maternity', title: 'Maternity Leave', value: '4', sub: 'This Year', color: 'purple', icon: 'heart' },
      { id: 'paternity', title: 'Paternity Leave', value: '3', sub: 'This Year', color: 'blue', icon: 'user-plus' },
      { id: 'compassionate', title: 'Compassionate Leave', value: '5', sub: 'This Year', color: 'green', icon: 'hand-heart' },
      { id: 'training', title: 'Training Leave', value: '2', sub: 'This Year', color: 'amber', icon: 'grad-cap' },
      { id: 'unpaid', title: 'Unpaid Leave', value: '6', sub: 'This Year', color: 'slate', icon: 'clock' },
    ],
    trends: [
      { id: 'emp', title: 'Total Employees', value: '28', sub: 'Active workforce', color: 'blue', icon: 'users' },
      { id: 'tot-abs', title: 'Total Absence Days', value: '312', sub: '12% vs last year', trend: 'down', color: 'green', icon: 'calendar' },
      { id: 'avg-abs', title: 'Avg Days per Employee', value: '11.1', sub: '18% vs last year', trend: 'down', color: 'blue', icon: 'bar-chart' },
      { id: 'sick-d', title: 'Sickness Days', value: '64', sub: '25% vs last year', trend: 'down', color: 'red', icon: 'medical' },
      { id: 'hol-d', title: 'Holiday Days', value: '192', sub: '8% vs last year', trend: 'up', color: 'amber', icon: 'sun' },
      { id: 'oth-d', title: 'Other Leave Days', value: '38', sub: '6% vs last year', trend: 'down', color: 'purple', icon: 'grad-cap' },
      { id: 'rate', title: 'Absence Rate', value: '2.1%', sub: '0.4% vs last year', trend: 'down', color: 'teal', icon: 'pie' },
    ],
  };

  // 1. Overview Tab Data (matches Leave & Absence 1.png)
  const overviewData = {
    kpis: kpis.overview,
    leaveYearDonut: {
      year: 2025,
      percent: 68,
      takenDays: 392,
      plannedDays: 118,
      remainingDays: 190,
      totalAllowance: 700,
    },
    calendarMonth: 'May 2025',
    calendarDays: [
      // 1 to 31
      { day: 28, prevMonth: true }, { day: 29, prevMonth: true }, { day: 30, prevMonth: true },
      { day: 1, current: true, events: [{ name: 'Jashanjot Singh', type: 'holiday', color: 'green' }] },
      { day: 2, current: true },
      { day: 3, current: true, events: [{ name: 'Pardeep Brar', type: 'holiday', color: 'green' }] },
      { day: 4, current: true },
      { day: 5, current: true, events: [{ name: 'Prince Kumar (Sick)', type: 'sick', color: 'red' }] },
      { day: 6, current: true },
      { day: 7, current: true, events: [{ name: 'Mulindwa Denis', type: 'holiday', color: 'green' }] },
      { day: 8, current: true },
      { day: 9, current: true },
      { day: 10, current: true },
      { day: 11, current: true },
      { day: 12, current: true, events: [{ name: 'Sahil Kumar', type: 'holiday', color: 'green' }] },
      { day: 13, current: true, events: [{ name: 'Nirmal Singh', type: 'holiday', color: 'green' }] },
      { day: 14, current: true },
      { day: 15, current: true, events: [{ name: 'Training Leave', type: 'training', color: 'amber' }] },
      { day: 16, current: true },
      { day: 17, current: true },
      { day: 18, current: true },
      { day: 19, current: true },
      { day: 20, current: true, events: [{ name: 'Jaswant Singh', type: 'holiday', color: 'green' }] },
      { day: 21, current: true },
      { day: 22, current: true, events: [{ name: 'Denis (Sick)', type: 'sick', color: 'red' }] },
      { day: 23, current: true },
      { day: 24, current: true },
      { day: 25, current: true },
      { day: 26, current: true },
      { day: 27, current: true },
      { day: 28, current: true, events: [{ name: 'Pardeep Brar', type: 'holiday', color: 'green' }] },
      { day: 29, current: true },
      { day: 30, current: true, events: [{ name: 'Prince Kumar', type: 'holiday', color: 'green' }] },
      { day: 31, current: true },
      { day: 1, nextMonth: true },
    ],
    recentRecords: [
      { date: '15 May 2025', employee: getEmp('Prince Kumar'), type: 'Sick Leave', typeBadge: 'badge-red', fromTo: '15 May - 17 May', days: 3, status: 'Approved', statusBadge: 'badge-green', notes: 'Flu' },
      { date: '12 May 2025', employee: getEmp('Sahil Kumar'), type: 'Holiday', typeBadge: 'badge-green', fromTo: '12 May - 16 May', days: 5, status: 'Approved', statusBadge: 'badge-green', notes: 'Annual leave' },
      { date: '07 May 2025', employee: getEmp('Mulindwa Denis'), type: 'Holiday', typeBadge: 'badge-green', fromTo: '07 May - 09 May', days: 3, status: 'Approved', statusBadge: 'badge-green', notes: 'Family event' },
      { date: '05 May 2025', employee: getEmp('Prince Kumar'), type: 'Sick Leave', typeBadge: 'badge-red', fromTo: '05 May - 06 May', days: 2, status: 'Approved', statusBadge: 'badge-green', notes: 'Medical certificate' },
      { date: '28 Apr 2025', employee: getEmp('Pardeep Brar'), type: 'Holiday', typeBadge: 'badge-green', fromTo: '28 Apr - 02 May', days: 5, status: 'Approved', statusBadge: 'badge-green', notes: 'Annual leave' },
      { date: '22 Apr 2025', employee: getEmp('Nirmal Singh'), type: 'Other Leave', typeBadge: 'badge-amber', fromTo: '22 Apr - 24 Apr', days: 3, status: 'Approved', statusBadge: 'badge-green', notes: 'Training' },
      { date: '14 Apr 2025', employee: getEmp('Jashanjot Singh'), type: 'Holiday', typeBadge: 'badge-green', fromTo: '14 Apr - 18 Apr', days: 5, status: 'Approved', statusBadge: 'badge-green', notes: 'Annual leave' },
    ],
    pendingRequests: [
      { id: 'LR-033', employee: getEmp('Nirmal Singh'), type: 'Holiday', fromTo: '12 Jun - 16 Jun', days: 5, status: 'Pending' },
      { id: 'LR-031', employee: getEmp('Sahil Kumar'), type: 'Holiday', fromTo: '03 Jul - 07 Jul', days: 5, status: 'Pending' },
      { id: 'LR-030', employee: getEmp('Mulindwa Denis'), type: 'Other Leave', fromTo: '18 Jun - 20 Jun', days: 3, status: 'Pending' },
      { id: 'LR-029', employee: getEmp('Prince Kumar'), type: 'Holiday', fromTo: '01 Aug - 08 Aug', days: 8, status: 'Pending' },
    ],
    balances: [
      { employee: getEmp('Jashanjot Singh'), allowance: 28, taken: 14, planned: 5, remaining: 9, color: '#10b981', percent: 68 },
      { employee: getEmp('Pardeep Brar'), allowance: 28, taken: 20, planned: 3, remaining: 5, color: '#f59e0b', percent: 82 },
      { employee: getEmp('Prince Kumar'), allowance: 28, taken: 10, planned: 8, remaining: 10, color: '#3b82f6', percent: 64 },
      { employee: getEmp('Mulindwa Denis'), allowance: 28, taken: 18, planned: 5, remaining: 5, color: '#f59e0b', percent: 82 },
      { employee: getEmp('Sahil Kumar'), allowance: 28, taken: 12, planned: 0, remaining: 16, color: '#3b82f6', percent: 43 },
      { employee: getEmp('Nirmal Singh'), allowance: 28, taken: 15, planned: 5, remaining: 8, color: '#3b82f6', percent: 71 },
    ],
    absenceSummary: [
      { month: 'Jan', holiday: 6, sick: 4, other: 1 },
      { month: 'Feb', holiday: 8, sick: 4, other: 3 },
      { month: 'Mar', holiday: 10, sick: 6, other: 2 },
      { month: 'Apr', holiday: 10, sick: 4, other: 1 },
      { month: 'May', holiday: 14, sick: 5, other: 0 },
      { month: 'Jun', holiday: 10, sick: 3, other: 1 },
      { month: 'Jul', holiday: 10, sick: 4, other: 2 },
      { month: 'Aug', holiday: 20, sick: 7, other: 0 },
      { month: 'Sep', holiday: 5, sick: 2, other: 0 },
      { month: 'Oct', holiday: 18, sick: 6, other: 4 },
      { month: 'Nov', holiday: 12, sick: 5, other: 0 },
      { month: 'Dec', holiday: 12, sick: 3, other: 1 },
    ],
  };

  // 2. All Requests Tab Data (matches Leave and absence 2.png)
  const allRequestsData = {
    kpis: kpis.requests,
    requests: [
      { id: 'LR-032', employee: getEmp('Jaswant Singh'), type: 'Holiday', typeBadge: 'badge-green', startDate: '12 Jun 2025', endDate: '16 Jun 2025', days: 5, status: 'Pending', statusBadge: 'badge-amber', requestedOn: '10 May 2025', reason: 'Family event.', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-031', employee: getEmp('Sahil Kumar'), type: 'Holiday', typeBadge: 'badge-green', startDate: '03 Jul 2025', endDate: '07 Jul 2025', days: 5, status: 'Pending', statusBadge: 'badge-amber', requestedOn: '08 May 2025', reason: 'Summer holiday', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-030', employee: getEmp('Mulindwa Denis'), type: 'Other Leave', typeBadge: 'badge-amber', startDate: '18 Jun 2025', endDate: '20 Jun 2025', days: 3, status: 'Approved', statusBadge: 'badge-green', requestedOn: '05 May 2025', reason: 'Paternity leave', operatingCentre: 'M1 - Nottingham' },
      { id: 'LR-029', employee: getEmp('Prince Kumar'), type: 'Holiday', typeBadge: 'badge-green', startDate: '01 Aug 2025', endDate: '08 Aug 2025', days: 8, status: 'Pending', statusBadge: 'badge-amber', requestedOn: '30 Apr 2025', reason: 'Annual holiday', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-028', employee: getEmp('Pardeep Brar'), type: 'Holiday', typeBadge: 'badge-green', startDate: '22 Apr 2025', endDate: '24 Apr 2025', days: 3, status: 'Approved', statusBadge: 'badge-green', requestedOn: '18 Apr 2025', reason: 'Personal matters', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-027', employee: getEmp('Nirmal Singh'), type: 'Sick Leave', typeBadge: 'badge-red', startDate: '05 May 2025', endDate: '06 May 2025', days: 2, status: 'Approved', statusBadge: 'badge-green', requestedOn: '05 May 2025', reason: 'Medical appointment', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-026', employee: getEmp('Sahil Kumar'), type: 'Other Leave', typeBadge: 'badge-amber', startDate: '14 Apr 2025', endDate: '18 Apr 2025', days: 5, status: 'Rejected', statusBadge: 'badge-red', requestedOn: '12 Apr 2025', reason: 'Short notice request', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-025', employee: getEmp('Mulindwa Denis'), type: 'Holiday', typeBadge: 'badge-green', startDate: '28 Apr 2025', endDate: '02 May 2025', days: 5, status: 'Approved', statusBadge: 'badge-green', requestedOn: '10 Apr 2025', reason: 'Annual holiday', operatingCentre: 'M1 - Nottingham' },
      { id: 'LR-024', employee: getEmp('Jaswant Singh'), type: 'Sick Leave', typeBadge: 'badge-red', startDate: '22 May 2025', endDate: '23 May 2025', days: 2, status: 'Pending', statusBadge: 'badge-amber', requestedOn: '18 May 2025', reason: 'Flu recovery', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-023', employee: getEmp('Prince Kumar'), type: 'Holiday', typeBadge: 'badge-green', startDate: '15 May 2025', endDate: '17 May 2025', days: 3, status: 'Approved', statusBadge: 'badge-green', requestedOn: '12 May 2025', reason: 'Short break', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-022', employee: getEmp('Nirmal Singh'), type: 'Holiday', typeBadge: 'badge-green', startDate: '10 Jul 2025', endDate: '12 Jul 2025', days: 3, status: 'Cancelled', statusBadge: 'badge-slate', requestedOn: '06 May 2025', reason: 'Cancelled by user', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-021', employee: getEmp('Pardeep Brar'), type: 'Sick Leave', typeBadge: 'badge-red', startDate: '07 May 2025', endDate: '09 May 2025', days: 3, status: 'Approved', statusBadge: 'badge-green', requestedOn: '06 May 2025', reason: 'Dental recovery', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-020', employee: getEmp('Sahil Kumar'), type: 'Holiday', typeBadge: 'badge-green', startDate: '25 Jun 2025', endDate: '27 Jun 2025', days: 3, status: 'Pending', statusBadge: 'badge-amber', requestedOn: '01 May 2025', reason: 'Rest days', operatingCentre: 'A1 - Leeds' },
      { id: 'LR-019', employee: getEmp('Mulindwa Denis'), type: 'Sick Leave', typeBadge: 'badge-red', startDate: '12 Mar 2025', endDate: '14 Mar 2025', days: 3, status: 'Approved', statusBadge: 'badge-green', requestedOn: '11 Mar 2025', reason: 'Back pain', operatingCentre: 'M1 - Nottingham' },
      { id: 'LR-018', employee: getEmp('Prince Kumar'), type: 'Other Leave', typeBadge: 'badge-amber', startDate: '05 Feb 2025', endDate: '06 Feb 2025', days: 2, status: 'Approved', statusBadge: 'badge-green', requestedOn: '31 Jan 2025', reason: 'Compassionate leave', operatingCentre: 'A1 - Leeds' },
    ],
    selectedRequest: {
      id: 'LR-032',
      employee: getEmp('Jaswant Singh'),
      type: 'Holiday',
      startDate: '12 Jun 2025',
      endDate: '16 Jun 2025',
      days: 5,
      status: 'Pending',
      requestedOn: '10 May 2025',
      operatingCentre: 'A1 - Leeds',
      reason: 'Family event.',
      commentsCount: 2,
    },
  };

  // 3. Holiday Calendar Tab Data (matches Holiday Calendar 3.png)
  const calendarData = {
    monthTitle: 'May 2025',
    summaryCards: [
      { title: 'On Holiday', value: '24', color: 'green' },
      { title: 'Sick Leave', value: '3', color: 'red' },
      { title: 'Other Leave', value: '1', color: 'amber' },
      { title: 'Total Employees', value: '28', color: 'blue' },
    ],
    upcomingLeave: [
      { employee: getEmp('Jaswant Singh'), type: 'Holiday', fromTo: '12 Jun - 16 Jun' },
      { employee: getEmp('Sahil Kumar'), type: 'Holiday', fromTo: '03 Jul - 07 Jul' },
      { employee: getEmp('Mulindwa Denis'), type: 'Other Leave', fromTo: '18 Jun - 20 Jun' },
      { employee: getEmp('Prince Kumar'), type: 'Holiday', fromTo: '01 Aug - 08 Aug' },
      { employee: getEmp('Pardeep Brar'), type: 'Holiday', fromTo: '22 Apr - 24 Apr' },
    ],
    onLeaveToday: [
      { employee: getEmp('Jashanjot Singh'), type: 'Holiday', ends: '21 May' },
      { employee: getEmp('Nirmal Singh'), type: 'Holiday', ends: '16 May' },
      { employee: getEmp('Pardeep Brar'), type: 'Holiday', ends: '23 May' },
    ],
    teamTimeline: [
      { employee: getEmp('Jaswant Singh'), role: 'HGV Driver', spans: [{ start: 1, end: 5, color: '#10b981' }] },
      { employee: getEmp('Pardeep Brar'), role: 'HGV Driver', spans: [{ start: 5, end: 9, color: '#10b981' }, { start: 23, end: 26, color: '#10b981' }] },
      { employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', spans: [{ start: 7, end: 10, color: '#10b981' }] },
      { employee: getEmp('Prince Kumar'), role: 'HGV Driver', spans: [{ start: 5, end: 7, color: '#ef4444' }, { start: 29, end: 31, color: '#10b981' }] },
      { employee: getEmp('Sahil Kumar'), role: 'HGV Driver', spans: [{ start: 8, end: 11, color: '#f59e0b' }] },
      { employee: getEmp('Nirmal Singh'), role: 'HGV Driver', spans: [{ start: 10, end: 17, color: '#10b981' }] },
    ],
  };

  // 4. Sickness Records Tab Data (matches Sickness Records 4.png)
  const sicknessData = {
    kpis: kpis.sickness,
    absenceRateDonut: {
      rate: '2.1%',
      sicknessDays: 64,
      workingDays: 2944,
    },
    sicknessRecords: [
      { id: 'SR-012', employee: getEmp('Prince Kumar'), role: 'HGV Driver', startDate: '05 May 2025', endDate: '09 May 2025', days: 5, reason: 'Flu', status: 'Completed', fitNote: 'Yes' },
      { id: 'SR-011', employee: getEmp('Sahil Kumar'), role: 'HGV Driver', startDate: '14 Apr 2025', endDate: '18 Apr 2025', days: 5, reason: 'Back Pain', status: 'Completed', fitNote: 'Yes' },
      { id: 'SR-010', employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', startDate: '28 Mar 2025', endDate: '04 Apr 2025', days: 8, reason: 'Chest Infection', status: 'Completed', fitNote: 'Yes' },
      { id: 'SR-009', employee: getEmp('Pardeep Brar'), role: 'HGV Driver', startDate: '10 Mar 2025', endDate: '12 Mar 2025', days: 3, reason: 'Stomach Bug', status: 'Completed', fitNote: 'No' },
      { id: 'SR-008', employee: getEmp('Nirmal Singh'), role: 'HGV Driver', startDate: '22 Feb 2025', endDate: '27 Feb 2025', days: 6, reason: 'Flu', status: 'Completed', fitNote: 'Yes' },
      { id: 'SR-007', employee: getEmp('Jashanjot Singh'), role: 'HGV Driver', startDate: '03 Feb 2025', endDate: '07 Feb 2025', days: 5, reason: 'Dental Treatment', status: 'Completed', fitNote: 'No' },
      { id: 'SR-006', employee: getEmp('Prince Kumar'), role: 'HGV Driver', startDate: '13 Jan 2025', endDate: '15 Jan 2025', days: 3, reason: 'Migraine', status: 'Completed', fitNote: 'No' },
      { id: 'SR-005', employee: getEmp('Sahil Kumar'), role: 'HGV Driver', startDate: '06 Jan 2025', endDate: '10 Jan 2025', days: 5, reason: 'Flu', status: 'Completed', fitNote: 'Yes' },
      { id: 'SR-004', employee: getEmp('Jaswant Singh'), role: 'HGV Driver', startDate: '02 Jun 2025', endDate: '06 Jun 2025', days: 5, reason: 'Under Review', status: 'Pending', fitNote: 'Yes' },
      { id: 'SR-003', employee: getEmp('Mulindwa Denis'), role: 'HGV Driver', startDate: '18 May 2025', endDate: '-', days: 3, reason: 'Back Pain', status: 'Ongoing', fitNote: 'Yes' },
      { id: 'SR-002', employee: getEmp('Nirmal Singh'), role: 'HGV Driver', startDate: '16 May 2025', endDate: '-', days: 2, reason: 'Flu', status: 'Ongoing', fitNote: 'No' },
      { id: 'SR-001', employee: getEmp('Pardeep Brar'), role: 'HGV Driver', startDate: '12 May 2025', endDate: '-', days: 3, reason: 'Chest Infection', status: 'Ongoing', fitNote: 'Yes' },
    ],
    currentAbsences: [
      { employee: getEmp('Pardeep Brar'), role: 'HGV Driver', startDate: '12 May 2025', days: 9 },
      { employee: getEmp('Nirmal Singh'), role: 'HGV Driver', startDate: '16 May 2025', days: 5 },
      { employee: getEmp('Prince Kumar'), role: 'HGV Driver', startDate: '19 May 2025', days: 2 },
    ],
    reasons: [
      { reason: 'Flu', days: 24, percent: 100, color: '#ef4444' },
      { reason: 'Back Pain', days: 10, percent: 42, color: '#3b82f6' },
      { reason: 'Chest Infection', days: 8, percent: 33, color: '#10b981' },
      { reason: 'Stomach Bug', days: 6, percent: 25, color: '#f59e0b' },
      { reason: 'Migraine', days: 5, percent: 21, color: '#8b5cf6' },
      { reason: 'Dental Treatment', days: 3, percent: 12, color: '#a855f7' },
      { reason: 'Other', days: 8, percent: 33, color: '#64748b' },
    ],
    monthlyTrend: [
      { month: 'Jan', shortTerm: 2, longTerm: 3 },
      { month: 'Feb', shortTerm: 5, longTerm: 2 },
      { month: 'Mar', shortTerm: 8, longTerm: 4 },
      { month: 'Apr', shortTerm: 6, longTerm: 1 },
      { month: 'May', shortTerm: 14, longTerm: 2 },
      { month: 'Jun', shortTerm: 9, longTerm: 4 },
      { month: 'Jul', shortTerm: 5, longTerm: 2 },
      { month: 'Aug', shortTerm: 7, longTerm: 1 },
      { month: 'Sep', shortTerm: 6, longTerm: 2 },
      { month: 'Oct', shortTerm: 6, longTerm: 3 },
      { month: 'Nov', shortTerm: 3, longTerm: 1 },
      { month: 'Dec', shortTerm: 3, longTerm: 1 },
    ],
    departmentBreakdown: [
      { department: 'HGV Drivers', days: 52, percent: 100, color: '#3b82f6' },
      { department: 'Transport Manager', days: 4, percent: 8, color: '#10b981' },
      { department: 'Mechanics', days: 4, percent: 8, color: '#f59e0b' },
      { department: 'Office Staff', days: 3, percent: 6, color: '#8b5cf6' },
      { department: 'Other', days: 1, percent: 2, color: '#64748b' },
    ],
  };

  // 5. Other Leave Tab Data (matches Other Leave 5.png)
  const otherLeaveData = {
    kpis: kpis.other,
    leaveTypeDonut: {
      totalDays: 20,
      breakdown: [
        { label: 'Maternity Leave', days: 60, color: '#8b5cf6' },
        { label: 'Paternity Leave', days: 28, color: '#3b82f6' },
        { label: 'Compassionate Leave', days: 12, color: '#10b981' },
        { label: 'Training Leave', days: 7, color: '#f59e0b' },
        { label: 'Unpaid Leave', days: 21, color: '#94a3b8' },
      ],
    },
    requests: [
      { id: 'OL-010', employee: getEmp('Jaswant Singh'), type: 'Compassionate Leave', typeBadge: 'badge-green', startDate: '10 May 2025', endDate: '12 May 2025', days: 3, status: 'Approved', statusBadge: 'badge-green', requestedOn: '08 May 2025' },
      { id: 'OL-009', employee: getEmp('Sahil Kumar'), type: 'Training Leave', typeBadge: 'badge-amber', startDate: '15 Apr 2025', endDate: '16 Apr 2025', days: 2, status: 'Completed', statusBadge: 'badge-green', requestedOn: '10 Apr 2025' },
      { id: 'OL-008', employee: getEmp('Mulindwa Denis'), type: 'Paternity Leave', typeBadge: 'badge-blue', startDate: '01 Mar 2025', endDate: '14 Mar 2025', days: 14, status: 'Approved', statusBadge: 'badge-green', requestedOn: '20 Feb 2025' },
      { id: 'OL-007', employee: getEmp('Prince Kumar'), type: 'Unpaid Leave', typeBadge: 'badge-slate', startDate: '05 Feb 2025', endDate: '07 Feb 2025', days: 3, status: 'Rejected', statusBadge: 'badge-red', requestedOn: '28 Jan 2025' },
      { id: 'OL-006', employee: getEmp('Pardeep Brar'), type: 'Compassionate Leave', typeBadge: 'badge-green', startDate: '12 Jan 2025', endDate: '13 Jan 2025', days: 2, status: 'Completed', statusBadge: 'badge-green', requestedOn: '10 Jan 2025' },
      { id: 'OL-005', employee: getEmp('Nirmal Singh'), type: 'Maternity Leave', typeBadge: 'badge-purple', startDate: '06 Jan 2025', endDate: '31 Mar 2025', days: 60, status: 'Approved', statusBadge: 'badge-green', requestedOn: '20 Dec 2024' },
      { id: 'OL-004', employee: getEmp('Sahil Kumar'), type: 'Training Leave', typeBadge: 'badge-amber', startDate: '18 Nov 2024', endDate: '22 Nov 2024', days: 5, status: 'Completed', statusBadge: 'badge-green', requestedOn: '12 Nov 2024' },
      { id: 'OL-003', employee: getEmp('Mulindwa Denis'), type: 'Comp. Leave', typeBadge: 'badge-green', startDate: '03 Oct 2024', endDate: '04 Oct 2024', days: 2, status: 'Approved', statusBadge: 'badge-green', requestedOn: '30 Sep 2024' },
      { id: 'OL-002', employee: getEmp('Prince Kumar'), type: 'Paternity Leave', typeBadge: 'badge-blue', startDate: '12 Sep 2024', endDate: '26 Sep 2024', days: 14, status: 'Completed', statusBadge: 'badge-green', requestedOn: '02 Sep 2024' },
      { id: 'OL-001', employee: getEmp('Pardeep Brar'), type: 'Unpaid Leave', typeBadge: 'badge-slate', startDate: '14 Aug 2024', endDate: '20 Aug 2024', days: 7, status: 'Approved', statusBadge: 'badge-green', requestedOn: '10 Aug 2024' },
    ],
    upcomingOther: [
      { employee: getEmp('Mulindwa Denis'), type: 'Paternity Leave', fromTo: '01 Mar - 14 Mar', days: 14 },
      { employee: getEmp('Nirmal Singh'), type: 'Maternity Leave', fromTo: '06 Jan - 31 Mar', days: 60 },
      { employee: getEmp('Sahil Kumar'), type: 'Training Leave', fromTo: '15 Apr - 16 Apr', days: 2 },
      { employee: getEmp('Jaswant Singh'), type: 'Compassionate', fromTo: '10 May - 12 May', days: 3 },
    ],
    entitlements: [
      { employee: getEmp('Jaswant Singh'), entitlement: 10, taken: 7, remaining: 3, percent: 70, color: '#10b981' },
      { employee: getEmp('Sahil Kumar'), entitlement: 10, taken: 5, remaining: 5, percent: 50, color: '#3b82f6' },
      { employee: getEmp('Mulindwa Denis'), entitlement: 10, taken: 14, remaining: -4, percent: 100, color: '#ef4444' },
      { employee: getEmp('Prince Kumar'), entitlement: 10, taken: 5, remaining: 5, percent: 50, color: '#3b82f6' },
      { employee: getEmp('Pardeep Brar'), entitlement: 10, taken: 2, remaining: 8, percent: 20, color: '#3b82f6' },
      { employee: getEmp('Nirmal Singh'), entitlement: 10, taken: 0, remaining: 10, percent: 0, color: '#94a3b8' },
    ],
    trend: [
      { month: 'Jan', maternity: 8, paternity: 0, compassionate: 0, training: 0, unpaid: 0 },
      { month: 'Feb', maternity: 4, paternity: 4, compassionate: 8, training: 0, unpaid: 0 },
      { month: 'Mar', maternity: 4, paternity: 4, compassionate: 8, training: 2, unpaid: 0 },
      { month: 'Apr', maternity: 2, paternity: 4, compassionate: 1, training: 1, unpaid: 2 },
      { month: 'May', maternity: 4, paternity: 4, compassionate: 4, training: 0, unpaid: 6 },
      { month: 'Jun', maternity: 2, paternity: 2, compassionate: 1, training: 1, unpaid: 2 },
      { month: 'Jul', maternity: 4, paternity: 0, compassionate: 2, training: 0, unpaid: 0 },
      { month: 'Aug', maternity: 2, paternity: 0, compassionate: 2, training: 0, unpaid: 2 },
      { month: 'Sep', maternity: 2, paternity: 0, compassionate: 2, training: 0, unpaid: 2 },
      { month: 'Oct', maternity: 1, paternity: 0, compassionate: 2, training: 0, unpaid: 0 },
      { month: 'Nov', maternity: 0, paternity: 0, compassionate: 1, training: 0, unpaid: 0 },
      { month: 'Dec', maternity: 2, paternity: 0, compassionate: 0, training: 0, unpaid: 0 },
    ],
  };

  // 6. Trends Tab Data (matches Trends Analytics 6.png)
  const trendsData = {
    kpis: kpis.trends,
    monthlyAbsenceStacked: [
      { month: 'Jan', sickness: 8, holiday: 18, other: 4, unpaid: 3, training: 2 },
      { month: 'Feb', sickness: 12, holiday: 20, other: 6, unpaid: 2, training: 1 },
      { month: 'Mar', sickness: 18, holiday: 26, other: 8, unpaid: 4, training: 3 },
      { month: 'Apr', sickness: 10, holiday: 22, other: 6, unpaid: 2, training: 1 },
      { month: 'May', sickness: 6, holiday: 20, other: 4, unpaid: 1, training: 2 },
      { month: 'Jun', sickness: 4, holiday: 16, other: 3, unpaid: 1, training: 1 },
      { month: 'Jul', sickness: 6, holiday: 18, other: 3, unpaid: 2, training: 1 },
      { month: 'Aug', sickness: 10, holiday: 24, other: 5, unpaid: 3, training: 2 },
      { month: 'Sep', sickness: 4, holiday: 12, other: 2, unpaid: 1, training: 1 },
      { month: 'Oct', sickness: 4, holiday: 10, other: 2, unpaid: 1, training: 1 },
      { month: 'Nov', sickness: 4, holiday: 10, other: 1, unpaid: 1, training: 0 },
      { month: 'Dec', sickness: 4, holiday: 10, other: 1, unpaid: 0, training: 1 },
    ],
    absenceRateTrend: [
      { month: 'Jan', rate2025: 1.8, rate2024: 2.7 },
      { month: 'Feb', rate2025: 2.5, rate2024: 3.2 },
      { month: 'Mar', rate2025: 3.4, rate2024: 4.1 },
      { month: 'Apr', rate2025: 2.1, rate2024: 2.9 },
      { month: 'May', rate2025: 1.8, rate2024: 2.3 },
      { month: 'Jun', rate2025: 1.4, rate2024: 2.1 },
      { month: 'Jul', rate2025: 2.5, rate2024: 3.5 },
      { month: 'Aug', rate2025: 1.8, rate2024: 2.4 },
      { month: 'Sep', rate2025: 1.4, rate2024: 2.0 },
      { month: 'Oct', rate2025: 1.2, rate2024: 1.8 },
      { month: 'Nov', rate2025: 1.1, rate2024: 1.7 },
      { month: 'Dec', rate2025: 1.0, rate2024: 1.6 },
    ],
    leaveTypeDonut: {
      totalDays: 312,
      breakdown: [
        { label: 'Sickness', days: 64, percent: 20.5, color: '#ef4444' },
        { label: 'Holiday', days: 192, percent: 61.5, color: '#3b82f6' },
        { label: 'Other Leave', days: 38, percent: 12.2, color: '#f59e0b' },
        { label: 'Unpaid Leave', days: 21, percent: 6.7, color: '#94a3b8' },
        { label: 'Training Leave', days: 7, percent: 2.2, color: '#8b5cf6' },
      ],
    },
    top10Employees: [
      { rank: 1, employee: getEmp('Nirmal Singh'), days: 24, rate: '8.1%', color: '#ef4444' },
      { rank: 2, employee: getEmp('Prince Kumar'), days: 18, rate: '6.2%', color: '#f87171' },
      { rank: 3, employee: getEmp('Mulindwa Denis'), days: 16, rate: '5.5%', color: '#fb923c' },
      { rank: 4, employee: getEmp('Sahil Kumar'), days: 15, rate: '5.1%', color: '#fb923c' },
      { rank: 5, employee: getEmp('Jaswant Singh'), days: 14, rate: '4.8%', color: '#facc15' },
      { rank: 6, employee: getEmp('Pardeep Brar'), days: 12, rate: '4.1%', color: '#facc15' },
      { rank: 7, employee: getEmp('Rolit Soni'), days: 11, rate: '3.8%', color: '#94a3b8' },
      { rank: 8, employee: getEmp('Amarjit Singh'), days: 10, rate: '3.4%', color: '#94a3b8' },
      { rank: 9, employee: getEmp('Jashanjot Singh'), days: 9, rate: '3.1%', color: '#cbd5e1' },
      { rank: 10, employee: getEmp('Karan Singh'), days: 8, rate: '2.7%', color: '#cbd5e1' },
    ],
  };

  return {
    overview: overviewData,
    requests: allRequestsData,
    calendar: calendarData,
    sickness: sicknessData,
    other: otherLeaveData,
    trends: trendsData,
    reports: {
      reportsList: [
        { title: 'Annual Leave Liability & Cost Report 2025', date: '30 Apr 2025', type: 'PDF', size: '1.2 MB' },
        { title: 'Bradford Factor Sickness Index Q1-Q2', date: '15 May 2025', type: 'XLSX', size: '480 KB' },
        { title: 'Unplanned Absence & Overtime Impact Assessment', date: '01 May 2025', type: 'PDF', size: '840 KB' },
        { title: 'Holiday Carryover & Forfeiture Forecast 2025/26', date: '20 Apr 2025', type: 'CSV', size: '120 KB' },
      ],
      bradfordHighlights: [
        { employee: getEmp('Prince Kumar'), score: 180, risk: 'High', episodes: 3, days: 20 },
        { employee: getEmp('Pardeep Brar'), score: 144, risk: 'Medium', episodes: 3, days: 16 },
        { employee: getEmp('Mulindwa Denis'), score: 98, risk: 'Low', episodes: 2, days: 14 },
      ]
    }
  };
}

module.exports = {
  getLeaveData,
};
