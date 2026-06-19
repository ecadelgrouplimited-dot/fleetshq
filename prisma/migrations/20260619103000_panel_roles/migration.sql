-- Extend the role enum for the platform panel model.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'fleet_manager';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'finance_officer';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'trainer';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'client';

-- Keep the existing primary role for compatibility, and add multi-role / branch membership.
ALTER TABLE "User" ADD COLUMN "roles" "UserRole"[] NOT NULL DEFAULT ARRAY[]::"UserRole"[];
ALTER TABLE "User" ADD COLUMN "branchIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "User"
SET "roles" = ARRAY["role"]::"UserRole"[]
WHERE cardinality("roles") = 0;
