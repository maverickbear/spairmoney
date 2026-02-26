"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/common/plan-badge";
import { Subscription, Plan } from "@/src/domain/subscriptions/subscriptions.validations";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { calculateTrialDaysRemaining } from "@/components/billing/trial-widget";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface UserHouseholdInfo {
  isOwner: boolean;
  isMember: boolean;
  ownerId?: string;
  ownerName?: string;
}

interface SubscriptionCardProps {
  subscription: Subscription | null;
  plan: Plan | null;
  /** Billing interval from Stripe; when null, defaults to monthly for display */
  interval?: "month" | "year" | null;
  onSubscriptionUpdated?: () => void;
}

export function SubscriptionCard({ subscription, plan, interval, onSubscriptionUpdated }: SubscriptionCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [householdInfo, setHouseholdInfo] = useState<UserHouseholdInfo | null>(null);

  useEffect(() => {
    async function loadHouseholdInfo() {
      try {
        const response = await fetch("/api/v2/household/info");
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

  async function handleManageSubscription() {
    try {
      setLoading(true);
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        console.error("Failed to create portal session:", data.error);
      }
    } catch (error) {
      console.error("Error opening portal:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!subscription || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>Please select a plan to continue</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const isYearly = interval === "year";
  const displayPrice = subscription.currentPeriodStart && subscription.currentPeriodEnd
    ? (isYearly ? plan.priceYearly : plan.priceMonthly)
    : 0;
  const priceLabel = isYearly ? "per year" : "per month";
  const priceDisplay = displayPrice > 0 ? `$${displayPrice.toFixed(2)}` : "Free";
  const isTrialPlan = displayPrice === 0 && subscription.trialEndDate;
  const trialEndDateStr = subscription.trialEndDate
    ? typeof subscription.trialEndDate === "string"
      ? subscription.trialEndDate
      : subscription.trialEndDate.toISOString()
    : null;
  const trialDaysLeft = isTrialPlan ? calculateTrialDaysRemaining(trialEndDateStr) : null;
  const priceSubtext = isTrialPlan && trialDaysLeft !== null
    ? (trialDaysLeft <= 0 ? "Your trial has ended." : `${trialDaysLeft} days left`)
    : priceLabel;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Current Plan
              <PlanBadge plan={plan.name} />
            </CardTitle>
            <CardDescription className="mt-1">
              {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} plan
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{priceDisplay}</div>
            <div className="text-sm text-muted-foreground">{priceSubtext}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(() => {
          const trialEnd = subscription.trialEndDate;
          const isTrialPeriod = (subscription.status === "trialing" && trialEnd) || (plan.id === "trial" && trialEnd);
          const dateToShow = isTrialPeriod && trialEnd
            ? new Date(trialEnd)
            : subscription.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd)
            : null;
          if (!dateToShow || isNaN(dateToShow.getTime())) return null;
          return (
            <div>
              <p className="text-sm text-muted-foreground">
                {isTrialPeriod ? "Your trial period ends on" : "Current period ends"}
              </p>
              <p className="font-medium">{format(dateToShow, "PPP")}</p>
            </div>
          );
        })()}

        {subscription.cancelAtPeriodEnd && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
            Your subscription will be cancelled at the end of the current period.
          </div>
        )}

        {subscription.status === "past_due" && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
            Your subscription payment failed. Please update your payment method.
          </div>
        )}

        {householdInfo?.isMember && !householdInfo?.isOwner && (
          <Alert>
            <AlertDescription>
              {householdInfo.ownerName 
                ? `You are viewing the subscription managed by ${householdInfo.ownerName}. Only the account owner can manage the subscription.`
                : "You are viewing the subscription as a household member. Only the account owner can manage the subscription."}
            </AlertDescription>
          </Alert>
        )}

        {(!householdInfo?.isMember || householdInfo?.isOwner) && (
          <Button
            onClick={
              isTrialPlan
                ? () => router.push(`${pathname}?openPricingModal=true`)
                : handleManageSubscription
            }
            disabled={!isTrialPlan && loading}
            className="w-full"
          >
            {!isTrialPlan && loading ? "Loading..." : isTrialPlan ? "Upgrade Now" : "Manage Subscription"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

