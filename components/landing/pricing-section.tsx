"use client";

import { StripePricingTable } from "@/components/billing/stripe-pricing-table";

export function PricingSection() {

  return (
    <section id="pricing" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free forever. Upgrade when you're ready for advanced features like bank integration, unlimited transactions, and family sharing.
          </p>
        </div>

        {/* Stripe Pricing Table */}
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="w-full max-w-4xl">
            <StripePricingTable />
          </div>
        </div>
      </div>
    </section>
  );
}

