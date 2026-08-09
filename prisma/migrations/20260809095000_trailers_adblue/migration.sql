-- CreateTable
CREATE TABLE "AdBlueLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "loggedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "litres" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "odometer" INTEGER,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdBlueLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trailer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "registration" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "motExpiryDate" TIMESTAMP(3),
    "insuranceExpiryDate" TIMESTAMP(3),
    "nextPmiDate" TIMESTAMP(3),
    "status" "VehicleStatus" NOT NULL DEFAULT 'active',
    "imageStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trailer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdBlueLog_tenantId_idx" ON "AdBlueLog"("tenantId");

-- CreateIndex
CREATE INDEX "AdBlueLog_vehicleId_idx" ON "AdBlueLog"("vehicleId");

-- CreateIndex
CREATE INDEX "AdBlueLog_loggedDate_idx" ON "AdBlueLog"("loggedDate");

-- CreateIndex
CREATE UNIQUE INDEX "Trailer_registration_key" ON "Trailer"("registration");

-- CreateIndex
CREATE INDEX "Trailer_tenantId_idx" ON "Trailer"("tenantId");

-- CreateIndex
CREATE INDEX "Trailer_status_idx" ON "Trailer"("status");
