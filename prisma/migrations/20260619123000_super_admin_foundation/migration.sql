CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "baseRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "perMileRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceType_tenantId_code_key" ON "ServiceType"("tenantId", "code");
CREATE INDEX "ServiceType_tenantId_idx" ON "ServiceType"("tenantId");
CREATE INDEX "ServiceType_isActive_idx" ON "ServiceType"("isActive");

CREATE UNIQUE INDEX "SystemConfig_tenantId_category_key_key" ON "SystemConfig"("tenantId", "category", "key");
CREATE INDEX "SystemConfig_tenantId_idx" ON "SystemConfig"("tenantId");
CREATE INDEX "SystemConfig_category_idx" ON "SystemConfig"("category");

ALTER TABLE "ServiceType" ADD CONSTRAINT "ServiceType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
