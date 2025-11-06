"use client";

import { useEffect, useState } from "react";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { UsageLimits } from "@/components/billing/usage-limits";
import { Plan, Subscription } from "@/lib/validations/plan";
import { PlanFeatures, LimitCheckResult } from "@/lib/api/limits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [limits, setLimits] = useState<PlanFeatures | null>(null);
  const [transactionLimit, setTransactionLimit] = useState<LimitCheckResult | null>(null);
  const [accountLimit, setAccountLimit] = useState<LimitCheckResult | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      setLoading(true);

      // Get current user subscription
      const subResponse = await fetch("/api/billing/subscription");
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
        setPlan(subData.plan);
        setLimits(subData.limits);
      }

      // Get usage limits
      const limitsResponse = await fetch("/api/billing/limits");
      if (limitsResponse.ok) {
        const limitsData = await limitsResponse.json();
        setTransactionLimit(limitsData.transactionLimit);
        setAccountLimit(limitsData.accountLimit);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Billing</h1>
            <p className="text-muted-foreground">Manage your subscription and usage</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and usage</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubscriptionCard subscription={subscription} plan={plan} />
          {limits && transactionLimit && accountLimit && (
            <UsageLimits
              limits={limits}
              transactionLimit={transactionLimit}
              accountLimit={accountLimit}
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade Plan</CardTitle>
            <CardDescription>Choose a plan that fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pricing">
              <Button>View Plans</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

