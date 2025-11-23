-- ============================================================================
-- Add Missing Foreign Key Indexes
-- ============================================================================
-- Date: 2025-02-03
-- Description: Adds indexes for foreign key constraints that are missing
--              covering indexes. This improves query performance for joins
--              and foreign key constraint checks.
-- ============================================================================
-- Note: Foreign keys without indexes can lead to suboptimal query performance,
-- especially for DELETE and UPDATE operations on referenced tables.

-- ============================================================================
-- PART 1: ADD INDEXES FOR UNINDEXED FOREIGN KEYS
-- ============================================================================

-- Household.createdBy (references User.id)
-- Used for queries finding households created by a specific user
CREATE INDEX IF NOT EXISTS "Household_createdBy_idx" 
ON "public"."Household"("createdBy");

-- HouseholdMemberNew.invitedBy (references User.id)
-- Used for queries finding members invited by a specific user
CREATE INDEX IF NOT EXISTS "HouseholdMemberNew_invitedBy_idx" 
ON "public"."HouseholdMemberNew"("invitedBy");

-- PlannedPayment.accountId (references Account.id)
-- Used for queries finding planned payments for a specific account
CREATE INDEX IF NOT EXISTS "PlannedPayment_accountId_idx" 
ON "public"."PlannedPayment"("accountId");

-- PlannedPayment.categoryId (references Category.id)
-- Used for queries finding planned payments in a specific category
CREATE INDEX IF NOT EXISTS "PlannedPayment_categoryId_idx" 
ON "public"."PlannedPayment"("categoryId");

-- PlannedPayment.subcategoryId (references Subcategory.id)
-- Used for queries finding planned payments in a specific subcategory
CREATE INDEX IF NOT EXISTS "PlannedPayment_subcategoryId_idx" 
ON "public"."PlannedPayment"("subcategoryId");

-- UserBlockHistory.blockedBy (references User.id)
-- Used for queries finding block history entries by a specific admin
CREATE INDEX IF NOT EXISTS "UserBlockHistory_blockedBy_idx" 
ON "public"."UserBlockHistory"("blockedBy");

-- category_learning.category_id (references Category.id)
-- Used for queries finding learning entries for a specific category
CREATE INDEX IF NOT EXISTS "category_learning_category_id_idx" 
ON "public"."category_learning"("category_id");

-- category_learning.subcategory_id (references Subcategory.id)
-- Used for queries finding learning entries for a specific subcategory
CREATE INDEX IF NOT EXISTS "category_learning_subcategory_id_idx" 
ON "public"."category_learning"("subcategory_id");

-- ============================================================================
-- NOTES
-- ============================================================================
-- These indexes improve performance for:
-- 1. JOIN operations on foreign key columns
-- 2. DELETE operations on referenced tables (cascade checks)
-- 3. UPDATE operations on referenced tables (referential integrity checks)
-- 4. Queries filtering by foreign key values
--
-- IMPORTANT: After applying this migration, the linter may still show these
-- indexes as "unused". This is NORMAL and EXPECTED because:
-- - Newly created indexes haven't been used in queries yet
-- - PostgreSQL tracks index usage over time
-- - The indexes will be marked as "used" once queries start using them
-- - These indexes are still necessary for foreign key performance
--
-- The linter also identified many other unused indexes. These are informational
-- warnings (INFO level, not errors). The indexes may be needed for:
-- - Future query patterns
-- - Reporting and analytics
-- - Backup/restore operations
-- - Maintenance queries
-- - Foreign key constraint checks (even if not used in SELECT queries)
--
-- DO NOT remove indexes just because they appear as "unused" - they serve
-- important purposes beyond just query optimization.
-- ============================================================================

