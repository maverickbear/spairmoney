"use client";

import { useSubscriptionContext } from "@/contexts/subscription-context";

/**
 * Hook to check if user can perform write operations.
 * During trial (Stripe trialing or local trial with no plan) user has full access.
 * After trial expires, user needs an active subscription to write.
 */
export function useWriteGuard() {
  const { subscription, trialEndsAt } = useSubscriptionContext();

  const canWrite =
    subscription?.status === "active" ||
    (subscription?.status === "trialing" && (!subscription.trialEndDate || new Date(subscription.trialEndDate) > new Date())) ||
    (!subscription && !!trialEndsAt && new Date(trialEndsAt) > new Date());

  const checkWriteAccess = (): boolean => canWrite;

  return {
    canWrite,
    checkWriteAccess,
  };
}

