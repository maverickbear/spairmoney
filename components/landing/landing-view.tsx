"use client";

import { LandingHeader } from "./landing-header";
import { HeroSection } from "./hero-section";
import { ProblemSection } from "./problem-section";
import { RealitySection } from "./reality-section";
import { DebtAwarenessSection } from "./debt-awareness-section";
import { ProductOverviewSection } from "./product-overview-section";
import { FeaturesShowcase } from "./features-showcase";
import { MobileMockupSection } from "./mobile-mockup-section";
import { TrustSection } from "./trust-section";
import { PricingSection } from "./pricing-section";
import { FAQSection } from "./faq-section";
import { LandingFooter } from "./landing-footer";

export function LandingView() {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to main content
      </a>
      <LandingHeader />
      <main id="main-content" aria-label="Spair Money – Personal finance at peace: features, pricing, and FAQ">
        <HeroSection />
        <ProblemSection />
        <ProductOverviewSection />
        <RealitySection />
        <DebtAwarenessSection />
        <FeaturesShowcase />
        <MobileMockupSection />
        <TrustSection />
        <PricingSection />
        <FAQSection />
        <LandingFooter />
      </main>
    </div>
  );
}
