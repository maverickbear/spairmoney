"use client";

import { useTranslations } from "next-intl";
import { useInView } from "@/hooks/use-in-view";
import { Search, BarChart3, LayoutGrid, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const OUTCOME_KEYS = ["outcome0", "outcome1", "outcome2", "outcome3"] as const;
const OUTCOME_ICONS = [Search, BarChart3, LayoutGrid, Brain] as const;

export function WhatSpairDoesSection() {
  const t = useTranslations("landing.whatSpairDoes");
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={cn(
        "py-16 md:py-24 bg-muted/30 transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            {t("heading")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">{t("subtitle")}</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 gap-6 md:gap-8">
          {OUTCOME_KEYS.map((key, i) => {
            const Icon = OUTCOME_ICONS[i];
            return (
              <div
                key={key}
                className="rounded-[32px] border border-border bg-card p-6 shadow-sm"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 --sentiment-positive">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">
                  {t(`${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`${key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
