# Taxes

## Purpose

Provides **tax-related** data and calculations: tax rates (e.g. by region), federal brackets, and a calculate endpoint for estimating tax. Used for planning or reporting, not filing.

## User Flows

- View or manage tax rates (if UI exists under settings or a planning section).
- View federal brackets (list, get by ID).
- Use calculate endpoint (e.g. from a calculator UI or report) to estimate tax for given income/deductions.
- Tax data may feed into reports or financial planning.

## Behavior / Logic

- **Tax rates:** Stored by region or type; list and CRUD are standard. Used as reference for calculate or display. May be seeded; admin or setup can create/update.
- **Federal brackets:** Stored brackets (e.g. by year); calculate endpoint uses them with income/deductions to estimate tax. No filing or submission; planning/reporting only.
- **Scope:** Tax rates and brackets may be global (shared) or per-region; calculate uses current user/household context for inputs. Advanced calculation or brackets may be gated by plan.

## Key Routes / Pages

- No dedicated “Taxes” page in the plan; may be under settings or planning. API is available for future or internal use.
- Components could call `/api/v2/taxes/calculate`, `/api/v2/tax-rates`, `/api/v2/federal-brackets`.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET or POST | `/api/v2/taxes/calculate` | Calculate tax (e.g. from income, brackets). |
| GET | `/api/v2/tax-rates` | List tax rates. |
| GET | `/api/v2/tax-rates/[id]` | Get one tax rate. |
| POST | `/api/v2/tax-rates` | Create tax rate (admin or setup). |
| PATCH | `/api/v2/tax-rates/[id]` | Update tax rate. |
| GET | `/api/v2/federal-brackets` | List federal brackets. |
| GET | `/api/v2/federal-brackets/[id]` | Get one federal bracket. |

## Domain / Application

- **Domain:** `src/domain/taxes/` – `taxes.types.ts`, `taxes.validations.ts`; `tax-rates.types.ts`, `tax-rates.validations.ts`; `federal-brackets.types.ts`, `federal-brackets.validations.ts`.
- **Application:** `src/application/taxes/` – `taxes.service.ts`, `taxes.factory.ts`; `tax-rates.service.ts`, `tax-rates.factory.ts`; `federal-brackets.service.ts`, `federal-brackets.factory.ts`.

## Infrastructure

- Repositories for tax_rates and federal_brackets. Supabase tables; may be seeded for standard brackets.

## Dependencies

- None for CRUD. Reports or planning features may consume tax data.

## Subscription / Access

- Authenticated users. Tax calculation or advanced brackets may be premium (plan-features-service).
