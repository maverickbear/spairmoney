"use client";

import { useTranslations } from "next-intl";
import { LandingImage } from "./landing-image";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const ITEM_KEYS = [
  { image: "categories.jpg", titleKey: "item1Title", descKey: "item1Description", altKey: "item1ImageAlt" },
  { image: "debt.jpg", titleKey: "item2Title", descKey: "item2Description", altKey: "item2ImageAlt" },
  { image: "subscriptions.jpg", titleKey: "item3Title", descKey: "item3Description", altKey: "item3ImageAlt" },
] as const;

export function FeaturesThreeColumn() {
  const t = useTranslations("landing");
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={cn(
        "py-16 md:py-24 transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      aria-label={t("aria.featuresSection")}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {ITEM_KEYS.map(({ image, titleKey, descKey, altKey }) => (
            <article
              key={titleKey}
              className="flex flex-col min-w-0 rounded-[32px] border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="relative aspect-[4/3] w-full bg-[#f8f4f1]">
                <LandingImage
                  src={image}
                  alt={t(`featuresThreeColumn.${altKey}`)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg md:text-xl font-bold text-foreground">
                  {t(`featuresThreeColumn.${titleKey}`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`featuresThreeColumn.${descKey}`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
