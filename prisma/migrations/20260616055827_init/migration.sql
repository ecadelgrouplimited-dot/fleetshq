-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('director', 'transport_manager', 'hr_manager', 'operations_manager', 'driver', 'garage');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('active', 'on_leave', 'suspended', 'terminated');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('active', 'vor', 'sold', 'hired', 'awaiting_repair');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('minor', 'serious', 'dangerous');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('reported', 'under_review', 'repair_booked', 'repaired', 'signed_off');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('induction', 'hgv_induction', 'tachograph', 'drivers_hours', 'walk_around_check', 'defect_reporting', 'load_security', 'health_safety', 'accident_reporting', 'mobile_phone', 'drug_alcohol', 'fatigue_management', 'fuel_card', 'yard_rules', 'vehicle_cleanliness', 'customer_site', 'manual_handling', 'fire_safety', 'refresher', 'cpc');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('walk_around_duties', 'defect_reporting', 'tachograph_rules', 'drivers_hours', 'fatigue_management', 'mobile_phone', 'drug_alcohol', 'accident_reporting', 'serious_defects');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('contract', 'offer_letter', 'job_description', 'passport', 'right_to_work', 'driving_licence', 'cpc_card', 'tacho_card', 'proof_of_address', 'national_insurance', 'payroll', 'disciplinary', 'appraisal', 'resignation_termination', 'other');

-- CreateEnum
CREATE TYPE "VehicleDocumentType" AS ENUM ('pmi_sheet', 'brake_test', 'mot_certificate', 'service_invoice', 'repair_invoice', 'tyre_report', 'tacho_certificate', 'safety_inspection', 'roadside_inspection', 'prohibition_notice', 'rectification_evidence', 'other');

-- CreateEnum
CREATE TYPE "CheckItemStatus" AS ENUM ('ok', 'defect_found', 'not_applicable');

-- CreateEnum
CREATE TYPE "CheckItemType" AS ENUM ('tyres_wheel_nuts', 'lights_indicators', 'brakes', 'steering', 'mirrors', 'windscreen_wipers', 'horn', 'number_plates', 'bodywork', 'fuel_adblue', 'warning_lights', 'tachograph', 'load_security', 'leaks', 'coupling', 'fifth_wheel', 'mudguards', 'reflectors');

-- CreateEnum
CREATE TYPE "SponsoredChangeType" AS ENUM ('salary', 'hours', 'job_duties', 'work_location', 'end_of_employment');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('pmi_due', 'mot_expiry', 'insurance_expiry', 'tacho_calibration', 'visa_expiry', 'right_to_work_due', 'cpc_expiry', 'missed_check', 'open_defect', 'induction_incomplete', 'toolbox_unsigned', 'policy_unsigned', 'licence_check_due');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('critical', 'warning', 'notice');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "homeAddress" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "nextOfKin" TEXT,
    "jobTitle" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'active',
    "contractedHours" DECIMAL(5,2) NOT NULL,
    "salary" DECIMAL(10,2) NOT NULL,
    "workLocation" TEXT NOT NULL,
    "isDriver" BOOLEAN NOT NULL DEFAULT false,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "lineManagerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsoredWorker" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cosNumber" TEXT NOT NULL,
    "socCode" TEXT NOT NULL,
    "sponsoredJobTitle" TEXT NOT NULL,
    "salaryOnCos" DECIMAL(10,2) NOT NULL,
    "actualSalary" DECIMAL(10,2) NOT NULL,
    "contractedHours" DECIMAL(5,2) NOT NULL,
    "actualWorkingPattern" TEXT,
    "workLocation" TEXT NOT NULL,
    "visaExpiryDate" TIMESTAMP(3) NOT NULL,
    "rightToWorkCheckDate" TIMESTAMP(3) NOT NULL,
    "rightToWorkFollowupDate" TIMESTAMP(3),
    "rightToWorkDocumentType" TEXT,
    "absenceMonitoringNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsoredWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsoredWorkerChange" (
    "id" TEXT NOT NULL,
    "sponsoredWorkerId" TEXT NOT NULL,
    "changeType" "SponsoredChangeType" NOT NULL,
    "previousValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reportedToHomeOffice" BOOLEAN NOT NULL DEFAULT false,
    "reportedDate" TIMESTAMP(3),
    "authorisedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsoredWorkerChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "trainingType" "TrainingType" NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'not_started',
    "completedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "trainerName" TEXT,
    "certificateNumber" TEXT,
    "documentStorageKey" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcknowledgement" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "policyType" "PolicyType" NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolboxTalk" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateIssued" TIMESTAMP(3) NOT NULL,
    "issuedById" TEXT NOT NULL,
    "managerSignedOff" BOOLEAN NOT NULL DEFAULT false,
    "managerSignoffAt" TIMESTAMP(3),
    "managerSignoffById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolboxTalk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolboxTalkAssignment" (
    "id" TEXT NOT NULL,
    "toolboxTalkId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolboxTalkAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "vinNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "operatorLicenceDisc" TEXT,
    "motExpiryDate" TIMESTAMP(3) NOT NULL,
    "roadTaxExpiryDate" TIMESTAMP(3),
    "insuranceExpiryDate" TIMESTAMP(3) NOT NULL,
    "tachoCalibrExpiry" TIMESTAMP(3),
    "pmiIntervalWeeks" INTEGER NOT NULL DEFAULT 6,
    "lastPmiDate" TIMESTAMP(3),
    "nextPmiDate" TIMESTAMP(3),
    "currentMileage" INTEGER NOT NULL DEFAULT 0,
    "status" "VehicleStatus" NOT NULL DEFAULT 'active',
    "assignedDriverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "documentType" "VehicleDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkAroundCheck" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "checkDate" DATE NOT NULL,
    "checkTime" TIME NOT NULL,
    "location" TEXT,
    "mileage" INTEGER NOT NULL,
    "nilDefect" BOOLEAN NOT NULL DEFAULT false,
    "signatureData" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalkAroundCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkAroundCheckItem" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "item" "CheckItemType" NOT NULL,
    "status" "CheckItemStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "WalkAroundCheckItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectCase" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "walkAroundCheckId" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defectCategory" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "vehicleAllowedToContinue" BOOLEAN NOT NULL,
    "status" "DefectStatus" NOT NULL DEFAULT 'reported',
    "vorDecision" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "repairAction" TEXT,
    "repairGarage" TEXT,
    "dateRepaired" TIMESTAMP(3),
    "invoiceStorageKey" TEXT,
    "finalSignoffById" TEXT,
    "finalSignoffAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefectCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectPhoto" (
    "id" TEXT NOT NULL,
    "defectCaseId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefectPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VorRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "defectCaseId" TEXT,
    "takenOffRoadDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "authorisedById" TEXT NOT NULL,
    "repairGarage" TEXT,
    "estimatedReturnDate" TIMESTAMP(3),
    "actualReturnDate" TIMESTAMP(3),
    "evidenceStorageKey" TEXT,
    "managerSignoffById" TEXT,
    "managerSignoffAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VorRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "daysUntil" INTEGER,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceScore" (
    "id" TEXT NOT NULL,
    "scoreDate" DATE NOT NULL,
    "peopleScore" DECIMAL(5,2) NOT NULL,
    "fleetScore" DECIMAL(5,2) NOT NULL,
    "driverScore" DECIMAL(5,2) NOT NULL,
    "overallScore" DECIMAL(5,2) NOT NULL,
    "peopleDetails" JSONB NOT NULL,
    "fleetDetails" JSONB NOT NULL,
    "driverDetails" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SponsoredWorker_employeeId_key" ON "SponsoredWorker"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRecord_employeeId_trainingType_key" ON "TrainingRecord"("employeeId", "trainingType");

-- CreateIndex
CREATE UNIQUE INDEX "ToolboxTalkAssignment_toolboxTalkId_employeeId_key" ON "ToolboxTalkAssignment"("toolboxTalkId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registration_key" ON "Vehicle"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vinNumber_key" ON "Vehicle"("vinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_assignedDriverId_key" ON "Vehicle"("assignedDriverId");

-- CreateIndex
CREATE UNIQUE INDEX "DefectCase_referenceNumber_key" ON "DefectCase"("referenceNumber");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Alert_severity_isResolved_idx" ON "Alert"("severity", "isResolved");

-- CreateIndex
CREATE INDEX "Alert_entityType_entityId_idx" ON "Alert"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceScore_scoreDate_key" ON "ComplianceScore"("scoreDate");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_lineManagerId_fkey" FOREIGN KEY ("lineManagerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredWorker" ADD CONSTRAINT "SponsoredWorker_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredWorkerChange" ADD CONSTRAINT "SponsoredWorkerChange_sponsoredWorkerId_fkey" FOREIGN KEY ("sponsoredWorkerId") REFERENCES "SponsoredWorker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredWorkerChange" ADD CONSTRAINT "SponsoredWorkerChange_authorisedById_fkey" FOREIGN KEY ("authorisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgement" ADD CONSTRAINT "PolicyAcknowledgement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolboxTalk" ADD CONSTRAINT "ToolboxTalk_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolboxTalk" ADD CONSTRAINT "ToolboxTalk_managerSignoffById_fkey" FOREIGN KEY ("managerSignoffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolboxTalkAssignment" ADD CONSTRAINT "ToolboxTalkAssignment_toolboxTalkId_fkey" FOREIGN KEY ("toolboxTalkId") REFERENCES "ToolboxTalk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolboxTalkAssignment" ADD CONSTRAINT "ToolboxTalkAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkAroundCheck" ADD CONSTRAINT "WalkAroundCheck_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkAroundCheck" ADD CONSTRAINT "WalkAroundCheck_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkAroundCheckItem" ADD CONSTRAINT "WalkAroundCheckItem_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "WalkAroundCheck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectCase" ADD CONSTRAINT "DefectCase_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectCase" ADD CONSTRAINT "DefectCase_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectCase" ADD CONSTRAINT "DefectCase_walkAroundCheckId_fkey" FOREIGN KEY ("walkAroundCheckId") REFERENCES "WalkAroundCheck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectCase" ADD CONSTRAINT "DefectCase_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectCase" ADD CONSTRAINT "DefectCase_finalSignoffById_fkey" FOREIGN KEY ("finalSignoffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectPhoto" ADD CONSTRAINT "DefectPhoto_defectCaseId_fkey" FOREIGN KEY ("defectCaseId") REFERENCES "DefectCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VorRecord" ADD CONSTRAINT "VorRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VorRecord" ADD CONSTRAINT "VorRecord_defectCaseId_fkey" FOREIGN KEY ("defectCaseId") REFERENCES "DefectCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VorRecord" ADD CONSTRAINT "VorRecord_authorisedById_fkey" FOREIGN KEY ("authorisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VorRecord" ADD CONSTRAINT "VorRecord_managerSignoffById_fkey" FOREIGN KEY ("managerSignoffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
