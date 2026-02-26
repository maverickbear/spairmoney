"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { trackLandingClick } from "@/lib/analytics/landing-events";

export function CTASection() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={cn(
        "py-16 md:py-24 bg-background-dark text-white transition-all duration-700",
        inView ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold">
          Stop guessing where your money goes.
        </h2>
        <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
          Start seeing it clearly.
        </p>
        <Button
          asChild
          size="large"
          className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-transform"
        >
          <Link
            href="/auth/signup"
            onClick={() => trackLandingClick({ section: "cta", link_id: "cta_reveal_spending", destination: "/auth/signup" })}
          >
            Reveal My Spending Today
          </Link>
        </Button>
      </div>
    </section>
  );
}
