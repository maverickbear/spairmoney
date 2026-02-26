"use client";

import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode, useEffect, useState } from "react";

interface StripeProviderProps {
  children: ReactNode;
  options?: StripeElementsOptions;
}

/** Load Stripe only on the client to avoid Date.now() during prerender (Next.js next-prerender-current-time-client). */
function useStripePromise() {
  const [promise, setPromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) setPromise(loadStripe(key));
  }, []);
  return promise;
}

export function StripeProvider({ children, options }: StripeProviderProps) {
  const stripePromise = useStripePromise();

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
    return <>{children}</>;
  }

  if (!stripePromise) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

