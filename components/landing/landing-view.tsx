"use client";

import { LandingHeader } from "./landing-header";
import { HeroSection } from "./hero-section";
import { ProblemSection } from "./problem-section";
import { WhatSpairDoesSection } from "./what-spair-does-section";
import { FeaturesThreeColumn } from "./features-three-column";
import { FeaturesShowcase } from "./features-showcase";
import { FeaturesStructuredSection } from "./features-structured-section";
import { MobileMockupSection } from "./mobile-mockup-section";
import { TrustSection } from "./trust-section";
import { PricingSection } from "./pricing-section";
import { FAQSection } from "./faq-section";
import { CTASection } from "./cta-section";
import { LandingFooter } from "./landing-footer";

export function LandingView() {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to main content
      </a>
      <LandingHeader />
      <main id="main-content" aria-label="Spair Money – Clarity over chaos: see where your money goes">
        <HeroSection />
        <ProblemSection />
        <WhatSpairDoesSection />
        <FeaturesShowcase />
        <MobileMockupSection />
        <FeaturesThreeColumn />
        <FeaturesStructuredSection />
        <TrustSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
        <LandingFooter />
      </main>
    </div>
  );
}
