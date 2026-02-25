# Spair Money – App Overview

## What It Is

**Spair Money** is a personal finance management platform. Users can track bank accounts, transactions, budgets, financial goals, debts, and planned payments; view reports and insights; and manage billing and household members. The app offers a dashboard with customizable widgets, AI-powered insights (Spair Score), and optional premium features via Stripe.

## How It Works (High Level)

- **Authentication:** Users sign up or sign in (email or Google) via Supabase Auth. Session is maintained with cookies.
- **Data:** All financial data lives in Supabase (PostgreSQL). Row Level Security (RLS) ensures users only access their own (or their household’s) data.
- **Payments:** Subscription billing is handled by Stripe (plans, trials, customer portal). The app stores subscription state and syncs with Stripe via webhooks and API.
- **AI (optional):** OpenAI is used for category suggestions, insights, and Spair Score when the API key is configured.
- **Client vs server:** Next.js App Router is used. Client components fetch data from `/api/v2/*`; server components call Application services via factories. No business logic or direct DB access in UI or API routes.

## Tech Stack (Summary)

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI, Recharts, React Hook Form, Zod, Lucide React |
| **Backend** | Supabase (PostgreSQL + Auth), Stripe, Resend (email), OpenAI (optional), Sanity (blog, optional) |
| **DevOps** | Vercel, Jest, ESLint, Prettier, Docker Compose (local DB) |

## How It Was Created / Architecture

The project follows **Clean Architecture** with **Domain-Driven Design (DDD)**:

1. **Domain (`src/domain/`)** – Types, Zod schemas, constants. No business logic, no infrastructure or UI.
2. **Application (`src/application/`)** – Business logic: services, mappers, factories. Validates with Domain schemas; uses repositories for persistence. No DB or HTTP.
3. **Infrastructure (`src/infrastructure/`)** – Data access (repositories), external services (Stripe, OpenAI, etc.). Maps DB `snake_case` to domain `camelCase`.
4. **Presentation (`src/presentation/` + `app/`)** – API routes (thin HTTP layer), React components and hooks. Components call `/api/v2/*`; API routes and server components use Application services via factories. No business logic, no direct DB access.

**Golden rules:**

- Business logic → Application services only.
- Data access → Repositories only.
- Client components → `/api/v2/<feature>`.
- Server components → Application services via factories.
- No direct Supabase access outside Infrastructure.

The canonical reference for these rules is [.cursorrules](.cursorrules) and the [README Architecture section](../README.md#-architecture).

## Project Structure (Short)

```
app/                    # Next.js App Router (pages, layouts, API routes)
  (protected)/          # Authenticated pages (dashboard, accounts, etc.)
  admin/                # Admin dashboard (users, plans, docs viewer at /admin/docs)
  api/v2/               # API routes (Clean Architecture)
  auth/                 # Login, signup, reset password
src/
  domain/               # Feature folders: types, validations, constants
  application/         # Feature folders: service, mapper, factory
  infrastructure/       # Repositories, external services, utils
  presentation/        # Feature components, hooks, config
components/             # Shared UI (forms, dashboard, common)
contexts/               # React contexts (auth, subscription, dashboard snapshot)
lib/                    # Utilities, validations, shared services (no business logic)
docs/                   # App and feature documentation (markdown)
```

**In-app documentation:** Admins can view all docs at **/admin/docs** (sidebar navigation, markdown rendered). Served by `GET /api/v2/admin/docs?path=...` (admin-only; super_admin only). Use the domain where the full Next.js app is deployed (e.g. **https://app.spair.co/admin/docs**). If you open `/admin/docs` on a different domain (e.g. www) that points to another deployment (e.g. marketing site), you will get 404; `vercel.json` redirects `www.spair.co/admin` and `www.spair.co/admin/*` to `app.spair.co` so admin and docs work from one canonical URL.

**Keeping /admin/docs in sync:** When you add or rename a doc under `docs/`, update all three so the viewer and API stay consistent: (1) **Documentation Index** in this file (table below); (2) **DOC_ITEMS** in `app/admin/(dashboard)/docs/docs-client.tsx` (sidebar list); (3) **ALLOWED_PATH_REGEX** in `app/api/v2/admin/docs/route.ts` if the path is a new pattern (e.g. a new top-level doc like `LANDING_VS_FEATURES.md`). Feature docs under `docs/features/` must use `UPPER_SNAKE_CASE.md` (e.g. `AUTH.md`) to match the regex.

## Security (Brief)

- **Auth:** Supabase Auth (email + Google); session via HTTP-only cookies.
- **Data:** RLS on Supabase tables; repositories use server/client with appropriate keys.
- **Payments:** Stripe handles card data; no card details stored in the app.
- **Secrets:** Environment variables for keys; no secrets in client bundle.
- **Input:** All external input validated with Zod (Domain or shared validations).

## Codebase State

- **No legacy `lib/api/`** – Migration to Application Services is complete; use `/api/v2/*` only.
- **Error handling** – Use `AppError` from `src/application/shared/app-error.ts` in services and API routes; no `lib/services/error-handler`.
- **Expected income formatting** – Use `formatExpectedAnnualIncome`, `formatMonthlyFromAnnual`, and `formatExpectedIncomeWithMonthly` from `src/presentation/utils/format-expected-income.ts` (deprecated range-based helpers were removed).
- **Transfer display** – Use `formatTransferLabel(fromAccountName, toAccountName)` from `src/presentation/utils/format-transfer-label.ts` when showing transfer transactions as a single line (e.g. "Transfer From: X → To: Y").
- **Resend segments** – Contact segment sync (active/trial vs cancelled) lives in `lib/utils/resend-segments.ts`. Used on signup, trial start, subscription lifecycle, and admin actions. Optional env: `RESEND_SEGMENT_ACTIVE`, `RESEND_SEGMENT_CANCELLED` (defaults exist); does not throw so signup/webhooks are not blocked.
- **Investments** – The route `/investments` redirects to `/dashboard`; the investments feature was removed. No separate investments doc.
- **i18n** – next-intl with locales `en`, `pt`, `es`. All routes under `app/[locale]/`. Use `Link`, `redirect`, `useRouter` from `@/i18n/navigation`; use `useTranslations` / `getTranslations` for strings. See [I18N](features/I18N.md).
- **Landing analytics** – GA4 tracking for the landing page: Measurement ID from Admin → SEO Settings; custom event `landing_click` with `section`, `link_id`, `destination`, and optional `interval` for key CTAs and links. See [Analytics](features/ANALYTICS.md).

## Where to Go Next

- **Setup, scripts, contributing:** See the root [README](../README.md).
- **Feature-by-feature documentation:** See the [Documentation index](#documentation-index) below.
- **In-app docs:** Admin → Docs at `/admin/docs` (super_admin only).
- **Architecture and coding rules:** See [.cursorrules](../.cursorrules) and [README – Architecture](../README.md#-architecture).

---

## Documentation Index

| Feature | Description |
|---------|-------------|
| [Auth](features/AUTH.md) | Sign-in, sign-up, sign-out, reset password, Google |
| [Dashboard](features/DASHBOARD.md) | Widgets, Spair Score, snapshot, date range |
| [Reports](features/REPORTS.md) | Net worth, cash flow, budget performance, spending by category |
| [Accounts](features/ACCOUNTS.md) | Bank accounts CRUD, types, balance, default |
| [Transactions](features/TRANSACTIONS.md) | CRUD, filters, bulk/import, suggestions, categories |
| [Subscriptions (recurring)](features/SUBSCRIPTIONS.md) | Recurring subscription tracking |
| [Planned payments](features/PLANNED_PAYMENTS.md) | Planned payments CRUD, sync, skip, mark-paid, cancel |
| [Budgets](features/BUDGETS.md) | Budgets and rules, category-based, suggest rules |
| [Goals](features/GOALS.md) | Financial goals, emergency fund, top-up, withdraw |
| [Debts](features/DEBTS.md) | Debt CRUD, payments, payoff tracking |
| [Categories](features/CATEGORIES.md) | Categories and subcategories CRUD; custom (household) categories in Settings |
| [Household & members](features/HOUSEHOLD_AND_MEMBERS.md) | Household info, invites, accept, roles |
| [Profile & my account](features/PROFILE_AND_MY_ACCOUNT.md) | Profile, avatar, delete account, user/role |
| [Billing (Stripe)](features/BILLING.md) | Stripe subscription, plans, portal, pause/resume |
| [Onboarding](features/ONBOARDING.md) | Income, location, budget plan, household income |
| [Insights (Spair Score)](features/INSIGHTS.md) | Spair Score insights, financial health |
| [Help & support](features/HELP_AND_SUPPORT.md) | Help content, contact form |
| [Feedback](features/FEEDBACK.md) | User feedback form, rating |
| [Receipts](features/RECEIPTS.md) | Upload, scan, extract |
| [Taxes](features/TAXES.md) | Tax rates, federal brackets, calculate |
| [Admin](features/ADMIN.md) | Admin-only: users, invites, promo codes, dashboard, plans |
| [Analytics](features/ANALYTICS.md) | GA4 landing tracking: traffic sources, click events, event params |
| [I18N](features/I18N.md) | Internationalization: en, pt, es; next-intl, messages, locale switcher |
| [I18N – TODOs](features/I18N_TODO.md) | Checklist to complete full i18n (auth, nav, dashboard, dialogs, etc.) |
| [Landing vs features](LANDING_VS_FEATURES.md) | What the landing page shows vs documented app features; unification notes |
| [Production](PRODUCTION.md) | Production deployment checklist, env vars, build, Stripe webhook, Sentry |
