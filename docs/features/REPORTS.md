# Reports

## Purpose

Provides financial reports for a selected period: net worth, cash flow, budget performance, and spending by category. Users can filter by period (current month, last 3/6/12 months, year-to-date) and view charts/tables.

## User Flows

- Open Reports page; choose period (e.g. last 6 months).
- View net worth report (assets vs liabilities over time).
- View cash flow report (income vs expenses).
- View budget performance report (planned vs actual by category).
- View spending by category report (breakdown by category/subcategory).
- Some reports may be gated by subscription tier.

## Behavior / Logic

- **Period:** Reports are computed for a selected period (e.g. current month, last 3/6/12 months, YTD). The same period is used for all report types on the page so comparisons are consistent.
- **Data source:** Net worth uses account balances over time; cash flow uses income vs expense transactions; budget performance compares budget limits to actual spending by category; spending-by-category aggregates transactions by category/subcategory. No dedicated reports table; data is aggregated from accounts, transactions, budgets.
- **Gating:** Advanced or historical reports may be restricted by plan; `BlockedFeature` or plan-features checks are used on the reports page.

## Key Routes / Pages

- `app/(protected)/reports/page.tsx` – Reports page; uses `loadReportsData`, `ReportFilters`, `ReportsContent`.
- `app/(protected)/reports/` – `data-loader.ts`, `reports-content.tsx` (or similar).
- `components/reports/` – Report filters, chart/table components.

## API

All report endpoints accept an optional query **`period`** (e.g. `last-3-months`, `last-6-months`, `last-12-months`, `year-to-date`). The reports page sends the same period to each endpoint so all charts use the same range.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/reports` | Main reports data (query `period=...`). |
| GET | `/api/v2/reports/net-worth` | Net worth time series. |
| GET | `/api/v2/reports/cash-flow` | Cash flow data. |
| GET | `/api/v2/reports/budget-performance` | Budget vs actual by category. |
| GET | `/api/v2/reports/spending-by-category` | Spending by category. |

## Domain / Application

- **Domain:** `src/domain/reports/` – `reports.types.ts`.
- **Domain:** `src/domain/dashboard/` – shared types/validations used by reports.
- **Application:** `src/application/reports/` – `reports.service.ts`, `reports-core.service.ts`, `reports-advanced.service.ts`, `reports.factory.ts` (`makeReportsService()`).

## Infrastructure

- Repositories: accounts, transactions, budgets (and related). Reports aggregate data from these; no dedicated reports table.
- Cache may be used for heavy report queries.

## Dependencies

- Accounts, Transactions, Budgets, Categories. Subscription for access to advanced reports (if gated).

## Subscription / Access

- Some report types may be restricted by plan (e.g. advanced or historical). `getDashboardSubscription` and plan-features checks used on the reports page; `BlockedFeature` may be shown for gated content.
