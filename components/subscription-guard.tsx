"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PricingDialog } from "@/components/billing/pricing-dialog";

interface SubscriptionGuardProps {
  shouldOpenModal: boolean;
  reason?: "no_subscription" | "trial_expired" | "subscription_inactive";
  currentPlanId?: string;
  currentInterval?: "month" | "year" | null;
  subscriptionStatus?: "no_subscription" | "cancelled" | null;
}

/**
 * Component that opens pricing dialog when subscription is required
 */
export function SubscriptionGuard({ 
  shouldOpenModal, 
  reason,
  currentPlanId,
  currentInterval,
  subscriptionStatus: propSubscriptionStatus,
}: SubscriptionGuardProps) {
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Check if modal should be opened from query params (for direct navigation)
    const openFromQuery = searchParams.get("openPricingModal") === "true";
    const trialExpired = searchParams.get("trial_expired") === "true";

    // Don't open dialog if trial expired - allow user to view system
    if (reason === "trial_expired" || trialExpired) {
      return;
    }

    // Only show pricing dialog if:
    // 1. subscriptionStatus is "cancelled" (user had subscription but cancelled it)
    // 2. OR openFromQuery is true (explicit request via URL)
    // For new users without subscription, onboarding dialog will handle it
    if (propSubscriptionStatus === "cancelled" || openFromQuery) {
      setDialogOpen(true);
    } else {
      setDialogOpen(false);
    }
  }, [shouldOpenModal, searchParams, reason, propSubscriptionStatus]);

  function handleTrialStarted() {
    // Dialog will handle page reload
    setDialogOpen(false);
  }

  return (
    <PricingDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      subscriptionStatus={propSubscriptionStatus || null}
      currentPlanId={currentPlanId}
      currentInterval={currentInterval}
      onTrialStarted={handleTrialStarted}
    />
  );
}

