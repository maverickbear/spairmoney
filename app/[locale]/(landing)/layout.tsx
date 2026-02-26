"use client";

import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";

/**
 * Shared layout for all landing pages (home, about, careers, contact, FAQ, terms, privacy, blog).
 * Ensures the same header and footer across the entire marketing/landing experience.
 */
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <div className="flex-1 pt-[var(--landing-header-offset)]">{children}</div>
      <LandingFooter />
    </div>
  );
}
