"use client";

import { useTranslations } from "next-intl";
import { FeatureSpotlightSection } from "./feature-spotlight-section";

const FEATURE_KEYS = ["feature0", "feature1", "feature2", "feature3", "feature4"] as const;

const FEATURE_CONFIG: Record<
  (typeof FEATURE_KEYS)[number],
  { image: string; reverse: boolean; fullView?: boolean }
> = {
  feature0: { image: "dashboard.jpg", reverse: false, fullView: true },
  feature1: { image: "budgets.jpg", reverse: true },
  feature2: { image: "planning.jpg", reverse: false },
  feature3: { image: "family.jpg", reverse: true },
  feature4: { image: "receipts.jpg", reverse: false },
};

export function FeaturesShowcase() {
  const tAria = useTranslations("landing.aria");
  const tShowcase = useTranslations("landing.featuresShowcase");
  const tLanding = useTranslations("landing");

  return (
    <section id="features" className="scroll-mt-20" aria-label={tAria("featuresSection")}>
      {FEATURE_KEYS.map((key, i) => {
        const config = FEATURE_CONFIG[key];
        return (
          <FeatureSpotlightSection
            key={key}
            image={config.image}
            imageAlt={tShowcase(`${key}.imageAlt`)}
            title={tShowcase(`${key}.title`)}
            tagline={tShowcase(`${key}.tagline`)}
            description={tShowcase(`${key}.description`)}
            ctaText={tLanding("startTrial")}
            ctaHref="/auth/signup"
            reverse={config.reverse}
            fullView={config.fullView}
          />
        );
      })}
    </section>
  );
}
