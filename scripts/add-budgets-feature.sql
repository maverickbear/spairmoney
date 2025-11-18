-- Script to add hasBudgets feature to existing plans
-- Run this in Supabase SQL Editor

-- Update Essential plan: add hasBudgets: true
UPDATE "Plan"
SET features = jsonb_set(
  COALESCE(features, '{}'::jsonb),
  '{hasBudgets}',
  'true'::jsonb
)
WHERE id = 'essential';

-- Update Pro plan: add hasBudgets: true
UPDATE "Plan"
SET features = jsonb_set(
  COALESCE(features, '{}'::jsonb),
  '{hasBudgets}',
  'true'::jsonb
)
WHERE id = 'pro';

-- Verify the updates
SELECT id, name, features->'hasBudgets' as hasBudgets
FROM "Plan"
WHERE id IN ('essential', 'pro');

