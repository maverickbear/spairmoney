-- Trusted browsers: store per-user, per-fingerprint trust so we don't ask for OTP again for 30 days.
-- Run this in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS trusted_browsers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_trusted_browsers_user_fingerprint
  ON trusted_browsers (user_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_browsers_expires_at
  ON trusted_browsers (expires_at);

COMMENT ON TABLE trusted_browsers IS 'Devices/browsers trusted by the user; OTP is skipped on login for 30 days.';

ALTER TABLE trusted_browsers ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own trusted browser rows
CREATE POLICY "Users can manage own trusted browsers"
  ON trusted_browsers
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
