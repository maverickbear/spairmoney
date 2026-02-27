"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { logger } from "@/lib/utils/logger";
import { apiUrl } from "@/lib/utils/api-base-url";
import type { Subscription, Plan, PlanFeatures } from "@/src/domain/subscriptions/subscriptions.validations";
import { getDefaultFeatures, getTrialFeatures } from "@/lib/utils/plan-features";

interface SubscriptionContextValue {
  subscription: Subscription | null;
  plan: Plan | null;
  /** Billing interval from Stripe (month/year); null when no subscription or unknown */
  interval: "month" | "year" | null;
  limits: PlanFeatures;
  checking: boolean;
  refetch: () => Promise<void>;
  /** End of 30-day local trial (no Stripe until Subscribe Now). From users.trial_ends_at. */
  trialEndsAt: string | null;
  /** True when initial load failed or data is inconclusive (e.g. connection issue). UI should not show "trial ended" until confirmed. */
  subscriptionStateUnknown: boolean;
  // Helper methods for common checks
  isActive: () => boolean;
  isTrialing: () => boolean;
  hasSubscription: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

interface InitialData {
  subscription: Subscription | null;
  plan: Plan | null;
  trialEndsAt?: string | null;
  /** True when server failed to load subscription (e.g. timeout). Prevents showing "trial ended" until refetch succeeds. */
  subscriptionDataUnavailable?: boolean;
}

interface SubscriptionProviderProps {
  children: ReactNode;
  initialData?: InitialData;
}


export function SubscriptionProvider({ children, initialData }: SubscriptionProviderProps) {
  const log = logger.withPrefix("SUBSCRIPTION-CONTEXT");
  
  // Initialize state from server data if provided
  const [subscription, setSubscription] = useState<Subscription | null>(
    initialData?.subscription ?? null
  );
  const [plan, setPlan] = useState<Plan | null>(initialData?.plan ?? null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(initialData?.trialEndsAt ?? null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year" | null>(null);
  const [limits, setLimits] = useState<PlanFeatures>(
    initialData?.plan?.features ?? getDefaultFeatures()
  );
  const [checking, setChecking] = useState(false);
  const [subscriptionStateUnknown, setSubscriptionStateUnknown] = useState(
    initialData?.subscriptionDataUnavailable ?? false
  );

  const checkingRef = useRef(false);
  // Track if we have initial data to avoid immediate refetch on mount
  const hasInitialDataRef = useRef(!!initialData);
  const lastFetchRef = useRef<number>(initialData ? Date.now() : 0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Track rate limit cooldown period (when we should not retry)
  const rateLimitCooldownRef = useRef<number>(0);
  // Track current subscription and plan in refs to avoid stale closures
  const subscriptionRef = useRef<Subscription | null>(initialData?.subscription ?? null);
  const planRef = useRef<Plan | null>(initialData?.plan ?? null);

  // Update limits when plan changes or trial status changes
  // During trial (no plan, trialEndsAt in future): full access. Otherwise plan features or defaults.
  useEffect(() => {
    if (plan?.features) {
      setLimits(plan.features);
    } else if (trialEndsAt && new Date(trialEndsAt) > new Date()) {
      setLimits(getTrialFeatures());
    } else {
      setLimits(getDefaultFeatures());
    }
    // Keep ref in sync
    planRef.current = plan;
  }, [plan, trialEndsAt]);

  // Keep subscription ref in sync
  useEffect(() => {
    subscriptionRef.current = subscription;
  }, [subscription]);

  // Sync state when initialData changes (e.g. after locale switch via cookie update and refresh).
  // React may reuse the same provider instance and only update props; useState does not re-run.
  useEffect(() => {
    const nextSub = initialData?.subscription ?? null;
    const nextPlan = initialData?.plan ?? null;
    const nextTrialEndsAt = initialData?.trialEndsAt ?? null;
    const nextDataUnavailable = initialData?.subscriptionDataUnavailable ?? false;
    setSubscription(nextSub);
    setPlan(nextPlan);
    setTrialEndsAt(nextTrialEndsAt);
    setSubscriptionStateUnknown(nextDataUnavailable);
    if (nextPlan?.features) {
      setLimits(nextPlan.features);
    } else if (nextTrialEndsAt && new Date(nextTrialEndsAt) > new Date()) {
      setLimits(getTrialFeatures());
    } else {
      setLimits(getDefaultFeatures());
    }
    subscriptionRef.current = nextSub;
    planRef.current = nextPlan;
    if (nextSub || nextPlan) {
      hasInitialDataRef.current = true;
      lastFetchRef.current = Date.now();
    }
  }, [initialData?.subscription, initialData?.plan, initialData?.trialEndsAt, initialData?.subscriptionDataUnavailable]);

  const fetchSubscription = useCallback(async (): Promise<{ subscription: Subscription | null; plan: Plan | null; interval: "month" | "year" | null; trialEndsAt?: string | null }> => {
    try {
      const response = await fetch(apiUrl("/api/v2/billing/subscription"));
      
      if (!response.ok) {
        if (response.status === 401) {
          log.log("User not authenticated");
          return {
            subscription: null,
            plan: null,
            interval: null,
            trialEndsAt: null,
          };
        }
        
        // Handle rate limiting (429) with proper cooldown
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60; // Default to 60 seconds
          const cooldownMs = retryAfterSeconds * 1000;
          
          // Set cooldown period - don't retry until this time has passed
          rateLimitCooldownRef.current = Date.now() + cooldownMs;
          
          log.log(`Rate limited (429). Cooldown until ${new Date(rateLimitCooldownRef.current).toISOString()}`);
          
          // Return current state from refs to avoid clearing subscription data
          // This preserves the last known good state
          return {
            subscription: subscriptionRef.current,
            plan: planRef.current,
            interval: null,
            trialEndsAt: undefined,
          };
        }
        
        throw new Error(`Failed to fetch subscription: ${response.status}`);
      }

      // Success - clear any rate limit cooldown
      rateLimitCooldownRef.current = 0;

      const data = await response.json();
      const result = {
        subscription: data.subscription ?? null,
        plan: data.plan ?? null,
        interval: data.interval ?? null,
        trialEndsAt: data.trialEndsAt ?? null,
      };
      
      return {
        subscription: result.subscription ?? null,
        plan: result.plan ?? null,
        interval: result.interval ?? null,
        trialEndsAt: result.trialEndsAt ?? null,
      };
    } catch (error) {
      log.error("Error fetching subscription:", error);
      return {
        subscription: subscriptionRef.current,
        plan: planRef.current,
        interval: null,
        trialEndsAt: undefined,
      };
    }
  }, [log]);

  const refetch = useCallback(async () => {
    if (checkingRef.current) {
      log.log("Already fetching, skipping");
      return;
    }

    // Check if we're in a rate limit cooldown period
    const now = Date.now();
    if (rateLimitCooldownRef.current > now) {
      const remainingMs = rateLimitCooldownRef.current - now;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      log.log(`Rate limit cooldown active. Skipping refetch. Retry in ${remainingSeconds}s`);
      return;
    }

    checkingRef.current = true;
    setChecking(true);
    const cooldownBeforeFetch = rateLimitCooldownRef.current;
    lastFetchRef.current = Date.now();

    try {
      const result = await fetchSubscription();
      const { subscription: newSubscription, plan: newPlan, interval: newInterval, trialEndsAt: newTrialEndsAt } = result;

      // Check if we got rate limited (cooldown was set during fetch)
      const wasRateLimited = rateLimitCooldownRef.current > cooldownBeforeFetch;

      // Only update state if we got fresh data (not rate limited)
      if (!wasRateLimited) {
        setSubscription(newSubscription);
        setPlan(newPlan);
        setBillingInterval(newInterval);
        if (newTrialEndsAt !== undefined) {
          setTrialEndsAt(newTrialEndsAt ?? null);
        }
        setSubscriptionStateUnknown(false);
      } else {
        log.log("Rate limited during fetch, preserving current subscription state");
      }
    } catch (error) {
      log.error("Error in refetch:", error);
    } finally {
      setChecking(false);
      checkingRef.current = false;
    }
  }, [fetchSubscription, log]);


  // Listen for onboarding completion event to refresh subscription
  useEffect(() => {
    const handleOnboardingCompleted = () => {
      log.log("Onboarding completed event received, refreshing subscription...");
      // Force immediate refetch when onboarding completes
      refetch();
    };

    window.addEventListener('onboarding-completed', handleOnboardingCompleted);

    return () => {
      window.removeEventListener('onboarding-completed', handleOnboardingCompleted);
    };
  }, [refetch, log]);

  // Check subscription status when app regains focus
  // This handles cases where subscription changes outside the app (e.g., App Store cancellation)
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchRef.current;
      
      // Skip if in rate limit cooldown
      if (rateLimitCooldownRef.current > now) {
        return;
      }
      
      // Only refetch if it's been at least 1 minute since last fetch
      // This prevents excessive refetches when user rapidly switches tabs
      if (timeSinceLastFetch > 60000) {
        log.log("App regained focus, checking subscription status...");
        refetch();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchRef.current;
        
        // Skip if in rate limit cooldown
        if (rateLimitCooldownRef.current > now) {
          return;
        }
        
        // Only refetch if it's been at least 1 minute since last fetch
        if (timeSinceLastFetch > 60000) {
          log.log("Page became visible, checking subscription status...");
          refetch();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch, log]);

  // Set up polling every 5 minutes
  // Only starts polling if we have initial data (from SSR) or have fetched before
  // Does NOT do immediate refetch on mount if we already have initialData
  useEffect(() => {
    // If we don't have initial data and haven't fetched, don't poll
    if (!hasInitialDataRef.current && lastFetchRef.current === 0) {
      return;
    }

    const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

    // Start polling interval - first refetch will happen after 5 minutes
    // (not immediately on mount if we have initialData)
    const timerId = setInterval(() => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchRef.current;
      
      // Skip if in rate limit cooldown
      if (rateLimitCooldownRef.current > now) {
        return;
      }
      
      // Only poll if it's been at least 5 minutes since last fetch
      if (timeSinceLastFetch >= POLLING_INTERVAL) {
        log.log("Polling interval reached, refetching...");
        refetch();
      }
    }, POLLING_INTERVAL);

    pollingIntervalRef.current = timerId;

    return () => {
      clearInterval(timerId);
    };
  }, [refetch, log]);

  // Helper methods for common subscription checks
  const isActive = useCallback(() => {
    return subscription?.status === "active";
  }, [subscription]);

  const isTrialing = useCallback(() => {
    return subscription?.status === "trialing";
  }, [subscription]);

  const hasSubscription = useCallback(() => {
    return subscription !== null;
  }, [subscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plan,
        interval: billingInterval,
        limits,
        checking,
        refetch,
        trialEndsAt,
        subscriptionStateUnknown,
        isActive,
        isTrialing,
        hasSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscriptionContext must be used within SubscriptionProvider");
  }
  return context;
}

/**
 * Safe version of useSubscriptionContext that returns null values when not within provider
 * Useful for components that may be used on public pages (e.g., landing page demos)
 */
export function useSubscriptionSafe() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    // Return safe defaults when not within provider
    return {
      subscription: null,
      plan: null,
      interval: null,
      limits: getDefaultFeatures(),
      checking: false,
      refetch: async () => {},
      trialEndsAt: null,
      subscriptionStateUnknown: false,
      isActive: () => false,
      isTrialing: () => false,
      hasSubscription: () => false,
    };
  }
  return context;
}
