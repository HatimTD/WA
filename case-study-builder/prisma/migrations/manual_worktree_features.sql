-- Manual Migration: Add fields from all worktree feature branches
-- Generated: December 10, 2024
-- Note: This migration ONLY ADDS new fields, does not drop existing tables

-- ============================================
-- SECURITY-FIXES: Soft Delete Support
-- ============================================

-- Add soft delete fields to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Add soft delete fields to CaseStudy table
ALTER TABLE "CaseStudy"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- ============================================
-- COST-CALCULATOR: BRD Compliance Fields
-- ============================================

-- Add new fields to CostCalculator table
ALTER TABLE "CostCalculator"
ADD COLUMN IF NOT EXISTS "costOfPart" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "oldSolutionLifetimeDays" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "waSolutionLifetimeDays" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "partsUsedPerYear" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maintenanceRepairCostBefore" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maintenanceRepairCostAfter" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "disassemblyCostBefore" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "disassemblyCostAfter" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "extraBenefits" TEXT;

-- ============================================
-- AI-ENHANCEMENTS: Tags Support
-- ============================================

-- Add tags array field to CaseStudy
ALTER TABLE "CaseStudy"
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}';

-- ============================================
-- NETSUITE-INTEGRATION: Customer Link
-- ============================================

-- Add NetSuite fields to CaseStudy
ALTER TABLE "CaseStudy"
ADD COLUMN IF NOT EXISTS "netsuiteCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "netsuiteSyncedAt" TIMESTAMP;

-- ============================================
-- Create indexes for new fields
-- ============================================

-- Index for soft delete queries
CREATE INDEX IF NOT EXISTS "CaseStudy_isActive_idx" ON "CaseStudy"("isActive");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");

-- Index for NetSuite customer lookup
CREATE INDEX IF NOT EXISTS "CaseStudy_netsuiteCustomerId_idx" ON "CaseStudy"("netsuiteCustomerId");

-- Index for tags search (GIN for array)
CREATE INDEX IF NOT EXISTS "CaseStudy_tags_idx" ON "CaseStudy" USING GIN("tags");
