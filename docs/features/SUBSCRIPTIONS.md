# Subscriptions (Recurring)

## Purpose

Tracks **recurring subscriptions** (e.g. streaming, gym, software) as part of the user’s spending—not Stripe billing. Users can add, edit, and pause subscription services; the dashboard and reports can show recurring costs. Pause/resume refers to the user’s own tracking (e.g. “paused” subscription they’re not paying temporarily).

## User Flows

- List recurring subscriptions (services).
- Add a subscription service (name, amount, interval, etc.).
- Edit or remove a subscription.
- Pause/resume a subscription (tracking state).
- View subscriptions on dashboard (e.g. subscriptions widget) and in reports.

## Behavior / Logic

- **Two meanings:** (1) **Stripe billing** – the app’s own paid subscription; pause/resume endpoints and SubscriptionContext refer to this. (2) **Recurring subscription services** – user-tracked services (e.g. Netflix, gym); CRUD and dashboard widget use subscription-services service and repository.
- **Pause/resume (Stripe):** Pause status and resume are for the app’s billing subscription only. Recurring services may have their own “paused” state in the subscription-services table for the user’s tracking.
- **Scope:** Recurring services are scoped by household (or user). Dashboard shows recurring costs; reports may include them in spending.

## Key Routes / Pages

- `app/(protected)/subscriptions/page.tsx` – Subscriptions management.
- `src/presentation/components/features/dashboard/widgets/subscriptions-widget.tsx` – Dashboard widget.
- `src/presentation/components/features/subscriptions/paused-subscription-banner.tsx` – Banner when app billing is paused.

## API

**Recurring subscription services (user-tracked, e.g. Netflix, gym):** The (protected) subscriptions page uses the **user-subscriptions** v2 API. This is the same surface as the app’s stored subscription records; in this context it refers to the user’s list of recurring services they track.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/user-subscriptions` | List user’s (recurring) subscription services. |
| POST | `/api/v2/user-subscriptions` | Create a subscription service. |
| GET | `/api/v2/user-subscriptions/[id]` | Get one subscription service. |
| PUT | `/api/v2/user-subscriptions/[id]` | Update (name, amount, interval, etc.). |
| DELETE | `/api/v2/user-subscriptions/[id]` | Delete a subscription service. |
| POST | `/api/v2/user-subscriptions/[id]` | Pause or resume (body: `{ action: "pause" }` or `{ action: "resume" }`). |

**Stripe billing (app’s own paid subscription) pause/resume only:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/subscriptions/pause-status` | Pause status for Stripe billing subscription. |
| POST | `/api/v2/subscriptions/resume` | Resume Stripe billing subscription. |

Legacy routes under `/api/subscription-services` and `/api/admin/subscription-services` (e.g. plans, categories) still use `subscription-services` application layer; the main user-facing CRUD is via `/api/v2/user-subscriptions`.

## Domain / Application

- **Domain:** `src/domain/subscriptions/` – types/validations for Stripe subscription state; `src/domain/subscription-services/` – types for recurring subscription services.
- **Application:** `src/application/subscriptions/` – `subscriptions.service.ts`, `get-dashboard-subscription.ts` (Stripe state); `src/application/subscription-services/` – `subscription-services.service.ts` for recurring services.
- **Presentation:** SubscriptionContext stores subscription state; components use selectors.

## Infrastructure

- Supabase for stored subscription-services (if any). Stripe for billing subscription state (sync via webhooks and revalidate endpoint).
- Repositories for subscription-services and user-subscriptions.

## Dependencies

- Billing (Stripe) for plan and pause/resume. Categories for categorizing recurring spending.

## Subscription / Access

- Recurring subscription tracking may be available to all users or gated. Stripe pause/resume is for the app’s own billing subscription (SubscriptionContext, billing feature).
