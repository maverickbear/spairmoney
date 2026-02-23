# Categories

## Purpose

Manages transaction categories and subcategories (e.g. Food > Groceries, Transport > Fuel). Used across the app for categorizing transactions, budgets, and reports. The app provides **system categories** (read-only for name/type) and **custom (household) categories** created in Settings > Categories. Custom categories are scoped by **household**: stored with `household_id`, visible and editable by all members of that household.

## User Flows

- **Settings > Categories** (`/settings/categories`): List household categories (custom only); create new categories and subcategories; edit or delete any category in the household (any member can).
- **Edit**: Clicking "Edit" loads the category from the API (GET by id) so the form shows the latest data from the database (name, type, existing subcategories). The user can change name/type and add new subcategories; saving does not duplicate existing subcategories.
- **Transactions / Budgets / Reports**: User selects category and subcategory when creating or editing; categories available are system categories plus the **current user’s active household** custom categories (shared with all household members).
- View spending by category in reports and dashboard.

## Custom vs System Categories

| | System | Custom (household) |
|--|--------|---------------------|
| **Source** | Seed data, `user_id` and `household_id` null | Created in Settings > Categories |
| **Visibility** | All users | All members of the same household |
| **Edit** | Name/type read-only; user can add subcategories (with paid plan) | Full edit and delete (any household member) |
| **Stored** | `is_system` true, `household_id` null | `household_id` = active household, `is_system` false |

Custom categories and their subcategories are used in transactions the same way as system categories.

## Behavior / Logic

- **Listing:** GET `/api/v2/categories` returns system categories plus custom categories for the current user’s active household. If the user has no active household, only system categories are returned.
- **Create:** Custom category creation requires (1) authenticated user, (2) active household, (3) paid plan (`guardWriteAccess`). The new category is stored with `household_id` of the active household; all household members see it.
- **Edit/delete:** Only categories that belong to the current user’s household (`household_id` match) can be updated or deleted. System categories are read-only for name/type; adding subcategories to system categories also requires a paid plan.
- **Subcategories:** Create/update/delete subcategories follow the same household scope as their parent category.

## Key Routes / Pages

- `app/(protected)/settings/categories/page.tsx` – Categories settings page.
- `src/presentation/components/features/categories/categories-module.tsx` – List of household categories, create/edit dialog, delete.
- `components/categories/category-dialog.tsx` – Create or edit category (name, type, subcategories); when editing, form is pre-filled from DB and only new subcategory names are created on save.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/categories` | List all categories (system + current user’s active household). Use `?all=true` for list with subcategories. |
| GET | `/api/v2/categories/[id]` | Get one category with subcategories (for edit). Returns 403 if category is not in user’s household or system. |
| POST | `/api/v2/categories` | Create custom category (body: `name`, `type`). Requires paid plan and active household. |
| PATCH | `/api/v2/categories/[id]` | Update category (body: `name`, `type`). Only for categories in current user’s household. |
| DELETE | `/api/v2/categories/[id]` | Delete category. Only for categories in current user’s household. |
| GET | `/api/v2/categories/[id]/subcategories` | List subcategories of a category. |
| POST | `/api/v2/categories/subcategories` | Create subcategory (body: `name`, `categoryId`, optional `logo`). |
| PATCH | `/api/v2/categories/subcategories/[id]` | Update subcategory. |
| DELETE | `/api/v2/categories/subcategories/[id]` | Delete subcategory. |

## Domain / Application

- **Domain:** `src/domain/categories/` – `categories.types.ts`, `categories.validations.ts`.
- **Application:** `src/application/categories/` – `categories.service.ts`, `categories.mapper.ts`, `categories.factory.ts`.
- Service rules: create requires active household and sets `householdId`; update/delete check category is in current user’s household (`household_id` match only; categories are scoped by household, not user).
- Category learning (suggestions) in `src/application/shared/category-learning.ts` and transactions suggestions.

## Infrastructure

- `src/infrastructure/database/repositories/categories.repository.ts`: CRUD for `categories` and `subcategories` (snake_case). List methods filter by `is_system = true` or `household_id = current user’s active household`. Tables have `household_id` (nullable, FK to `households`); no `user_id` column. RLS restricts access by household membership; API GET `/api/v2/categories/[id]` also enforces access.

## Dependencies

- Used by: Transactions, Budgets, Reports, Dashboard (spending breakdown). Onboarding may reference default categories.

## Subscription / Access

- Authenticated users. Creating and editing **custom** categories and subcategories requires a paid plan (`guardWriteAccess`). System categories are read-only for name/type; adding subcategories to system categories also requires a paid plan.
