"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const DAILY_ITEMS = [
  { label: "Coffee & pastry", amount: 6 },
  { label: "Lunch out", amount: 14 },
  { label: "Snacks & drinks", amount: 6 },
  { label: "Takeout / delivery", amount: 20 },
];

const UNUSED_SUBSCRIPTIONS_MONTHLY = 50;

const DAY_TOTAL = DAILY_ITEMS.reduce((sum, { amount }) => sum + amount, 0);
const MONTH_ESTIMATE = DAY_TOTAL * 30 + UNUSED_SUBSCRIPTIONS_MONTHLY;

export function ProblemSection() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={cn(
        "pt-16 md:pt-24 pb-3 transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center">
          It&apos;s not the big expenses.
        </h2>
        <p className="mt-6 text-muted-foreground text-lg leading-relaxed text-center max-w-2xl mx-auto">
          Most people don&apos;t struggle because of rent or car payments. They struggle because of small,
          everyday spending that never feels important — until the end of the month.
        </p>

        <div className="mt-10 mx-auto max-w-sm rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-lg shadow-black/5 dark:shadow-black/20">
          <p className="text-sm font-medium text-muted-foreground text-center mb-5">
            Here&apos;s how &ldquo;just a few small things&rdquo; add up.
          </p>
          <ul className="space-y-2.5">
            {DAILY_ITEMS.map(({ label, amount }) => (
              <li
                key={label}
                className="flex items-center justify-between text-sm text-foreground"
              >
                <span>{label}</span>
                <span className="font-medium tabular-nums">${amount}</span>
              </li>
            ))}
            <li className="flex items-center justify-between text-sm text-foreground pt-1">
              <span>Unused subscriptions</span>
              <span className="font-medium tabular-nums text-muted-foreground">${UNUSED_SUBSCRIPTIONS_MONTHLY}/mo</span>
            </li>
          </ul>
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-center">
              <span className="font-semibold text-foreground">${DAY_TOTAL}/day</span>
              <span className="text-muted-foreground mx-1.5">→</span>
              <span className="font-bold text-destructive tabular-nums">${MONTH_ESTIMATE.toLocaleString()}/mo</span>
            </p>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Most people never track it. Spair shows patterns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
