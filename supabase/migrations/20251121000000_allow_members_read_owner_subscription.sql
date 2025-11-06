-- Migration: Allow household members to read owner's subscription and basic info
-- This enables shadow subscription functionality where members inherit the owner's plan
-- Members need to read the owner's subscription and basic info (name, email) to determine which plan they should have access to

-- ============================================
-- Step 1: Add policy for members to read owner's subscription
-- ============================================

-- Allow household members to read their owner's subscription
-- This is needed for shadow subscription functionality
CREATE POLICY "Members can read owner subscriptions" ON "Subscription"
  FOR SELECT USING (
    -- User is the subscription owner (existing behavior)
    auth.uid() = "userId"
    OR
    -- User is an active member of the household where the subscription owner is the household owner
    EXISTS (
      SELECT 1 FROM "HouseholdMember"
      WHERE "HouseholdMember"."ownerId" = "Subscription"."userId"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- ============================================
-- Step 2: Add policy for members to read owner's basic info
-- ============================================

-- Allow household members to read basic info (name, email) of their owner
-- This is needed to display owner information in the profile
CREATE POLICY "Members can read owner basic info" ON "User"
  FOR SELECT USING (
    -- User is reading their own profile (existing behavior)
    auth.uid() = id
    OR
    -- User is an active member of the household where this user is the owner
    EXISTS (
      SELECT 1 FROM "HouseholdMember"
      WHERE "HouseholdMember"."ownerId" = "User"."id"
      AND "HouseholdMember"."memberId" = auth.uid()
      AND "HouseholdMember"."status" = 'active'
    )
  );

-- Note: These policies allow:
-- 1. Users to read their own subscriptions and profile (existing behavior)
-- 2. Active household members to read their owner's subscription and basic info (new behavior for shadow subscriptions)
--
-- This enables the shadow subscription feature where members inherit the owner's plan
-- without creating duplicate subscription records in the database.
-- Members can also see the owner's name/email to display in their profile.

