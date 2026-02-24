"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { PlanFeatures } from "@/src/domain/subscriptions/subscriptions.validations";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockedFeature } from "./blocked-feature";
import { PageHeader } from "./page-header";
import { useAuthSafe } from "@/contexts/auth-context";

interface FeatureGuardProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  requiredPlan?: string; // Simplified: only "pro" exists, but allow string for flexibility
  featureName?: string;
  header?: ReactNode;
  headerTitle?: string;
}

/**
 * FeatureGuard
 * 
 * Uses AuthContext and SubscriptionContext for user data (single source of truth)
 * No longer makes direct API calls - all data comes from Context
 */
export function FeatureGuard({
  feature,
  children,
  fallback,
  requiredPlan,
  featureName,
  header,
  headerTitle,
}: FeatureGuardProps) {
  const { limits, checking: loading, plan, subscription } = useSubscription();
  const { role, checking: checkingAuth } = useAuthSafe(); // Use Context instead of fetch
  
  // Derive isSuperAdmin from Context role
  const isSuperAdmin = role === "super_admin";
  const checkingSuperAdmin = checkingAuth;

  // OPTIMIZATION: Don't block render while checking
  // Show content optimistically, checks happen in background
  if (loading || checkingSuperAdmin) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // super_admin has access to all features
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // SIMPLIFIED: With only one plan, all features are always enabled
  // Just check if user has an active subscription (status: active or trialing)
  const hasActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing";

  if (!hasActiveSubscription) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Subscription not active - show blocked screen (BlockedFeature translates feature name via billing.featureNames)
    return (
      <>
        {/* Show only title when blocked */}
        {headerTitle ? (
          <PageHeader title={headerTitle} />
        ) : header ? (
          // Try to extract title from header if headerTitle not provided
          header
        ) : null}
        <BlockedFeature feature={feature} featureName={featureName || undefined} />
      </>
    );
  }

  return <>{children}</>;
}

