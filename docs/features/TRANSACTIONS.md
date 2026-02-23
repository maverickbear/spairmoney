# Transactions

## Purpose

Tracks income and expense transactions linked to accounts and categories. Supports CRUD, filters (date, account, category, type), bulk operations, CSV import, and AI-powered category suggestions. Recurring and subscription detection can tag transactions.

## User Flows

- List transactions with filters (date range, account, category, type).
- Create or edit a transaction (amount, date, account, category, description, etc.).
- Delete a transaction (with optional confirm-delete flow); restore previously deleted.
- Bulk update or delete (bulk endpoint).
- Import from CSV (import job; progress endpoint for status).
- Apply or reject category suggestions (suggestions/generate, apply, reject).
- Get suggested transaction types (suggest-types).

## Behavior / Logic

- **Filters:** List endpoint supports query params for date range, account, category, type (income/expense). Results are scoped to the user’s household (or user). Pagination or limits may apply.
- **Delete:** Soft delete may be used; `confirm-delete` and `restore` endpoints implement business rules (e.g. confirm before permanent delete, restore within a window). Hard delete is done in the application layer after checks.
- **Suggestions:** Category suggestions can be generated (e.g. via AI), then applied or rejected per transaction. Applying writes the suggested category to the transaction; rejecting may update learning so the same suggestion is not repeated.
- **Transfers:** A transfer is represented by two transactions (out from one account, in to another). Display uses `formatTransferLabel(from, to)` so the user sees one logical “Transfer From X → To Y” line.

## Key Routes / Pages

- `app/(protected)/transactions/page.tsx` – Transactions list and filters.
- `src/presentation/components/features/transactions/` – `category-selection-dialog.tsx`, `category-selection-modal.tsx`, `transactions-mobile-card.tsx`.
- `components/forms/transaction-form.tsx`, `components/forms/csv-import-dialog.tsx`.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/transactions` | List transactions (query params for filters). |
| POST | `/api/v2/transactions` | Create transaction. |
| GET | `/api/v2/transactions/[id]` | Get one transaction. |
| PATCH/PUT | `/api/v2/transactions/[id]` | Update transaction. |
| DELETE | `/api/v2/transactions/[id]` | Delete transaction. |
| POST | `/api/v2/transactions/bulk` | Bulk create/update/delete. |
| GET | `/api/v2/transactions/by-ids` | Get multiple by IDs. |
| POST | `/api/v2/transactions/import` | Start CSV import. |
| GET | `/api/v2/transactions/import/progress` | Import job progress. |
| POST | `/api/v2/transactions/confirm-delete` | Confirm delete (business rule). |
| POST | `/api/v2/transactions/restore` | Restore deleted transaction. |
| POST | `/api/v2/transactions/suggestions/generate` | Generate category suggestions. |
| POST | `/api/v2/transactions/[id]/suggestions/apply` | Apply suggestion. |
| POST | `/api/v2/transactions/[id]/suggestions/reject` | Reject suggestion. |
| GET or POST | `/api/v2/transactions/suggest-types` | Suggest transaction types. |

## Display (transfers)

- **Transfer transactions** are shown as a single-line label when displaying one leg (e.g. outgoing): `"Transfer From: {source account} → To: {destination account}"`. Use `formatTransferLabel(fromAccountName, toAccountName)` from `src/presentation/utils/format-transfer-label.ts` in list, mobile card, and modals.

## Domain / Application

- **Domain:** `src/domain/transactions/` – `transactions.types.ts`, `transactions.validations.ts`.
- **Application:** `src/application/transactions/` – `transactions.service.ts`, `transactions.mapper.ts`, `transactions.factory.ts` (`makeTransactionsService()`); `subscription-detection.ts`, `category-learning.ts` for suggestions and recurring logic.
- Validations: Zod in domain; services validate inputs.

## Infrastructure

- `src/infrastructure/database/repositories/transactions.repository.ts` – CRUD, filters, bulk, mapping. Implements transactions repository interface.
- OpenAI (optional) for category/type suggestions.
- Import jobs may use `import-jobs` service and repository.

## Dependencies

- Accounts (for accountId), Categories (for category/subcategory). Optional: OpenAI for suggestions.

## Subscription / Access

- Authenticated users. Transaction limits or advanced features (e.g. suggestions, import) may be gated by plan (feature guard or dashboard transaction-usage).
