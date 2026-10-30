/**
 * FLEETS HQ - Medical & Fitness Service
 * Manages medical records, driver fitness certificates, D4 reviews, vision/hearing tests, and drug & alcohol compliance.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getMedicalFitnessData(filters = {}) {
  const tenantId = filters.tenantId || '00000000-0000-4000-8000-000000000001';

  // 1. Fetch real DB employees to map IDs
  const dbEmployees = await prisma.employee.findMany({
    where: { tenantId },
    select: { id: true, fullName: true, isDriver: true, jobTitle: true }
  });

  const seedMedicalRecords = [
    {
      code: 'EMP-001',
      name: 'Jaswant Singh',
      role: 'HGV Driver',
      lastMedical: '12 May 2024',
      expiryDate: '12 May 2026',
      daysLeft: 357,
      status: 'Fit to Drive',
      statusClass: 'badge-fit',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'None',
      avatar: '/img/employee-jaswant.png',
      matchQuery: 'jaswant'
    },
    {
      code: 'EMP-002',
      name: 'Pardeep Brar',
      role: 'HGV Driver',
      lastMedical: '18 Apr 2024',
      expiryDate: '18 Apr 2026',
      daysLeft: 332,
      status: 'Fit to Drive',
      statusClass: 'badge-fit',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'None',
      avatar: '/img/driver-avatar-pardeep.png',
      matchQuery: 'pardeep'
    },
    {
      code: 'EMP-003',
      name: 'Mulindwa Denis',
      role: 'HGV Driver',
      lastMedical: '28 Mar 2024',
      expiryDate: '28 Mar 2026',
      daysLeft: 311,
      status: 'Fit to Drive',
      statusClass: 'badge-fit',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'None',
      avatar: '/img/driver-avatar-mulindwa.png',
      matchQuery: 'mulindwa'
    },
    {
      code: 'EMP-004',
      name: 'Nirmal Singh',
      role: 'HGV Driver',
      lastMedical: '05 Jan 2024',
      expiryDate: '05 Jan 2026',
      daysLeft: 233,
      status: 'Due Soon',
      statusClass: 'badge-due',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'None',
      avatar: '/img/driver-avatar-nirmal.png',
      matchQuery: 'nirmal'
    },
    {
      code: 'EMP-005',
      name: 'Prince Kumar',
      role: 'HGV Driver',
      lastMedical: '10 Feb 2024',
      expiryDate: '10 Feb 2026',
      daysLeft: 269,
      status: 'Due Soon',
      statusClass: 'badge-due',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'None',
      avatar: '/img/driver-avatar-prince.png',
      matchQuery: 'prince'
    },
    {
      code: 'EMP-006',
      name: 'Sahil Kumar',
      role: 'HGV Driver',
      lastMedical: '15 May 2023',
      expiryDate: '15 May 2025',
      daysLeft: -1,
      status: 'Expired',
      statusClass: 'badge-expired',
      visionTest: false,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'Requires Review',
      avatar: '/img/employee-jaswant.png',
      matchQuery: 'sahil'
    },
    {
      code: 'EMP-007',
      name: 'Amarjit Singh',
      role: 'HGV Driver',
      lastMedical: '22 Jun 2023',
      expiryDate: '22 Jun 2025',
      daysLeft: 33,
      status: 'Due Soon',
      statusClass: 'badge-due',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: false,
      healthConditions: 'None',
      avatar: '/img/driver-avatar-pardeep.png',
      matchQuery: 'amarjit'
    },
    {
      code: 'EMP-008',
      name: 'Rolit Soni',
      role: 'HGV Driver',
      lastMedical: '12 Sep 2024',
      expiryDate: '12 Sep 2026',
      daysLeft: 480,
      status: 'Fit to Drive',
      statusClass: 'badge-fit',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'None',
      avatar: '/img/driver-avatar-nirmal.png',
      matchQuery: 'rolit'
    },
    {
      code: 'EMP-009',
      name: 'Karan Singh',
      role: 'HGV Driver',
      lastMedical: '14 Jan 2024',
      expiryDate: '14 Jan 2026',
      daysLeft: 252,
      status: 'Due Soon',
      statusClass: 'badge-due',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'None',
      avatar: '/img/driver-avatar-mulindwa.png',
      matchQuery: 'karan'
    },
    {
      code: 'EMP-010',
      name: 'Sahil Kumar',
      role: 'HGV Driver',
      lastMedical: '03 Mar 2024',
      expiryDate: '03 Mar 2026',
      daysLeft: 309,
      status: 'Fit to Drive',
      statusClass: 'badge-fit',
      visionTest: true,
      hearingTest: true,
      drugAlcohol: true,
      healthConditions: 'None',
      avatar: '/img/employee-jaswant.png',
      matchQuery: 'sahil'
    }
  ];

  const records = seedMedicalRecords.map((r, idx) => {
    const match = dbEmployees.find(e => e.fullName.toLowerCase().includes(r.matchQuery));
    return {
      ...r,
      id: match ? match.id : (dbEmployees[idx] ? dbEmployees[idx].id : `med-${idx + 1}`)
    };
  });

  return {
    kpis: {
      fitToDrive: 48,
      fitPct: 82,
      dueSoon: 7,
      expired: 4,
      awaitingResults: 2,
      totalEmployees: 61,
    },
    records,
    medicalOverviewDonut: [
      { label: 'Fit to Drive', count: 48, pct: 82, color: '#10b981' },
      { label: 'Due Soon', count: 7, pct: 11, color: '#f59e0b' },
      { label: 'Expired', count: 4, pct: 7, color: '#ef4444' },
      { label: 'Awaiting Results', count: 2, pct: 3, color: '#94a3b8' },
    ],
    upcomingExpiry: [
      { month: 'May', dueSoon: 3, expired: 0 },
      { month: 'Jun', dueSoon: 0, expired: 6 },
      { month: 'Jul', dueSoon: 0, expired: 4 },
    ],
    fitnessByRole: [
      { role: 'HGV Driver', count: 48, color: '#10b981' },
      { role: 'LGV Driver', count: 5, color: '#3b82f6' },
      { role: 'Mechanic', count: 3, color: '#3b82f6' },
      { role: 'Office Staff', count: 2, color: '#3b82f6' },
      { role: 'Management', count: 3, color: '#3b82f6' },
    ],
    healthConditions: [
      { label: 'None', count: 52, pct: 85, color: '#10b981' },
      { label: 'Hypertension', count: 3, pct: 5, color: '#f59e0b' },
      { label: 'Diabetes', count: 2, pct: 3, color: '#f97316' },
      { label: 'Asthma', count: 2, pct: 3, color: '#8b5cf6' },
      { label: 'Other', count: 2, pct: 3, color: '#3b82f6' },
    ]
  };
}

module.exports = {
  getMedicalFitnessData,
};
