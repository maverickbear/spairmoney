"use client";

import Script from "next/script";
import React from "react";

// Declare the Stripe pricing table custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-pricing-table": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "pricing-table-id": string;
          "publishable-key": string;
        },
        HTMLElement
      >;
    }
  }
}

export function StripePricingTable() {
  return (
    <>
      <Script
        async
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      {/* @ts-ignore - Stripe custom element */}
      <stripe-pricing-table
        pricing-table-id="prctbl_1SSuVUEj1ttZtjC0ZdPrMniP"
        publishable-key="pk_live_51SQHmOEj1ttZtjC0C7A9ReTcCvQLyaMJoXEkM844AfX8GUih7QczN0q9YiXLduNX6fksfsttaYqv5bgklGjKCPKd008Th0Tzgx"
      />
    </>
  );
}

