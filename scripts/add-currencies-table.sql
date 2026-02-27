-- Currencies table for display currency (Phase 2)
-- Run this in Supabase SQL Editor. Add new currencies with INSERT; no app deploy needed.

-- Create table
CREATE TABLE IF NOT EXISTS public.currencies (
  code text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  locale text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comment for documentation
COMMENT ON TABLE public.currencies IS 'Supported display currencies for the app. Add rows to enable new currencies without deploy.';

-- Seed CAD and USD
INSERT INTO public.currencies (code, name, locale, is_active, sort_order)
VALUES
  ('CAD', 'Canadian Dollar', 'en-CA', true, 0),
  ('USD', 'US Dollar', 'en-US', true, 1)
ON CONFLICT (code) DO NOTHING;

-- Optional: RLS (allow read for authenticated users; write only for service role / admin)
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
  ON public.currencies FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Allow all for service role"
  ON public.currencies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
