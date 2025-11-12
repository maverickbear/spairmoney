-- Migration: Rename Macro table to Group
-- This migration renames the Macro table to Group and updates all related constraints, indexes, and RLS policies

-- ============================================
-- Step 1: Rename the table
-- ============================================
ALTER TABLE "Macro" RENAME TO "Group";

-- ============================================
-- Step 2: Rename indexes
-- ============================================
ALTER INDEX IF EXISTS "Macro_pkey" RENAME TO "Group_pkey";
ALTER INDEX IF EXISTS "Macro_name_key" RENAME TO "Group_name_key";
ALTER INDEX IF EXISTS "Macro_name_idx" RENAME TO "Group_name_idx";
ALTER INDEX IF EXISTS "Macro_userId_idx" RENAME TO "Group_userId_idx";
ALTER INDEX IF EXISTS "Macro_name_key_system" RENAME TO "Group_name_key_system";
ALTER INDEX IF EXISTS "Macro_name_userId_key" RENAME TO "Group_name_userId_key";

-- ============================================
-- Step 3: Rename foreign key constraints
-- ============================================
ALTER TABLE "Category" 
  DROP CONSTRAINT IF EXISTS "Category_macroId_fkey",
  ADD CONSTRAINT "Category_groupId_fkey" 
  FOREIGN KEY ("macroId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Budget" 
  DROP CONSTRAINT IF EXISTS "Budget_macroId_fkey",
  ADD CONSTRAINT "Budget_groupId_fkey" 
  FOREIGN KEY ("macroId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 4: Rename RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view system and own macros" ON "Group";
DROP POLICY IF EXISTS "Users can insert own macros" ON "Group";
DROP POLICY IF EXISTS "Users can update own macros" ON "Group";
DROP POLICY IF EXISTS "Users can delete own macros" ON "Group";

CREATE POLICY "Users can view system and own groups" ON "Group"
  FOR SELECT
  USING (("userId" IS NULL) OR ("userId" = auth.uid()));

CREATE POLICY "Users can insert own groups" ON "Group"
  FOR INSERT
  WITH CHECK (("userId" IS NULL) OR ("userId" = auth.uid()));

CREATE POLICY "Users can update own groups" ON "Group"
  FOR UPDATE
  USING (("userId" = auth.uid()));

CREATE POLICY "Users can delete own groups" ON "Group"
  FOR DELETE
  USING (("userId" = auth.uid()));

