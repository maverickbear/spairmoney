-- Migration: Add roles to HouseholdMember and remove avatarUrl
-- This migration adds role-based access control to household members

-- ============================================
-- Step 1: Add role column to HouseholdMember
-- ============================================

ALTER TABLE "HouseholdMember" 
ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'member'; -- 'admin' | 'member'

-- Create index for role
CREATE INDEX IF NOT EXISTS "HouseholdMember_role_idx" ON "HouseholdMember"("role");

-- ============================================
-- Step 2: Remove avatarUrl column
-- ============================================

ALTER TABLE "HouseholdMember" 
DROP COLUMN IF EXISTS "avatarUrl";

-- ============================================
-- Step 3: Update existing members to have appropriate roles
-- ============================================

-- Note: Owners are automatically admins (they're not in HouseholdMember table)
-- All existing household members default to 'member' role (already set by DEFAULT)

