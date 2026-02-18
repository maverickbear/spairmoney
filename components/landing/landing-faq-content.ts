/**
 * Single source of truth for landing page FAQ content.
 * Used by FAQSection (UI) and FAQPage JSON-LD (SEO).
 * Focused on objections and common questions.
 */

export const LANDING_FAQ_ITEMS = [
  {
    q: "Is my data secure?",
    a: "Yes. We use bank-level encryption and never sell your information. Your data is private and in your control.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime—your plan stays active until the end of your billing cycle (monthly or annual). No questions asked.",
  },
  {
    q: "Do I need to connect my bank?",
    a: "No. You can add accounts and transactions manually or import from CSV. Connect only what you're comfortable with.",
  },
  {
    q: "Can I use it with my partner?",
    a: "Yes. Household sharing lets you invite your partner or family to the same household so you can manage money together.",
  },
  {
    q: "Does it track subscriptions automatically?",
    a: "Yes. Spair highlights recurring spending and subscriptions so you can see what you're paying regularly.",
  },
  {
    q: "Does it work on mobile?",
    a: "Spair is a responsive web app—you can use it on your phone's browser. A dedicated mobile app may come later.",
  },
] as const;
