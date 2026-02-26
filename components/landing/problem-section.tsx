"use client";

import { useTranslations } from "next-intl";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const DAILY_AMOUNTS = [6, 14, 6, 20];
const ITEM_KEYS = ["item0", "item1", "item2", "item3"] as const;
const UNUSED_SUBSCRIPTIONS_MONTHLY = 50;

const DAY_TOTAL = DAILY_AMOUNTS.reduce((sum, a) => sum + a, 0);
const MONTH_ESTIMATE = DAY_TOTAL * 30 + UNUSED_SUBSCRIPTIONS_MONTHLY;

export function ProblemSection() {
  const t = useTranslations("landing.problemSection");
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={cn(
        "pt-16 md:pt-24 pb-3 transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center">
          {t("heading")}
        </h2>
        <p className="mt-6 text-muted-foreground text-lg leading-relaxed text-center max-w-2xl mx-auto">
          {t("subtitle")}
        </p>

        <div className="mt-10 mx-auto max-w-sm rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-lg shadow-black/5 dark:shadow-black/20">
          <p className="text-sm font-medium text-muted-foreground text-center mb-5">
            {t("cardTitle")}
          </p>
          <ul className="space-y-2.5">
            {ITEM_KEYS.map((key, i) => (
              <li
                key={key}
                className="flex items-center justify-between text-sm text-foreground"
              >
                <span>{t(key)}</span>
                <span className="font-medium tabular-nums">${DAILY_AMOUNTS[i]}</span>
              </li>
            ))}
            <li className="flex items-center justify-between text-sm text-foreground pt-1">
              <span>{t("unusedSubscriptions")}</span>
              <span className="font-medium tabular-nums text-muted-foreground">
                ${UNUSED_SUBSCRIPTIONS_MONTHLY}{t("perMonth")}
              </span>
            </li>
          </ul>
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-center">
              <span className="font-semibold text-foreground">
                ${DAY_TOTAL}{t("perDay")}
              </span>
              <span className="text-muted-foreground mx-1.5">→</span>
              <span className="font-bold text-destructive tabular-nums">
                ${MONTH_ESTIMATE.toLocaleString()}{t("perMonth")}
              </span>
            </p>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {t("footer")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
