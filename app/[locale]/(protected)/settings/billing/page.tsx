"use client";

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { usePagePerformance } from "@/hooks/use-page-performance";
import { useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/utils/api-base-url";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/toast-provider";
import { PageHeader } from "@/components/common/page-header";
import { UsageChart } from "@/components/billing/usage-chart";
import { SubscriptionManagementEmbedded } from "@/components/billing/subscription-management-embedded";
import { PaymentMethodManager } from "@/components/billing/payment-method-manager";
import { Subscription, Plan } from "@/src/domain/subscriptions/subscriptions.validations";
import { PlanFeatures } from "@/src/domain/subscriptions/subscriptions.validations";
import { BaseLimitCheckResult } from "@/src/domain/subscriptions/subscriptions.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Minimum ms between loadBillingData calls (avoids storm on visibility/portal return). */
const LOAD_BILLING_COOLDOWN_MS = 5000;
/** When we get 429, don't retry for this long (ms). */
const RATE_LIMIT_COOLDOWN_MS = 60000;

// Lazy load PaymentHistory to improve initial load time
const PaymentHistory = lazy(() => 
  import("@/components/billing/payment-history").then(m => ({ default: m.PaymentHistory }))
);

function LazyPaymentHistory({ billingHistoryTitle }: { billingHistoryTitle: string }) {
  return (
    <Suspense fallback={
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{billingHistoryTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    }>
      <PaymentHistory title={billingHistoryTitle} />
    </Suspense>
  );
}

export default function BillingPage() {
  const tNav = useTranslations("nav");
  const tSettings = useTranslations("settings");
  const tBilling = useTranslations("billing");
  const perf = usePagePerformance("Settings - Billing");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [limits, setLimits] = useState<PlanFeatures | null>(null);
  const [transactionLimit, setTransactionLimit] = useState<BaseLimitCheckResult | null>(null);
  const [accountLimit, setAccountLimit] = useState<BaseLimitCheckResult | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year" | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  // OPTIMIZED: Share household info between components to avoid duplicate calls
  const [householdInfo, setHouseholdInfo] = useState<{ isOwner: boolean; isMember: boolean; ownerId?: string; ownerName?: string } | null>(null);

  const portalReturnHandledRef = useRef(false);
  const lastLoadBillingRef = useRef<number>(0);
  const rateLimitCooldownRef = useRef<number>(0);

  const syncSubscription = useCallback(async () => {
    try {
      setSyncing(true);
      console.log("[BILLING] Syncing subscription from Stripe...");
      const response = await fetch(apiUrl("/api/stripe/sync-subscription"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("[BILLING] Subscription synced successfully:", data.subscription);
        
        toast({
          title: tBilling("subscriptionUpdated"),
          description: tBilling("subscriptionUpdatedDescription"),
        });
        return true;
      } else {
        console.error("[BILLING] Failed to sync subscription:", data.error);
        return false;
      }
    } catch (error) {
      console.error("[BILLING] Error syncing subscription:", error);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [toast, tBilling]);

  const loadBillingData = useCallback(async (force = false) => {
    const now = Date.now();
    if (rateLimitCooldownRef.current > now) {
      return;
    }
    if (!force && hasLoaded && !syncing) {
      return;
    }
    if (force && now - lastLoadBillingRef.current < LOAD_BILLING_COOLDOWN_MS) {
      return;
    }

    try {
      setLoading(true);
      lastLoadBillingRef.current = now;

      const subResponse = await fetch(apiUrl("/api/v2/billing/subscription"), {
        cache: "no-store",
      });

      if (subResponse.status === 429) {
        const retryAfter = subResponse.headers.get("Retry-After");
        const cooldownSec = retryAfter ? parseInt(retryAfter, 10) : 60;
        rateLimitCooldownRef.current = now + Math.min(cooldownSec * 1000, RATE_LIMIT_COOLDOWN_MS);
        setHasLoaded(true);
        toast({
          title: tBilling("tooManyRequests"),
          description: tBilling("tooManyRequestsDescription"),
          variant: "destructive",
        });
        return;
      }

      if (!subResponse.ok) {
        console.error("Failed to fetch subscription:", subResponse.status);
        setSubscription(null);
        setPlan(null);
        setLimits(null);
        setTransactionLimit(null);
        setAccountLimit(null);
        setBillingInterval(null);
        setHasLoaded(true);
        return;
      }

      const subData = await subResponse.json();
      const result = {
        subscription: subData.subscription ?? null,
        plan: subData.plan ?? null,
        limits: subData.limits ?? null,
        transactionLimit: subData.transactionLimit ?? null,
        accountLimit: subData.accountLimit ?? null,
        interval: subData.interval ?? null,
      };

      setSubscription(result.subscription);
      setPlan(result.plan);
      setLimits(result.limits);
      setTransactionLimit(result.transactionLimit);
      setAccountLimit(result.accountLimit);
      setBillingInterval(result.interval);
      setHasLoaded(true);
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  }, [hasLoaded, syncing, toast]);
  
  // Mark as loaded when component mounts (page structure is ready)
  useEffect(() => {
    const timer = setTimeout(() => {
      perf.markComplete();
    }, 100);
    return () => clearTimeout(timer);
  }, [perf]);

  // Check if user is returning from Stripe Portal (run only once per portal_return to avoid loop)
  useEffect(() => {
    const portalReturn = searchParams.get("portal_return");
    if (portalReturn !== "true") {
      portalReturnHandledRef.current = false;
      return;
    }
    if (portalReturnHandledRef.current) {
      return;
    }
    portalReturnHandledRef.current = true;
    router.replace("/settings/billing", { scroll: false });
    syncSubscription().then(() => {
      lastLoadBillingRef.current = 0;
      loadBillingData(true);
    });
  }, [searchParams, router, syncSubscription, loadBillingData]);

  // OPTIMIZED: Load household info once and share between components
  useEffect(() => {
    async function loadHouseholdInfo() {
      try {
        const response = await fetch(apiUrl("/api/v2/household/info"));
        if (response.ok) {
          const data = await response.json();
          setHouseholdInfo(data);
        }
      } catch (error) {
        console.error("Error loading household info:", error);
      }
    }
    loadHouseholdInfo();
  }, []);

  // Load data on mount immediately
  useEffect(() => {
    if (!hasLoaded) {
      loadBillingData();
    }
  }, [hasLoaded, loadBillingData]);

  // Refresh billing data periodically when billing page is active
  useEffect(() => {
    // Refresh data every 30 seconds when billing page is active
    const interval = setInterval(() => {
      loadBillingData(true); // Force refresh
    }, 30000); // 30 seconds

    // Also refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadBillingData(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadBillingData]);

  return (
    <div>
      <PageHeader
        title={tNav("items.billing")}
      />

      <div className="w-full p-4 lg:p-8">
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <SubscriptionManagementEmbedded
          subscription={subscription}
          plan={plan}
          interval={billingInterval}
          householdInfo={householdInfo}
          onSubscriptionUpdated={() => {
            loadBillingData(true);
          }}
        />

        <UsageChart
          limits={limits ?? undefined}
          transactionLimit={transactionLimit ?? undefined}
          accountLimit={accountLimit ?? undefined}
        />
      </div>

          <PaymentMethodManager />

          <LazyPaymentHistory billingHistoryTitle={tSettings("billingHistory")} />
        </div>
      </div>
    </div>
  );
}

