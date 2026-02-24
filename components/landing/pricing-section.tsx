"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { setLandingPlan } from "@/lib/constants/landing-plan";
import { Badge } from "@/components/ui/badge";
import { useInView } from "@/hooks/use-in-view";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/utils/api-base-url";

const INCLUDED_KEYS = [
  "unlimitedAccounts",
  "unlimitedTransactions",
  "smartCategories",
  "recurringTracking",
  "budgetsGoals",
  "debtTracking",
  "reportsTrends",
  "spairScore",
  "householdSharing",
  "receiptScanning",
  "csvImport",
] as const;

const FALLBACK_PRICE_MONTHLY = 14.99;
const FALLBACK_PRICE_YEARLY = 149.9;

type PlanInterval = "month" | "year";

interface ProPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
}

const PRO_PLAN_ID = "pro";

export function PricingSection() {
  const t = useTranslations("landing.pricingSection");
  const router = useRouter();
  const { ref, inView } = useInView();
  const [interval, setInterval] = useState<PlanInterval>("month");
  const [plan, setPlan] = useState<ProPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/billing/plans/public"))
      .then((res) => res.json())
      .then((data) => {
        const pro = (data.plans || []).find((p: ProPlan) => p.name === "pro");
        if (pro) setPlan(pro);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const priceMonthly = plan?.priceMonthly ?? FALLBACK_PRICE_MONTHLY;
  const priceYearly = plan?.priceYearly ?? FALLBACK_PRICE_YEARLY;
  const price = interval === "month" ? priceMonthly : priceYearly;
  const monthlyEquivalent = interval === "year" ? priceYearly / 12 : priceMonthly;
  const yearlySavingsPct =
    priceYearly > 0 ? Math.round((1 - priceYearly / 12 / priceMonthly) * 100) : 0;

  return (
    <section id="pricing" ref={ref} className="bg-[#f8f4f1] py-16 md:py-24 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className={cn("grid lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t("title")}</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              {t("description")}
            </p>
            <ul className="mt-6 space-y-3">
              {INCLUDED_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-3">
                  <Check className="h-5 w-5 shrink-0 --sentiment-positive" />
                  <span className="text-muted-foreground">{t(`included.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[32px] border border-border bg-card p-8 text-left">
            <p className="text-3xl font-bold text-foreground">{t("planName")}</p>

            {/* Interval toggle + price */}
            <div className="mt-6">
              <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1.5">
                <Button
                  type="button"
                  variant={interval === "month" ? "default" : "ghost"}
                  size="medium"
                  onClick={() => setInterval("month")}
                  className={interval === "month" ? "shadow-sm" : ""}
                >
                  {t("monthly")}
                </Button>
                <Button
                  type="button"
                  variant={interval === "year" ? "default" : "ghost"}
                  size="medium"
                  onClick={() => setInterval("year")}
                  className={cn("flex items-center gap-2", interval === "year" && "shadow-sm")}
                >
                  {t("yearly")}
                  {yearlySavingsPct > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
                      {t("savePct", { pct: yearlySavingsPct })}
                    </Badge>
                  )}
                </Button>
              </div>
              <div className="mt-4">
                {loading ? (
                  <div className="h-12 w-24 rounded bg-muted animate-pulse" />
                ) : (
                  <>
                    {interval === "year" ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-foreground">
                            ${monthlyEquivalent.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">{t("perMonth")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("billedAnnually", { amount: `$${priceYearly.toFixed(2)}` })}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          ${priceMonthly.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">{t("perMonth")}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <Button
              size="large"
              className="mt-8 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setLandingPlan(PRO_PLAN_ID, interval);
                router.push(`/auth/signup?planId=${PRO_PLAN_ID}&interval=${interval}`);
              }}
            >
              {t("startTrial")}
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("footnote")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
