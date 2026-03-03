"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const TESTIMONIAL_KEYS = [0, 1, 2, 3, 4] as const;
const AUTO_ADVANCE_MS = 5000;

export function TrustSection() {
  const t = useTranslations("landing.trust");
  const tAria = useTranslations("landing.aria");
  const { ref, inView } = useInView();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = useMemo(
    () =>
      TESTIMONIAL_KEYS.map((i) => ({
        stars: 5,
        quote: t(`testimonial${i}Quote`),
        name: t(`testimonial${i}Name`),
      })),
    [t]
  );

  const goTo = useCallback((i: number) => {
    setIndex((prev) => {
      const next = i < 0 ? testimonials.length - 1 : i >= testimonials.length ? 0 : i;
      return next;
    });
  }, [testimonials.length]);

  useEffect(() => {
    if (!inView || isPaused) return;
    const id = setInterval(() => goTo(index + 1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [inView, isPaused, index, goTo]);

  const current = testimonials[index];

  return (
    <section ref={ref} className={cn("py-16 md:py-24 bg-muted/40 text-foreground transition-all duration-700", inView ? "opacity-100" : "opacity-0")}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">{t("headline")}</h2>
          <p className="text-muted-foreground text-center mb-6">{t("subline")}</p>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              aria-label={tAria("prevTestimonial")}
              className="absolute left-0 z-10 -translate-x-1 sm:-translate-x-2 md:-translate-x-4 h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-border bg-background shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors touch-manipulation"
              onClick={() => goTo(index - 1)}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <Card className="flex-1 border border-border bg-card shadow-sm overflow-hidden">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="flex justify-center gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn("h-5 w-5", star <= current.stars ? "fill-foreground text-foreground" : "text-muted-foreground/40")}
                    />
                  ))}
                </div>
                <p className="text-foreground text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                  &ldquo;{current.quote}&rdquo;
                </p>
                <p className="mt-4 font-semibold text-foreground">{current.name}</p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-1.5 mt-6">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={tAria("goToTestimonial", { index: i + 1 })}
                      className="group min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 sm:m-0 sm:min-w-0 sm:min-h-0 touch-manipulation"
                      onClick={() => setIndex(i)}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors block",
                          i === index ? "bg-primary w-6" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <button
              type="button"
              aria-label={tAria("nextTestimonial")}
              className="absolute right-0 z-10 translate-x-1 sm:translate-x-2 md:translate-x-4 h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-border bg-background shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors touch-manipulation"
              onClick={() => goTo(index + 1)}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
