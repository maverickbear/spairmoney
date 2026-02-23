# Goals

## Purpose

Lets users define financial goals (e.g. emergency fund, vacation, down payment), set target amounts and deadlines, and track progress. Supports top-up and withdraw operations and emergency-fund calculation based on income.

## User Flows

- List goals (with progress and target).
- Create a goal (name, target amount, deadline, priority).
- Edit or delete a goal.
- Top-up: add money to a goal (may create a transaction or adjust balance).
- Withdraw: remove money from a goal.
- Calculate emergency fund (income-based suggestion) via dedicated endpoint.
- Get income basis for goal planning (income-basis endpoint).
- View goals on dashboard (goals-progress widget).

## Behavior / Logic

- **Progress:** Each goal has a target amount and current balance. Progress is shown as balance/target; top-up increases balance, withdraw decreases it. Top-up/withdraw may create or link transactions depending on implementation.
- **Emergency fund:** The emergency-fund calculate endpoint uses income (e.g. from onboarding or transactions) to suggest a target (e.g. N months of expenses). It does not create a goal; it returns a suggested value.
- **Planned payments:** Goals can be linked to planned payments (e.g. monthly savings). Creating/updating/deleting a goal may sync related planned payments via goal-planned-payments service.

## Key Routes / Pages

- `app/(protected)/planning/goals/page.tsx` – Goals list and management.
- `src/presentation/components/features/dashboard/widgets/goals-progress-widget.tsx` – Dashboard widget.
- Goal form and progress components.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/goals` | List goals. |
| POST | `/api/v2/goals` | Create goal. |
| GET | `/api/v2/goals/[id]` | Get one goal. |
| PATCH/PUT | `/api/v2/goals/[id]` | Update goal. |
| DELETE | `/api/v2/goals/[id]` | Delete goal. |
| POST | `/api/v2/goals/[id]/top-up` | Top up goal. |
| POST | `/api/v2/goals/[id]/withdraw` | Withdraw from goal. |
| GET or POST | `/api/v2/goals/emergency-fund/calculate` | Calculate emergency fund (e.g. from income). |
| GET | `/api/v2/goals/income-basis` | Get income basis for planning. |

## Domain / Application

- **Domain:** `src/domain/goals/` – `goals.types.ts`, `goals.validations.ts`; `src/domain/financial-objectives/` may be related.
- **Application:** `src/application/goals/` – `goals.service.ts`, `goals.mapper.ts`, `goals.factory.ts`; `get-income-basis.ts` for income basis.
- Planned payments: `goal-planned-payments.service.ts` links goals to planned payments.

## Infrastructure

- Repositories for goals (and possibly financial_objectives). Supabase tables.
- Income data may come from transactions or onboarding for emergency-fund calculation.

## Dependencies

- Transactions or onboarding for income basis. Accounts for top-up/withdraw (if creating transactions). Planned payments for goal-linked payments.

## Subscription / Access

- Authenticated users. Number of goals or advanced features may be gated by plan.
