"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Subscription, Plan } from "@/src/domain/subscriptions/subscriptions.validations";
import { format } from "date-fns";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { apiUrl } from "@/lib/utils/api-base-url";
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

interface SubscriptionManagementEmbeddedProps {
  subscription: Subscription | null;
  plan: Plan | null;
  interval?: "month" | "year" | null;
  householdInfo?: UserHouseholdInfo | null;
  onSubscriptionUpdated?: () => void;
}

export function SubscriptionManagementEmbedded({
  subscription,
  plan,
  interval,
  householdInfo: initialHouseholdInfo,
  onSubscriptionUpdated,
}: SubscriptionManagementEmbeddedProps) {
  const tToasts = useTranslations("toasts");
  const t = useTranslations("billing");
  const breakpoint = useBreakpoint();
  const isMobile = !breakpoint || breakpoint === "xs" || breakpoint === "sm" || breakpoint === "md";
  const [loading, setLoading] = useState(false);
  const [householdInfo, setHouseholdInfo] = useState<UserHouseholdInfo | null>(initialHouseholdInfo ?? null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialHouseholdInfo !== undefined) {
      setHouseholdInfo(initialHouseholdInfo);
      return;
    }
    
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
  }, [initialHouseholdInfo]);

  async function handleOpenStripePortal() {
    try {
      setLoading(true);
      const response = await fetch(apiUrl("/api/stripe/portal"), {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        toast({
          title: tToasts("error"),
          description: data.error || t("failedToOpenPortalRetry"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast({
        title: tToasts("error"),
        description: t("failedToOpenPortalRetry"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!subscription || !plan) {
    return (
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("subscriptionCardTitle")}
          </CardTitle>
          <CardDescription>{t("noActiveSubscriptionDescription")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isYearly = interval === "year";
  const displayPrice = subscription.currentPeriodStart && subscription.currentPeriodEnd
    ? (isYearly ? plan.priceYearly : plan.priceMonthly)
    : 0;
  const priceLabel = isYearly ? t("perYearLabel") : t("perMonthLabel");
  const isCancelled = subscription.cancelAtPeriodEnd || subscription.status === "cancelled";
  const isFullyCancelled = subscription.status === "cancelled";

  return (
    <>
      <Card className="border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} Plan
              </CardTitle>
              <CardDescription className="mt-1">
                {interval === "year"
                  ? t("yearlySubscription")
                  : interval === "month"
                  ? t("monthlySubscription")
                  : t("subscriptionLabel")}
              </CardDescription>
            </div>
            {displayPrice > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold">${displayPrice.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">{priceLabel}</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            let dateToShow: Date | null = null;
            let label = "";
            let isValidDate = false;

            if (subscription.status === "trialing" && subscription.trialEndDate) {
              dateToShow = new Date(subscription.trialEndDate);
              label = t("yourTrialEndsOn");
              isValidDate = !isNaN(dateToShow.getTime()) && dateToShow.getFullYear() > 1970;
            } else if (subscription.currentPeriodEnd) {
              dateToShow = new Date(subscription.currentPeriodEnd);
              isValidDate = !isNaN(dateToShow.getTime()) && dateToShow.getFullYear() > 1970;
              
              if (isValidDate) {
                if (isFullyCancelled) {
                  label = t("accessEndedOn");
                } else if (isCancelled) {
                  label = t("subscriptionEndsOn");
                } else {
                  label = t("renewsOn");
                }
              }
            }

            if (dateToShow && isValidDate) {
              return (
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-medium">
                    {format(dateToShow, "PPP")}
                  </p>
                </div>
              );
            }

            if (isFullyCancelled) {
              return (
                <div>
                  <p className="text-sm text-muted-foreground">{t("subscriptionStatusLabel")}</p>
                  <p className="font-medium text-muted-foreground">{t("cancelled")}</p>
                </div>
              );
            }

            return null;
          })()}

          {isCancelled && (
            <Alert variant={isFullyCancelled ? "default" : "destructive"}>
              <AlertDescription>
                {isFullyCancelled ? (
                  <>
                    <strong>{t("subscriptionCancelledTitle")}</strong> {t("subscriptionCancelledDescription")}
                  </>
                ) : (
                  <>
                    <strong>{t("subscriptionWillBeCancelledTitle")}</strong>{" "}
                    {t("subscriptionWillBeCancelledDescription", {
                      date: subscription.currentPeriodEnd
                        ? format(new Date(subscription.currentPeriodEnd), "PPP")
                        : t("endOfBillingPeriod"),
                    })}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {subscription.status === "past_due" && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>{t("paymentFailedTitle")}</strong> {t("paymentFailedDescription")}
              </AlertDescription>
            </Alert>
          )}

          {householdInfo?.isMember && !householdInfo?.isOwner && (
            <Alert>
              <AlertDescription>
                {householdInfo.ownerName
                  ? t("viewingSubscriptionManagedBy", { name: householdInfo.ownerName })
                  : t("viewingSubscriptionAsMember")}
              </AlertDescription>
            </Alert>
          )}

          {(!householdInfo?.isMember || householdInfo?.isOwner) && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleOpenStripePortal}
                disabled={loading}
                variant="outline"
                size={isMobile ? "small" : "medium"}
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("upgradeDialog.loading")}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("manageSubscription")}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

