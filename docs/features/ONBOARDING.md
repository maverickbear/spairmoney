# Onboarding

## Purpose

Guides new users after sign-up: set income, location (for regional defaults), budget rule (e.g. 50/30/20), and optionally household income. Data is used for dashboard, goals (emergency fund), and budget suggestions. Onboarding can be shown as modals or dedicated steps.

## User Flows

- After sign-up, user sees onboarding (income, location, budget plan).
- Submit income (onboarding/income).
- Select or confirm location (onboarding/location) for currency/region.
- Set budget rule (onboarding/budget-rule) – e.g. percentage allocation.
- Optionally set household income (household-income-settings component).
- Dashboard or app then uses this data (expected income widget, goal calculations, suggested budget rules).

## Behavior / Logic

- **Steps:** Onboarding is not a single page; it is a set of steps or dialogs (income, location, budget rule, optional household income). The onboarding-decision service determines what’s missing and whether to show each step (e.g. after sign-up or when opening dashboard).
- **Persistence:** Income, location, and budget rule are stored (e.g. in profile or household); household income is stored in household context. No separate “onboarding complete” flag is required if the app infers completeness from filled fields.
- **Downstream:** Expected income widget, emergency-fund calculation, and budget-rule suggestions use this data; no feature gates—onboarding is for all new users.

## Key Routes / Pages

- No single “onboarding page”; flows are dialogs or steps (e.g. in dashboard or after auth).
- `src/presentation/components/features/onboarding/` – `income-onboarding-dialog.tsx`, `income-onboarding-form.tsx`, `budget-plan-settings.tsx`, `location-step.tsx`, `personal-data-step.tsx`, `household-income-settings.tsx`.
- `components/dashboard/onboarding-widget.tsx` – Prompts to complete onboarding.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/onboarding/income` | Get current income (for edit/prefill). |
| POST | `/api/v2/onboarding/income` | Save income (and possibly frequency). |
| POST | `/api/v2/onboarding/location` | Save location/region. |
| GET | `/api/v2/onboarding/budget-rule` | Get current budget rule. |
| POST | `/api/v2/onboarding/budget-rule` | Save budget rule (e.g. percentages). |

## Domain / Application

- **Domain:** `src/domain/onboarding/` – `onboarding.types.ts`, `onboarding.validations.ts`.
- **Application:** `src/application/onboarding/` – `onboarding.service.ts`, `onboarding.mapper.ts`, `onboarding.factory.ts`; `budget-generator.ts`, `category-helper.ts`, `onboarding-decision.service.ts` (when to show onboarding, what’s missing).

## Infrastructure

- Repositories or profile/household tables for storing income, location, budget rule. May reuse user or household rows.

## Dependencies

- Auth (current user). Household (for household income). Categories (for budget rule defaults). Goals and dashboard consume onboarding data.

## Subscription / Access

- All new users; not gated by plan. Onboarding decision service may consider plan for which steps to show.
