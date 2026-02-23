# Insights (Spair Score)

## Purpose

Surfaces **Spair Score** and financial health insights: a score and breakdown derived from transactions, income, expenses, and savings behavior. The insights page provides a deeper view than the dashboard widget; calculations use shared financial-health and Spair Score logic.

## User Flows

- Open Insights page (/insights).
- View Spair Score and breakdown (e.g. spending, savings, consistency).
- See recommendations or tips based on the score.
- Month or period may be selectable (insights may use same snapshot as dashboard or loadDashboardData).

## Behavior / Logic

- **Spair Score:** Computed from transactions and user/household data using `spair-score-calculator` and `financial-health` modules. Factors may include spending, savings, consistency; the result is a score and optional breakdown. Same logic can be used by the dashboard widget and the full insights page.
- **Data:** Insights page typically loads dashboard data (same snapshot as dashboard) or uses dashboard/route and widgets; there is no separate insights persistence. Score is derived on demand from transactions and config.
- **Gating:** Full insights or Spair Score breakdown may be premium; BlockedFeature or plan-features-service can restrict access to the insights page or detailed breakdown.

## Key Routes / Pages

- `app/(protected)/insights/page.tsx` – Loads dashboard data and renders `SpairScoreInsightsPage` (insights-content).
- `app/(protected)/insights/insights-content.tsx` (or under insights/) – Main insights UI.
- `src/application/shared/financial-health.ts` – `recalculateFinancialHealthFromTransactions` and related.
- `src/application/shared/spair-score-calculator.ts` – Spair Score calculation.
- Dashboard widget: `spair-score-widget.tsx`, `spair-score-details-dialog.tsx`, `spair-score-full-width-widget.tsx`.

## API

- Insights page typically uses **dashboard data** (transactions, income, expenses for the period) and **dashboard/route** or **dashboard/widgets**; no dedicated “insights” v2 route. Spair Score may be computed client-side or via a widget endpoint that returns score breakdown.
- If a dedicated endpoint exists: GET `/api/v2/dashboard` or widgets with Spair Score payload.

## Domain / Application

- **Domain:** `src/domain/dashboard/` – types for dashboard/snapshot; financial health types may live in shared or dashboard.
- **Application:** `src/application/shared/financial-health.ts`, `src/application/shared/spair-score-calculator.ts`; dashboard service for data loading.
- Reports/dashboard services may expose score-related aggregates.

## Infrastructure

- Transactions (and optionally accounts, budgets) for inputs. No separate insights table; score is computed from transactions and user/household data.

## Dependencies

- Transactions, Dashboard data (income/expenses), optionally Onboarding (income for ratios). Subscription may gate advanced insights.

## Subscription / Access

- Authenticated users. Full insights or Spair Score breakdown may be premium (plan-features-service, BlockedFeature on insights page).
