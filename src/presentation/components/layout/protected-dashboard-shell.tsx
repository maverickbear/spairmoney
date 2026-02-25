"use client";

import { SubscriptionProvider } from "@/contexts/subscription-context";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { DashboardLayout } from "@/src/presentation/components/layout/dashboard-layout";
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
  children,
}: ProtectedDashboardShellProps) {
  const { isSidebarCollapsed } = useSidebarState();
  const hasSubscription = !!subscription;

  return (
    <SubscriptionProvider initialData={{ subscription, plan, trialEndsAt }}>
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
      >
        {children}
      </DashboardLayout>
    </SubscriptionProvider>
  );
}
