-- CreateEnum
CREATE TYPE "InfringementType" AS ENUM ('speeding', 'drivers_hours', 'tachograph', 'working_time', 'mobile_phone', 'seatbelt', 'vehicle_defect', 'no_break', 'overloading', 'harsh_driving', 'other');

-- CreateEnum
CREATE TYPE "InfringementSeverity" AS ENUM ('minor', 'major', 'serious');

-- CreateEnum
CREATE TYPE "InfringementStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "DebriefOutcome" AS ENUM ('positive', 'improvement_plan', 'verbal_warning', 'written_warning', 'training_assigned', 'coaching');

-- CreateTable
CREATE TABLE "DriverInfringement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "driverId" TEXT NOT NULL,
    "type" "InfringementType" NOT NULL DEFAULT 'other',
    "severity" "InfringementSeverity" NOT NULL DEFAULT 'minor',
    "status" "InfringementStatus" NOT NULL DEFAULT 'open',
    "points" INTEGER NOT NULL DEFAULT 0,
    "infringementDate" TIMESTAMP(3) NOT NULL,
    "vehicleId" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverInfringement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDebrief" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "driverId" TEXT NOT NULL,
    "debriefDate" TIMESTAMP(3) NOT NULL,
    "outcome" "DebriefOutcome" NOT NULL DEFAULT 'positive',
    "conductedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverDebrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverRiskProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "driverId" TEXT NOT NULL,
    "licenceNumber" TEXT,
    "licenceClass" TEXT,
    "dvlaCheckDate" TIMESTAMP(3),
    "licencePoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverRiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverInfringement_tenantId_idx" ON "DriverInfringement"("tenantId");

-- CreateIndex
CREATE INDEX "DriverInfringement_driverId_idx" ON "DriverInfringement"("driverId");

-- CreateIndex
CREATE INDEX "DriverInfringement_status_idx" ON "DriverInfringement"("status");

-- CreateIndex
CREATE INDEX "DriverDebrief_tenantId_idx" ON "DriverDebrief"("tenantId");

-- CreateIndex
CREATE INDEX "DriverDebrief_driverId_idx" ON "DriverDebrief"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverRiskProfile_driverId_key" ON "DriverRiskProfile"("driverId");

-- CreateIndex
CREATE INDEX "DriverRiskProfile_tenantId_idx" ON "DriverRiskProfile"("tenantId");
