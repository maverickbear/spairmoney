-- Dedicated table for admin SEO settings (input at /admin).
-- Run this in Supabase SQL Editor. SEO data is read/written only from this table.

-- Create table
CREATE TABLE IF NOT EXISTS public.system_seo_settings (
  id text NOT NULL PRIMARY KEY,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.system_seo_settings IS 'SEO settings configured in Admin (title, description, OG, Twitter, organization, etc.). One row per config (e.g. id = default).';

-- One-time migration: copy existing SEO data from system_config_settings into the new table
INSERT INTO public.system_seo_settings (id, payload, created_at, updated_at)
SELECT
  'default',
  COALESCE(seo_settings, '{}'::jsonb),
  COALESCE(created_at, now()),
  COALESCE(updated_at, now())
FROM public.system_config_settings
WHERE id = 'default'
  AND seo_settings IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Remove SEO column from system_config_settings (SEO now lives in system_seo_settings)
ALTER TABLE public.system_config_settings DROP COLUMN IF EXISTS seo_settings;
