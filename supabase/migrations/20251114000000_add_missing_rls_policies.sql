-- ============================================
-- Add Missing RLS Policies for Security
-- ============================================
-- This migration adds RLS policies that were missing from the schema
-- to improve security and ensure proper access control

-- ============================================
-- Step 1: Enable RLS on missing tables
-- ============================================

-- Enable RLS on User table (if not already enabled)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Plan table (if not already enabled)
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Subscription table (if not already enabled)
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: Add User table policies
-- ============================================

-- Drop existing policies if they exist (to ensure they're up to date)
DROP POLICY IF EXISTS "Users can read own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can insert own profile" ON "User";
DROP POLICY IF EXISTS "Users cannot delete own profile" ON "User";

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON "User"
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (via trigger on signup)
CREATE POLICY "Users can insert own profile" ON "User"
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users cannot delete their own profile (deletion should be done via Supabase Auth)
CREATE POLICY "Users cannot delete own profile" ON "User"
  FOR DELETE USING (false);

-- ============================================
-- Step 3: Add Plan table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Plans are publicly readable" ON "Plan";
DROP POLICY IF EXISTS "Service role can insert plans" ON "Plan";
DROP POLICY IF EXISTS "Service role can update plans" ON "Plan";
DROP POLICY IF EXISTS "Service role can delete plans" ON "Plan";

-- Everyone can read plans (public pricing)
CREATE POLICY "Plans are publicly readable" ON "Plan"
  FOR SELECT USING (true);

-- Only service role can insert plans
CREATE POLICY "Service role can insert plans" ON "Plan"
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Only service role can update plans
CREATE POLICY "Service role can update plans" ON "Plan"
  FOR UPDATE USING (auth.role() = 'service_role');

-- Only service role can delete plans
CREATE POLICY "Service role can delete plans" ON "Plan"
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- Step 4: Add Subscription table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service can insert subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Service role can delete subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Service role can update subscriptions" ON "Subscription";

-- Service role can insert subscriptions (for webhooks)
-- More restrictive than the old "Service can insert subscriptions" which allowed all authenticated users
CREATE POLICY "Service role can insert subscriptions" ON "Subscription"
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Service role can delete subscriptions
CREATE POLICY "Service role can delete subscriptions" ON "Subscription"
  FOR DELETE USING (auth.role() = 'service_role');

-- Service role can update subscriptions (for webhooks)
-- Note: Service role bypasses RLS automatically, but this policy is good for safety
CREATE POLICY "Service role can update subscriptions" ON "Subscription"
  FOR UPDATE USING (auth.role() = 'service_role');

-- Note: SELECT and UPDATE policies already exist:
-- - "Users can read own subscriptions" (SELECT) - already exists
-- - "Users cannot update subscriptions" (UPDATE) - already exists (blocks user updates)
-- - "Users can insert own subscriptions" (INSERT) - created by 20241115000002_fix_subscription_insert_policy.sql
--   This policy allows users to create their own subscriptions during signup/signin

-- ============================================
-- Step 5: Add DELETE policies for Security tables
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can delete securities" ON "Security";
DROP POLICY IF EXISTS "Authenticated users can delete security prices" ON "SecurityPrice";

-- Authenticated users can delete securities
CREATE POLICY "Authenticated users can delete securities" ON "Security"
  FOR DELETE USING (auth.role() = 'authenticated');

-- Authenticated users can delete security prices
CREATE POLICY "Authenticated users can delete security prices" ON "SecurityPrice"
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- Step 6: Clean up conflicting policies (if any)
-- ============================================

-- Remove generic "Service role can manage subscriptions" policy if it exists
-- This is too permissive and conflicts with specific policies
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON "Subscription";

