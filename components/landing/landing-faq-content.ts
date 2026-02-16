/**
 * Single source of truth for landing page FAQ content.
 * Used by FAQSection (UI) and FAQPage JSON-LD (SEO).
 */

export const LANDING_FAQ_ITEMS = [
  {
    q: "What is Spair Money?",
    a: "Spair Money is a simple app that helps you manage all your money in one place. You can track spending, set budgets, save for goals, and see where your money goes.",
  },
  {
    q: "How does it work?",
    a: "You add accounts and transactions manually or import from CSV. The app sorts your spending into categories, helps you create budgets, and shows your financial health with the Spair Score.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. We use bank-level encryption and never sell your information. Your data is private and in your control.",
  },
  {
    q: "What's the free trial?",
    a: "You get a 30-day free trial with full access. You'll only be charged after the trial ends. Cancel anytime—your plan stays active until the end of your billing cycle (monthly or annual).",
  },
  {
    q: "What's included?",
    a: "Unlimited transactions and accounts, dashboard, Spair Score, budgets, goals, reports, receipts, and household sharing. Everything in one plan.",
  },
] as const;
