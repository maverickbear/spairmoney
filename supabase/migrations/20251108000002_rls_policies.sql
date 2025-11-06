-- Enable Row Level Security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- User policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON "User"
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (via trigger on signup)
CREATE POLICY "Users can insert own profile" ON "User"
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Plan policies
-- Everyone can read plans (public pricing)
CREATE POLICY "Plans are publicly readable" ON "Plan"
  FOR SELECT USING (true);

-- Subscription policies
-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON "Subscription"
  FOR SELECT USING (auth.uid() = "userId");

-- Users can update their own subscriptions (via webhook)
-- Note: In production, webhooks should use service role key
CREATE POLICY "Users can update own subscriptions" ON "Subscription"
  FOR UPDATE USING (auth.uid() = "userId");

-- Service role can insert subscriptions (for webhooks)
-- Note: This requires service role key, not anon key
CREATE POLICY "Service can insert subscriptions" ON "Subscription"
  FOR INSERT WITH CHECK (true);

