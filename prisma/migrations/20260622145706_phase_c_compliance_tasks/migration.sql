-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('vehicle_compliance', 'driver_compliance', 'tachograph', 'insurance', 'health_safety', 'training', 'licensing', 'other');

-- CreateTable
CREATE TABLE "ComplianceTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL DEFAULT 'other',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'not_started',
    "dueDate" TIMESTAMP(3),
    "assigneeId" TEXT,
    "vehicleId" TEXT,
    "createdById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceSubtask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceSubtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceTaskEvidence" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceTaskEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplianceTask_tenantId_idx" ON "ComplianceTask"("tenantId");

-- CreateIndex
CREATE INDEX "ComplianceTask_status_idx" ON "ComplianceTask"("status");

-- CreateIndex
CREATE INDEX "ComplianceTask_assigneeId_idx" ON "ComplianceTask"("assigneeId");

-- CreateIndex
CREATE INDEX "ComplianceSubtask_taskId_idx" ON "ComplianceSubtask"("taskId");

-- CreateIndex
CREATE INDEX "ComplianceTaskEvidence_taskId_idx" ON "ComplianceTaskEvidence"("taskId");

-- AddForeignKey
ALTER TABLE "ComplianceSubtask" ADD CONSTRAINT "ComplianceSubtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ComplianceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTaskEvidence" ADD CONSTRAINT "ComplianceTaskEvidence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ComplianceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
