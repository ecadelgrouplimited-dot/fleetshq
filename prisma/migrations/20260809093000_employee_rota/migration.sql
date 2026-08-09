-- CreateEnum
CREATE TYPE "RotaShiftStatus" AS ENUM ('assigned', 'rest_day', 'relief_cover', 'on_site', 'office', 'work_from_home', 'standby', 'leave', 'sick', 'training');

-- CreateTable
CREATE TABLE "EmployeeShift" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "employeeId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "status" "RotaShiftStatus" NOT NULL DEFAULT 'assigned',
    "shiftDate" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "routeLabel" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeShift_tenantId_idx" ON "EmployeeShift"("tenantId");

-- CreateIndex
CREATE INDEX "EmployeeShift_employeeId_idx" ON "EmployeeShift"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeShift_shiftDate_idx" ON "EmployeeShift"("shiftDate");

-- CreateIndex
CREATE INDEX "EmployeeShift_status_idx" ON "EmployeeShift"("status");
