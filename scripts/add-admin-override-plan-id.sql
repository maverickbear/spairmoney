-- Add admin_override_plan_id to users table for admin-only plan override (app-only; does not change Stripe/billing).
-- Run this in Supabase SQL Editor.
-- When set, SubscriptionsService uses this plan for limits/features; clearing restores normal resolution.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS admin_override_plan_id text DEFAULT NULL;

COMMENT ON COLUMN users.admin_override_plan_id IS 'Admin override: effective plan for feature access only. Does not change Stripe or app_subscriptions. Null = use normal subscription resolution.';

-- Optional: add FK to app_plans if app_plans.id is stable (uncomment if desired)
-- ALTER TABLE users ADD CONSTRAINT fk_users_admin_override_plan_id FOREIGN KEY (admin_override_plan_id) REFERENCES app_plans(id) ON DELETE SET NULL;
