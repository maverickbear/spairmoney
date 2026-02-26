"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const t = useTranslations("landing.faqSection");
  const { ref, inView } = useInView();
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <section id="faq" ref={ref} className={cn("py-16 md:py-24 scroll-mt-20 transition-all duration-700", inView ? "opacity-100" : "opacity-0")}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t("title")}</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t("subtitle")}
          </p>
        </div>
        <Accordion type="single" defaultValue="faq-0" collapsible className="mt-8 space-y-2">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left data-[state=open]:--sentiment-positive">
                {item.q}
              </AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("moreQuestions")}{" "}
          <Link href="/faq" className="text-content-link hover:underline">
            {t("seeFullFaq")}
          </Link>
        </p>
      </div>
    </section>
  );
}
