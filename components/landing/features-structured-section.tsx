"use client";

import { useInView } from "@/hooks/use-in-view";
import { Search, Sliders, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    icon: Search,
    title: "Clarity Tools",
    items: [
      "Smart transaction categorization",
      "Recurring subscription tracking",
      "Advanced reports",
      "Spending trends",
    ],
  },
  {
    icon: Sliders,
    title: "Control Tools",
    items: [
      "Budgets that match your real habits",
      "Goal tracking with progress visualization",
      "Planned payments (see the next 90 days clearly)",
      "Debt tracking with payoff visibility",
    ],
  },
  {
    icon: TrendingUp,
    title: "Growth Tools",
    items: [
      "Spair Score (financial health index)",
      "Household sharing",
      "Receipt scanning",
      "CSV import/export",
      "Tax bracket & rate helper",
    ],
  },
];

export function FeaturesStructuredSection() {
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
            Features
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Structured clearly — clarity, control, and growth.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {GROUPS.map(({ icon: Icon, title, items }) => (
            <div
              key={title}
              className="rounded-[32px] border border-border bg-card p-6 shadow-sm"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 --sentiment-positive">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                  >
                    <span className="--sentiment-positive mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
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
