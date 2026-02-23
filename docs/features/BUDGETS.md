# Budgets

## Purpose

Manages monthly (or other period) budgets by category: set limits, track spending against them, and define rules (e.g. “50% of income to housing”). Supports rule suggestions and budget performance in reports.

## User Flows

- List budgets (by period/category).
- Create or edit a budget (category, amount, period).
- Create or edit budget rules (e.g. percentage of income).
- Get suggested rules (e.g. based on income or defaults).
- View budget progress on dashboard (total-budgets widget, budget-performance widget) and in reports.
- Delete a budget or rule.

## Behavior / Logic

- **Budgets:** A budget is defined for a category (and optionally period). The amount is the limit; actual spending is computed from transactions in that category for the period. Progress (e.g. spent vs limit) is shown on the dashboard and in reports.
- **Budget rules:** Rules define allocation (e.g. “50% of income to housing”). They can be used to suggest or auto-create budgets. Suggest endpoint may use onboarding income or transaction history.
- **Scope:** Budgets and rules are scoped by household (or user). Plan may limit the number of budgets or rules (`guard` in service).

## Key Routes / Pages

- `app/(protected)/planning/budgets/page.tsx` – Budgets and rules management.
- `src/presentation/components/features/budgets/` – `category-budget-slider.tsx`, `budget-rule-selector.tsx`.
- `src/presentation/components/features/dashboard/widgets/total-budgets-widget.tsx`, `budget-performance-widget.tsx`.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/budgets` | List budgets. |
| POST | `/api/v2/budgets` | Create budget. |
| GET | `/api/v2/budgets/[id]` | Get one budget. |
| PATCH/PUT | `/api/v2/budgets/[id]` | Update budget. |
| DELETE | `/api/v2/budgets/[id]` | Delete budget. |
| GET | `/api/v2/budgets/rules` | List budget rules. |
| POST | `/api/v2/budgets/rules` | Create rule. |
| GET or POST | `/api/v2/budgets/rules/suggest` | Suggest budget rules. |

## Domain / Application

- **Domain:** `src/domain/budgets/` – `budgets.types.ts`, `budgets.validations.ts`; `budget-rules.types.ts`, `budget-rules.constants.ts`.
- **Application:** `src/application/budgets/` – `budgets.service.ts`, `budgets.mapper.ts`, `budgets.factory.ts`; `budget-rules.service.ts`, `budget-rules.factory.ts`.

## Infrastructure

- Repositories for budgets and budget_rules. Supabase tables (snake_case).
- Transactions and categories used to compute spending vs budget.

## Dependencies

- Categories (for category-based budgets). Transactions (for actual spending). Onboarding may use budget rules (income-based).

## Subscription / Access

- Authenticated users. Number of budgets or rules may be limited by plan.
