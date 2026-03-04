-- RLS policies for categories and subcategories so household members (not only owner)
-- can read, create, update, and delete custom categories for their household.
-- Run in Supabase SQL Editor. Safe to re-run (drops existing policies first).
--
-- Requires: public.categories and public.subcategories must have columns
--   household_id (uuid, nullable), is_system (boolean).
-- public.household_members must have: user_id, household_id, status, deleted_at.

-- Helper: allow access when row is system OR user is active member of the row's household
-- (auth.uid() is the current authenticated user)

-- ========== CATEGORIES ==========
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present (idempotent)
DROP POLICY IF EXISTS "categories_select_system_or_household_member" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_household_member" ON public.categories;
DROP POLICY IF EXISTS "categories_update_household_member" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_household_member" ON public.categories;

-- SELECT: system categories (is_system = true) OR custom categories for households the user belongs to
CREATE POLICY "categories_select_system_or_household_member"
  ON public.categories FOR SELECT
  TO authenticated
  USING (
    is_system = true
    OR (
      household_id IS NOT NULL
      AND household_id IN (
        SELECT hm.household_id
        FROM public.household_members hm
        WHERE hm.user_id = auth.uid()
          AND hm.status = 'active'
          AND hm.deleted_at IS NULL
      )
    )
  );

-- INSERT: only for households where the user is an active member (app creates custom categories with household_id)
CREATE POLICY "categories_insert_household_member"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND household_id IN (
      SELECT hm.household_id
      FROM public.household_members hm
      WHERE hm.user_id = auth.uid()
        AND hm.status = 'active'
        AND hm.deleted_at IS NULL
    )
  );

-- UPDATE: only custom categories in households where the user is an active member
CREATE POLICY "categories_update_household_member"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (
    household_id IS NOT NULL
    AND household_id IN (
      SELECT hm.household_id
      FROM public.household_members hm
      WHERE hm.user_id = auth.uid()
        AND hm.status = 'active'
        AND hm.deleted_at IS NULL
    )
  )
  WITH CHECK (
    household_id IS NOT NULL
    AND household_id IN (
      SELECT hm.household_id
      FROM public.household_members hm
      WHERE hm.user_id = auth.uid()
        AND hm.status = 'active'
        AND hm.deleted_at IS NULL
    )
  );

-- DELETE: only custom categories in households where the user is an active member
CREATE POLICY "categories_delete_household_member"
  ON public.categories FOR DELETE
  TO authenticated
  USING (
    household_id IS NOT NULL
    AND household_id IN (
      SELECT hm.household_id
      FROM public.household_members hm
      WHERE hm.user_id = auth.uid()
        AND hm.status = 'active'
        AND hm.deleted_at IS NULL
    )
  );

-- ========== SUBCATEGORIES ==========
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subcategories_select_system_or_household_member" ON public.subcategories;
DROP POLICY IF EXISTS "subcategories_insert_household_member" ON public.subcategories;
DROP POLICY IF EXISTS "subcategories_update_household_member" ON public.subcategories;
DROP POLICY IF EXISTS "subcategories_delete_household_member" ON public.subcategories;

-- SELECT: system subcategories (is_system = true) OR custom for households the user belongs to
CREATE POLICY "subcategories_select_system_or_household_member"
  ON public.subcategories FOR SELECT
  TO authenticated
  USING (
    is_system = true
    OR (
      household_id IS NOT NULL
      AND household_id IN (
        SELECT hm.household_id
        FROM public.household_members hm
        WHERE hm.user_id = auth.uid()
          AND hm.status = 'active'
          AND hm.deleted_at IS NULL
      )
    )
  );

-- INSERT: only for households where the user is an active member
CREATE POLICY "subcategories_insert_household_member"
  ON public.subcategories FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IS NULL
    OR household_id IN (
      SELECT hm.household_id
      FROM public.household_members hm
      WHERE hm.user_id = auth.uid()
        AND hm.status = 'active'
        AND hm.deleted_at IS NULL
    )
  );

-- UPDATE: system or custom in user's households
CREATE POLICY "subcategories_update_household_member"
  ON public.subcategories FOR UPDATE
  TO authenticated
  USING (
    is_system = true
    OR (
      household_id IS NOT NULL
      AND household_id IN (
        SELECT hm.household_id
        FROM public.household_members hm
        WHERE hm.user_id = auth.uid()
          AND hm.status = 'active'
          AND hm.deleted_at IS NULL
      )
    )
  )
  WITH CHECK (
    is_system = true
    OR (
      household_id IS NOT NULL
      AND household_id IN (
        SELECT hm.household_id
        FROM public.household_members hm
        WHERE hm.user_id = auth.uid()
          AND hm.status = 'active'
          AND hm.deleted_at IS NULL
      )
    )
  );

-- DELETE: system or custom in user's households
CREATE POLICY "subcategories_delete_household_member"
  ON public.subcategories FOR DELETE
  TO authenticated
  USING (
    is_system = true
    OR (
      household_id IS NOT NULL
      AND household_id IN (
        SELECT hm.household_id
        FROM public.household_members hm
        WHERE hm.user_id = auth.uid()
          AND hm.status = 'active'
          AND hm.deleted_at IS NULL
      )
    )
  );
