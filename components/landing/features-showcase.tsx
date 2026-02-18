"use client";

import { FeatureSpotlightSection } from "./feature-spotlight-section";

const FEATURES = [
  {
    image: "dashboard.jpg",
    imageAlt: "Spair Score and dashboard: your money in one place with a clear health score",
    title: "Your money in one place, with a clear health score.",
    tagline: "Stay on top of your finances with Spair Money",
    description:
      "The dashboard shows all your accounts, recent activity, and your Spair Score in one view. See where you stand and what to do next—no more jumping between apps or spreadsheets.",
    reverse: false,
    fullView: true,
  },
  {
    image: "budgets.jpg",
    imageAlt: "Budgets and savings goals with progress tracking",
    title: "Set limits and targets. See progress and stay on track.",
    tagline: "Budgets and goals that match your real habits",
    description:
      "Create monthly budgets by category and set savings goals with a clear timeline. Track spending against your budget and watch your goals move forward. You stay in control, month after month.",
    reverse: true,
  },
  {
    image: "planning.jpg",
    imageAlt: "Reports, spending trends and planned payments for the next 90 days",
    title: "Understand patterns. Plan payments and cash flow.",
    tagline: "Reports and planning in one place",
    description:
      "See where your money goes with clear reports and trends. Planned payments show what's due in the next 90 days—recurring, debts, goals, and subscriptions—so you can plan with confidence.",
    reverse: false,
  },
  {
    image: "family.jpg",
    imageAlt: "Household sharing: manage money together with your partner or family",
    title: "Manage money together.",
    tagline: "Household sharing with Spair Money",
    description:
      "Invite your partner or family to the same household. Share accounts, budgets, and goals so everyone is aligned. Build wealth together, not just pay bills alone.",
    reverse: true,
  },
  {
    image: "receipts.jpg",
    imageAlt: "Receipt scanning attached to transactions",
    title: "Capture receipts. Stay organized.",
    tagline: "Receipt scanning with Spair Money",
    description:
      "Scan receipts and attach them to transactions. Everything stays in one place for taxes, returns, or simply knowing where your money went. No more lost slips or scattered photos.",
    reverse: false,
  },
];

export function FeaturesShowcase() {
  return (
    <section id="features" className="scroll-mt-20" aria-label="Features explained with visuals">
      {FEATURES.map((feature, i) => (
        <FeatureSpotlightSection key={i} {...feature} ctaText="Start 30-day free trial" ctaHref="/auth/signup" />
      ))}
    </section>
  );
}
