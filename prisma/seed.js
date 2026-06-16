require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const hash = (p) => bcrypt.hash(p, 10);
const ago  = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x; };
const fut  = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x; };
const yr   = new Date().getFullYear();

async function main() {
  console.log('🌱 Seeding 256 Logistics Compliance Hub — full demo data...\n');

  // ── Wipe existing data ────────────────────────────────────────────────
  await prisma.alert.deleteMany();
  await prisma.complianceScore.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.toolboxTalkAssignment.deleteMany();
  await prisma.toolboxTalk.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.trainingRecord.deleteMany();
  await prisma.defectPhoto.deleteMany();
  await prisma.walkAroundCheckItem.deleteMany();
  await prisma.defectCase.deleteMany();
  await prisma.walkAroundCheck.deleteMany();
  await prisma.vorRecord.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.sponsoredWorkerChange.deleteMany();
  await prisma.sponsoredWorker.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  // ── Users / Accounts ──────────────────────────────────────────────────
  const pw = await hash('Demo2024!');

  const [directorUser, tmUser, hrUser, opsUser] = await Promise.all([
    prisma.user.create({ data: { email: 'director@256logistics.co.uk', passwordHash: pw, role: 'director', firstName: 'Sarah', lastName: 'Mitchell', phone: '07700900001' } }),
    prisma.user.create({ data: { email: 'transport@256logistics.co.uk', passwordHash: pw, role: 'transport_manager', firstName: 'David', lastName: 'Hughes', phone: '07700900002' } }),
    prisma.user.create({ data: { email: 'hr@256logistics.co.uk', passwordHash: pw, role: 'hr_manager', firstName: 'Claire', lastName: 'Pearson', phone: '07700900003' } }),
    prisma.user.create({ data: { email: 'ops@256logistics.co.uk', passwordHash: pw, role: 'operations_manager', firstName: 'Mark', lastName: 'Ellis', phone: '07700900004' } }),
  ]);

  // Driver users — these will be linked to employee records after
  const driverUsers = await Promise.all([
    prisma.user.create({ data: { email: 'driver1@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'James', lastName: 'Okello' } }),
    prisma.user.create({ data: { email: 'driver2@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Mohammed', lastName: 'Al-Rashid' } }),
    prisma.user.create({ data: { email: 'driver3@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Thomas', lastName: 'Adeyemi' } }),
    prisma.user.create({ data: { email: 'driver4@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Robert', lastName: 'Chen' } }),
    prisma.user.create({ data: { email: 'driver5@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Pavel', lastName: 'Novak' } }),
    prisma.user.create({ data: { email: 'driver6@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Kevin', lastName: 'Williams' } }),
    prisma.user.create({ data: { email: 'driver7@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Oluwaseun', lastName: 'Bakare' } }),
    prisma.user.create({ data: { email: 'driver8@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Gheorghe', lastName: 'Ionescu' } }),
    prisma.user.create({ data: { email: 'driver9@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Derek', lastName: 'Morrison' } }),
    prisma.user.create({ data: { email: 'driver10@256logistics.co.uk', passwordHash: pw, role: 'driver', firstName: 'Tariq', lastName: 'Hassan' } }),
  ]);

  console.log('✓ Users created (4 management + 10 drivers)');

  // ── Management Employees ──────────────────────────────────────────────
  const mgrEmp = await prisma.employee.create({ data: {
    fullName: 'David Hughes', dateOfBirth: new Date('1978-03-15'),
    homeAddress: '14 Oak Lane, Birmingham, B2 5TH',
    phone: '07700900002', email: 'david.hughes@256logistics.co.uk',
    emergencyContactName: 'Lisa Hughes', emergencyContactPhone: '07700900020',
    nextOfKin: 'Lisa Hughes (Wife)', jobTitle: 'Transport Manager', department: 'Management',
    startDate: new Date('2019-04-01'), employmentStatus: 'active',
    contractedHours: 40, salary: 52000, workLocation: 'Birmingham Depot',
  }});
  await prisma.user.update({ where: { id: tmUser.id }, data: { employeeId: mgrEmp.id } });

  await prisma.employee.createMany({ data: [
    {
      fullName: 'Sarah Mitchell', dateOfBirth: new Date('1980-02-14'),
      homeAddress: '5 Director Way, Birmingham, B1 1AA',
      phone: '07700900001', email: 'sarah.mitchell@256logistics.co.uk',
      emergencyContactName: 'Peter Mitchell', emergencyContactPhone: '07700900021',
      nextOfKin: 'Peter Mitchell (Husband)', jobTitle: 'Director', department: 'Management',
      startDate: new Date('2018-01-01'), employmentStatus: 'active',
      contractedHours: 40, salary: 80000, workLocation: 'Birmingham Depot',
    },
    {
      fullName: 'Claire Pearson', dateOfBirth: new Date('1984-08-19'),
      homeAddress: '18 Birch Ave, Birmingham, B3 4GH',
      phone: '07700900003', email: 'claire.pearson@256logistics.co.uk',
      emergencyContactName: 'Tom Pearson', emergencyContactPhone: '07700900022',
      nextOfKin: 'Tom Pearson (Husband)', jobTitle: 'HR Manager', department: 'HR',
      startDate: new Date('2020-09-01'), employmentStatus: 'active',
      contractedHours: 37.5, salary: 40000, workLocation: 'Birmingham Depot',
    },
    {
      fullName: 'Mark Ellis', dateOfBirth: new Date('1982-11-05'),
      homeAddress: '9 Riverside Rd, Solihull, B91 1DP',
      phone: '07700900004', email: 'mark.ellis@256logistics.co.uk',
      emergencyContactName: 'Jenny Ellis', emergencyContactPhone: '07700900023',
      nextOfKin: 'Jenny Ellis (Wife)', jobTitle: 'Operations Manager', department: 'Operations',
      startDate: new Date('2021-03-01'), employmentStatus: 'active',
      contractedHours: 40, salary: 45000, workLocation: 'Birmingham Depot',
    },
    {
      fullName: 'Angela Brooks', dateOfBirth: new Date('1986-06-30'),
      homeAddress: '22 Elm Park, Birmingham, B16 0LE',
      phone: '07700900030', email: 'angela.brooks@256logistics.co.uk',
      emergencyContactName: 'Kevin Brooks', emergencyContactPhone: '07700900031',
      nextOfKin: 'Kevin Brooks (Husband)', jobTitle: 'Compliance Administrator', department: 'Operations',
      startDate: new Date('2022-06-15'), employmentStatus: 'active',
      contractedHours: 37.5, salary: 28000, workLocation: 'Birmingham Depot',
    },
  ]});

  // ── Driver Employee Records ────────────────────────────────────────────
  const driverDefs = [
    { firstName: 'James',     lastName: 'Okello',    dob: '1990-07-22', addr: '42 Elm Street, Birmingham, B4 7PQ',       ph: '07700900005', salary: 34000, start: ago(420), sponsored: true,  userIdx: 0 },
    { firstName: 'Mohammed',  lastName: 'Al-Rashid', dob: '1985-11-08', addr: '8 Park Road, Coventry, CV1 2BN',          ph: '07700900006', salary: 32000, start: ago(700), sponsored: true,  userIdx: 1 },
    { firstName: 'Thomas',    lastName: 'Adeyemi',   dob: '1992-04-30', addr: '23 Mill Lane, Wolverhampton, WV1 4RT',   ph: '07700900007', salary: 31000, start: ago(195), sponsored: false, userIdx: 2 },
    { firstName: 'Robert',    lastName: 'Chen',      dob: '1988-09-14', addr: '7 Station Road, Birmingham, B1 2SQ',     ph: '07700900008', salary: 33000, start: ago(560), sponsored: false, userIdx: 3 },
    { firstName: 'Pavel',     lastName: 'Novak',     dob: '1987-01-25', addr: '15 Queens Drive, Birmingham, B5 6TY',   ph: '07700900009', salary: 32500, start: ago(310), sponsored: true,  userIdx: 4 },
    { firstName: 'Kevin',     lastName: 'Williams',  dob: '1983-06-12', addr: '31 High Street, Solihull, B91 3AX',     ph: '07700900010', salary: 36000, start: ago(950), sponsored: false, userIdx: 5 },
    { firstName: 'Oluwaseun', lastName: 'Bakare',    dob: '1991-03-18', addr: '55 Victoria Road, Birmingham, B6 5AX',  ph: '07700900011', salary: 31500, start: ago(145), sponsored: true,  userIdx: 6 },
    { firstName: 'Gheorghe',  lastName: 'Ionescu',   dob: '1986-08-02', addr: '12 Charter Street, Coventry, CV6 3DT', ph: '07700900012', salary: 33000, start: ago(480), sponsored: false, userIdx: 7 },
    { firstName: 'Derek',     lastName: 'Morrison',  dob: '1979-12-20', addr: '4 Maple Close, Wolverhampton, WV2 1XT',ph: '07700900013', salary: 37000, start: ago(1200), sponsored: false, userIdx: 8 },
    { firstName: 'Tariq',     lastName: 'Hassan',    dob: '1993-05-07', addr: '88 Greenfield Ave, Birmingham, B29 6EG',ph: '07700900014', salary: 30500, start: ago(85), sponsored: true,  userIdx: 9 },
  ];

  const drivers = await Promise.all(driverDefs.map(d => prisma.employee.create({ data: {
    fullName: `${d.firstName} ${d.lastName}`,
    dateOfBirth: new Date(d.dob),
    homeAddress: d.addr, phone: d.ph,
    email: `${d.firstName.toLowerCase()}.${d.lastName.toLowerCase().replace('-', '')}@256logistics.co.uk`,
    emergencyContactName: `${d.firstName === 'James' ? 'Mary' : d.firstName === 'Mohammed' ? 'Fatima' : 'Next of'} ${d.lastName}`,
    emergencyContactPhone: `0770090${20 + d.userIdx}`,
    nextOfKin: 'Family member',
    jobTitle: 'HGV Driver', department: 'Drivers',
    startDate: d.start, employmentStatus: 'active',
    contractedHours: 45, salary: d.salary,
    workLocation: 'Birmingham Depot', lineManagerId: mgrEmp.id,
    isDriver: true, isSponsored: d.sponsored,
  }})));

  // Link driver users to employees
  await Promise.all(driverDefs.map((d, i) =>
    prisma.user.update({ where: { id: driverUsers[d.userIdx].id }, data: { employeeId: drivers[i].id } })
  ));

  const [james, mohammed, thomas, robert, pavel, kevin, seun, gheorghe, derek, tariq] = drivers;

  console.log('✓ Employee records created (4 management + 10 drivers)');

  // ── Sponsored Workers ──────────────────────────────────────────────────
  const sponsoredData = [
    { emp: james,    cos: 'F1LC0D0A5001', soc: '8211', title: 'HGV Driver', cossal: 30000, actsal: 34000, visa: fut(125), rtw: ago(365), rtwFup: fut(120), docType: 'BRP' },
    { emp: mohammed, cos: 'F1LC0D0B2034', soc: '8211', title: 'HGV Driver', cossal: 29000, actsal: 32000, visa: fut(18),  rtw: ago(180), rtwFup: fut(12),  docType: 'BRP', mismatch: true },
    { emp: pavel,    cos: 'F1LC0D0C3098', soc: '8211', title: 'HGV Driver', cossal: 30000, actsal: 32500, visa: fut(390), rtw: ago(90),  rtwFup: fut(300), docType: 'Passport + Vignette' },
    { emp: seun,     cos: 'F1LC0D0D4012', soc: '8211', title: 'HGV Driver', cossal: 28000, actsal: 31500, visa: fut(210), rtw: ago(140), rtwFup: fut(170), docType: 'BRP' },
    { emp: tariq,    cos: 'F1LC0D0E5077', soc: '8211', title: 'HGV Driver', cossal: 28000, actsal: 30500, visa: fut(480), rtw: ago(80),  rtwFup: fut(400), docType: 'BRP' },
  ];

  const sponsoredWorkers = {};
  for (const s of sponsoredData) {
    sponsoredWorkers[s.emp.id] = await prisma.sponsoredWorker.create({ data: {
      employeeId: s.emp.id, cosNumber: s.cos, socCode: s.soc,
      sponsoredJobTitle: s.title, salaryOnCos: s.cossal, actualSalary: s.actsal,
      contractedHours: 45, workLocation: 'Birmingham Depot',
      visaExpiryDate: s.visa, rightToWorkCheckDate: s.rtw,
      rightToWorkFollowupDate: s.rtwFup, rightToWorkDocumentType: s.docType,
    }});
    await prisma.employee.update({ where: { id: s.emp.id }, data: { isSponsored: true } });
  }

  // Mohammed — unreported salary change
  await prisma.sponsoredWorkerChange.create({ data: {
    sponsoredWorkerId: sponsoredWorkers[mohammed.id].id,
    changeType: 'salary', previousValue: '29000', newValue: '32000',
    effectiveDate: ago(45), reportedToHomeOffice: false,
    authorisedById: directorUser.id, notes: 'Annual pay review — salary increased',
  }});

  // Seun — location change
  await prisma.sponsoredWorkerChange.create({ data: {
    sponsoredWorkerId: sponsoredWorkers[seun.id].id,
    changeType: 'work_location', previousValue: 'Coventry Depot', newValue: 'Birmingham Depot',
    effectiveDate: ago(22), reportedToHomeOffice: false,
    authorisedById: tmUser.id, notes: 'Depot restructure — driver relocated to main depot',
  }});

  console.log('✓ Sponsored workers created (5 workers, 2 with unreported changes)');

  // ── Vehicles ───────────────────────────────────────────────────────────
  const vehicleDefs = [
    { reg: 'FN16 EVK', vin: 'YV2GA123001', make: 'Volvo',    model: 'FH',    yr: 2016, motExp: fut(42),  insExp: fut(210), tacho: fut(180), pmiInt: 6, lastPmi: ago(38), status: 'active', driverId: james.id },
    { reg: 'NU66 XVB', vin: 'YV2GA123002', make: 'DAF',      model: 'XF',    yr: 2016, motExp: fut(21),  insExp: fut(200), tacho: fut(90),  pmiInt: 6, lastPmi: ago(50), status: 'vor',    driverId: mohammed.id },
    { reg: 'WX18 NEO', vin: 'YV2GA123003', make: 'Mercedes', model: 'Actros',yr: 2018, motExp: fut(120), insExp: fut(280), tacho: fut(280), pmiInt: 6, lastPmi: ago(22), status: 'active', driverId: thomas.id },
    { reg: 'BW18 DXL', vin: 'YV2GA123004', make: 'Scania',   model: 'R500',  yr: 2018, motExp: fut(200), insExp: fut(320), tacho: fut(400), pmiInt: 6, lastPmi: ago(10), status: 'active', driverId: robert.id },
    { reg: 'YP20 HJK', vin: 'YV2GA123005', make: 'Volvo',    model: 'FMX',   yr: 2020, motExp: fut(300), insExp: fut(310), tacho: fut(350), pmiInt: 8, lastPmi: ago(15), status: 'active', driverId: pavel.id },
    { reg: 'PK19 ZRT', vin: 'YV2GA123006', make: 'MAN',      model: 'TGX',   yr: 2019, motExp: fut(180), insExp: fut(250), tacho: fut(200), pmiInt: 6, lastPmi: ago(5),  status: 'active', driverId: kevin.id },
    { reg: 'GH21 MNB', vin: 'YV2GA123007', make: 'Volvo',    model: 'FH16',  yr: 2021, motExp: fut(350), insExp: fut(370), tacho: fut(420), pmiInt: 6, lastPmi: ago(18), status: 'active', driverId: seun.id },
    { reg: 'LM17 TKJ', vin: 'YV2GA123008', make: 'DAF',      model: 'CF',    yr: 2017, motExp: fut(8),   insExp: fut(190), tacho: fut(130), pmiInt: 6, lastPmi: ago(42), status: 'active', driverId: gheorghe.id },
    { reg: 'SV14 QAZ', vin: 'YV2GA123009', make: 'Scania',   model: 'R450',  yr: 2014, motExp: fut(90),  insExp: fut(150), tacho: fut(60),  pmiInt: 4, lastPmi: ago(32), status: 'active', driverId: derek.id },
    { reg: 'RT22 DFG', vin: 'YV2GA123010', make: 'Mercedes', model: 'Arocs', yr: 2022, motExp: fut(420), insExp: fut(430), tacho: fut(450), pmiInt: 8, lastPmi: ago(3),  status: 'active', driverId: tariq.id },
  ];

  const calcNext = (last, weeks) => {
    const d = new Date(last); d.setDate(d.getDate() + weeks * 7); return d;
  };

  const vehicles = await Promise.all(vehicleDefs.map(v => prisma.vehicle.create({ data: {
    registration: v.reg, vinNumber: v.vin, make: v.make, model: v.model, year: v.yr,
    operatorLicenceDisc: `OL-2024-${8820 + vehicleDefs.indexOf(v)}`,
    motExpiryDate: v.motExp, roadTaxExpiryDate: fut(365),
    insuranceExpiryDate: v.insExp, tachoCalibrExpiry: v.tacho,
    pmiIntervalWeeks: v.pmiInt,
    lastPmiDate: v.lastPmi, nextPmiDate: calcNext(v.lastPmi, v.pmiInt),
    currentMileage: 80000 + Math.floor(Math.random() * 300000),
    status: v.status, assignedDriverId: v.driverId,
  }})));

  const [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10] = vehicles;

  console.log('✓ Fleet created (10 vehicles, 1 VOR, 2 with expiry alerts)');

  // ── Training Records ───────────────────────────────────────────────────
  const fullSet = [
    'induction','hgv_induction','tachograph','drivers_hours','walk_around_check',
    'defect_reporting','load_security','health_safety','accident_reporting',
    'mobile_phone','drug_alcohol','fatigue_management','fuel_card',
    'yard_rules','vehicle_cleanliness','manual_handling','fire_safety',
  ];

  const trainingProfiles = [
    { emp: james,    complete: fullSet, cpc: { exp: fut(100),  cert: 'CPC-2024-1001' } },
    { emp: mohammed, complete: fullSet.slice(0, 9), cpc: { exp: fut(25), cert: 'CPC-2019-0842' } }, // CPC nearly expired
    { emp: thomas,   complete: fullSet.slice(0, 6), cpc: null }, // New driver, partial induction
    { emp: robert,   complete: fullSet, cpc: { exp: fut(740), cert: 'CPC-2023-2041' } },
    { emp: pavel,    complete: fullSet, cpc: { exp: fut(620), cert: 'CPC-2022-3099' } },
    { emp: kevin,    complete: fullSet, cpc: { exp: fut(510), cert: 'CPC-2023-3015' }, refresher: true },
    { emp: seun,     complete: fullSet.slice(0, 10), cpc: null }, // Partial induction
    { emp: gheorghe, complete: fullSet, cpc: { exp: fut(280), cert: 'CPC-2024-4422' } },
    { emp: derek,    complete: fullSet, cpc: { exp: fut(890), cert: 'CPC-2022-5510' }, refresher: true },
    { emp: tariq,    complete: fullSet.slice(0, 4), cpc: null }, // Very new driver
  ];

  for (const tp of trainingProfiles) {
    await Promise.all(tp.complete.map(t => prisma.trainingRecord.create({ data: {
      employeeId: tp.emp.id, trainingType: t, status: 'completed',
      completedDate: ago(Math.floor(Math.random() * 400) + 30),
      trainerName: ['Safety Solutions Ltd','Transport Training UK','Driver Competence Ltd','In-house TM'][Math.floor(Math.random()*4)],
    }})));
    if (tp.cpc) {
      await prisma.trainingRecord.create({ data: {
        employeeId: tp.emp.id, trainingType: 'cpc', status: 'completed',
        completedDate: ago(730), expiryDate: tp.cpc.exp, certificateNumber: tp.cpc.cert,
      }});
    } else {
      await prisma.trainingRecord.create({ data: {
        employeeId: tp.emp.id, trainingType: 'cpc', status: 'not_started',
      }});
    }
    if (tp.refresher) {
      await prisma.trainingRecord.create({ data: {
        employeeId: tp.emp.id, trainingType: 'refresher', status: 'completed',
        completedDate: ago(180), expiryDate: fut(545),
      }});
    }
  }

  console.log('✓ Training records created (varied completion levels)');

  // ── Policy Acknowledgements ────────────────────────────────────────────
  const allPolicies = ['walk_around_duties','defect_reporting','tachograph_rules','drivers_hours','mobile_phone','drug_alcohol'];
  // Fully signed: james, robert, kevin, gheorghe, derek
  for (const emp of [james, robert, kevin, gheorghe, derek]) {
    await Promise.all(allPolicies.map(p => prisma.policyAcknowledgement.create({ data: {
      employeeId: emp.id, policyType: p, policyVersion: 'v2.1',
      signedAt: ago(Math.floor(Math.random() * 60) + 30),
      ipAddress: '10.0.1.1', signatureData: 'demo_signature_data',
    }})));
  }
  // Partial: mohammed, thomas, pavel, seun — missing mobile_phone
  for (const emp of [mohammed, thomas, pavel, seun]) {
    await Promise.all(allPolicies.slice(0, 4).map(p => prisma.policyAcknowledgement.create({ data: {
      employeeId: emp.id, policyType: p, policyVersion: 'v2.1',
      signedAt: ago(90), ipAddress: '10.0.1.1', signatureData: 'demo_signature_data',
    }})));
  }
  // Tariq — very new, only signed 2
  await Promise.all(allPolicies.slice(0, 2).map(p => prisma.policyAcknowledgement.create({ data: {
    employeeId: tariq.id, policyType: p, policyVersion: 'v2.1',
    signedAt: ago(10), ipAddress: '10.0.1.1', signatureData: 'demo_signature_data',
  }})));

  console.log('✓ Policy acknowledgements created');

  // ── Toolbox Talks ──────────────────────────────────────────────────────
  const allDriverIds = drivers.map(d => d.id);

  const talk1 = await prisma.toolboxTalk.create({ data: {
    topic: 'Winter Driving Safety',
    description: 'Key hazards and procedures for driving in winter conditions — ice, fog, black ice, and reduced visibility. Includes stopping distances and tyre checks.',
    dateIssued: ago(30), issuedById: tmUser.id,
    managerSignedOff: true, managerSignoffAt: ago(29), managerSignoffById: tmUser.id,
    assignments: { create: [james, mohammed, robert, kevin, gheorghe, derek].map(e => ({ employeeId: e.id, signedAt: ago(28), signatureData: 'signed' })) },
  }});

  const talk2 = await prisma.toolboxTalk.create({ data: {
    topic: 'Tachograph Infringement Awareness',
    description: 'Review of recent infringement patterns across the fleet. Focus on drivers hours rules, 45-minute break requirements, and digital tacho card usage.',
    dateIssued: ago(7), issuedById: tmUser.id, managerSignedOff: false,
    assignments: { create: [
      { employeeId: james.id,    signedAt: ago(6), signatureData: 'signed' },
      { employeeId: robert.id,   signedAt: ago(6), signatureData: 'signed' },
      { employeeId: kevin.id,    signedAt: ago(5), signatureData: 'signed' },
      { employeeId: derek.id,    signedAt: ago(5), signatureData: 'signed' },
      { employeeId: thomas.id },   // Not signed
      { employeeId: mohammed.id }, // Not signed
      { employeeId: pavel.id },    // Not signed
      { employeeId: seun.id },
      { employeeId: gheorghe.id, signedAt: ago(4), signatureData: 'signed' },
      { employeeId: tariq.id },    // Not signed — new driver
    ]},
  }});

  const talk3 = await prisma.toolboxTalk.create({ data: {
    topic: 'Bridge Strike Prevention',
    description: 'Understanding height restrictions, how to read route permits, and what to do if you are approaching a low bridge. Review of company procedure following industry incident.',
    dateIssued: ago(3), issuedById: tmUser.id, managerSignedOff: false,
    assignments: { create: allDriverIds.map(id => ({ employeeId: id })) }, // None signed yet
  }});

  const talk4 = await prisma.toolboxTalk.create({ data: {
    topic: 'Load Security — Updated Procedure',
    description: 'Updated company procedure for load security following Transport Manager review. All drivers must acknowledge the revised strapping and restraint requirements.',
    dateIssued: ago(60), issuedById: tmUser.id,
    managerSignedOff: true, managerSignoffAt: ago(55), managerSignoffById: tmUser.id,
    assignments: { create: [james, robert, kevin, pavel, gheorghe, derek, mohammed].map(e => ({ employeeId: e.id, signedAt: ago(Math.floor(Math.random()*10)+50), signatureData: 'signed' })) },
  }});

  console.log('✓ Toolbox talks created (4 talks, varied sign-off levels)');

  // ── Daily Walk-Around Checks ───────────────────────────────────────────
  const checkItems = [
    'tyres_wheel_nuts','lights_indicators','brakes','steering','mirrors',
    'windscreen_wipers','horn','number_plates','bodywork','fuel_adblue',
    'warning_lights','tachograph','load_security','leaks','mudguards','reflectors',
  ];

  // James — 7 days of checks on FN16 EVK, all pass
  for (let i = 6; i >= 1; i--) {
    await prisma.walkAroundCheck.create({ data: {
      vehicleId: v1.id, driverId: james.id,
      checkDate: ago(i), checkTime: new Date('2000-01-01T06:30:00'),
      location: 'Birmingham Depot', mileage: 244800 + (i * 95), nilDefect: true,
      signatureData: 'demo_sig',
      items: { create: checkItems.map(item => ({ item, status: 'ok' })) },
    }});
  }

  // Thomas — check with a serious defect on WX18 NEO (2 days ago)
  const thomasCheck = await prisma.walkAroundCheck.create({ data: {
    vehicleId: v3.id, driverId: thomas.id,
    checkDate: ago(2), checkTime: new Date('2000-01-01T07:05:00'),
    location: 'Birmingham Depot', mileage: 198480, nilDefect: false, signatureData: 'demo_sig',
    items: { create: [
      { item: 'lights_indicators', status: 'defect_found', notes: 'Nearside rear indicator not working — bulb or wiring fault suspected' },
      { item: 'tyres_wheel_nuts', status: 'defect_found', notes: 'Nearside rear tyre tread depth borderline — 2mm near legal limit' },
      ...checkItems.filter(i => !['lights_indicators','tyres_wheel_nuts'].includes(i)).map(item => ({ item, status: 'ok' })),
    ]},
  }});

  // Derek — check yesterday on SV14 QAZ, all pass
  await prisma.walkAroundCheck.create({ data: {
    vehicleId: v9.id, driverId: derek.id,
    checkDate: ago(1), checkTime: new Date('2000-01-01T05:45:00'),
    location: 'Birmingham Depot', mileage: 312880, nilDefect: true, signatureData: 'demo_sig',
    items: { create: checkItems.map(item => ({ item, status: 'ok' })) },
  }});

  // Kevin — check yesterday PK19 ZRT, pass
  await prisma.walkAroundCheck.create({ data: {
    vehicleId: v6.id, driverId: kevin.id,
    checkDate: ago(1), checkTime: new Date('2000-01-01T06:15:00'),
    location: 'Birmingham Depot', mileage: 228400, nilDefect: true, signatureData: 'demo_sig',
    items: { create: checkItems.map(item => ({ item, status: 'ok' })) },
  }});

  // Robert — check today
  await prisma.walkAroundCheck.create({ data: {
    vehicleId: v4.id, driverId: robert.id,
    checkDate: ago(0), checkTime: new Date('2000-01-01T06:50:00'),
    location: 'Birmingham Depot', mileage: 278920, nilDefect: true, signatureData: 'demo_sig',
    items: { create: checkItems.map(item => ({ item, status: 'ok' })) },
  }});

  // NOTE: BW18 DXL (v4) has a check today; but v2 (NU66 XVB), v7 (GH21 MNB), v8 (LM17 TKJ), v9, v10 have NO check today — missed checks
  console.log('✓ Daily walk-around checks created');

  // ── Defect Cases ───────────────────────────────────────────────────────
  let defRef = 1;
  const ref = () => `DEF-${yr}-${String(defRef++).padStart(4,'0')}`;

  // 1. DANGEROUS — NU66 XVB brake failure → VOR (repair booked)
  const def1 = await prisma.defectCase.create({ data: {
    referenceNumber: ref(), vehicleId: v2.id, reportedById: mohammed.id,
    reportedAt: ago(5), defectCategory: 'Brakes',
    description: 'Brake pedal travel significantly increased. Vehicle pulling to nearside under braking. Suspected brake imbalance on rear axle — driver noticed fade on motorway exit.',
    severity: 'dangerous', vehicleAllowedToContinue: false,
    status: 'repair_booked', vorDecision: true,
    reviewedById: tmUser.id, reviewedAt: ago(5),
    repairGarage: 'Midlands Truck Centre, Unit 4 Tyseley Industrial Estate',
    repairAction: 'Full brake inspection on all axles. Replace rear brake pads and discs. Balance test required before return to service.',
  }});

  // 2. SERIOUS — WX18 NEO lights (from Thomas's check 2 days ago)
  const def2 = await prisma.defectCase.create({ data: {
    referenceNumber: ref(), vehicleId: v3.id, reportedById: thomas.id,
    walkAroundCheckId: thomasCheck.id, reportedAt: ago(2),
    defectCategory: 'Lights & Indicators',
    description: 'Nearside rear indicator not working. Also nearside rear tyre borderline — tread depth 2mm. Both items reported during walk-around check.',
    severity: 'serious', vehicleAllowedToContinue: true,
    status: 'under_review', vorDecision: false,
    reviewedById: tmUser.id, reviewedAt: ago(1),
  }});

  // 3. MINOR — BW18 DXL AdBlue warning (Robert, reported yesterday)
  const def3 = await prisma.defectCase.create({ data: {
    referenceNumber: ref(), vehicleId: v4.id, reportedById: robert.id,
    reportedAt: ago(1), defectCategory: 'Fuel & AdBlue',
    description: 'AdBlue warning light illuminated on dashboard. Level critically low — approximately 5% remaining. Vehicle will derate shortly.',
    severity: 'minor', vehicleAllowedToContinue: true,
    status: 'reported', vorDecision: false,
  }});

  // 4. MINOR — LM17 TKJ windscreen chip (Gheorghe, reported 3 days ago → repair booked)
  const def4 = await prisma.defectCase.create({ data: {
    referenceNumber: ref(), vehicleId: v8.id, reportedById: gheorghe.id,
    reportedAt: ago(3), defectCategory: 'Windscreen',
    description: 'Stone chip on windscreen, passenger side, within drivers field of vision. Approximately 5mm diameter.',
    severity: 'minor', vehicleAllowedToContinue: true,
    status: 'repair_booked', vorDecision: false,
    reviewedById: tmUser.id, reviewedAt: ago(2),
    repairGarage: 'AutoGlass Birmingham', repairAction: 'Windscreen chip repair — can be completed on-site',
  }});

  // 5. CLOSED — FN16 EVK mirror casing crack (James, closed 14 days ago)
  const def5 = await prisma.defectCase.create({ data: {
    referenceNumber: ref(), vehicleId: v1.id, reportedById: james.id,
    reportedAt: ago(20), defectCategory: 'Bodywork',
    description: 'Crack in nearside door mirror casing. Mirror function unaffected.',
    severity: 'minor', vehicleAllowedToContinue: true,
    status: 'signed_off', vorDecision: false,
    reviewedById: tmUser.id, reviewedAt: ago(18),
    repairGarage: 'In-house', repairAction: 'Replaced mirror casing. No further action required.',
    dateRepaired: ago(15), finalSignoffById: tmUser.id, finalSignoffAt: ago(14),
  }});

  // 6. CLOSED — YP20 HJK horn fault (Pavel, closed 7 days ago)
  const def6 = await prisma.defectCase.create({ data: {
    referenceNumber: ref(), vehicleId: v5.id, reportedById: pavel.id,
    reportedAt: ago(12), defectCategory: 'Horn',
    description: 'Horn intermittent — working occasionally only. Failed during safety check.',
    severity: 'serious', vehicleAllowedToContinue: false,
    status: 'signed_off', vorDecision: true,
    reviewedById: tmUser.id, reviewedAt: ago(12),
    repairGarage: 'Fleet Services Birmingham',
    repairAction: 'Horn relay replaced. Tested and confirmed working.',
    dateRepaired: ago(9), finalSignoffById: tmUser.id, finalSignoffAt: ago(8),
  }});

  // 7. DANGEROUS — SV14 QAZ oil leak (Derek, reported today → VOR)
  const def7 = await prisma.defectCase.create({ data: {
    referenceNumber: ref(), vehicleId: v9.id, reportedById: derek.id,
    reportedAt: ago(0), defectCategory: 'Engine / Fluid Leak',
    description: 'Significant engine oil leak discovered on pre-shift inspection. Large puddle under vehicle at overnight park. Oil level critically low. Vehicle must not move.',
    severity: 'dangerous', vehicleAllowedToContinue: false,
    status: 'under_review', vorDecision: true,
    reviewedById: tmUser.id, reviewedAt: ago(0),
  }});

  console.log('✓ Defect cases created (7 cases across severity levels)');

  // ── VOR Records ────────────────────────────────────────────────────────
  await prisma.vorRecord.create({ data: {
    vehicleId: v2.id, defectCaseId: def1.id,
    takenOffRoadDate: ago(5), reason: 'Dangerous brake defect — vehicle prohibited from road use pending full brake inspection.',
    authorisedById: tmUser.id, repairGarage: 'Midlands Truck Centre',
    estimatedReturnDate: fut(2),
  }});

  await prisma.vorRecord.create({ data: {
    vehicleId: v9.id, defectCaseId: def7.id,
    takenOffRoadDate: ago(0), reason: 'Critical engine oil leak — vehicle prohibited pending investigation and repair.',
    authorisedById: tmUser.id, repairGarage: 'Pending garage allocation',
    estimatedReturnDate: fut(3),
  }});

  // Closed VOR — YP20 HJK horn (Pavel, returned to service 8 days ago)
  await prisma.vorRecord.create({ data: {
    vehicleId: v5.id, defectCaseId: def6.id,
    takenOffRoadDate: ago(12), reason: 'Intermittent horn failure — vehicle VOR until repair completed.',
    authorisedById: tmUser.id, repairGarage: 'Fleet Services Birmingham',
    estimatedReturnDate: ago(9), actualReturnDate: ago(8),
    managerSignoffById: tmUser.id, managerSignoffAt: ago(8),
  }});

  // Update v2 and v9 status to VOR
  await prisma.vehicle.update({ where: { id: v2.id }, data: { status: 'vor' } });
  await prisma.vehicle.update({ where: { id: v9.id }, data: { status: 'vor' } });

  console.log('✓ VOR records created (2 active VOR, 1 historical)');

  // ── Alerts ────────────────────────────────────────────────────────────
  await prisma.alert.createMany({ data: [
    // Critical
    { alertType: 'pmi_due',         severity: 'critical', entityType: 'vehicle',  entityId: v1.id,       entityName: 'FN16 EVK',          message: 'FN16 EVK — PMI due in 4 days',                                  daysUntil: 4 },
    { alertType: 'pmi_due',         severity: 'critical', entityType: 'vehicle',  entityId: v2.id,       entityName: 'NU66 XVB',          message: 'NU66 XVB — PMI overdue by 8 days',                             daysUntil: -8 },
    { alertType: 'visa_expiry',     severity: 'critical', entityType: 'employee', entityId: mohammed.id, entityName: 'Mohammed Al-Rashid',message: 'Mohammed Al-Rashid — Visa expires in 18 days',                  daysUntil: 18 },
    { alertType: 'right_to_work_due',severity:'critical', entityType: 'employee', entityId: mohammed.id, entityName: 'Mohammed Al-Rashid',message: 'Mohammed Al-Rashid — Right to Work follow-up due in 12 days',   daysUntil: 12 },
    { alertType: 'open_defect',     severity: 'critical', entityType: 'vehicle',  entityId: v2.id,       entityName: 'NU66 XVB',          message: `NU66 XVB — Open DANGEROUS defect (DEF-${yr}-0001)`,            daysUntil: null },
    { alertType: 'open_defect',     severity: 'critical', entityType: 'vehicle',  entityId: v9.id,       entityName: 'SV14 QAZ',          message: `SV14 QAZ — Open DANGEROUS defect (DEF-${yr}-0007) — Engine oil leak`, daysUntil: null },
    { alertType: 'mot_expiry',      severity: 'critical', entityType: 'vehicle',  entityId: v8.id,       entityName: 'LM17 TKJ',          message: 'LM17 TKJ — MOT expires in 8 days',                             daysUntil: 8 },
    // Warning
    { alertType: 'mot_expiry',      severity: 'warning',  entityType: 'vehicle',  entityId: v2.id,       entityName: 'NU66 XVB',          message: 'NU66 XVB — MOT expires in 21 days',                            daysUntil: 21 },
    { alertType: 'cpc_expiry',      severity: 'warning',  entityType: 'employee', entityId: mohammed.id, entityName: 'Mohammed Al-Rashid',message: 'Mohammed Al-Rashid — CPC expires in 25 days',                   daysUntil: 25 },
    { alertType: 'missed_check',    severity: 'warning',  entityType: 'vehicle',  entityId: v2.id,       entityName: 'NU66 XVB',          message: 'NU66 XVB — No daily check submitted today (vehicle on VOR)',    daysUntil: 0 },
    { alertType: 'missed_check',    severity: 'warning',  entityType: 'vehicle',  entityId: v7.id,       entityName: 'GH21 MNB',          message: 'GH21 MNB — No daily check submitted today (driver: Oluwaseun Bakare)', daysUntil: 0 },
    { alertType: 'missed_check',    severity: 'warning',  entityType: 'vehicle',  entityId: v8.id,       entityName: 'LM17 TKJ',          message: 'LM17 TKJ — No daily check submitted today (driver: Gheorghe Ionescu)', daysUntil: 0 },
    { alertType: 'induction_incomplete',severity:'warning',entityType:'employee', entityId: thomas.id,   entityName: 'Thomas Adeyemi',    message: 'Thomas Adeyemi — Driver induction incomplete (195 days employed)', daysUntil: null },
    { alertType: 'induction_incomplete',severity:'warning',entityType:'employee', entityId: tariq.id,    entityName: 'Tariq Hassan',      message: 'Tariq Hassan — Driver induction incomplete (85 days employed)',   daysUntil: null },
    // Notice
    { alertType: 'toolbox_unsigned',severity: 'notice',   entityType: 'employee', entityId: thomas.id,   entityName: 'Thomas Adeyemi',    message: 'Thomas Adeyemi — "Tachograph Infringement Awareness" toolbox talk not signed', daysUntil: null },
    { alertType: 'toolbox_unsigned',severity: 'notice',   entityType: 'employee', entityId: tariq.id,    entityName: 'Tariq Hassan',      message: 'Tariq Hassan — "Bridge Strike Prevention" toolbox talk not signed', daysUntil: null },
    { alertType: 'policy_unsigned', severity: 'notice',   entityType: 'employee', entityId: mohammed.id, entityName: 'Mohammed Al-Rashid',message: 'Mohammed Al-Rashid — Mobile Phone Policy v2.1 not signed',       daysUntil: null },
    { alertType: 'policy_unsigned', severity: 'notice',   entityType: 'employee', entityId: seun.id,     entityName: 'Oluwaseun Bakare',  message: 'Oluwaseun Bakare — Mobile Phone Policy v2.1 not signed',         daysUntil: null },
    { alertType: 'tacho_calibration',severity:'notice',   entityType: 'vehicle',  entityId: v9.id,       entityName: 'SV14 QAZ',          message: 'SV14 QAZ — Tachograph calibration expires in 60 days',           daysUntil: 60 },
  ]});

  console.log('✓ Alerts seeded (6 critical, 7 warning, 6 notice)');

  // ── Compliance Scores ──────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  await prisma.complianceScore.create({ data: {
    scoreDate: today, peopleScore: 82.0, fleetScore: 68.5, driverScore: 74.0, overallScore: 74.7,
    peopleDetails: { totalEmployees: 14, missingDocuments: 6, expiredDocuments: 1, sponsorAlerts: 2 },
    fleetDetails:  { totalVehicles: 10, pmiOverdue: 1, openDangerous: 2, motCritical: 1 },
    driverDetails: { totalDrivers: 10, incompleteInduction: 2, missedChecks: 3, cpcExpiring: 1 },
  }});

  // Historical scores for 7 days (slight improvement trend)
  for (let i = 1; i <= 7; i++) {
    const d = ago(i); d.setHours(0, 0, 0, 0);
    const base = 70 + (7 - i);
    await prisma.complianceScore.create({ data: {
      scoreDate: d,
      peopleScore: base + 10,
      fleetScore:  base - 2,
      driverScore: base + 4,
      overallScore: base + 4,
      peopleDetails: {}, fleetDetails: {}, driverDetails: {},
    }}).catch(() => {}); // skip if duplicate
  }

  console.log('✓ Compliance scores created (today + 7 day history)');

  console.log('\n' + '═'.repeat(56));
  console.log('  ✅  DEMO SEED COMPLETE');
  console.log('═'.repeat(56));
  console.log('\n  Fleet:     10 vehicles  (2 VOR · 2 PMI alerts · 1 MOT alert)');
  console.log('  People:    14 employees (10 drivers · 5 sponsored workers)');
  console.log('  Defects:   7 cases      (2 dangerous · 2 serious · 3 minor)');
  console.log('  Alerts:    19 active    (6 critical · 7 warning · 6 notice)');
  console.log('  Toolbox:   4 talks      (varying sign-off levels)');
  console.log('\n  LOGIN CREDENTIALS  (password: Demo2024! for all)');
  console.log('  ─────────────────────────────────────────────────');
  console.log('  Director:     director@256logistics.co.uk');
  console.log('  Transport Mgr: transport@256logistics.co.uk');
  console.log('  HR Manager:   hr@256logistics.co.uk');
  console.log('  Operations:   ops@256logistics.co.uk');
  console.log('  Driver 1:     driver1@256logistics.co.uk  (James Okello)');
  console.log('  Driver 2:     driver2@256logistics.co.uk  (Mohammed Al-Rashid)');
  console.log('  Driver 3:     driver3@256logistics.co.uk  (Thomas Adeyemi)');
  console.log('  ...up to:     driver10@256logistics.co.uk (Tariq Hassan)');
  console.log('═'.repeat(56) + '\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
