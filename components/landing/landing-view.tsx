"use client";

import { useTranslations } from "next-intl";
import { HeroSection } from "./hero-section";
import { ProblemSection } from "./problem-section";
import { WhatSpairDoesSection } from "./what-spair-does-section";
import { FeaturesThreeColumn } from "./features-three-column";
import { FeaturesShowcase } from "./features-showcase";
import { FeaturesStructuredSection } from "./features-structured-section";
import { MobileMockupSection } from "./mobile-mockup-section";
import { TrustSection } from "./trust-section";
import { PricingSection } from "./pricing-section";

/**
 * Main content of the landing home page. Header and footer are provided by (landing) layout.
 */
export function LandingView() {
  const t = useTranslations("landing.aria");
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to main content
      </a>
      <main id="main-content" className="flex-1" aria-label={t("mainContent")}>
        <HeroSection />
        <ProblemSection />
        <WhatSpairDoesSection />
        <FeaturesShowcase />
        <MobileMockupSection />
        <FeaturesThreeColumn />
        <FeaturesStructuredSection />
        <TrustSection />
        <PricingSection />
      </main>
    </>
  );
}
