-- Migration: Migrate existing categories
-- This migration handles existing category data
-- Strategy: Keep existing data as user-specific (maintain userId)
-- This ensures no data loss and existing users continue to have their custom categories

-- ============================================
-- Step 1: Ensure all existing categories have userId
-- ============================================

-- Note: This migration assumes existing categories already have userId
-- If any categories exist without userId, they should be assigned to the first user
-- or kept as-is if they're meant to be system defaults

-- For safety, we'll only update categories that have NULL userId
-- and assign them to a default user (if needed)
-- However, in practice, existing categories should already have userId from previous migration

-- No action needed - existing categories with userId will remain as user-specific
-- System defaults are created in the seed migration

-- This migration is intentionally minimal as we're keeping existing data as-is
-- to avoid data loss and conflicts

