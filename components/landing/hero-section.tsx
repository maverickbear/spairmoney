"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingImage } from "./landing-image";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const { ref: headlineRef, inView: headlineInView } = useInView();
  const { ref: imageRef, inView: imageInView } = useInView();

  return (
    <section className="relative min-h-[70vh] flex flex-col justify-center pt-12 pb-20 md:pb-32 lg:pt-40 overflow-hidden bg-[#f8f4f1]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div ref={headlineRef} className={cn("order-2 lg:order-1 text-center lg:text-left transition-all duration-700 ease-out", headlineInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Your money isn’t disappearing — it’s just hiding.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mx-auto lg:mx-0">
              Small daily purchases add up fast. Coffee. Lunch. Subscriptions. Delivery.
              Spair shows you exactly where your money goes — so you can take control.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="large"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-transform"
              >
                <Link href="/auth/signup">Reveal My Spending</Link>
              </Button>
              <Button asChild variant="outline" size="large">
                <Link href="#features">See How It Works</Link>
              </Button>
            </div>
          </div>

          <div ref={imageRef} className={cn("relative order-1 lg:order-2 aspect-[4/3] max-w-xl mx-auto w-full bg-[#f8f4f1] transition-all duration-700 delay-150 ease-out", imageInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <LandingImage
              src="hero.jpg"
              alt="Spair Money dashboard: your money in one place with Spair Score and spending overview"
              fill
              priority
              className="rounded-[32px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
