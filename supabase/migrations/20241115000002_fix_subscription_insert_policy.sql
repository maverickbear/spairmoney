-- Migration: Fix Subscription Insert Policy
-- Allow users to create their own subscriptions (for initial free plan setup)
-- This is needed because signup/signin code creates subscriptions using anon_key, not service_role

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON "Subscription";

-- Add policy to allow users to insert their own subscriptions
-- This is safe because it only allows inserting subscriptions where userId = auth.uid()
CREATE POLICY "Users can insert own subscriptions" ON "Subscription"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Note: Multiple policies can coexist for INSERT:
-- 1. "Users can insert own subscriptions" - allows users to create their own subscriptions (via signup/signin)
-- 2. "Service role can insert subscriptions" - allows service_role to create subscriptions (via webhooks)
-- Service role client bypasses RLS automatically, but this policy is good for safety

