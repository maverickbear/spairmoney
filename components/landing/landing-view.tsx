"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { HeroSection } from "./hero-section";

/** Below-the-fold sections loaded in separate chunks for faster initial load and TTI. SSR kept so content is in first HTML. */
const ProblemSection = dynamic(() => import("./problem-section").then((m) => ({ default: m.ProblemSection })), { ssr: true });
const WhatSpairDoesSection = dynamic(() => import("./what-spair-does-section").then((m) => ({ default: m.WhatSpairDoesSection })), { ssr: true });
const FeaturesShowcase = dynamic(() => import("./features-showcase").then((m) => ({ default: m.FeaturesShowcase })), { ssr: true });
const MobileMockupSection = dynamic(() => import("./mobile-mockup-section").then((m) => ({ default: m.MobileMockupSection })), { ssr: true });
const FeaturesThreeColumn = dynamic(() => import("./features-three-column").then((m) => ({ default: m.FeaturesThreeColumn })), { ssr: true });
const FeaturesStructuredSection = dynamic(() => import("./features-structured-section").then((m) => ({ default: m.FeaturesStructuredSection })), { ssr: true });
const TrustSection = dynamic(() => import("./trust-section").then((m) => ({ default: m.TrustSection })), { ssr: true });
const FAQSection = dynamic(() => import("./faq-section").then((m) => ({ default: m.FAQSection })), { ssr: true });
const PricingSection = dynamic(() => import("./pricing-section").then((m) => ({ default: m.PricingSection })), { ssr: true });

/**
 * Main content of the landing home page. Header and footer are provided by (landing) layout.
 * Section order: hero, problem, what we do, features, mobile, trust, FAQ, pricing.
 * Below-fold sections are code-split so the initial JS bundle is smaller and the page becomes interactive faster.
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
        <FAQSection />
        <PricingSection />
      </main>
    </>
  );
}
