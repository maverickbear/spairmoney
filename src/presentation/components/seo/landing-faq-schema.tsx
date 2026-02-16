/**
 * FAQPage JSON-LD for the landing page.
 * Helps search engines show FAQ rich results.
 */

import { LANDING_FAQ_ITEMS } from "@/components/landing/landing-faq-content";

export function LandingFAQSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
