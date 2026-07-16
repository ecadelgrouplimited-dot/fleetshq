-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending_verification', 'verified', 'pending_activation', 'provisioned', 'rejected');

-- CreateTable
CREATE TABLE "RegistrationRequest" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyRegNo" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "fleetSize" TEXT NOT NULL,
    "region" TEXT,
    "plan" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'pending_verification',
    "chLookup" JSONB,
    "reviewNotes" TEXT,
    "tenantId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistrationRequest_status_idx" ON "RegistrationRequest"("status");

-- CreateIndex
CREATE INDEX "RegistrationRequest_contactEmail_idx" ON "RegistrationRequest"("contactEmail");

-- CreateIndex
CREATE INDEX "VerificationCode_requestId_idx" ON "VerificationCode"("requestId");

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RegistrationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
