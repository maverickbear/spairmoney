-- Add trial_ends_at to users table for 30-day local trial (no Stripe until Subscribe Now).
-- Run this in Supabase SQL Editor.
-- New users get trial_ends_at set on insert (application layer). No backfill for existing users.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN users.trial_ends_at IS 'End of 30-day app trial (no Stripe subscription until user clicks Subscribe Now). Set on user creation.';
