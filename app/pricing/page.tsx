"use client";

import { useEffect, Suspense } from "react";
import { StripePricingTable } from "@/components/billing/stripe-pricing-table";
import { useRouter, useSearchParams } from "next/navigation";

// Component that uses useSearchParams - must be wrapped in Suspense
function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for success/cancel from Stripe
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success) {
      // Redirect to billing page after successful payment
      router.push("/billing?success=true");
      return;
    } else if (canceled) {
      // Show cancel message
      console.log("Checkout was canceled");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Pricing</h1>
          <p className="text-muted-foreground mt-2">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <StripePricingTable />
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that provides Suspense boundary for useSearchParams
export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Pricing</h1>
            <p className="text-muted-foreground">Choose the plan that's right for you</p>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}

