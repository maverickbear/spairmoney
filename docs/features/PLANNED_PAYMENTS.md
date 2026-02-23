# Planned Payments

## Purpose

Manages **planned** (scheduled) payments: one-off or recurring future expenses (e.g. rent, utilities, loan payments). Users can create, edit, skip, mark as paid, or cancel planned payments. Sync and debug endpoints support reconciliation and troubleshooting. Dashboard shows upcoming payments.

## Actions (Mark as Paid, Skip, Cancel)

These actions are available on scheduled planned payments. The same icons and labels are used in the planned payment list (`/planned-payment`) and in the **Planned Payments** dashboard widget for consistency.

| Action | Icon | What it does |
|--------|------|----------------|
| **Mark as Paid** | Check (✓) | Creates a transaction with the planned payment’s date, amount, account, and category; marks the planned payment as `paid` and links it to that transaction. Only available when status is `scheduled`. |
| **Skip** | SkipForward (▷\|) | Marks the planned payment as `skipped`. No transaction is created. Use when you are not paying this occurrence (e.g. skipping a month). Only available when status is `scheduled`. |
| **Cancel** | X | Marks the planned payment as `cancelled`. No transaction is created. Use when the planned payment should no longer exist (e.g. subscription ended). Not available when status is already `paid`. |

- **Edit** (Pencil icon): Opens the planned payment form to change amount, date, recurrence, etc. Only for `scheduled` payments.

## Behavior / Logic (states and sync)

- **Status:** Planned payments have statuses such as `scheduled`, `paid`, `skipped`, `cancelled`. Mark as paid creates a transaction and sets status to `paid`; skip sets `skipped`; cancel sets `cancelled`. Edit is only for `scheduled`.
- **Sync:** Planned payments can be linked to debts, goals, subscriptions, or recurring transactions. When the source (debt, goal, etc.) is deleted or updated, the app explicitly deletes or updates related planned payments (no DB triggers); sync and debug endpoints support reconciliation.
- **Scope:** List and CRUD are scoped by household (or user). Dashboard widget shows upcoming payments from the same service.

## User Flows

- List planned payments (with due dates, amounts, recurrence).
- Create a planned payment (amount, due date, recurrence, link to debt/goal if applicable).
- Edit or delete/cancel a planned payment.
- Skip one occurrence (e.g. skip next month).
- Mark a payment as paid (record actual payment).
- Sync planned payments (e.g. with debts or goals).
- View upcoming payments on dashboard (upcoming-payments widget).

## Key Routes / Pages

- `app/(protected)/planned-payment/page.tsx` – Planned payments list and management.
- `src/presentation/components/features/dashboard/widgets/upcoming-payments-widget.tsx` – Dashboard widget.
- Components for planned payment form and list.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/planned-payments` | List planned payments. |
| POST | `/api/v2/planned-payments` | Create planned payment. |
| GET | `/api/v2/planned-payments/[id]` | Get one. |
| PATCH/PUT | `/api/v2/planned-payments/[id]` | Update. |
| DELETE | `/api/v2/planned-payments/[id]` | Delete (hard delete). |
| POST | `/api/v2/planned-payments/[id]/skip` | Skip (set status to `skipped`). |
| POST | `/api/v2/planned-payments/[id]/mark-paid` | Mark as paid (create transaction and set status to `paid`). |
| POST | `/api/v2/planned-payments/[id]/cancel` | Cancel (set status to `cancelled`). |
| POST | `/api/v2/planned-payments/sync` | Sync (e.g. with debts/goals). |
| GET or POST | `/api/v2/planned-payments/debug` | Debug info. |

## Domain / Application

- **Domain:** `src/domain/planned-payments/` – `planned-payments.types.ts`, `planned-payments.validations.ts`.
- **Application:** `src/application/planned-payments/` – `planned-payments.service.ts`, `planned-payments.mapper.ts`, `planned-payments.factory.ts`; `debt-planned-payments.service.ts`, `goal-planned-payments.service.ts`, `recurring-planned-payments.service.ts`; `get-dashboard-planned-payments.ts`.

## Infrastructure

- Repositories for planned payments (and possibly debts/goals for sync). Supabase table: `planned_payments`.
- Mapping: snake_case in DB to camelCase in domain.

## Database (triggers, functions, constraints)

- **No triggers or functions** in the codebase act on `planned_payments`. All create/update/delete/sync is done in the **application layer** (services + repository). When source data changes (debts, goals, subscriptions, recurring transactions), the app explicitly deletes or cancels related planned payments and optionally regenerates them.
- **If you add DB triggers or functions** (e.g. in Supabase dashboard or migrations), ensure they do **not** duplicate or conflict with this application-driven sync (e.g. do not auto-delete by `debt_id`/`goal_id`/`subscription_id`/`recurring_transaction_id` in a trigger if the app already does it before deleting the parent row).
- **Key columns** used for sync and cleanup: `debt_id`, `subscription_id`, `goal_id`, `recurring_transaction_id`, `linked_transaction_id`. The repository methods `deleteByDebtId`, `deleteByGoalId`, `deleteByRecurringTransactionIds`, `deleteByLinkedTransactionIds` rely on these; subscriptions use a direct `DELETE ... WHERE subscription_id = ?`. Any RLS or check constraints must allow these application-driven deletes and inserts for the owning user.

## Dependencies

- Optional: Debts, Goals (for linked planned payments and sync). Accounts for “mark as paid” if a transaction is created.

## Subscription / Access

- Authenticated users. May be gated by plan for unlimited or advanced scheduling.
