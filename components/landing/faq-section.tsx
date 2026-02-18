"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { LANDING_FAQ_ITEMS } from "./landing-faq-content";

export function FAQSection() {
  const { ref, inView } = useInView();

  return (
    <section id="faq" ref={ref} className={cn("py-16 md:py-24 scroll-mt-20 transition-all duration-700", inView ? "opacity-100" : "opacity-0")}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">FAQ</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Focused on what matters most.
          </p>
        </div>
        <Accordion type="single" defaultValue="faq-0" collapsible className="mt-8 space-y-2">
          {LANDING_FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left data-[state=open]:text-primary">
                {item.q}
              </AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-6 text-sm text-muted-foreground">
          More questions?{" "}
          <Link href="/faq" className="text-content-link hover:underline">
            See full FAQ
          </Link>
        </p>
      </div>
    </section>
  );
}
