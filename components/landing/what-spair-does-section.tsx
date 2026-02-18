"use client";

import { useInView } from "@/hooks/use-in-view";
import { Search, BarChart3, LayoutGrid, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const OUTCOMES = [
  {
    icon: Search,
    title: "See the small stuff clearly",
    description:
      "Spair automatically categorizes your transactions and highlights recurring micro-spending — so you can spot leaks instantly.",
  },
  {
    icon: BarChart3,
    title: "Understand your behavior",
    description:
      "Weekly and monthly trends show where your habits are helping you — and where they're costing you.",
  },
  {
    icon: LayoutGrid,
    title: "Track everything in one place",
    description:
      "Accounts. Transactions. Categories. Subscriptions. Debts. Goals. No switching apps. No spreadsheets.",
  },
  {
    icon: Brain,
    title: "Get a financial clarity score",
    description:
      "Spair Score helps you understand your overall financial health in one simple number.",
  },
];

export function WhatSpairDoesSection() {
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
            Spair turns transactions into clarity.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Instead of listing features, we present outcomes.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 gap-6 md:gap-8">
          {OUTCOMES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-[32px] border border-border bg-card p-6 shadow-sm"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 --sentiment-positive">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
