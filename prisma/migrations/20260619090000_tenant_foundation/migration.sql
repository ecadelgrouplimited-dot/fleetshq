-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trial');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "branding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "operatorLicenceNumber" TEXT,
    "registeredAddress" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "branding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "serviceAreas" JSONB,
    "hours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- Default tenant for live-row backfill and local/test records created outside request context.
INSERT INTO "Tenant" ("id", "name", "slug", "plan", "status", "updatedAt")
VALUES ('00000000-0000-4000-8000-000000000001', '256 Logistics', 'default', 'starter', 'active', CURRENT_TIMESTAMP);

ALTER TABLE "User" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "User" ADD COLUMN "companyId" TEXT;
ALTER TABLE "User" ADD COLUMN "branchId" TEXT;
ALTER TABLE "Employee" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "SponsoredWorker" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "SponsoredWorkerChange" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "EmployeeDocument" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "TrainingRecord" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "PolicyAcknowledgement" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "ToolboxTalk" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "ToolboxTalkAssignment" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "Vehicle" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "VehicleDocument" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "WalkAroundCheck" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "WalkAroundCheckItem" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "DefectCase" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "DefectPhoto" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "VorRecord" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "Alert" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "ComplianceScore" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Company_tenantId_idx" ON "Company"("tenantId");
CREATE INDEX "Branch_tenantId_idx" ON "Branch"("tenantId");
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "User_branchId_idx" ON "User"("branchId");
CREATE INDEX "Employee_tenantId_idx" ON "Employee"("tenantId");
CREATE INDEX "SponsoredWorker_tenantId_idx" ON "SponsoredWorker"("tenantId");
CREATE INDEX "SponsoredWorkerChange_tenantId_idx" ON "SponsoredWorkerChange"("tenantId");
CREATE INDEX "EmployeeDocument_tenantId_idx" ON "EmployeeDocument"("tenantId");
CREATE INDEX "TrainingRecord_tenantId_idx" ON "TrainingRecord"("tenantId");
CREATE INDEX "PolicyAcknowledgement_tenantId_idx" ON "PolicyAcknowledgement"("tenantId");
CREATE INDEX "ToolboxTalk_tenantId_idx" ON "ToolboxTalk"("tenantId");
CREATE INDEX "ToolboxTalkAssignment_tenantId_idx" ON "ToolboxTalkAssignment"("tenantId");
CREATE INDEX "Vehicle_tenantId_idx" ON "Vehicle"("tenantId");
CREATE INDEX "VehicleDocument_tenantId_idx" ON "VehicleDocument"("tenantId");
CREATE INDEX "WalkAroundCheck_tenantId_idx" ON "WalkAroundCheck"("tenantId");
CREATE INDEX "WalkAroundCheckItem_tenantId_idx" ON "WalkAroundCheckItem"("tenantId");
CREATE INDEX "DefectCase_tenantId_idx" ON "DefectCase"("tenantId");
CREATE INDEX "DefectPhoto_tenantId_idx" ON "DefectPhoto"("tenantId");
CREATE INDEX "VorRecord_tenantId_idx" ON "VorRecord"("tenantId");
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "Alert_tenantId_idx" ON "Alert"("tenantId");
CREATE INDEX "ComplianceScore_tenantId_idx" ON "ComplianceScore"("tenantId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SponsoredWorker" ADD CONSTRAINT "SponsoredWorker_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SponsoredWorkerChange" ADD CONSTRAINT "SponsoredWorkerChange_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PolicyAcknowledgement" ADD CONSTRAINT "PolicyAcknowledgement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ToolboxTalk" ADD CONSTRAINT "ToolboxTalk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ToolboxTalkAssignment" ADD CONSTRAINT "ToolboxTalkAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WalkAroundCheck" ADD CONSTRAINT "WalkAroundCheck_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WalkAroundCheckItem" ADD CONSTRAINT "WalkAroundCheckItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DefectCase" ADD CONSTRAINT "DefectCase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DefectPhoto" ADD CONSTRAINT "DefectPhoto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VorRecord" ADD CONSTRAINT "VorRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComplianceScore" ADD CONSTRAINT "ComplianceScore_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
