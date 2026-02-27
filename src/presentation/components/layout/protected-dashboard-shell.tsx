"use client";

import { SubscriptionProvider } from "@/contexts/subscription-context";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { DashboardLayout } from "@/src/presentation/components/layout/dashboard-layout";
import { CurrencyInitializer } from "@/src/presentation/components/layout/currency-initializer";
import { useSidebarState } from "@/src/presentation/hooks/use-sidebar-state";
import type { Subscription, Plan } from "@/src/domain/subscriptions/subscriptions.validations";

export interface ProtectedDashboardShellProps {
  subscription: Subscription | null;
  plan: Plan | null;
  trialEndsAt: string | null;
  shouldOpenModal: boolean;
  reason: "no_subscription" | "trial_expired" | "subscription_inactive" | undefined;
  currentPlanId: string | undefined;
  currentInterval: "month" | "year" | null;
  subscriptionStatus: "no_subscription" | "cancelled" | "past_due" | "unpaid" | null;
  /** True when subscription fetch failed (e.g. timeout). Prevents showing "trial ended" until data is confirmed. */
  subscriptionDataUnavailable?: boolean;
  children: React.ReactNode;
}

/**
 * Renders the full protected dashboard: trial banner above everything (full width),
 * then subscription guard, then dashboard layout (nav, header, main) with page content.
 * Used so the trial banner appears before the sidebar and header.
 */
export function ProtectedDashboardShell({
  subscription,
  plan,
  trialEndsAt,
  shouldOpenModal,
  reason,
  currentPlanId,
  currentInterval,
  subscriptionStatus,
  subscriptionDataUnavailable = false,
  children,
}: ProtectedDashboardShellProps) {
  const { isSidebarCollapsed } = useSidebarState();
  const hasSubscription = !!subscription;
  const isInLocalTrial = !subscription && !!trialEndsAt && new Date(trialEndsAt) > new Date();
  const isStripeTrialing =
    subscription?.status === "trialing" &&
    (!subscription.trialEndDate || new Date(subscription.trialEndDate) > new Date());
  const hasAccess =
    subscription?.status === "active" || isStripeTrialing || isInLocalTrial;

  return (
    <SubscriptionProvider
      initialData={{
        subscription,
        plan,
        trialEndsAt,
        subscriptionDataUnavailable,
      }}
    >
      <CurrencyInitializer />
      <SubscriptionGuard
        shouldOpenModal={shouldOpenModal}
        reason={reason}
        currentPlanId={currentPlanId}
        currentInterval={currentInterval}
        subscriptionStatus={subscriptionStatus}
      />
      <DashboardLayout
        isSidebarCollapsed={isSidebarCollapsed}
        hasSubscription={hasSubscription}
        hasAccess={hasAccess}
      >
        {children}
      </DashboardLayout>
    </SubscriptionProvider>
  );
}
