# Dashboard

## Purpose

Provides a single overview of the user’s finances for a chosen period: widgets for net worth, spending, budgets, goals, recurring/subscriptions, recent transactions, Spair Score, planned payments, and debt. Users can change the snapshot month/range and refresh data.

## User Flows

- View dashboard with default (e.g. current month) snapshot.
- Change month or date range; widgets update from cached or refetched data.
- Open Spair Score details or other widget dialogs.
- Add a transaction from the dashboard (Add Transaction widget).
- See trial celebration or subscription-related banners when applicable.

## Behavior / Logic

- **Snapshot:** Dashboard data is tied to a snapshot month/date range. Changing the range triggers refetch (or use of cached data via `DashboardSnapshotContext`). All widgets consume the same snapshot so the view is consistent.
- **Widgets:** Each widget (net worth, spending, budgets, goals, recurring, subscriptions, Spair Score, planned payments, debt, recent transactions) fetches or receives data from the dashboard service or widget endpoints. Some widgets may be gated by plan (SubscriptionContext, plan-features-service).
- **Feature gating:** Trial and billing banners (e.g. trial celebration, paused subscription) are shown based on subscription state from SubscriptionContext; no business logic in the layout beyond initialData for providers.

## Key Routes / Pages

- `app/(protected)/dashboard/page.tsx` – Main dashboard page; uses `DashboardSnapshotProvider` and `DashboardWidgetsClient`.
- `src/presentation/components/features/dashboard/` – `dashboard-widgets-client.tsx`, `dashboard-layout.tsx`, and `widgets/` (e.g. spending, net-worth, goals-progress, recurring, subscriptions, spair-score, planned payments, debt, etc.).
- `src/presentation/contexts/dashboard-snapshot-context.tsx` – Holds snapshot date and version for conditional refetch.
- `components/dashboard/` – Shared pieces (e.g. dashboard-realtime, trial-celebration).

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/dashboard/route` | Dashboard aggregate data for the snapshot. |
| GET | `/api/v2/dashboard/widgets` | Widget-specific payload (widgets config/data). |
| GET | `/api/v2/dashboard/transaction-usage` | Transaction usage for limits/features. |

## Domain / Application

- **Domain:** `src/domain/dashboard/` – `types.ts`, `validations.ts`; shared `src/domain/shared/` for constants.
- **Application:** `src/application/dashboard/` – `dashboard.service.ts`, `dashboard.factory.ts` (`makeDashboardService()`), `get-cached-dashboard-widgets.ts`.
- **Shared:** `src/application/shared/financial-health.ts`, `src/application/shared/spair-score-calculator.ts` – used for Spair Score and financial health.

## Infrastructure

- Repositories for accounts, transactions, budgets, goals, debts, planned payments, subscriptions (read-only for dashboard).
- Cache (e.g. `getCacheHeaders`, `unstable_cache` where used) for widget data.
- No direct Stripe in dashboard; subscription state comes from user-subscriptions/subscription context.

## Dependencies

- Accounts, Transactions, Budgets, Goals, Debts, Planned payments, Subscriptions (recurring), Categories (for spending breakdown). Subscription state for feature gating and banners.

## Subscription / Access

- Dashboard is available to all authenticated users. Some widgets or data may be gated by plan (SubscriptionContext, plan-features-service); trial and billing banners are shown when relevant.
