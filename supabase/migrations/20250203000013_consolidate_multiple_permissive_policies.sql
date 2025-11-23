-- ============================================================================
-- Consolidate Multiple Permissive Policies
-- ============================================================================
-- Date: 2025-02-03
-- Description: Combines multiple permissive RLS policies into single policies
--              using OR conditions. This improves performance by reducing the
--              number of policy evaluations per query.
-- 
-- Problem: When multiple permissive policies exist for the same role and action,
--          PostgreSQL must evaluate ALL of them for every query, which is
--          inefficient. Combining them into a single policy with OR conditions
--          is more performant.
-- ============================================================================

-- ============================================================================
-- PART 1: CATEGORY TABLE
-- ============================================================================
-- Combine "Super admin can * system categories" with "Users can * own categories"

-- DELETE
DROP POLICY IF EXISTS "Super admin can delete system categories" ON "public"."Category";
DROP POLICY IF EXISTS "Users can delete own categories" ON "public"."Category";
DROP POLICY IF EXISTS "Users and super admins can delete categories" ON "public"."Category";
CREATE POLICY "Users and super admins can delete categories" ON "public"."Category"
FOR DELETE
USING (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- INSERT
DROP POLICY IF EXISTS "Super admin can insert system categories" ON "public"."Category";
DROP POLICY IF EXISTS "Users can insert own categories" ON "public"."Category";
DROP POLICY IF EXISTS "Users and super admins can insert categories" ON "public"."Category";
CREATE POLICY "Users and super admins can insert categories" ON "public"."Category"
FOR INSERT
WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- UPDATE
DROP POLICY IF EXISTS "Super admin can update system categories" ON "public"."Category";
DROP POLICY IF EXISTS "Users can update own categories" ON "public"."Category";
DROP POLICY IF EXISTS "Users and super admins can update categories" ON "public"."Category";
CREATE POLICY "Users and super admins can update categories" ON "public"."Category"
FOR UPDATE
USING (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- ============================================================================
-- PART 2: SUBCATEGORY TABLE
-- ============================================================================
-- Combine "Super admin can * system subcategories" with "Users can * own subcategories"

-- DELETE
DROP POLICY IF EXISTS "Super admin can delete system subcategories" ON "public"."Subcategory";
DROP POLICY IF EXISTS "Users can delete own subcategories" ON "public"."Subcategory";
DROP POLICY IF EXISTS "Users and super admins can delete subcategories" ON "public"."Subcategory";
CREATE POLICY "Users and super admins can delete subcategories" ON "public"."Subcategory"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "public"."Category"
        WHERE "Category"."id" = "Subcategory"."categoryId"
        AND (("Category"."userId" IS NULL) OR ("Category"."userId" = (SELECT auth.uid())))
    )
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- INSERT
DROP POLICY IF EXISTS "Super admin can insert system subcategories" ON "public"."Subcategory";
DROP POLICY IF EXISTS "Users can insert own subcategories" ON "public"."Subcategory";
DROP POLICY IF EXISTS "Users and super admins can insert subcategories" ON "public"."Subcategory";
CREATE POLICY "Users and super admins can insert subcategories" ON "public"."Subcategory"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."Category"
        WHERE "Category"."id" = "Subcategory"."categoryId"
        AND (("Category"."userId" IS NULL) OR ("Category"."userId" = (SELECT auth.uid())))
    )
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- UPDATE
DROP POLICY IF EXISTS "Super admin can update system subcategories" ON "public"."Subcategory";
DROP POLICY IF EXISTS "Users can update own subcategories" ON "public"."Subcategory";
DROP POLICY IF EXISTS "Users and super admins can update subcategories" ON "public"."Subcategory";
CREATE POLICY "Users and super admins can update subcategories" ON "public"."Subcategory"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "public"."Category"
        WHERE "Category"."id" = "Subcategory"."categoryId"
        AND (("Category"."userId" IS NULL) OR ("Category"."userId" = (SELECT auth.uid())))
    )
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."Category"
        WHERE "Category"."id" = "Subcategory"."categoryId"
        AND (("Category"."userId" IS NULL) OR ("Category"."userId" = (SELECT auth.uid())))
    )
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- ============================================================================
-- PART 3: GROUP TABLE
-- ============================================================================
-- Combine "Super admin can * system groups" with "Users can * own groups"

-- DELETE
DROP POLICY IF EXISTS "Super admin can delete system groups" ON "public"."Group";
DROP POLICY IF EXISTS "Users can delete own groups" ON "public"."Group";
DROP POLICY IF EXISTS "Users and super admins can delete groups" ON "public"."Group";
CREATE POLICY "Users and super admins can delete groups" ON "public"."Group"
FOR DELETE
USING (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- INSERT
DROP POLICY IF EXISTS "Super admin can insert system groups" ON "public"."Group";
DROP POLICY IF EXISTS "Users can insert own groups" ON "public"."Group";
DROP POLICY IF EXISTS "Users and super admins can insert groups" ON "public"."Group";
CREATE POLICY "Users and super admins can insert groups" ON "public"."Group"
FOR INSERT
WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- UPDATE
DROP POLICY IF EXISTS "Super admin can update system groups" ON "public"."Group";
DROP POLICY IF EXISTS "Users can update own groups" ON "public"."Group";
DROP POLICY IF EXISTS "Users and super admins can update groups" ON "public"."Group";
CREATE POLICY "Users and super admins can update groups" ON "public"."Group"
FOR UPDATE
USING (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- ============================================================================
-- PART 4: CONTACTFORM TABLE
-- ============================================================================
-- Combine "Super admins can view all contact submissions" with "Users can view own contact submissions"

DROP POLICY IF EXISTS "Super admins can view all contact submissions" ON "public"."ContactForm";
DROP POLICY IF EXISTS "Users can view own contact submissions" ON "public"."ContactForm";
DROP POLICY IF EXISTS "Users and super admins can view contact submissions" ON "public"."ContactForm";
CREATE POLICY "Users and super admins can view contact submissions" ON "public"."ContactForm"
FOR SELECT
USING (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- PART 5: FEEDBACK TABLE
-- ============================================================================
-- Combine "Super admins can view all feedback submissions" with "Users can view own feedback submissions"

DROP POLICY IF EXISTS "Super admins can view all feedback submissions" ON "public"."Feedback";
DROP POLICY IF EXISTS "Users can view own feedback submissions" ON "public"."Feedback";
DROP POLICY IF EXISTS "Users and super admins can view feedback submissions" ON "public"."Feedback";
CREATE POLICY "Users and super admins can view feedback submissions" ON "public"."Feedback"
FOR SELECT
USING (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- PART 6: PROMOCODE TABLE
-- ============================================================================
-- Combine "Public can read active promo codes" with "Super admin can read promo codes"

DROP POLICY IF EXISTS "Public can read active promo codes" ON "public"."PromoCode";
DROP POLICY IF EXISTS "Super admin can read promo codes" ON "public"."PromoCode";
DROP POLICY IF EXISTS "Public and super admins can read promo codes" ON "public"."PromoCode";
CREATE POLICY "Public and super admins can read promo codes" ON "public"."PromoCode"
FOR SELECT
USING (
    (("isActive" = true) AND (("expiresAt" IS NULL) OR ("expiresAt" > now())))
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- ============================================================================
-- PART 7: SUBSCRIPTION TABLE
-- ============================================================================
-- Combine "Service role can * subscriptions" with "Users can * household subscriptions"
-- Note: We combine them using OR, but service_role check comes first for efficiency

-- DELETE
DROP POLICY IF EXISTS "Service role can delete subscriptions" ON "public"."Subscription";
DROP POLICY IF EXISTS "Users can delete household subscriptions" ON "public"."Subscription";
DROP POLICY IF EXISTS "Service role and users can delete subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role and users can delete subscriptions" ON "public"."Subscription"
FOR DELETE
USING (
    ((SELECT auth.role()) = 'service_role'::"text")
    OR "public"."can_access_household_data"("householdId", 'delete'::"text")
    OR ("userId" = (SELECT auth.uid()))
);

-- INSERT
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON "public"."Subscription";
DROP POLICY IF EXISTS "Users can insert household subscriptions" ON "public"."Subscription";
DROP POLICY IF EXISTS "Service role and users can insert subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role and users can insert subscriptions" ON "public"."Subscription"
FOR INSERT
WITH CHECK (
    ((SELECT auth.role()) = 'service_role'::"text")
    OR "public"."can_access_household_data"("householdId", 'write'::"text")
    OR ("userId" = (SELECT auth.uid()))
);

-- UPDATE
DROP POLICY IF EXISTS "Service role can update subscriptions" ON "public"."Subscription";
DROP POLICY IF EXISTS "Users can update household subscriptions" ON "public"."Subscription";
DROP POLICY IF EXISTS "Service role and users can update subscriptions" ON "public"."Subscription";
CREATE POLICY "Service role and users can update subscriptions" ON "public"."Subscription"
FOR UPDATE
USING (
    ((SELECT auth.role()) = 'service_role'::"text")
    OR "public"."can_access_household_data"("householdId", 'write'::"text")
    OR ("userId" = (SELECT auth.uid()))
)
WITH CHECK (
    ((SELECT auth.role()) = 'service_role'::"text")
    OR "public"."can_access_household_data"("householdId", 'write'::"text")
    OR ("userId" = (SELECT auth.uid()))
);

-- ============================================================================
-- PART 8: SUBSCRIPTIONSERVICE TABLE
-- ============================================================================
-- Combine "Anyone can view active subscription services" with "Super admin can manage subscription services"

DROP POLICY IF EXISTS "Anyone can view active subscription services" ON "public"."SubscriptionService";
DROP POLICY IF EXISTS "Super admin can manage subscription services" ON "public"."SubscriptionService";
DROP POLICY IF EXISTS "Public and super admins can access subscription services" ON "public"."SubscriptionService";
CREATE POLICY "Public and super admins can access subscription services" ON "public"."SubscriptionService"
FOR ALL
USING (
    ("isActive" = true)
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    ("isActive" = true)
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- ============================================================================
-- PART 9: SUBSCRIPTIONSERVICECATEGORY TABLE
-- ============================================================================
-- Combine "Anyone can view active subscription service categories" with "Super admin can manage subscription service categories"

DROP POLICY IF EXISTS "Anyone can view active subscription service categories" ON "public"."SubscriptionServiceCategory";
DROP POLICY IF EXISTS "Super admin can manage subscription service categories" ON "public"."SubscriptionServiceCategory";
DROP POLICY IF EXISTS "Public and super admins can access subscription service categories" ON "public"."SubscriptionServiceCategory";
CREATE POLICY "Public and super admins can access subscription service categories" ON "public"."SubscriptionServiceCategory"
FOR ALL
USING (
    ("isActive" = true)
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    ("isActive" = true)
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- ============================================================================
-- PART 10: SUBSCRIPTIONSERVICEPLAN TABLE
-- ============================================================================
-- Combine "Anyone can view active subscription service plans" with "Super admin can manage subscription service plans"

DROP POLICY IF EXISTS "Anyone can view active subscription service plans" ON "public"."SubscriptionServicePlan";
DROP POLICY IF EXISTS "Super admin can manage subscription service plans" ON "public"."SubscriptionServicePlan";
DROP POLICY IF EXISTS "Public and super admins can access subscription service plans" ON "public"."SubscriptionServicePlan";
CREATE POLICY "Public and super admins can access subscription service plans" ON "public"."SubscriptionServicePlan"
FOR ALL
USING (
    ("isActive" = true)
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
)
WITH CHECK (
    ("isActive" = true)
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" = 'super_admin'
    )
);

-- ============================================================================
-- PART 11: USERACTIVEHOUSEHOLD TABLE
-- ============================================================================
-- Combine "Users can set their active household" with "Users can view their active household"

DROP POLICY IF EXISTS "Users can set their active household" ON "public"."UserActiveHousehold";
DROP POLICY IF EXISTS "Users can view their active household" ON "public"."UserActiveHousehold";
DROP POLICY IF EXISTS "Users can manage their active household" ON "public"."UserActiveHousehold";
CREATE POLICY "Users can manage their active household" ON "public"."UserActiveHousehold"
FOR ALL
USING ("userId" = (SELECT auth.uid()))
WITH CHECK ("userId" = (SELECT auth.uid()));

-- ============================================================================
-- PART 12: USERBLOCKHISTORY TABLE
-- ============================================================================
-- Combine "Admins can view all block history" with "Users can view own block history"

DROP POLICY IF EXISTS "Admins can view all block history" ON "public"."UserBlockHistory";
DROP POLICY IF EXISTS "Users can view own block history" ON "public"."UserBlockHistory";
DROP POLICY IF EXISTS "Users and admins can view block history" ON "public"."UserBlockHistory";
CREATE POLICY "Users and admins can view block history" ON "public"."UserBlockHistory"
FOR SELECT
USING (
    "userId" = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = (SELECT auth.uid())
        AND "User"."role" IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After applying this migration, run the linter again to verify all warnings
-- about multiple permissive policies have been resolved.
-- ============================================================================

