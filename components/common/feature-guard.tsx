"use client";

import { ReactNode, useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { PlanFeatures } from "@/src/domain/subscriptions/subscriptions.validations";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockedFeature } from "./blocked-feature";
import { PageHeader } from "./page-header";

interface FeatureGuardProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  requiredPlan?: "essential" | "pro";
  featureName?: string;
  header?: ReactNode;
  headerTitle?: string;
}

export function FeatureGuard({
  feature,
  children,
  fallback,
  requiredPlan,
  featureName,
  header,
  headerTitle,
}: FeatureGuardProps) {
  const { limits, checking: loading, plan } = useSubscription();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [checkingSuperAdmin, setCheckingSuperAdmin] = useState(true);

  // OPTIMIZATION: Check super_admin in background using fast endpoint, don't block render
  // Start with optimistic assumption that user is not super_admin
  useEffect(() => {
    let cancelled = false;
    
    async function checkSuperAdmin() {
      try {
        // OPTIMIZATION: Use fast endpoint that only returns userRole, not all members
        const response = await fetch("/api/v2/user/role");
        if (cancelled) return;
        
        if (!response.ok) {
          throw new Error("Failed to fetch user role");
        }
        const { userRole } = await response.json();
        if (cancelled) return;
        
        const isSuperAdmin = userRole === "super_admin";
        setIsSuperAdmin(isSuperAdmin);
        
        // Cache the result
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('isSuperAdmin', String(isSuperAdmin));
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Error checking super_admin status:", error);
        setIsSuperAdmin(false);
      } finally {
        if (!cancelled) {
          setCheckingSuperAdmin(false);
        }
      }
    }
    
    // Only check if we haven't cached it yet
    const cachedSuperAdmin = sessionStorage.getItem('isSuperAdmin');
    if (cachedSuperAdmin !== null) {
      setIsSuperAdmin(cachedSuperAdmin === 'true');
      setCheckingSuperAdmin(false);
    } else {
      checkSuperAdmin();
    }
    
    return () => {
      cancelled = true;
    };
  }, []);

  // OPTIMIZATION: Don't block render while checking super_admin
  // Show content optimistically, super_admin check happens in background
  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // super_admin has access to all features
  // If we're still checking, assume not super_admin (will update if it is)
  if (isSuperAdmin === true) {
    // Cache the result
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('isSuperAdmin', 'true');
    }
    return <>{children}</>;
  }

  // Check feature access directly from the database (via limits)
  // The database is the source of truth - if a feature is disabled in Supabase, it should be disabled here
  // Safety check: convert string "true" to boolean (defensive programming)
  const featureValue = limits[feature];
  const hasAccess = featureValue === true || String(featureValue) === "true";

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Feature not available - show blocked screen
    const displayName = featureName || getFeatureName(feature);
    return (
      <>
        {/* Show only title when blocked */}
        {headerTitle ? (
          <PageHeader title={headerTitle} />
        ) : header ? (
          // Try to extract title from header if headerTitle not provided
          header
        ) : null}
        <BlockedFeature feature={feature} featureName={displayName} />
      </>
    );
  }

  return <>{children}</>;
}

function getFeatureName(feature: keyof PlanFeatures): string {
  const names: Record<keyof PlanFeatures, string> = {
    maxTransactions: "Unlimited Transactions",
    maxAccounts: "Unlimited Accounts",
    hasInvestments: "Investments",
    hasAdvancedReports: "Advanced Reports",
    hasCsvExport: "CSV Export",
    hasCsvImport: "CSV Import",
    hasDebts: "Debts",
    hasGoals: "Goals",
    hasBankIntegration: "Bank Integration",
    hasHousehold: "Household Members",
    hasBudgets: "Budgets",
    hasReceiptScanner: "Receipt Scanner",
  };

  return names[feature] || feature;
}

