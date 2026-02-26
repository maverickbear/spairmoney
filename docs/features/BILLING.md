# Billing (Stripe)

## Purpose

Manages the app’s **paid subscription** via Stripe: plans, checkout, customer portal, trial, and pause/resume. The app stores subscription state (user-subscriptions) and syncs with Stripe via webhooks and revalidate endpoint. SubscriptionContext and decision services control feature access.

## User Flows

- **New users:** After signup, users get a 30-day **app trial** (stored in `users.trial_ends_at`). No Stripe subscription is created until they click **Subscribe Now**. They can use the app immediately; a small **trial banner** at the top shows days left and a Subscribe Now button. When 2 days or less remain, the banner shows an urgency message. When the trial ends (or for existing users with no subscription), the same banner shows **billing period choice** (Monthly/Annual) and a Subscribe button that creates a Stripe Checkout Session. The blocking "Subscribe to Pro" dialog is shown only for **reactivation** (cancelled, past_due, unpaid), not for new users or trial-ended users.
- View current plan and billing status on settings/billing.
- Upgrade or change plan (redirect to Stripe Checkout or use Stripe Elements).
- Manage subscription (update payment method, cancel, etc.) via Stripe Customer Portal (link from app).
- Revalidate: after Stripe webhook or portal return, app revalidates subscription state.
- Pause subscription (Stripe); resume when ready.
- See trial celebration when applicable (dashboard, settings).

## Behavior / Logic

- **Subscription state:** The app keeps a local copy of subscription state (user_subscriptions); Stripe is the source of truth. Webhooks and the revalidate endpoint update local state after checkout, portal, or lifecycle events (e.g. cancelled, paused).
- **Feature access:** SubscriptionContext exposes plan and status; plan-features-service and decision services determine what’s allowed (e.g. account limit, reports, goals). Components use selectors from context; no business logic in UI.
- **Trial:** New users receive a 30-day local trial (`users.trial_ends_at` set on signup); no Stripe subscription until they click Subscribe Now in the trial banner. The **Pro trial banner** (`ProTrialBanner`) shows: active trial (days left + Subscribe Now), urgency when ≤2 days left, or trial-ended/no-subscription state with Monthly/Annual choice and Subscribe. After subscribing via the banner, Stripe Checkout creates the subscription and webhooks update local state. Stripe trialing and trial celebration are shown based on subscription state. Pause/resume (Stripe subscription) is exposed via subscriptions API; Resend segments are updated on lifecycle (active vs cancelled).
- **Plan override (admin):** Super admins can set an effective plan override per user via Admin → Users → Plan Override. This changes only the plan used for feature limits and access; it does not change Stripe, billing, or `app_subscriptions`. Stored in `users.admin_override_plan_id`; clearing the override restores normal resolution from subscription/cache.

## Key Routes / Pages

- `app/(protected)/settings/billing/page.tsx` – Billing page (plan, portal link, pause/resume).
- `app/subscription/success/page.tsx` – Post-checkout success.
- `contexts/subscription-context.tsx` – Subscription state; components use selectors.
- `src/presentation/components/features/billing/subscription-success-dialog.tsx`.
- Components: `BlockedFeature`, `CancelledSubscriptionBanner`, `PausedSubscriptionBanner` (from subscriptions feature), `ProTrialBanner` (trial banner with Subscribe Now / billing period choice).

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/billing/subscription` | Get current subscription (from Stripe + local state). |
| POST | `/api/v2/billing/revalidate-subscription` | Revalidate subscription after webhook or portal. |
| PUT | `/api/v2/admin/users/[userId]/plan-override` | Set or clear admin plan override (super_admin only; app-only, no Stripe change). |
| GET or POST | Stripe webhooks (e.g. customer.subscription.updated) | Update local state (handled in app API). |

Pause/resume for **Stripe** subscription: `/api/v2/subscriptions/pause-status`, `/api/v2/subscriptions/resume` (see [Subscriptions](SUBSCRIPTIONS.md) doc).

**Note:** The `/api/v2/user-subscriptions` API is used for **user-tracked recurring services** (e.g. Netflix, gym), not for Stripe billing state. See [Subscriptions (recurring)](SUBSCRIPTIONS.md). Stripe subscription state is returned by GET `/api/v2/billing/subscription` and updated via webhooks and revalidate.

## Domain / Application

- **Domain:** `src/domain/billing/` – `billing.types.ts`; `src/domain/subscriptions/` – subscription state types; `src/domain/stripe/` – Stripe-related types.
- **Application:** `src/application/billing/` – `billing.service.ts`, `billing.factory.ts`; `src/application/stripe/` – `stripe.service.ts`, `stripe.factory.ts`; `src/application/user-subscriptions/` – `user-subscriptions.service.ts`, `user-subscriptions.factory.ts`; `src/application/shared/plan-features-service.ts` – feature access by plan.
- **Trial:** `src/application/trial/trial.service.ts`, `trial.factory.ts` for trial logic.

## Infrastructure

- Stripe API (products, prices, checkout, portal, webhooks). Supabase (or DB) for user_subscriptions (local copy). Webhook handler verifies signature and updates state.
- **Resend contact segments:** Subscription lifecycle (trial start, active, cancel) syncs the user’s email to Resend segments (active vs cancelled) for campaigns. Implemented in `lib/utils/resend-segments.ts` (`ensureContactInActiveSegment`, `moveContactToCancelledSegment`). Optional env: `RESEND_SEGMENT_ACTIVE`, `RESEND_SEGMENT_CANCELLED`; failures are logged and do not block webhooks or signup.

## Dependencies

- Auth (current user). All paid features depend on billing for plan and feature flags.

## Subscription / Access

- Billing page and subscription state are for authenticated users. SubscriptionContext exposes plan; decision services and plan-features-service determine what’s allowed (e.g. account limit, reports, goals).
