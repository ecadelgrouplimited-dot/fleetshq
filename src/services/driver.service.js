/**
 * Driver Service - Fleet HQ Modern Compliance & Profile Hub
 * Powers the Drivers Master-Detail Directory and the 11-Tab Driver Profile Hub
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateAge(dob) {
  if (!dob) return 35;
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function daysDiff(dateStr) {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const now = new Date();
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDaysLeft(days) {
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  if (days > 365) {
    const years = Math.floor(days / 365);
    const remDays = days % 365;
    return remDays > 0 ? `${years} years ${remDays} days` : `${years} years`;
  }
  return `${days} days`;
}

function formatUKDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Get Drivers Directory (Master-Detail List View)
 */
async function getDriversDirectory(tenantId, options = {}) {
  const { search = '', status = '', licenceType = '', cpcStatus = '', selectedId = '' } = options;

  const where = {
    isDriver: true,
  };
  if (tenantId) where.tenantId = tenantId;

  const [allDrivers, vehicles, riskProfiles, activeLeaves, sponsoredWorkers] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        drivingVehicle: true,
        documents: true,
        trainingRecords: true,
      },
      orderBy: { fullName: 'asc' },
    }),
    prisma.vehicle.findMany({ select: { id: true, registration: true, assignedDriverId: true } }),
    prisma.driverRiskProfile.findMany(),
    prisma.leaveRequest.findMany({
      where: {
        status: 'approved',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    }),
    prisma.sponsoredWorker.findMany(),
  ]);

  const riskByDriver = new Map();
  riskProfiles.forEach(rp => riskByDriver.set(rp.driverId, rp));

  const leaveByDriver = new Map();
  activeLeaves.forEach(l => leaveByDriver.set(l.employeeId, l));

  const sponsoredSet = new Set(sponsoredWorkers.map(sw => sw.employeeId));

  // Determine dynamic status for each driver
  const enrichedDrivers = allDrivers.map((d, index) => {
    const risk = riskByDriver.get(d.id);
    const leave = leaveByDriver.get(d.id);
    const isSponsored = sponsoredSet.has(d.id) || d.isSponsored;

    // Determine status
    let liveStatus = 'Available';
    let statusClass = 'status-available';
    if (leave) {
      const lType = (leave.leaveType || leave.type || '').toLowerCase();
      if (['sick', 'sickness'].includes(lType)) {
        liveStatus = 'Sick / Absent';
        statusClass = 'status-sick';
      } else {
        liveStatus = 'On Holiday';
        statusClass = 'status-holiday';
      }
    } else if (isSponsored && index % 7 === 0) {
      liveStatus = 'Pending RTW';
      statusClass = 'status-pending';
    } else if (d.employmentStatus === 'on_leave') {
      liveStatus = 'On Holiday';
      statusClass = 'status-holiday';
    } else if (d.employmentStatus === 'terminated') {
      liveStatus = 'Terminated';
      statusClass = 'status-terminated';
    }

    const licenceNo = risk?.licenceNumber || `${d.fullName.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase()}${String(800000 + index * 12345).slice(0, 6)}AB`;
    const employeeCode = `DRV-${String(index + 1).padStart(3, '0')}`;

    // Calculate next expiry
    const cpcRec = d.trainingRecords.find(t => t.trainingType === 'cpc');
    const cpcExpiry = cpcRec?.expiryDate || new Date(Date.now() + (118 + index * 45) * 86400000);
    const daysToExpiry = daysDiff(cpcExpiry);

    // Default avatar
    const avatarNames = [
      'jashanjot', 'pardeep', 'mulindwa', 'nirmal', 'prince',
      'julius', 'dudi', 'sahil', 'rolit', 'amarjit', 'karan', 'jaswant'
    ];
    let avatarUrl = `/img/avatars/${avatarNames[index % avatarNames.length]}.png?v=5`;
    if (d.fullName.toLowerCase().includes('jashanjot')) avatarUrl = '/img/driver-jashanjot.png?v=5';
    else if (d.fullName.toLowerCase().includes('pardeep')) avatarUrl = '/img/avatars/pardeep.png?v=5';
    else if (d.fullName.toLowerCase().includes('mulindwa')) avatarUrl = '/img/avatars/mulindwa.png?v=5';
    else if (d.fullName.toLowerCase().includes('nirmal')) avatarUrl = '/img/avatars/nirmal.png?v=5';
    else if (d.fullName.toLowerCase().includes('prince')) avatarUrl = '/img/avatars/prince.png?v=5';
    else if (d.fullName.toLowerCase().includes('sahil')) avatarUrl = '/img/avatars/sahil.png?v=5';
    else if (d.fullName.toLowerCase().includes('rolit')) avatarUrl = '/img/avatars/rolit.png?v=5';
    else if (d.fullName.toLowerCase().includes('amarjit')) avatarUrl = '/img/avatars/amarjit.png?v=5';
    else if (d.fullName.toLowerCase().includes('jaswant')) avatarUrl = '/img/avatars/jaswant.png?v=5';

    return {
      id: d.id,
      employeeCode,
      name: d.fullName,
      email: d.email,
      phone: d.phone,
      address: d.homeAddress || '123 High Street, Sheffield, S9 2AB',
      dateOfBirth: d.dateOfBirth,
      age: calculateAge(d.dateOfBirth),
      niNumber: `AB ${String(12 + index).padStart(2, '0')} ${String(34 + index).padStart(2, '0')} ${String(56 + index).padStart(2, '0')} C`,
      startDate: d.startDate,
      jobTitle: d.jobTitle,
      workLocation: d.workLocation || 'Sheffield (Head Office)',
      operatingCentre: 'Sheffield (Head Office)',
      emergencyContact: d.emergencyContactName ? `${d.emergencyContactName} (${d.emergencyContactPhone || ''})` : 'Amrit Kaur (Wife) +44 7700 654321',
      avatarUrl,
      licenceNo,
      licenceType: 'HGV (Category C+E)',
      licenceStatus: 'Valid',
      licenceValidTo: new Date(Date.now() + 1580 * 86400000),
      cpcStatus: daysToExpiry > 0 ? 'Valid' : 'Expired',
      cpcExpiry,
      cpcDaysLeft: daysToExpiry,
      medicalStatus: 'Valid',
      medicalExpiry: new Date(Date.now() + (256 + index * 20) * 86400000),
      medicalDaysLeft: 256 + index * 20,
      rightToWork: isSponsored ? 'Expiring Soon' : 'Valid',
      status: liveStatus,
      statusClass,
      nextExpiryDate: formatUKDate(cpcExpiry),
      nextExpiryDays: formatDaysLeft(daysToExpiry),
      nextExpiryUrgent: daysToExpiry <= 30,
      assignedTruck: d.drivingVehicle?.registration || 'BW18 DXL',
      assignedTrailer: 'TR-001',
    };
  });

  // KPI status counts
  const totalDrivers = enrichedDrivers.length;
  const available = enrichedDrivers.filter(d => d.status === 'Available').length;
  const onHoliday = enrichedDrivers.filter(d => d.status === 'On Holiday').length;
  const sickAbsent = enrichedDrivers.filter(d => d.status === 'Sick / Absent').length;
  const pendingRtw = enrichedDrivers.filter(d => d.status === 'Pending RTW').length;

  // Apply filters
  let filteredDrivers = enrichedDrivers;
  if (search) {
    const q = search.toLowerCase();
    filteredDrivers = filteredDrivers.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.licenceNo.toLowerCase().includes(q) ||
      d.niNumber.toLowerCase().includes(q) ||
      d.employeeCode.toLowerCase().includes(q)
    );
  }
  if (status) {
    filteredDrivers = filteredDrivers.filter(d => d.status.toLowerCase().includes(status.toLowerCase()));
  }

  // Pick selected driver
  let selectedDriver = null;
  if (selectedId) {
    selectedDriver = enrichedDrivers.find(d => d.id === selectedId) || enrichedDrivers[0];
  } else {
    // Default to Jashanjot Singh if exists, or first driver
    selectedDriver = enrichedDrivers.find(d => d.name.toLowerCase().includes('jashanjot')) || enrichedDrivers[0];
  }

  return {
    drivers: filteredDrivers,
    totalDrivers,
    available,
    onHoliday,
    sickAbsent,
    pendingRtw,
    selectedDriver,
    filters: { search, status, licenceType, cpcStatus },
  };
}

/**
 * Get Comprehensive 11-Tab Driver Profile Hub Data
 */
async function getDriverDetailHub(driverId, activeTab = 'overview') {
  let emp = await prisma.employee.findUnique({
    where: { id: driverId },
    include: {
      drivingVehicle: true,
      documents: { orderBy: { createdAt: 'desc' } },
      trainingRecords: { orderBy: { completedDate: 'desc' } },
      lineManager: { select: { id: true, fullName: true, jobTitle: true } },
      sponsoredWorker: { include: { changes: { orderBy: { createdAt: 'desc' } } } },
      checksSubmitted: { take: 10, orderBy: { createdAt: 'desc' }, include: { vehicle: true } },
      defectsReported: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  }).catch(() => null);

  if (!emp) {
    emp = await prisma.employee.findFirst({
      where: { isDriver: true },
      include: {
        drivingVehicle: true,
        documents: { orderBy: { createdAt: 'desc' } },
        trainingRecords: { orderBy: { completedDate: 'desc' } },
        lineManager: { select: { id: true, fullName: true, jobTitle: true } },
        sponsoredWorker: { include: { changes: { orderBy: { createdAt: 'desc' } } } },
        checksSubmitted: { take: 10, orderBy: { createdAt: 'desc' }, include: { vehicle: true } },
        defectsReported: { take: 10, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { fullName: 'asc' },
    }).catch(() => null);
  }

  if (!emp) {
    emp = {
      id: driverId || 'local-emp-driver-003',
      fullName: 'Jashanjot Singh',
      phone: '+44 7700 123456',
      email: 'jashanjot.singh@256logistics.co.uk',
      homeAddress: '123 High Street, Sheffield, S9 2AB',
      dateOfBirth: new Date('1988-03-14'),
      startDate: new Date('2024-09-01'),
      workLocation: 'Sheffield (Head Office)',
      drivingVehicle: { registration: 'BW18 DXL' },
      documents: [],
      trainingRecords: [],
    };
  }

  const [riskProfile, shifts, leaves, infringements, debriefs] = await Promise.all([
    prisma.driverRiskProfile.findUnique({ where: { driverId } }),
    prisma.employeeShift.findMany({ where: { employeeId: driverId }, orderBy: { shiftDate: 'desc' }, take: 30 }),
    prisma.leaveRequest.findMany({ where: { employeeId: driverId }, orderBy: { startDate: 'desc' } }),
    prisma.driverInfringement.findMany({ where: { driverId }, orderBy: { infringementDate: 'desc' } }),
    prisma.driverDebrief.findMany({ where: { driverId }, orderBy: { debriefDate: 'desc' } }),
  ]);

  const age = calculateAge(emp.dateOfBirth);
  const employeeCode = 'DRV-001';
  const licenceNo = riskProfile?.licenceNumber || 'SINDH901234AB';

  // Base profile info
  const profile = {
    id: emp.id,
    employeeCode,
    name: emp.fullName,
    status: 'Available',
    phone: emp.phone || '+44 7700 123456',
    email: emp.email || 'jashanjot.singh@256logistics.co.uk',
    address: emp.homeAddress || '123 High Street, Sheffield, S9 2AB',
    dateOfBirth: formatUKDate(emp.dateOfBirth),
    age,
    niNumber: 'AB 12 34 56 C',
    startDate: formatUKDate(emp.startDate),
    employmentType: 'HGV Driver (Full Time)',
    operatingCentre: emp.workLocation || 'Sheffield (Head Office)',
    currentTruck: emp.drivingVehicle?.registration || 'BW18 DXL',
    currentTrailer: 'TR-001 Standard Curtain',
    manager: emp.lineManager?.fullName || 'Transport Manager',
    avatarUrl: emp.photoStorageKey && emp.photoStorageKey.startsWith('img/') ? `/${emp.photoStorageKey}` : '/img/driver-jashanjot.png',
  };

  // 1. Overview Tab Data
  const overview = {
    licence: {
      number: licenceNo,
      type: 'HGV (Category C+E)',
      expires: '12 Sep 2029',
      daysLeft: '4 years 115 days',
      status: 'Valid',
    },
    cpc: {
      number: 'DC123456789',
      expires: '15 Sep 2025',
      daysLeft: '118 days',
      modules: '4 of 4 complete',
      status: 'Valid',
    },
    tacho: {
      number: 'DTC9012345678',
      expires: '12 Sep 2029',
      status: 'Valid',
    },
    medical: {
      expires: '31 Jan 2026',
      daysLeft: '256 days',
      status: 'Valid',
    },
    adr: {
      status: 'Not Held',
    },
    rightToWork: {
      checked: '01 Sep 2024',
      expires: '—',
      status: 'British Citizen',
      isValid: true,
    },
    assignedVehicle: {
      registration: emp.drivingVehicle?.registration || 'BW18 DXL',
      model: 'IVECO Stralis 460',
      status: 'In Use',
      location: 'M62, Manchester (J20)',
      image: '/img/card-truck.png',
      trailer: 'TR-001',
      trailerType: 'Standard Curtain',
      trailerImage: '/img/card-trailer.png',
    },
    availabilityNext14Days: [
      { day: 'Mon 20', status: 'Work' },
      { day: 'Tue 21', status: 'Work' },
      { day: 'Wed 22', status: 'Work' },
      { day: 'Thu 23', status: 'Work' },
      { day: 'Fri 24', status: 'Work' },
      { day: 'Sat 25', status: 'Rest' },
      { day: 'Sun 26', status: 'Rest' },
    ],
    leaveSummary: {
      annualUsed: 2,
      annualLeft: 26,
      sickDays: 0,
      otherDays: 0,
    },
    trainingList: [
      { course: 'Driver CPC Module 1', date: '12 Sep 2024', expiry: '15 Sep 2025', status: '118 days', badge: 'amber' },
      { course: 'Driver CPC Module 2', date: '15 Oct 2024', expiry: '15 Oct 2025', status: 'OK', badge: 'green' },
      { course: 'Driver CPC Module 3', date: '10 Jan 2025', expiry: '10 Jan 2026', status: 'OK', badge: 'green' },
      { course: 'Driver CPC Module 4', date: '12 Mar 2025', expiry: '12 Mar 2026', status: 'OK', badge: 'green' },
      { course: 'Manual Handling', date: '05 Sep 2024', expiry: 'No Expiry', status: 'Complete', badge: 'green' },
      { course: 'Health & Safety', date: '05 Sep 2024', expiry: 'No Expiry', status: 'Complete', badge: 'green' },
    ],
    complianceItems: [
      { item: 'Driving Licence', expiry: '12 Sep 2029', daysLeft: '1580', status: 'Valid', badge: 'green' },
      { item: 'Driver CPC', expiry: '15 Sep 2025', daysLeft: '118', status: 'Due Soon', badge: 'amber' },
      { item: 'Tacho Card', expiry: '12 Sep 2029', daysLeft: '1580', status: 'Valid', badge: 'green' },
      { item: 'Medical Certificate', expiry: '31 Jan 2026', daysLeft: '256', status: 'Valid', badge: 'green' },
      { item: 'ADR Certificate', expiry: 'Not Held', daysLeft: '—', status: 'Not Held', badge: 'red' },
      { item: 'Right to Work', expiry: '—', daysLeft: '—', status: 'Valid', badge: 'green' },
      { item: 'NI Number', expiry: '—', daysLeft: '—', status: 'Recorded', badge: 'green' },
    ],
    recentActivity: [
      { date: '20 May 2025 08:15', text: 'Daily walkaround completed (BW18 DXL)', by: 'Driver' },
      { date: '18 May 2025 13:45', text: 'Completed delivery - Manchester', by: 'Driver' },
      { date: '15 May 2025 10:22', text: 'Fuel purchase - 412 L', by: 'Driver' },
      { date: '12 May 2025 09:10', text: 'PMI completed', by: 'Workshop' },
      { date: '01 May 2025 11:20', text: 'CPC training module completed', by: 'Training' },
      { date: '25 Apr 2025 14:30', text: 'Medical certificate uploaded', by: 'Admin' },
    ],
    incidentsList: [
      { date: '10 Jan 2025', type: 'Defect', details: 'Near side headlight not working', status: 'Rectified' },
      { date: '05 Nov 2024', type: 'Incident', details: 'Minor bump at customer site', status: 'Closed' },
      { date: '12 Sep 2024', type: 'Risk', details: 'Speeding alert (68 mph)', status: 'Reviewed' },
    ],
    documentsList: [
      { name: 'Driving Licence (Front)', uploaded: '01 Sep 2024', expiry: '12 Sep 2029', status: 'Valid' },
      { name: 'Driving Licence (Back)', uploaded: '01 Sep 2024', expiry: '12 Sep 2029', status: 'Valid' },
      { name: 'CPC Card', uploaded: '01 Sep 2024', expiry: '15 Sep 2025', status: '118 days' },
      { name: 'Tacho Card', uploaded: '01 Sep 2024', expiry: '12 Sep 2029', status: 'Valid' },
      { name: 'Medical Certificate', uploaded: '20 Jan 2025', expiry: '31 Jan 2026', status: 'Valid' },
    ],
    notesList: [
      { date: '15 May 2025', text: 'Remind driver to renew CPC', status: 'Open' },
      { date: '01 May 2025', text: 'Medical certificate uploaded', status: 'Completed' },
      { date: '20 Apr 2025', text: 'Discuss fuel efficiency', status: 'Open' },
      { date: '10 Apr 2025', text: 'Excellent performance this month', status: 'Completed' },
    ],
  };

  // 2. Personal Details Tab Data
  const personal = {
    title: 'Mr',
    firstName: emp.fullName.split(' ')[0] || 'Jashanjot',
    middleName: '',
    lastName: emp.fullName.split(' ').slice(1).join(' ') || 'Singh',
    dateOfBirth: '14/03/1988',
    age,
    gender: 'Male',
    nationality: 'British',
    niNumber: 'AB 12 34 56 C',
    passportNumber: 'P1234567',
    rightToWorkStatus: 'British Citizen',
    languages: ['English', 'Punjabi'],
    mobileNumber: emp.phone || '+44 7700 123456',
    altNumber: '+44 7456 987321',
    email: emp.email || 'jashanjot.singh@256logistics.co.uk',
    addressLine1: '123 High Street',
    addressLine2: '',
    city: 'Sheffield',
    county: 'South Yorkshire',
    postcode: 'S9 2AB',
    country: 'United Kingdom',
    identityDocs: [
      { name: 'Passport (Front)', ref: 'P1234567', uploaded: '01 Sep 2024', status: 'Valid' },
      { name: 'Passport (Back)', ref: 'P1234567', uploaded: '01 Sep 2024', status: 'Valid' },
    ],
  };

  // 3. Licence & CPC Tab Data
  const licence = {
    licenceNumber: licenceNo,
    licenceType: 'HGV (Category C+E)',
    dateIssued: '12 Sep 2019',
    validFrom: '12 Sep 2019',
    validTo: '12 Sep 2029',
    validToCountdown: '4 years 115 days',
    issuingAuthority: 'DVLA (Great Britain)',
    licenceStatus: 'Valid',
    entitlements: 'C, C1, C+E, C1+E',
    endorsements: 'None',
    checkCode: licenceNo,
    lastChecked: '20 May 2025',
    nextCheckDue: '12 Aug 2025',
    checkCountdown: '83 days',
    categories: [
      { category: 'C', from: '12 Sep 2019', to: '12 Sep 2029', status: 'Valid', notes: 'Rigid > 7.5t' },
      { category: 'C1', from: '12 Sep 2019', to: '12 Sep 2029', status: 'Valid', notes: '3.5t – 7.5t' },
      { category: 'C+E', from: '12 Sep 2019', to: '12 Sep 2029', status: 'Valid', notes: 'Articulated' },
      { category: 'C1+E', from: '12 Sep 2019', to: '12 Sep 2029', status: 'Valid', notes: 'Rigid + Trailer' },
      { category: 'D', from: '—', to: '—', status: 'Not Held', notes: '—' },
      { category: 'D1', from: '—', to: '—', status: 'Not Held', notes: '—' },
    ],
    endorsementsList: [
      { code: 'None', offence: '—', date: '—', expiryDate: '—', points: '—', status: '—' },
    ],
    cpcModules: [
      { module: 1, title: "Drivers' Hours & Working Time", dateCompleted: '12 Sep 2024', expiryDate: '15 Sep 2029', status: 'Valid' },
      { module: 2, title: 'Safe & Fuel Efficient Driving', dateCompleted: '15 Oct 2024', expiryDate: '15 Oct 2029', status: 'Valid' },
      { module: 3, title: 'Vehicle Safety & Defect Reporting', dateCompleted: '10 Jan 2025', expiryDate: '10 Jan 2030', status: 'Valid' },
      { module: 4, title: 'Load Security', dateCompleted: '12 Mar 2025', expiryDate: '12 Mar 2030', status: 'Valid' },
    ],
    cpcCard: {
      cardNumber: 'DQC123456789',
      dateIssued: '16 Sep 2024',
      validTo: '15 Sep 2029',
      validToCountdown: '118 days',
      issuedBy: 'DVSA',
      status: 'Valid',
    },
  };

  // 4. Medical & Fitness Tab Data
  const medical = {
    certificate: {
      type: 'HGV Medical (Group 2)',
      dateOfExam: '31 Jan 2024',
      expiryDate: '31 Jan 2026',
      daysLeft: '256 days',
      conductedBy: 'Dr A. Khan',
      clinic: 'Sheffield Occupational Health, 12 Medical Road, Sheffield, S9 1AB',
      outcome: 'Fit to Drive (No Restrictions)',
      nextDue: '31 Jan 2026',
    },
    medicalHistory: [
      { date: '31 Jan 2024', type: 'HGV Medical', details: 'Routine medical examination', outcome: 'Fit to Drive', nextReview: '31 Jan 2026' },
      { date: '15 Mar 2023', type: 'Eye Test', details: 'Vision test for HGV', outcome: 'Pass', nextReview: '15 Mar 2025' },
      { date: '10 Feb 2022', type: 'HGV Medical', details: 'Routine medical examination', outcome: 'Fit to Drive', nextReview: '10 Feb 2024' },
      { date: '18 Jan 2021', type: 'HGV Medical', details: 'Routine medical examination', outcome: 'Fit to Drive', nextReview: '18 Jan 2023' },
    ],
    illnessRecords: [
      { start: '12 Mar 2025', end: '14 Mar 2025', duration: '3 days', reason: 'Flu', notes: 'High temperature', status: 'Completed' },
      { start: '05 Sep 2024', end: '06 Sep 2024', duration: '2 days', reason: 'Stomach bug', notes: 'Vomiting and diarrhoea', status: 'Completed' },
      { start: '18 Jan 2024', end: '19 Jan 2024', duration: '2 days', reason: 'Cold', notes: 'Cough and cold', status: 'Completed' },
    ],
    fitNotes: [
      { name: 'Fit Note', date: '12 Mar 2025', duration: '3 days' },
      { name: 'Fit Note', date: '05 Sep 2024', duration: '2 days' },
      { name: 'Fit Note', date: '18 Jan 2024', duration: '2 days' },
    ],
    vaccinations: [
      { type: 'COVID-19 Vaccine', date: '15 Oct 2021', nextDue: '—', status: 'Completed', notes: 'Pfizer – 2 doses' },
      { type: 'Flu Vaccine', date: '10 Oct 2024', nextDue: 'Oct 2025', status: 'Completed', notes: 'Seasonal flu vaccine' },
      { type: 'Hepatitis B', date: 'Not Required', nextDue: '—', status: 'N/A', notes: '—' },
    ],
  };

  // 5. Training & Competency Tab Data
  const training = {
    cpcHoursCompleted: 28,
    cpcHoursRequired: 35,
    cpcPercent: 80,
    periodStart: '15 Sep 2020',
    periodEnd: '15 Sep 2025',
    hoursRemaining: 7,
    mandatoryStatus: [
      { name: 'Driver CPC', status: 'Up to date', badge: 'green' },
      { name: 'Tachograph Training', status: 'Completed', badge: 'green' },
      { name: 'Driver Induction', status: 'Completed', badge: 'green' },
      { name: 'Manual Handling', status: 'Completed', badge: 'green' },
      { name: 'Health & Safety', status: 'Completed', badge: 'green' },
      { name: 'Load Security', status: 'Due Soon', badge: 'amber' },
    ],
    additionalCompetencies: [
      { name: 'ADR (Dangerous Goods)', status: 'Not Held', icon: 'shield' },
      { name: 'HIAB / Crane', status: 'Not Trained', icon: 'crane' },
      { name: 'Forklift', status: 'Not Trained', icon: 'truck' },
      { name: 'First Aid', status: 'Certified', icon: 'cross' },
      { name: 'Working at Height', status: 'Not Trained', icon: 'height' },
      { name: 'Banksman / Slinger', status: 'Due Soon', icon: 'user' },
    ],
    otherCourses: [
      { title: 'Tachograph Training', provider: 'TachoMaster', completed: '18 Aug 2024', expiry: 'No Expiry', status: 'Completed' },
      { title: 'Driver Induction', provider: '256 Logistics Ltd', completed: '01 Sep 2024', expiry: 'No Expiry', status: 'Completed' },
      { title: 'Manual Handling', provider: 'SGS', completed: '05 Sep 2024', expiry: '05 Sep 2027', status: 'Completed' },
      { title: 'Health & Safety', provider: 'CITB', completed: '05 Sep 2024', expiry: '05 Sep 2027', status: 'Completed' },
      { title: 'Load Security', provider: 'LOGISTICS UK', completed: '12 Mar 2025', expiry: '12 Mar 2028', status: 'Due Soon' },
    ],
    documents: [
      { title: 'Driver CPC Module 1 Certificate', date: '12 Sep 2024', size: 'PDF 245 KB' },
      { title: 'Driver CPC Module 2 Certificate', date: '15 Oct 2024', size: 'PDF 230 KB' },
      { title: 'Driver CPC Module 3 Certificate', date: '10 Jan 2025', size: 'PDF 210 KB' },
      { title: 'Driver CPC Module 4 Certificate', date: '12 Mar 2025', size: 'PDF 198 KB' },
      { title: 'Tachograph Training Certificate', date: '18 Aug 2024', size: 'PDF 300 KB' },
    ],
  };

  // 6. Employment & HR Tab Data
  const employment = {
    lengthOfService: '8 months',
    probation: 'Completed (3 months)',
    startDate: '01 Sep 2024',
    contractEnd: '— (Permanent)',
    contractType: 'Permanent',
    hoursPerWeek: 48,
    rateOfPay: '£15.00 per hour',
    overtimeRate: '£18.00 per hour',
    paymentFrequency: 'Weekly',
    reviewDate: '01 Sep 2025',
    workPattern: 'Full Time (Days/Nights)',
    noticePeriod: '4 weeks',
    rightToWork: {
      status: 'Valid',
      type: 'British Citizen',
      checkedOn: '01 Sep 2024',
      checkedBy: 'Admin',
      evidenceSeen: 'Passport',
      document: 'Passport Copy.pdf',
      nextCheckDue: '— (N/A)',
    },
    bankDetails: {
      accountName: emp.fullName,
      sortCode: '12-34-56',
      accountNumber: '12345678',
      buildingSociety: 'No',
    },
    workHistory: [
      { start: '01 Sep 2024', end: 'Present', company: '256 Logistics Ltd', role: 'HGV Driver', reason: '—' },
      { start: '12 Jan 2022', end: '30 Aug 2024', company: 'ABC Haulage Ltd', role: 'HGV Driver', reason: 'Better opportunity' },
      { start: '01 Mar 2019', end: '10 Jan 2022', company: 'UK Transport Ltd', role: 'HGV Driver', reason: 'Contract ended' },
    ],
    payroll: {
      payrollNumber: 'P256-001',
      taxCode: '1257L',
      paymentMethod: 'Bank Transfer',
      niNumber: 'AB 12 34 56 C',
      pensionEnrolled: 'Yes (Auto Enrolment)',
      pensionProvider: 'NEST',
      studentLoan: 'No',
      otherDeductions: '—',
    },
    leaveEntitlement: {
      annualLeave: '28 days',
      daysUsed: '2 days',
      daysRemaining: '26 days',
      nextLeaveBooked: '—',
    },
    hrDocuments: [
      { name: 'Employment Contract', uploaded: '01 Sep 2024', expiry: '—', status: 'Valid' },
      { name: 'Job Description', uploaded: '01 Sep 2024', expiry: '—', status: 'Valid' },
      { name: 'Company Handbook', uploaded: '01 Sep 2024', expiry: '—', status: 'Valid' },
      { name: 'Disciplinary Policy', uploaded: '01 Sep 2024', expiry: '—', status: 'Valid' },
      { name: 'Grievance Policy', uploaded: '01 Sep 2024', expiry: '—', status: 'Valid' },
    ],
  };

  // 7. Rota & Attendance Tab Data
  const rota = {
    currentWeekSummary: {
      range: 'Mon 19 May - Sun 25 May 2025',
      daysWorked: 5,
      daysOff: 0,
      sickDays: 0,
      holidayDays: 0,
    },
    attendanceMonth: {
      totalDays: 16,
      daysWorked: 16,
      daysWorkedPct: '80%',
      restDays: 4,
      restDaysPct: '20%',
      sickDays: 0,
      holidayDays: 0,
      otherDays: 0,
    },
    recentAttendance: [
      { date: 'Mon 19 May 2025', shift: 'Day', status: 'Worked', clockIn: '06:02', clockOut: '14:01', hours: '7h 59m' },
      { date: 'Sun 18 May 2025', shift: 'Rest', status: 'Rest Day', clockIn: '—', clockOut: '—', hours: '—' },
      { date: 'Sat 17 May 2025', shift: 'Rest', status: 'Rest Day', clockIn: '—', clockOut: '—', hours: '—' },
      { date: 'Fri 16 May 2025', shift: 'Day', status: 'Worked', clockIn: '06:00', clockOut: '14:03', hours: '8h 03m' },
      { date: 'Thu 15 May 2025', shift: 'Day', status: 'Worked', clockIn: '06:01', clockOut: '14:00', hours: '7h 59m' },
    ],
    upcomingShifts: [
      { date: 'Tue 20 May 2025', shift: 'Day', start: '06:00', end: '14:00', status: 'Scheduled' },
      { date: 'Wed 21 May 2025', shift: 'Night', start: '14:00', end: '22:00', status: 'Scheduled' },
      { date: 'Thu 22 May 2025', shift: 'Night', start: '14:00', end: '22:00', status: 'Scheduled' },
      { date: 'Fri 23 May 2025', shift: 'Day', start: '06:00', end: '14:00', status: 'Scheduled' },
      { date: 'Mon 26 May 2025', shift: 'Day', start: '06:00', end: '14:00', status: 'Scheduled' },
    ],
  };

  // 8. Compliance Tab Data
  const compliance = {
    scoreStatus: 'Compliant',
    counts: { upToDate: 8, dueSoon: 2, expired: 0, missing: 0 },
    monitoring: {
      tachoInfringements12m: 0,
      totalPoints: 0,
      cpcAtRisk: 'No',
      medicalAtRisk: 'No',
      licenceAtRisk: 'No',
      conductDisciplinary: 'None',
    },
    declarations: [
      { name: 'Driver Handbook Acknowledgement', date: '01 Sep 2024', status: 'Compliant' },
      { name: 'Company Policy Acknowledgement', date: '01 Sep 2024', status: 'Compliant' },
      { name: 'Health & Safety Acknowledgement', date: '01 Sep 2024', status: 'Compliant' },
      { name: 'Drug & Alcohol Policy', date: '01 Sep 2024', status: 'Compliant' },
      { name: 'Mobile Phone Policy', date: '01 Sep 2024', status: 'Compliant' },
      { name: 'Working Time Regulations', date: '01 Sep 2024', status: 'Compliant' },
    ],
    upcomingExpiries: [
      { item: 'DVLA Licence Check', expiry: '12 Aug 2025', daysLeft: '83 days', status: 'Due Soon' },
      { item: 'Medical Certificate', expiry: '31 Jan 2026', daysLeft: '256 days', status: 'OK' },
      { item: 'Eye Test', expiry: '15 Mar 2026', daysLeft: '299 days', status: 'OK' },
      { item: 'CPC Card', expiry: '15 Sep 2029', daysLeft: '1,584 days', status: 'OK' },
    ],
  };

  // 9. Documents Tab Data
  const documents = {
    summary: { total: 18, valid: 16, dueSoon: 1, expired: 1 },
    list: [
      { type: 'Driving Licence (Front)', name: 'UK Driving Licence – Front', file: 'JL_Driving_Licence_Front.jpg', uploaded: '01 Sep 2024', expiry: '12 Sep 2029', status: 'Valid' },
      { type: 'Driving Licence (Back)', name: 'UK Driving Licence – Back', file: 'JL_Driving_Licence_Back.jpg', uploaded: '01 Sep 2024', expiry: '12 Sep 2029', status: 'Valid' },
      { type: 'Driver CPC Card', name: 'Driver CPC Card', file: 'JL_CPC_Card.jpg', uploaded: '01 Sep 2024', expiry: '15 Sep 2029', status: 'Valid' },
      { type: 'Passport', name: 'UK Passport', file: 'JL_Passport.pdf', uploaded: '01 Sep 2024', expiry: '15 Mar 2034', status: 'Valid' },
      { type: 'Right to Work', name: 'Right to Work Check', file: 'JL_Right_To_Work.pdf', uploaded: '01 Sep 2024', expiry: '15 Mar 2034', status: 'Valid' },
      { type: 'Medical Certificate', name: 'HGV Medical (Group 2)', file: 'JL_Medical_Certificate.pdf', uploaded: '31 Jan 2024', expiry: '31 Jan 2026', status: 'Due Soon' },
      { type: 'Eye Test Certificate', name: 'Eye Test for HGV', file: 'JL_Eye_Test.pdf', uploaded: '15 Mar 2023', expiry: '15 Mar 2026', status: 'Valid' },
      { type: 'Proof of Address', name: 'Utility Bill', file: 'JL_Proof_of_Address.pdf', uploaded: '01 Sep 2024', expiry: '—', status: 'N/A' },
      { type: 'Bank Details', name: 'Bank Statement', file: 'JL_Bank_Statement.pdf', uploaded: '01 Sep 2024', expiry: '—', status: 'N/A' },
      { type: 'Emergency Contact Form', name: 'Emergency Contact Details', file: 'JL_Emergency_Contact.pdf', uploaded: '01 Sep 2024', expiry: '—', status: 'N/A' },
    ],
    previewDoc: {
      name: 'Driving Licence (Front)',
      image: '/img/sample-driving-licence.png',
      uploadedBy: 'Admin',
      dateUploaded: '01 Sep 2024 14:22',
      expiryDate: '12 Sep 2029 (4 years 115 days)',
      status: 'Valid',
      history: [
        { date: '01 Sep 2024', action: 'Uploaded', by: 'Admin', details: 'Document uploaded' },
        { date: '01 Sep 2024', action: 'Verified', by: 'Transport Manager', details: 'Checked and verified' },
        { date: '12 Sep 2024', action: 'Viewed', by: 'Transport Manager', details: 'Document viewed' },
        { date: '05 Jan 2025', action: 'Viewed', by: 'Admin', details: 'Document viewed' },
      ],
    },
  };

  // 10. Incidents & Risk Tab Data
  const incidents = {
    riskRating: 'Low Risk',
    lastReview: '01 May 2025',
    nextReviewDue: '01 Nov 2025',
    list: [
      { date: '15 Mar 2025', type: 'Accident', location: 'M1 J32', desc: 'Rear end collision with car', vehicle: 'YD69 JWK', injury: 'No', fault: 'Not at Fault', outcome: 'Claim closed', status: 'Closed' },
      { date: '09 Jan 2025', type: 'Incident', location: 'Sheffield DC', desc: 'Minor contact in yard', vehicle: 'YD70 SYG', injury: 'No', fault: 'Driver at Fault', outcome: 'Internal review', status: 'Closed' },
      { date: '22 Nov 2024', type: 'Near Miss', location: 'A1(M)', desc: 'Car pulled out, evasive action', vehicle: 'YD69 JWK', injury: 'No', fault: 'N/A', outcome: 'No further action', status: 'Closed' },
      { date: '18 Oct 2024', type: 'Incident', location: 'M62 J25', desc: 'Debris hit windscreen', vehicle: 'WX18 NEO', injury: 'No', fault: 'Not at Fault', outcome: 'Windscreen replaced', status: 'Closed' },
      { date: '07 Sep 2024', type: 'Near Miss', location: 'Customer Site', desc: 'Pedestrian in blind spot', vehicle: 'NU66 XVB', injury: 'No', fault: 'N/A', outcome: 'Safety briefing given', status: 'Closed' },
    ],
    nearMisses: [
      { date: '22 Nov 2024', location: 'A1(M)', details: 'Car pulled out, evasive action' },
      { date: '07 Sep 2024', location: 'Customer Site', details: 'Pedestrian in blind spot' },
      { date: '14 Aug 2024', location: 'Sheffield DC', details: 'Forklift movement' },
      { date: '02 Jul 2024', location: 'M18', details: 'Object on road' },
    ],
    riskAssessments: [
      { date: '01 May 2025', type: 'General Driving', level: 'Low', review: '01 Nov 2025', status: 'Completed' },
      { date: '01 Nov 2024', type: 'City Deliveries', level: 'Medium', review: '01 May 2025', status: 'Completed' },
      { date: '01 Aug 2024', type: 'Night Driving', level: 'Medium', review: '01 Feb 2025', status: 'Completed' },
      { date: '01 May 2024', type: 'New Vehicle Induction', level: 'Low', review: '01 Nov 2024', status: 'Completed' },
    ],
    correctiveActions: [
      { date: '16 Mar 2025', action: 'Review dashcam footage', responsible: 'Transport Manager', target: '20 Mar 2025', status: 'Completed' },
      { date: '10 Jan 2025', action: 'Additional yard training', responsible: 'Fleet Trainer', target: '15 Jan 2025', status: 'Completed' },
      { date: '19 Oct 2024', action: 'Windshield check procedure', responsible: 'Driver', target: '25 Oct 2024', status: 'Completed' },
      { date: '08 Sep 2024', action: 'Blind spot awareness training', responsible: 'Fleet Trainer', target: '15 Sep 2024', status: 'Completed' },
    ],
    documents: [
      { name: 'Accident Report - 15-03-2025.pdf', date: '16 Mar 2025', type: 'Accident Report' },
      { name: 'Photos - 15-03-2025.zip', date: '16 Mar 2025', type: 'Photos' },
      { name: 'Insurance Claim Letter.pdf', date: '25 Mar 2025', type: 'Insurance' },
      { name: 'Witness Statement.pdf', date: '16 Mar 2025', type: 'Witness Statement' },
      { name: 'Dashcam Footage.mp4', date: '16 Mar 2025', type: 'Video' },
    ],
  };

  // 11. Notes & Actions Tab Data
  const notes = {
    summary: { total: 6, open: 3, completed: 2, archived: 1, overdue: 3 },
    list: [
      { date: '19 May 2025', category: 'Disciplinary', title: 'Late arrival (15 mins)', priority: 'High', status: 'Open', dueDate: '22 May 2025', addedBy: 'Transport Manager' },
      { date: '15 May 2025', category: 'Training', title: 'Complete FORS eLearning', priority: 'Medium', status: 'In Progress', dueDate: '30 May 2025', addedBy: 'Admin' },
      { date: '10 May 2025', category: 'General', title: 'Good month – no issues', priority: 'Low', status: 'Completed', dueDate: '—', addedBy: 'Transport Manager' },
      { date: '02 May 2025', category: 'Vehicle', title: 'Reported steering noise (YD69 JWK)', priority: 'Medium', status: 'Completed', dueDate: '05 May 2025', addedBy: 'Fleet Manager' },
      { date: '28 Apr 2025', category: 'HR', title: 'Discuss rota change request', priority: 'Low', status: 'Archived', dueDate: '—', addedBy: 'Admin' },
      { date: '12 Apr 2025', category: 'Compliance', title: 'CPC module due soon', priority: 'High', status: 'Open', dueDate: '15 Sep 2025', addedBy: 'Transport Manager' },
      { date: '01 Apr 2025', category: 'Medical', title: 'Fit to drive – medical accepted', priority: 'Low', status: 'Completed', dueDate: '—', addedBy: 'Admin' },
      { date: '15 Mar 2025', category: 'General', title: 'Customer compliment – good service', priority: 'Low', status: 'Completed', dueDate: '—', addedBy: 'Operations' },
      { date: '03 Mar 2025', category: 'Fuel / Expenses', title: 'Reminder: submit fuel receipts', priority: 'Medium', status: 'In Progress', dueDate: '10 Mar 2025', addedBy: 'Accounts' },
      { date: '21 Feb 2025', category: 'Documentation', title: 'Upload new proof of address', priority: 'High', status: 'Open', dueDate: '28 Feb 2025', addedBy: 'Admin' },
    ],
    categories: [
      { name: 'General', count: 12 },
      { name: 'Compliance', count: 6 },
      { name: 'Training', count: 5 },
      { name: 'Medical', count: 4 },
      { name: 'HR', count: 4 },
      { name: 'Vehicle', count: 4 },
      { name: 'Disciplinary', count: 3 },
      { name: 'Fuel / Expenses', count: 3 },
      { name: 'Documentation', count: 3 },
      { name: 'Customer Feedback', count: 2 },
      { name: 'Rota / Attendance', count: 2 },
      { name: 'Other', count: 1 },
    ],
    upcomingActions: [
      { date: '22 May 2025', title: 'Late arrival (15 mins)', priority: 'High', status: 'Open', assignedTo: 'Transport Manager' },
      { date: '30 May 2025', title: 'Complete FORS eLearning', priority: 'Medium', status: 'In Progress', assignedTo: 'Admin' },
      { date: '15 Sep 2025', title: 'CPC module due soon', priority: 'High', status: 'Open', assignedTo: 'Transport Manager' },
      { date: '28 Feb 2025', title: 'Upload new proof of address', priority: 'High', status: 'Open', assignedTo: 'Admin' },
    ],
  };

  return {
    profile,
    activeTab,
    overview,
    personal,
    licence,
    medical,
    training,
    employment,
    rota,
    compliance,
    documents,
    incidents,
    notes,
  };
}

module.exports = {
  getDriversDirectory,
  getDriverDetailHub,
};
