-- Migration: Create HouseholdMember table
-- This migration creates the household members table for multi-user household management
-- Allows account owners to invite household members by email

-- ============================================
-- Step 1: Create HouseholdMember Table
-- ============================================

CREATE TABLE IF NOT EXISTS "HouseholdMember" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "memberId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "avatarUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'declined'
  "invitationToken" TEXT UNIQUE NOT NULL,
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- ============================================
-- Step 2: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS "HouseholdMember_ownerId_idx" ON "HouseholdMember"("ownerId");
CREATE INDEX IF NOT EXISTS "HouseholdMember_memberId_idx" ON "HouseholdMember"("memberId");
CREATE INDEX IF NOT EXISTS "HouseholdMember_email_idx" ON "HouseholdMember"("email");
CREATE INDEX IF NOT EXISTS "HouseholdMember_invitationToken_idx" ON "HouseholdMember"("invitationToken");
CREATE INDEX IF NOT EXISTS "HouseholdMember_status_idx" ON "HouseholdMember"("status");

-- ============================================
-- Step 3: Enable Row Level Security
-- ============================================

ALTER TABLE "HouseholdMember" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 4: Create RLS Policies
-- ============================================

-- Owners can view their household members
CREATE POLICY "Owners can view own household members" ON "HouseholdMember"
  FOR SELECT USING (auth.uid() = "ownerId");

-- Owners can insert household members (invite)
CREATE POLICY "Owners can invite household members" ON "HouseholdMember"
  FOR INSERT WITH CHECK (auth.uid() = "ownerId");

-- Owners can update their household members
CREATE POLICY "Owners can update own household members" ON "HouseholdMember"
  FOR UPDATE USING (auth.uid() = "ownerId");

-- Owners can delete their household members
CREATE POLICY "Owners can delete own household members" ON "HouseholdMember"
  FOR DELETE USING (auth.uid() = "ownerId");

-- Members can view their own household relationships (where they are the member)
CREATE POLICY "Members can view own household relationships" ON "HouseholdMember"
  FOR SELECT USING (auth.uid() = "memberId");

-- Members can update their own household relationships (accept invitation)
CREATE POLICY "Members can accept invitations" ON "HouseholdMember"
  FOR UPDATE USING (auth.uid() = "memberId" OR auth.uid() = "ownerId")
  WITH CHECK (auth.uid() = "memberId" OR auth.uid() = "ownerId");

-- Anyone can view by invitation token (for accepting invitations)
CREATE POLICY "Anyone can view by invitation token" ON "HouseholdMember"
  FOR SELECT USING (true);



