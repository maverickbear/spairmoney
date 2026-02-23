# Landing Page vs App Features (Docs)

Single reference: what the landing page already shows vs what is documented as app features and not (or barely) surfaced on the landing.

**Source:** `docs/APP_OVERVIEW.md` (Documentation Index) and `components/landing/` (LandingView and its sections).

---

## 1. What the landing page already shows

### Sections (order on page)

| Section | Location | What it shows |
|--------|----------|----------------|
| **Hero** | `hero-section.tsx` | Headline + “Track spending, budgets, goals, and more—all in one place” + CTA (trial, pricing) |
| **Problem** | `problem-section.tsx` | “Everything in one place”, “See where money goes”, “Goals that get started” |
| **Product overview** | `product-overview-section.tsx` | One app for “accounts, transactions, budgets, goals, debts, and insights” + hero image |
| **Reality** | `reality-section.tsx` | Stats (73%, 6 mos, 2.5x) — no feature list |
| **Debt awareness** | `debt-awareness-section.tsx` | Debt stats (Canada/USA/World) + CTA “organized, less work, available anywhere” |
| **Features showcase** | `features-showcase.tsx` | 4 spotlights: (1) Dashboard + Spair Score, (2) Budgets & goals, (3) Reports + planned payments, (4) Household |
| **Mobile** | `mobile-mockup-section.tsx` | “Dashboard, budgets, and goals—wherever you are”, any device |
| **Trust** | `trust-section.tsx` | Testimonials carousel |
| **Pricing** | `pricing-section.tsx` | Pro plan, trial, and “What’s included” list (see below) |
| **FAQ** | `faq-section.tsx` + `landing-faq-content.ts` | What is Spair Money, how it works, data safety, trial, what’s included |
| **Footer** | `landing-footer.tsx` | Links, legal, etc. |

### Features explicitly mentioned on the landing

- **Dashboard** — Hero, Problem, Product overview, Features showcase, Mobile, Pricing, FAQ  
- **Spair Score / insights** — Hero image alt, Features showcase, Pricing, FAQ  
- **Budgets** — Hero, Problem, Features showcase, Mobile, Pricing, FAQ  
- **Goals** — Hero, Problem, Product overview, Features showcase, Mobile, Pricing, FAQ  
- **Reports** — Problem (“categories and reports”), Features showcase, Pricing (“Advanced reports”), FAQ  
- **Accounts** — Problem (“Everything in one place”), Product overview, Pricing (“Unlimited … accounts”), FAQ  
- **Transactions** — Product overview, Pricing (“Unlimited transactions”), FAQ  
- **Debts** — Product overview, Debt awareness section, Features showcase (planned payments), Pricing (“Debt tracking”), FAQ (implied)  
- **Planned payments** — Features showcase (“what’s due in the next 90 days—recurring, debts, goals, and subscriptions”)  
- **Household** — Features showcase, Pricing (“Household sharing”), FAQ  
- **Receipts** — Pricing (“Receipt scanning”), FAQ (“receipts”)  
- **CSV** — Pricing (“CSV import and export”); testimonials mention CSV import  

### Mentioned only in passing / implied

- **Categories** — Problem section: “Clear categories and reports” (no dedicated feature block).  
- **Recurring subscriptions (tracking)** — Only inside the planned-payments copy (“recurring … and subscriptions”), not as its own feature.

---

## 2. Documented features not (or barely) on the landing

From `docs/APP_OVERVIEW.md` Documentation Index:

| Doc feature | On landing? | Note |
|-------------|------------|------|
| **Auth** | Only as CTA (sign up / sign in) | No “how auth works” (email, Google). OK for landing. |
| **Dashboard** | Yes | — |
| **Reports** | Yes | — |
| **Accounts** | Yes | — |
| **Transactions** | Yes | — |
| **Subscriptions (recurring)** | Only inside “planned payments” copy | Recurring subscription *tracking* is not called out as its own feature. |
| **Planned payments** | Yes | In Features showcase. |
| **Budgets** | Yes | — |
| **Goals** | Yes | — |
| **Debts** | Yes | — |
| **Categories** | Implied only | “Categories” in Problem section; no spotlight or pricing line. |
| **Household & members** | Yes | — |
| **Profile & my account** | No | Usually not landing material. |
| **Billing (Stripe)** | Yes | Pricing section + trial. |
| **Onboarding** | No | Internal flow; optional to mention (“quick setup”, etc.). |
| **Insights (Spair Score)** | Yes | As “Spair Score”. |
| **Help & support** | No | Optional for footer or FAQ. |
| **Feedback** | No | Optional. |
| **Receipts** | Yes | Pricing + FAQ. |
| **Taxes** | No | Documented feature (tax rates, brackets, calculate) not mentioned on landing. |
| **Admin** | No | Not for end users. |

Summary of “missing” or under-exposed:

- **Taxes** — Full feature in docs; not mentioned on the landing.  
- **Categories** — Only one short phrase; could be unified with “Reports” or called out once (e.g. in Product overview or Pricing).  
- **Recurring subscriptions (tracking)** — Could be one line in “Planned payments” or in “What’s included” (e.g. “Recurring subscription tracking”) to align with docs.  
- **Help & support / Feedback** — Optional; could add one FAQ or footer link if you want to surface them.

---

## 3. Unification opportunities

- **Categories**  
  - Today: only “Clear categories and reports” in Problem.  
  - Option: add “Categories” to the Product overview sentence (“accounts, transactions, **categories**, budgets…”) or to the Pricing “What’s included” list so it matches Reports/Transactions in the docs.

- **Recurring subscriptions**  
  - Today: only inside the planned-payments paragraph.  
  - Option: add to Pricing “What’s included”, e.g. “Recurring subscription tracking” or “Track recurring subscriptions”, so it’s clear and aligned with `SUBSCRIPTIONS.md`.

- **Taxes**  
  - If you want to advertise the feature: add one line to Product overview or to “What’s included” (e.g. “Tax rate and bracket helpers” or “Tax planning tools”).  
  - If it’s niche: keep it out of landing and only in-app/docs.

- **Duplicate / unused components**  
  - `feature-cards-section.tsx` and `offer-grid-section.tsx` are not used in `landing-view.tsx` (the page uses `FeaturesShowcase` instead).  
  - You can remove them if unused elsewhere, or reuse one of them to avoid maintaining two similar “feature grid” contents (e.g. one source of truth for “Dashboard & score”, “Budgets & goals”, “Reports & planning”, “Household”).

---

## 4. Summary table

| Status | Items |
|--------|--------|
| **Shown on landing** | Dashboard, Spair Score, Reports, Accounts, Transactions, Planned payments, Budgets, Goals, Debts, Household, Receipts, CSV, Billing/trial |
| **Missing or weak** | Taxes (not mentioned), Categories (one phrase), Recurring subscriptions (only inside planned payments text) |
| **Optional** | Help & support, Feedback, Onboarding (one line), Profile (usually not on landing) |
| **Unify** | Add Categories and/or Recurring subscriptions to one clear place (overview or pricing); decide if Taxes goes on landing; consolidate or remove duplicate feature-card sections. |

This doc can be updated when you add/remove sections or change the docs index.
