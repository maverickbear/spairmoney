"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { AlertCircle, Loader2, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscriptionSafe } from "@/contexts/subscription-context";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";
import type { Plan } from "@/src/domain/subscriptions/subscriptions.validations";

const DAYS_URGENCY_THRESHOLD = 2;

type BannerState = "active" | "urgency" | "expired" | "stripe_trialing" | "hidden";

interface ProTrialBannerProps {
  isSidebarCollapsed?: boolean;
  /** "top" = full-width alert at top (legacy); "sidebar" = compact card in nav above user avatar */
  variant?: "top" | "sidebar";
}

function getDaysLeft(trialEnd: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(trialEnd);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function ProTrialBanner({
  isSidebarCollapsed = false,
  variant = "top",
}: ProTrialBannerProps) {
  const t = useTranslations("billing.trialBanner");
  const context = useSubscriptionSafe();
  const { toast } = useToast();
  const { subscription, trialEndsAt } = context;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("month");

  const subscriptionTrialing = subscription?.status === "trialing";
  const trialEndFromSub = subscription?.trialEndDate
    ? new Date(subscription.trialEndDate)
    : null;
  const trialEndFromUser = trialEndsAt ? new Date(trialEndsAt) : null;
  const trialEnd = trialEndFromSub ?? trialEndFromUser;
  const hasLocalTrial = !subscription && trialEndsAt;
  const localTrialEnded =
    hasLocalTrial && trialEndFromUser && trialEndFromUser.getTime() <= Date.now();
  const noSubscriptionNoTrial = !subscription && !trialEndsAt;
  const daysLeft = trialEnd ? getDaysLeft(trialEnd) : 0;
  const isUrgency = daysLeft <= DAYS_URGENCY_THRESHOLD && daysLeft >= 0;

  const state: BannerState = subscriptionTrialing
    ? "stripe_trialing"
    : localTrialEnded || noSubscriptionNoTrial
      ? "expired"
      : hasLocalTrial && trialEnd
        ? isUrgency
          ? "urgency"
          : "active"
        : "hidden";

  const showBanner =
    state === "active" ||
    state === "urgency" ||
    state === "expired" ||
    state === "stripe_trialing";

  useEffect(() => {
    if (state !== "expired") return;
    let cancelled = false;
    setLoadingPlans(true);
    fetch(apiUrl("/api/billing/plans/public"))
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list = (data.plans || []) as Plan[];
        setPlans(list.sort((a: Plan, b: Plan) => a.priceMonthly - b.priceMonthly));
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state]);

  const proPlan = plans.find((p) => p.name.toLowerCase() === "pro") ?? plans[plans.length - 1];

  const startCheckout = useCallback(
    async (interval: "month" | "year") => {
      if (!proPlan) {
        toast({
          title: t("error"),
          description: t("noPlans"),
          variant: "destructive",
        });
        return;
      }
      setCheckoutLoading(true);
      try {
        const response = await fetch(apiUrl("/api/billing/checkout-session"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: proPlan.id,
            interval,
            returnUrl: "/subscription/success",
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          toast({
            title: t("error"),
            description: data.error || t("checkoutFailed"),
            variant: "destructive",
          });
          return;
        }
        if (data.url && typeof data.url === "string") {
          window.location.href = data.url;
        } else {
          toast({
            title: t("error"),
            description: t("checkoutFailed"),
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("[ProTrialBanner] Checkout error:", err);
        toast({
          title: t("error"),
          description: t("checkoutFailed"),
          variant: "destructive",
        });
      } finally {
        setCheckoutLoading(false);
      }
    },
    [proPlan, t, toast]
  );

  if (!showBanner) return null;

  // Sidebar: compact card above user avatar (reference: support card style)
  if (variant === "sidebar") {
    const isUrgency = state === "urgency";
    const isExpired = state === "expired";
    const isStripeTrialing = state === "stripe_trialing";
    const cardBg =
      isExpired || isUrgency
        ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20"
        : "bg-muted/50 dark:bg-muted/30 border-border";
    return (
      <div
        className={cn(
          "rounded-lg border p-3 shadow-sm",
          cardBg
        )}
      >
        <p className="font-semibold text-sm text-foreground leading-tight">
          {isExpired ? t("trialEnded") : t("onTrial")}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {isExpired
            ? t("chooseBillingPeriod")
            : isUrgency
              ? t("urgencyMessage", { count: daysLeft })
              : trialEnd
                ? t("daysLeft", { count: daysLeft })
                : ""}
        </p>
        {isExpired ? (
          <div className="mt-3 space-y-2">
            <div className="flex rounded-md border border-border bg-background/80 p-1 gap-1">
              <button
                type="button"
                onClick={() => setSelectedInterval("month")}
                className={cn(
                  "flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors",
                  selectedInterval === "month"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {t("monthly")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedInterval("year")}
                className={cn(
                  "flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors",
                  selectedInterval === "year"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {t("annual")}
              </button>
            </div>
            <Button
              size="small"
              className="w-full"
              onClick={() => startCheckout(selectedInterval)}
              disabled={checkoutLoading || !proPlan}
            >
              {checkoutLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                t("subscribe")
              )}
            </Button>
          </div>
        ) : isStripeTrialing ? (
          <Button variant="outline" size="small" className="w-full mt-3" asChild>
            <a href="/settings/billing">{t("manageBilling")}</a>
          </Button>
        ) : (
          <Button
            size="small"
            variant="outline"
            className="w-full mt-3"
            onClick={() => startCheckout("month")}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              t("subscribeNow")
            )}
          </Button>
        )}
      </div>
    );
  }

  if (state === "stripe_trialing") {
    return (
      <Alert
        variant="default"
        className={cn(
          "h-fit w-full rounded-none border-0 py-1",
          "bg-sentiment-positive-bg text-foreground dark:text-white"
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex-1 min-w-0">
            {t("onTrial")} {trialEnd && t("daysLeft", { count: daysLeft })}.
          </span>
          <Button variant="outline" size="small" asChild className="shrink-0 w-full sm:w-auto">
            <a href="/settings/billing">{t("manageBilling")}</a>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state === "expired") {
    return (
      <Alert
        variant="default"
        className={cn(
          "w-full rounded-none border-0",
          "bg-amber-500/15 dark:bg-amber-500/20 text-foreground dark:text-white border-amber-500/30"
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-4">
          <span className="font-medium">{t("trialEnded")}</span>
          <p className="text-sm text-muted-foreground">{t("chooseBillingPeriod")}</p>
          {loadingPlans ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg border border-border bg-background/50 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedInterval("month")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    selectedInterval === "month"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {t("monthly")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInterval("year")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    selectedInterval === "year"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {t("annual")}
                </button>
              </div>
              <Button
                size="small"
                onClick={() => startCheckout(selectedInterval)}
                disabled={checkoutLoading || !proPlan}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  t("subscribe")
                )}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const isUrgencyState = state === "urgency";
  return (
    <Alert
      variant="default"
      className={cn(
        "h-fit w-full rounded-none border-0 py-1",
        isUrgencyState
          ? "bg-amber-500/15 dark:bg-amber-500/20 text-foreground dark:text-white border-amber-500/30"
          : "bg-sentiment-positive-bg text-foreground dark:text-white"
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex-1 min-w-0">
          {isUrgencyState ? (
            <>
              {t("urgencyMessage", { count: daysLeft })} {t("urgencySubtext")}
            </>
          ) : (
            <>
              {t("onTrial")} {t("daysLeft", { count: daysLeft })}.
            </>
          )}
        </span>
        <Button
          size="small"
          onClick={() => startCheckout("month")}
          disabled={checkoutLoading}
          className="shrink-0 w-full sm:w-auto"
        >
          {checkoutLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("loading")}
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {t("subscribeNow")}
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
