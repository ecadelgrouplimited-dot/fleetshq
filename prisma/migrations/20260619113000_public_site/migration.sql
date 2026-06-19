-- Public lead capture for contact and quote forms.
CREATE TABLE "PublicLead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "enquiryType" TEXT NOT NULL DEFAULT 'general',
    "message" TEXT NOT NULL,
    "sourcePath" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicLead_tenantId_idx" ON "PublicLead"("tenantId");
CREATE INDEX "PublicLead_email_idx" ON "PublicLead"("email");
CREATE INDEX "PublicLead_createdAt_idx" ON "PublicLead"("createdAt");

ALTER TABLE "PublicLead" ADD CONSTRAINT "PublicLead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
