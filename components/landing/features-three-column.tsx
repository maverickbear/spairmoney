"use client";

import { LandingImage } from "./landing-image";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    image: "categories.jpg",
    imageAlt: "Smart transaction categories and spending trends",
    title: "Spair categorizes your spending.",
    description:
      "Automatic categories and weekly or monthly trends show where your money really goes.",
  },
  {
    image: "debt.jpg",
    imageAlt: "Debt tracking with balances and payoff visibility",
    title: "See debt payoff clearly.",
    description:
      "Track balances, due dates, and progress toward payoff—all in one view.",
  },
  {
    image: "subscriptions.jpg",
    imageAlt: "Recurring subscriptions and micro-spending",
    title: "See the small stuff clearly.",
    description:
      "Recurring spending and subscriptions highlighted so you can spot leaks instantly.",
  },
];

export function FeaturesThreeColumn() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={cn(
        "py-16 md:py-24 transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {ITEMS.map(({ image, imageAlt, title, description }) => (
            <article
              key={title}
              className="flex flex-col min-w-0 rounded-[32px] border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="relative aspect-[4/3] w-full bg-[#f8f4f1]">
                <LandingImage
                  src={image}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg md:text-xl font-bold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
