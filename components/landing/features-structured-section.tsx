"use client";

import { useInView } from "@/hooks/use-in-view";
import { useTranslations } from "next-intl";
import { Search, Sliders, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUP_KEYS = [
  {
    icon: Search,
    titleKey: "clarityTools" as const,
    itemKeys: ["smartCategorization", "recurringTracking", "advancedReports", "spendingTrends"] as const,
  },
  {
    icon: Sliders,
    titleKey: "controlTools" as const,
    itemKeys: ["budgetsHabits", "goalTracking", "plannedPayments", "debtTracking"] as const,
  },
  {
    icon: TrendingUp,
    titleKey: "growthTools" as const,
    itemKeys: ["spairScore", "householdSharing", "receiptScanning", "csvImport", "taxHelper"] as const,
  },
];

export function FeaturesStructuredSection() {
  const t = useTranslations("landing.featuresSection");
  const { ref, inView } = useInView();

  return (
    <section
      id="feature-tools"
      ref={ref}
      className={cn(
        "py-16 md:py-24 bg-muted/30 scroll-mt-20 transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {GROUP_KEYS.map(({ icon: Icon, titleKey, itemKeys }) => (
            <div
              key={titleKey}
              className="rounded-[32px] border border-border bg-card p-6 shadow-sm"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 --sentiment-positive">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{t(titleKey)}</h3>
              <ul className="mt-4 space-y-2">
                {itemKeys.map((key) => (
                  <li
                    key={key}
                    className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                  >
                    <span className="--sentiment-positive mt-0.5 shrink-0">•</span>
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
