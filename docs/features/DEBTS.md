# Debts

## Purpose

Tracks debts (loans, credit cards, etc.): balance, interest, payment schedule, and payoff progress. Users can add debts, record payments, and see payoff projections. Integrates with planned payments for scheduled payments; credit-card debt sync can keep balances in sync with transactions.

## User Flows

- List debts (with balance, interest, next payment).
- Create a debt (name, type, balance, interest rate, minimum payment, etc.).
- Edit or delete a debt.
- Record a payment (amount, date); balance and planned payments may update.
- View debt overview on dashboard (debt-overview widget).
- Use planned payments for recurring debt payments.

## Behavior / Logic

- **Balance:** Debt has a current balance; recording a payment reduces the balance. Credit-card debt sync can update balance from linked account transactions (credit-card-debt-sync service).
- **Planned payments:** When a debt exists, the app may create or sync planned payments for scheduled repayments. Deleting or updating a debt can remove or update those planned payments (debt-planned-payments service).
- **Scope:** Debts are scoped by household (or user). Plan may limit count or advanced payoff features.

## Key Routes / Pages

- `app/(protected)/debts/page.tsx` – Debts list and management.
- `src/presentation/components/features/dashboard/widgets/debt-overview-widget.tsx` – Dashboard widget.
- Debt form and payment components.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/debts` | List debts. |
| POST | `/api/v2/debts` | Create debt. |
| GET | `/api/v2/debts/[id]` | Get one debt. |
| PATCH/PUT | `/api/v2/debts/[id]` | Update debt. |
| DELETE | `/api/v2/debts/[id]` | Delete debt. |
| POST | `/api/v2/debts/[id]/payment` | Record a payment. |

## Domain / Application

- **Domain:** `src/domain/debts/` – `debts.types.ts`, `debts.validations.ts`.
- **Application:** `src/application/debts/` – `debts.service.ts`, `debts.mapper.ts`, `debts.factory.ts`; `src/application/planned-payments/debt-planned-payments.service.ts` for linking planned payments to debts; `src/application/credit-card-debt/credit-card-debt-sync.service.ts` for syncing credit card balance from transactions.
- Credit-card-debt: `credit-card-debt-sync.factory.ts`, `credit-card-debt-sync.service.ts`.

## Infrastructure

- `src/infrastructure/database/repositories/debts.repository.ts` – CRUD, mapping.
- Supabase table(s) for debts. Transactions repository used by credit-card-debt sync.

## Dependencies

- Accounts (for linked account if applicable). Planned payments for scheduled debt payments. Transactions for credit-card balance sync.

## Subscription / Access

- Authenticated users. Debt count or advanced payoff features may be gated by plan.
