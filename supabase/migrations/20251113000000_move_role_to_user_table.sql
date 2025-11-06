-- Migration: Move role from HouseholdMember to User table
-- This migration moves the role field to the User table for better consistency
-- and simpler queries
--
-- IMPORTANT: Users are only created when they accept an invitation
-- Owners (who sign up directly) are created with role 'admin'
-- Members (who accept invitations) are created with role based on invitation

-- ============================================
-- Step 1: Add role column to User table
-- ============================================

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'admin'; -- 'admin' | 'member'

-- Create index for role
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- ============================================
-- Step 2: Set role for existing owners
-- ============================================

-- All existing users are owners (signed up directly), so they should be admins
-- This is already the default, but we'll make it explicit
UPDATE "User" 
SET "role" = 'admin' 
WHERE "role" IS NULL OR "role" = '';

-- ============================================
-- Step 3: Update role for members based on HouseholdMember
-- ============================================

-- Update users who are members based on their role in HouseholdMember
-- (These users were created when they accepted invitations)
UPDATE "User" 
SET "role" = (
  SELECT "role" 
  FROM "HouseholdMember" 
  WHERE "HouseholdMember"."memberId" = "User"."id" 
    AND "HouseholdMember"."status" = 'active'
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM "HouseholdMember" 
  WHERE "HouseholdMember"."memberId" = "User"."id" 
    AND "HouseholdMember"."status" = 'active'
);

-- ============================================
-- Step 4: Keep role column in HouseholdMember
-- ============================================

-- We keep the role in HouseholdMember because:
-- 1. It's used to set the role when a user accepts an invitation
-- 2. The role is then copied to the User table when the invitation is accepted
-- 3. This allows us to know what role to assign before the user is created

