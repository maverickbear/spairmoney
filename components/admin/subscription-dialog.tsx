"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Calendar, AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SimpleTabs, SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent } from "@/components/ui/simple-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUser } from "@/src/domain/admin/admin.types";

interface SubscriptionDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** When set, open directly on this tab (e.g. "plan-override"). */
  initialTab?: string;
}

type CancelOption = "immediately" | "end_of_period" | "specific_date";
type RefundOption = "none" | "prorated" | "full";

type PlanOption = { id: string; name: string };

export function SubscriptionDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  initialTab,
}: SubscriptionDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? "trial");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trial edit state
  const [trialEndDate, setTrialEndDate] = useState("");
  const [trialEndTime, setTrialEndTime] = useState("");

  // Cancel subscription state
  const [cancelOption, setCancelOption] = useState<CancelOption>("immediately");
  const [specificCancelDate, setSpecificCancelDate] = useState("");
  const [refundOption, setRefundOption] = useState<RefundOption>("none");

  // Plan override state
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedOverridePlanId, setSelectedOverridePlanId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab && open) setActiveTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    if (user && open && activeTab === "plan-override") {
      setPlansLoading(true);
      fetch("/api/v2/admin/plans")
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load plans"))))
        .then((data: { plans?: Array<{ id: string; name: string }> }) => {
          setPlans(data.plans ?? []);
          setSelectedOverridePlanId(user.adminOverridePlanId ?? null);
        })
        .catch(() => setPlans([]))
        .finally(() => setPlansLoading(false));
    }
  }, [user, open, activeTab]);

  useEffect(() => {
    if (user && user.subscription && open) {
      // Initialize trial end date/time
      if (user.subscription.trialEndDate) {
        const date = new Date(user.subscription.trialEndDate);
        setTrialEndDate(format(date, "yyyy-MM-dd"));
        setTrialEndTime(format(date, "HH:mm"));
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setTrialEndDate(format(tomorrow, "yyyy-MM-dd"));
        setTrialEndTime("23:59");
      }

      // Initialize cancel date to current period end if available
      if (user.subscription.currentPeriodEnd) {
        setSpecificCancelDate(format(new Date(user.subscription.currentPeriodEnd), "yyyy-MM-dd"));
      } else {
        const defaultCancelDate = new Date();
        defaultCancelDate.setMonth(defaultCancelDate.getMonth() + 1);
        setSpecificCancelDate(format(defaultCancelDate, "yyyy-MM-dd"));
      }

      setError(null);
    }
  }, [user, open]);

  // Calculate dates for cancel options
  const getImmediateCancelDate = () => {
    return format(new Date(), "MMM dd, yyyy");
  };

  const getEndOfPeriodDate = () => {
    if (user?.subscription?.currentPeriodEnd) {
      return format(new Date(user.subscription.currentPeriodEnd), "MMM dd, yyyy");
    }
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return format(nextMonth, "MMM dd, yyyy");
  };

  async function handleSaveTrial() {
    if (!user || !user.subscription || !user.subscription.id) return;

    setError(null);
    setLoading(true);

    try {
      const dateTimeString = `${trialEndDate}T${trialEndTime}:00`;
      const trialEnd = new Date(dateTimeString);

      if (isNaN(trialEnd.getTime())) {
        setError("Invalid date/time format");
        setLoading(false);
        return;
      }

      const now = new Date();
      if (trialEnd <= now) {
        setError("Trial end date must be in the future");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/subscriptions/update-trial", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: user.subscription.id,
          trialEndDate: trialEnd.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update trial");
        setLoading(false);
        return;
      }

      if (data.warning) {
        console.warn("Warning:", data.warning);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trial");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!user || !user.subscription || !user.subscription.id) return;

    setError(null);
    setLoading(true);

    try {
      let cancelAt: string | null = null;
      if (cancelOption === "specific_date") {
        if (!specificCancelDate) {
          setError("Please select a specific date");
          setLoading(false);
          return;
        }
        cancelAt = new Date(specificCancelDate).toISOString();
      } else if (cancelOption === "end_of_period") {
        cancelAt = null;
      }

      const response = await fetch("/api/admin/subscriptions/cancel", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: user.subscription.id,
          cancelOption,
          cancelAt,
          refundOption,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to cancel subscription");
        setLoading(false);
        return;
      }

      if (data.warning) {
        console.warn("Warning:", data.warning);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePlanOverride() {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/v2/admin/users/${user.id}/plan-override`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedOverridePlanId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update plan override");
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan override");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const isTrialing = user.subscription?.status === "trialing";
  const isActive = user.subscription?.status === "active";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l"
      >
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-xl">Manage Subscription</SheetTitle>
          <SheetDescription>
            Manage subscription for {user.name || user.email}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <SimpleTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <SimpleTabsList className="border-b">
            {isTrialing && (
              <SimpleTabsTrigger value="trial">
                <Calendar className="h-4 w-4 mr-2" />
                Edit Trial
              </SimpleTabsTrigger>
            )}
            {(isTrialing || isActive) && (
              <SimpleTabsTrigger value="cancel">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </SimpleTabsTrigger>
            )}
            <SimpleTabsTrigger value="plan-override">
              <Shield className="h-4 w-4 mr-2" />
              Plan Override
            </SimpleTabsTrigger>
          </SimpleTabsList>

          {/* Trial Edit Tab */}
          <SimpleTabsContent value="trial" className="p-6">
            {isTrialing && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">User</Label>
                  <Input
                    id="user"
                    value={user.name || user.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Input
                    id="plan"
                    value={user.plan?.name || "-"}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trial-end-date">New Trial End Date</Label>
                    <Input
                      id="trial-end-date"
                      type="date"
                      value={trialEndDate}
                      onChange={(e) => setTrialEndDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trial-end-time">Time</Label>
                    <Input
                      id="trial-end-time"
                      type="time"
                      value={trialEndTime}
                      onChange={(e) => setTrialEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </SimpleTabsContent>

          {/* Cancel Subscription Tab */}
          <SimpleTabsContent value="cancel" className="p-6">
            {(isTrialing || isActive) && (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  To cancel a subscription with a refund, you need to create and issue a credit note, or{" "}
                  <span className="--sentiment-positive font-medium">update</span> the subscription end date and configure the pro rata behavior.
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Cancel</Label>
                    <RadioGroup value={cancelOption} onValueChange={(v) => setCancelOption(v as CancelOption)}>
                      <div className="flex items-start space-x-3 space-y-0">
                        <RadioGroupItem value="immediately" id="immediately" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="immediately" className="font-normal cursor-pointer">
                            Immediately
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {getImmediateCancelDate()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 space-y-0">
                        <RadioGroupItem value="end_of_period" id="end_of_period" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="end_of_period" className="font-normal cursor-pointer">
                            End of current period
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {getEndOfPeriodDate()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 space-y-0">
                        <RadioGroupItem value="specific_date" id="specific_date" className="mt-1" />
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="specific_date" className="font-normal cursor-pointer">
                            On a specific date
                          </Label>
                          {cancelOption === "specific_date" && (
                            <Input
                              type="date"
                              value={specificCancelDate}
                              onChange={(e) => setSpecificCancelDate(e.target.value)}
                              min={format(new Date(), "yyyy-MM-dd")}
                              className="mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <Label>Refund</Label>
                    <RadioGroup value={refundOption} onValueChange={(v) => setRefundOption(v as RefundOption)}>
                      <div className="flex items-start space-x-3 space-y-0">
                        <RadioGroupItem value="none" id="refund_none" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="refund_none" className="font-normal cursor-pointer">
                            No refund
                          </Label>
                          {isTrialing && (
                            <p className="text-sm text-muted-foreground">
                              The subscription is in a trial period.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 space-y-0">
                        <RadioGroupItem value="prorated" id="refund_prorated" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="refund_prorated" className="font-normal cursor-pointer">
                            Prorated refund
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 space-y-0">
                        <RadioGroupItem value="full" id="refund_full" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="refund_full" className="font-normal cursor-pointer">
                            Full refund
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}
          </SimpleTabsContent>

          {/* Plan Override Tab */}
          <SimpleTabsContent value="plan-override" className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Override the effective plan for this user (app-only). Does not change Stripe or billing. The user will get the selected plan&apos;s limits and features until you clear the override.
              </p>
              <div className="space-y-2">
                <Label>Current override</Label>
                {user.adminOverridePlanId && user.adminOverridePlanName ? (
                  <Badge variant="secondary">
                    {user.adminOverridePlanName}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="override-plan">Set plan override</Label>
                {plansLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading plans…
                  </div>
                ) : (
                  <Select
                    value={selectedOverridePlanId ?? "none"}
                    onValueChange={(v) => setSelectedOverridePlanId(v === "none" ? null : v)}
                  >
                    <SelectTrigger id="override-plan">
                      <SelectValue placeholder="Select plan or clear override" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Clear override</SelectItem>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </SimpleTabsContent>

          {error && (
            <Alert variant="destructive" className="mx-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
            </SimpleTabs>
          </ScrollArea>
          <div className="p-4 border-t flex flex-wrap justify-end gap-2 shrink-0 bg-background">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (activeTab === "trial") handleSaveTrial();
                else if (activeTab === "cancel") handleCancelSubscription();
                else if (activeTab === "plan-override") handleSavePlanOverride();
              }}
              disabled={loading}
              variant={activeTab === "cancel" ? "destructive" : "default"}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {activeTab === "trial" && "Save Changes"}
              {activeTab === "cancel" && "Cancel Subscription"}
              {activeTab === "plan-override" && "Save Plan Override"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

