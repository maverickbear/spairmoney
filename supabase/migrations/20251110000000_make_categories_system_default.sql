-- Migration: Make categories system default
-- This migration makes Macro, Category, and Subcategory system-wide defaults
-- while allowing paid plan users to create custom categories

-- ============================================
-- Step 1: Make userId optional (NULL allowed)
-- ============================================

-- Alter Macro table to allow NULL userId (system defaults)
ALTER TABLE "Macro" 
ALTER COLUMN "userId" DROP NOT NULL;

-- Alter Category table to allow NULL userId (system defaults)
ALTER TABLE "Category" 
ALTER COLUMN "userId" DROP NOT NULL;

-- Note: Subcategory doesn't have userId directly, it inherits from Category

-- ============================================
-- Step 1.5: Update unique constraint on Macro name
-- ============================================

-- Drop existing unique constraint on Macro name
DROP INDEX IF EXISTS "Macro_name_key";

-- Create partial unique index: macro name must be unique only when userId IS NULL
-- This allows system defaults to have unique names, but users can have macros with same name
CREATE UNIQUE INDEX IF NOT EXISTS "Macro_name_key_system" 
ON "Macro"("name") 
WHERE "userId" IS NULL;

-- Create unique index for user's own macros: (name, userId) must be unique
-- This prevents users from having duplicate macro names
CREATE UNIQUE INDEX IF NOT EXISTS "Macro_name_userId_key" 
ON "Macro"("name", "userId") 
WHERE "userId" IS NOT NULL;

-- ============================================
-- Step 2: Drop existing RLS policies
-- ============================================

-- Drop existing Macro policies
DROP POLICY IF EXISTS "Users can view own macros" ON "Macro";
DROP POLICY IF EXISTS "Users can insert own macros" ON "Macro";
DROP POLICY IF EXISTS "Users can update own macros" ON "Macro";
DROP POLICY IF EXISTS "Users can delete own macros" ON "Macro";

-- Drop existing Category policies
DROP POLICY IF EXISTS "Users can view own categories" ON "Category";
DROP POLICY IF EXISTS "Users can insert own categories" ON "Category";
DROP POLICY IF EXISTS "Users can update own categories" ON "Category";
DROP POLICY IF EXISTS "Users can delete own categories" ON "Category";

-- Drop existing Subcategory policies
DROP POLICY IF EXISTS "Users can view own subcategories" ON "Subcategory";
DROP POLICY IF EXISTS "Users can insert own subcategories" ON "Subcategory";
DROP POLICY IF EXISTS "Users can update own subcategories" ON "Subcategory";
DROP POLICY IF EXISTS "Users can delete own subcategories" ON "Subcategory";

-- ============================================
-- Step 3: Create new RLS policies for Macro
-- ============================================

-- SELECT: Allow access to system defaults (userId IS NULL) OR user's own macros
CREATE POLICY "Users can view system and own macros" ON "Macro"
  FOR SELECT USING (
    "userId" IS NULL OR "userId" = auth.uid()
  );

-- INSERT: Only allow system defaults via migration (userId IS NULL) 
-- OR user's own macros if they have a paid plan
-- Note: Paid plan check will be enforced in application code
CREATE POLICY "Users can insert own macros" ON "Macro"
  FOR INSERT WITH CHECK (
    "userId" IS NULL OR "userId" = auth.uid()
  );

-- UPDATE: Only allow updating user's own macros (not system defaults)
CREATE POLICY "Users can update own macros" ON "Macro"
  FOR UPDATE USING (
    "userId" = auth.uid()
  );

-- DELETE: Only allow deleting user's own macros (not system defaults)
CREATE POLICY "Users can delete own macros" ON "Macro"
  FOR DELETE USING (
    "userId" = auth.uid()
  );

-- ============================================
-- Step 4: Create new RLS policies for Category
-- ============================================

-- SELECT: Allow access to system defaults (userId IS NULL) OR user's own categories
CREATE POLICY "Users can view system and own categories" ON "Category"
  FOR SELECT USING (
    "userId" IS NULL OR "userId" = auth.uid()
  );

-- INSERT: Only allow system defaults via migration (userId IS NULL)
-- OR user's own categories if they have a paid plan
-- Note: Paid plan check will be enforced in application code
CREATE POLICY "Users can insert own categories" ON "Category"
  FOR INSERT WITH CHECK (
    "userId" IS NULL OR "userId" = auth.uid()
  );

-- UPDATE: Only allow updating user's own categories (not system defaults)
CREATE POLICY "Users can update own categories" ON "Category"
  FOR UPDATE USING (
    "userId" = auth.uid()
  );

-- DELETE: Only allow deleting user's own categories (not system defaults)
CREATE POLICY "Users can delete own categories" ON "Category"
  FOR DELETE USING (
    "userId" = auth.uid()
  );

-- ============================================
-- Step 5: Create new RLS policies for Subcategory
-- ============================================

-- SELECT: Allow access to subcategories from system categories OR user's own categories
CREATE POLICY "Users can view system and own subcategories" ON "Subcategory"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Category" 
      WHERE "Category"."id" = "Subcategory"."categoryId" 
      AND ("Category"."userId" IS NULL OR "Category"."userId" = auth.uid())
    )
  );

-- INSERT: Allow inserting subcategories to system categories OR user's own categories
-- Note: Paid plan check for system categories will be enforced in application code
CREATE POLICY "Users can insert own subcategories" ON "Subcategory"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Category" 
      WHERE "Category"."id" = "Subcategory"."categoryId" 
      AND ("Category"."userId" IS NULL OR "Category"."userId" = auth.uid())
    )
  );

-- UPDATE: Only allow updating subcategories from user's own categories
CREATE POLICY "Users can update own subcategories" ON "Subcategory"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Category" 
      WHERE "Category"."id" = "Subcategory"."categoryId" 
      AND "Category"."userId" = auth.uid()
    )
  );

-- DELETE: Only allow deleting subcategories from user's own categories
CREATE POLICY "Users can delete own subcategories" ON "Subcategory"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Category" 
      WHERE "Category"."id" = "Subcategory"."categoryId" 
      AND "Category"."userId" = auth.uid()
    )
  );

