"use client";

import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plan } from "@/src/domain/subscriptions/subscriptions.validations";
import { Check, Loader2, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type UpgradeDialogSubscriptionStatus = "no_subscription" | "cancelled" | "past_due" | "unpaid" | null;

interface ProUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionStatus?: UpgradeDialogSubscriptionStatus;
  currentPlanId?: string;
  currentInterval?: "month" | "year" | null;
  onSelectPlan: (planId: string, interval: "month" | "year", promoCode?: string) => void;
  onManageSubscription?: () => void;
  canClose?: boolean;
  loading?: boolean;
}

function getCopy(
  subscriptionStatus: UpgradeDialogSubscriptionStatus,
  currentPlanId: string | undefined,
  t: ReturnType<typeof useTranslations<"billing.upgradeDialog">>
) {
  if (currentPlanId === "trial") {
    return {
      title: t("subscribeNoTrialTitle"),
      description: t("subscribeNoTrialDescription"),
      primaryButton: t("subscribe"),
      secondaryButton: null as string | null,
      footerDisclaimer: "footerDisclaimerNoTrial" as const,
    };
  }

  const isNoPlan = !subscriptionStatus || subscriptionStatus === "no_subscription";

  if (isNoPlan) {
    return {
      title: t("subscribeTitle"),
      description: t("subscribeDescription"),
      primaryButton: t("startTrial"),
      secondaryButton: null as string | null,
      footerDisclaimer: "footerDisclaimer" as const,
    };
  }
  if (subscriptionStatus === "cancelled") {
    return {
      title: t("reactivateTitle"),
      description: t("reactivateDescription"),
      primaryButton: t("reactivate"),
      secondaryButton: t("maybeLater"),
      footerDisclaimer: "footerDisclaimer" as const,
    };
  }
  if (subscriptionStatus === "past_due") {
    return {
      title: t("pastDueTitle"),
      description: t("pastDueDescription"),
      primaryButton: t("updatePayment"),
      secondaryButton: t("maybeLater"),
      footerDisclaimer: "footerDisclaimer" as const,
    };
  }
  if (subscriptionStatus === "unpaid") {
    return {
      title: t("unpaidTitle"),
      description: t("unpaidDescription"),
      primaryButton: t("updatePayment"),
      secondaryButton: t("maybeLater"),
      footerDisclaimer: "footerDisclaimer" as const,
    };
  }
  return {
    title: t("subscribeTitle"),
    description: t("subscribeDescription"),
    primaryButton: t("startTrial"),
    secondaryButton: null as string | null,
    footerDisclaimer: "footerDisclaimer" as const,
  };
}

export function ProUpgradeDialog({
  open,
  onOpenChange,
  subscriptionStatus = "no_subscription",
  currentPlanId,
  currentInterval,
  onSelectPlan,
  onManageSubscription,
  canClose = false,
  loading = false,
}: ProUpgradeDialogProps) {
  const t = useTranslations("billing.upgradeDialog");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);

  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
    t("feature4"),
    t("feature5"),
    t("feature6"),
    t("feature7"),
    t("feature8"),
    t("feature9"),
  ];

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setPlansLoading(true);
      try {
        const usePublic = currentPlanId === undefined && currentInterval === null;
        let res: Response;
        if (usePublic) {
          res = await fetch("/api/billing/plans/public");
        } else {
          res = await fetch("/api/billing/plans");
          if (!res.ok && res.status === 401) res = await fetch("/api/billing/plans/public");
        }
        if (cancelled || !res.ok) return;
        const data = await res.json();
        const plansData = (data.plans || []) as Plan[];
        const pro = plansData.find((p: Plan) => p.name?.toLowerCase() === "pro") ?? plansData[0];
        if (pro) setPlan(pro);
      } catch {
        if (!cancelled) setPlan(null);
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, currentPlanId, currentInterval]);

  useEffect(() => {
    if (!open) {
      setPromoCode("");
      setShowPromoInput(false);
    }
  }, [open]);

  const copy = getCopy(subscriptionStatus, currentPlanId, t);
  const needsReactivation =
    subscriptionStatus === "cancelled" || subscriptionStatus === "past_due" || subscriptionStatus === "unpaid";
  const priceMonthly = plan?.priceMonthly ?? 8;
  const priceYearly = plan?.priceYearly ?? 72;
  const yearlyMonthly = priceYearly / 12;
  const yearlySavingsPct =
    priceMonthly > 0 ? Math.round((1 - priceYearly / 12 / priceMonthly) * 100) : 0;

  function handlePrimary() {
    if (needsReactivation && (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") && onManageSubscription) {
      onManageSubscription();
      return;
    }
    if (needsReactivation && subscriptionStatus === "cancelled" && onManageSubscription) {
      onManageSubscription();
      return;
    }
    if (plan) onSelectPlan(plan.id, interval, promoCode.trim() || undefined);
  }

  function handleSecondary() {
    if (canClose) {
      onOpenChange(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 flex w-full max-w-[590px] flex-col overflow-hidden rounded-none border border-border bg-background p-0 shadow-lg",
            "left-0 top-0 h-full max-h-screen translate-x-0 translate-y-0 sm:inset-auto sm:h-auto",
            "sm:left-[50%] sm:top-[50%] sm:max-w-[773px] sm:h-auto sm:max-h-[90vh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl"
          )}
          onInteractOutside={(e) => !canClose && e.preventDefault()}
          onEscapeKeyDown={(e) => !canClose && e.preventDefault()}
        >
          {canClose && (
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          )}
          <DialogPrimitive.Title className="sr-only">
            {copy.title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {copy.description}
          </DialogPrimitive.Description>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-row sm:min-h-[420px] sm:overflow-visible sm:flex-initial">
            {/* Left panel – form and features */}
            <div className="flex flex-none flex-col bg-[#f8f4f1] px-6 py-6 sm:min-h-0 sm:min-w-0 sm:flex-1 sm:overflow-y-auto sm:px-8 sm:py-8 sm:rounded-l-2xl order-1 sm:order-1 sm:w-1/2">
              <h3 className="text-xl font-bold text-foreground">{copy.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{copy.description}</p>

              <ul className="mt-6 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {copy.secondaryButton && (
                <div className="mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSecondary}
                    disabled={loading}
                  >
                    {copy.secondaryButton}
                  </Button>
                </div>
              )}
            </div>

            {/* Right panel – Pro plan, two option cards, and primary CTA */}
            <div className="flex shrink-0 flex-col justify-end bg-background px-6 py-8 sm:w-1/2 sm:rounded-r-2xl sm:px-8 sm:py-10 order-2 sm:order-2">
              <h3 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {t("chooseBillingPeriod")}
              </h3>

              {/* Two plan options as cards – selected uses plan.id + interval for price ID */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-1">
                {plansLoading ? (
                  <>
                    <div className="h-[88px] min-h-[88px] rounded-xl border border-border bg-muted/20 animate-pulse" />
                    <div className="h-[88px] min-h-[88px] rounded-xl border border-border bg-muted/20 animate-pulse" />
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setInterval("month")}
                      className={cn(
                        "w-full rounded-xl border-2 p-4 text-left transition-colors",
                        interval === "month"
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/20 hover:border-muted-foreground/40"
                      )}
                    >
                      <p className="text-lg font-bold text-gray-900 sm:text-xl">
                        {t("perMonth", { amount: `$${priceMonthly.toFixed(2)}` })}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-900/90">
                        {t("annualCost", { amount: `$${(priceMonthly * 12).toFixed(2)}` })}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterval("year")}
                      className={cn(
                        "w-full rounded-xl border-2 p-4 text-left transition-colors",
                        interval === "year"
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/20 hover:border-muted-foreground/40"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-gray-900 sm:text-xl">
                          {t("perYear", { amount: `$${priceYearly.toFixed(2)}` })}
                        </span>
                        {yearlySavingsPct > 0 && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium --sentiment-positive">
                            {t("savePct", { pct: yearlySavingsPct })}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-900/90">
                        {t("perMonth", { amount: `$${yearlyMonthly.toFixed(2)}` })}
                      </p>
                    </button>
                  </>
                )}
              </div>

              {/* Promo code – optional */}
              <div className="mt-4">
                {!showPromoInput ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(true)}
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {t("havePromoCode")}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder={t("enterCode")}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="font-mono text-sm h-9"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="small"
                        className="shrink-0 h-9 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setPromoCode("");
                          setShowPromoInput(false);
                        }}
                        aria-label="Remove promo code"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {promoCode.trim() && (
                      <p className="text-xs text-muted-foreground">
                        {t("applied")} <span className="font-mono font-medium text-foreground">{promoCode.trim()}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Primary CTA – uses plan.id + interval (price ID resolved server-side) */}
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={handlePrimary}
                  disabled={loading || plansLoading || !plan}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("loading")}
                    </>
                  ) : currentPlanId === "trial" ? (
                    interval === "year" ? t("subscribeToYearlyPlan") : t("subscribeToMonthlyPlan")
                  ) : (
                    copy.primaryButton
                  )}
                </Button>
              </div>

              {/* Footer disclaimer */}
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                {t(copy.footerDisclaimer)}
              </p>
            </div>
          </div>

          {plansLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin --sentiment-positive" />
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
