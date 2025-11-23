"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DynamicPricingTable } from "@/components/billing/dynamic-pricing-table";
import { EmbeddedCheckout } from "@/components/billing/embedded-checkout";
import { Plan } from "@/lib/validations/plan";
import { useToast } from "@/components/toast-provider";

export function PricingSection() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<{ plan: Plan | null; interval: "month" | "year" } | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | undefined>(undefined);
  const [currentInterval, setCurrentInterval] = useState<"month" | "year" | null>(null);

  useEffect(() => {
    // Check authentication and load current plan info
    async function checkAuth() {
      try {
        // Try to access subscription endpoint (requires auth)
        const response = await fetch("/api/billing/subscription");
        setIsAuthenticated(response.ok);
        
        // Also fetch plans to get currentPlanId and currentInterval
        const plansResponse = await fetch("/api/billing/plans");
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setCurrentPlanId(plansData.currentPlanId);
          setCurrentInterval(plansData.currentInterval);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  async function handleSelectPlan(planId: string, interval: "month" | "year") {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to signup with plan selected
      router.push(`/auth/signup?planId=${planId}&interval=${interval}`);
      return;
    }

    // Load plan details
    try {
      const response = await fetch("/api/billing/plans");
      if (response.ok) {
        const data = await response.json();
        const plan = (data.plans || []).find((p: Plan) => p.id === planId);
        if (plan) {
          setSelectedPlan({ plan, interval });
          setShowCheckout(true);
        }
      }
    } catch (error) {
      console.error("Error loading plan:", error);
      toast({
        title: "Error",
        description: "Failed to load plan details. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <section id="pricing" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
            Pricing
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Start Organizing Your Finances<br />Try It Free Today
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track expenses, understand spending, and learn to save together as a family. Choose the plan that fits your needs. Start your 30-day free trial today.
          </p>
        </div>

        {/* Dynamic Pricing Table */}
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="w-full max-w-4xl">
            <DynamicPricingTable
              currentPlanId={currentPlanId}
              currentInterval={currentInterval}
              onSelectPlan={handleSelectPlan}
              showTrial={true}
            />
          </div>
        </div>
      </div>

      {selectedPlan?.plan && (
        <EmbeddedCheckout
          open={showCheckout}
          onOpenChange={(open) => {
            setShowCheckout(open);
            if (!open) {
              setSelectedPlan(null);
            }
          }}
          plan={selectedPlan.plan}
          interval={selectedPlan.interval}
          onSuccess={() => {
            setShowCheckout(false);
            setSelectedPlan(null);
            router.push("/settings?tab=billing&checkout=success");
          }}
        />
      )}
    </section>
  );
}

