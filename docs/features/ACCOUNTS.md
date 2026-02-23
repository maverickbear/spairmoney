# Accounts

## Purpose

Manages bank (and similar) accounts: checking, savings, credit, and other types. Users can create, edit, and delete accounts; set a default account; and see balance (and optionally holdings). Account list is used across the app for transactions, dashboard, and reports.

## User Flows

- List all accounts (with balances).
- Create a new account (name, type, optional initial balance, etc.).
- Edit an account – when opening edit (table or card), all fields are loaded: name, type, credit limit, initial balance, due day, and additional owners. The form initializes from the account so Type and other fields show correctly from the first render.
- Set default account (e.g. for new transactions).
- Delete an account (may require no transactions or transfer logic; `has-transactions` endpoint supports this).
- View account in dashboard/reports.

## Behavior / Logic

- **Scope:** Accounts belong to the user’s household (or user when no household). List and CRUD are scoped so the user only sees and edits accounts they are allowed to access (RLS + service layer).
- **Default account:** Exactly one account can be marked default per household (or user). Setting a new default unsets the previous one. New transactions may default to this account.
- **Delete:** Before delete, the app may check `has-transactions`; if the account has transactions, the UI may require transfer to another account or block delete. Deletion is enforced in the application layer.

## Key Routes / Pages

- `app/(protected)/accounts/page.tsx` – Accounts list and management.
- `src/presentation/components/features/accounts/` – `add-account-sheet.tsx`, `add-account-dropdown.tsx`, `import-progress.tsx`, `import-status-banner.tsx`, `delete-account-with-transfer-dialog.tsx`.
- `components/banking/account-card.tsx`, `components/forms/account-form.tsx`.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/accounts` | List accounts (optional `includeHoldings`). |
| POST | `/api/v2/accounts` | Create account (validates with account schema; plan limit via `guardAccountLimit`). |
| GET | `/api/v2/accounts/[id]` | Get one account. |
| PATCH/PUT | `/api/v2/accounts/[id]` | Update account. |
| DELETE | `/api/v2/accounts/[id]` | Delete account. |
| POST | `/api/v2/accounts/[id]/set-default` | Set default account. |
| GET | `/api/v2/accounts/[id]/has-transactions` | Check if account has transactions (for delete/transfer UX). |

## Domain / Application

- **Domain:** `src/domain/accounts/` – `accounts.types.ts`, `accounts.validations.ts`, `accounts.constants.ts` (account types).
- **Application:** `src/application/accounts/` – `accounts.service.ts`, `accounts.mapper.ts`, `accounts.factory.ts` (`makeAccountsService()`); `get-dashboard-accounts.ts` for dashboard.
- Validations: Zod in domain; API uses `AccountFormData` and feature guard for account limits.

## Infrastructure

- `src/infrastructure/database/repositories/accounts.repository.ts` – CRUD; raw Supabase rows are mapped to `AccountRow` (including `type`) so the API returns camelCase. `findById` uses an explicit mapper so GET-by-id always returns full account data for the edit form.
- Supabase table `accounts` (columns: id, name, type, user_id, credit_limit, initial_balance, due_day_of_month, etc.).

## Dependencies

- None for core CRUD. Transactions and other features depend on accounts. Subscription/plan may limit number of accounts (`guardAccountLimit`).

## Subscription / Access

- Authenticated users can manage accounts. Account count may be limited by plan (feature guard).
