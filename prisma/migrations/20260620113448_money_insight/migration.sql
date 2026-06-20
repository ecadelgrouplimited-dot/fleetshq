-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('fuel', 'maintenance', 'wages', 'insurance', 'admin', 'rent', 'utilities', 'marketing', 'other');

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
    "category" "ExpenseCategory" NOT NULL DEFAULT 'other',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "vatAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expenseDate" DATE NOT NULL,
    "supplier" TEXT,
    "reference" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_tenantId_idx" ON "Expense"("tenantId");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");
