-- Script to add hasCsvImport feature to existing plans
-- Run this in Supabase SQL Editor

-- Update Essential plan: add hasCsvImport: true
UPDATE "Plan"
SET features = jsonb_set(
  COALESCE(features, '{}'::jsonb),
  '{hasCsvImport}',
  'true'::jsonb
)
WHERE id = 'essential';

-- Update Pro plan: add hasCsvImport: true
UPDATE "Plan"
SET features = jsonb_set(
  COALESCE(features, '{}'::jsonb),
  '{hasCsvImport}',
  'true'::jsonb
)
WHERE id = 'pro';

-- Verify the updates
SELECT id, name, features->'hasCsvImport' as hasCsvImport
FROM "Plan"
WHERE id IN ('essential', 'pro');

