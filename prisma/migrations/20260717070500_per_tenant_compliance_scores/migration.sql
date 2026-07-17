-- Compliance scores are per-tenant per-day: replace the global unique on
-- scoreDate (which broke the first dashboard load of every non-first tenant)
-- with a (tenantId, scoreDate) compound unique.
DROP INDEX "ComplianceScore_scoreDate_key";

CREATE UNIQUE INDEX "ComplianceScore_tenantId_scoreDate_key" ON "ComplianceScore"("tenantId", "scoreDate");
