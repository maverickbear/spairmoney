# Admin

## Purpose

**Admin-only** back office: manage users (list, block, unblock), invites (list, validate, register), promo codes, system settings, contact form submissions, feedback entries, and plans. Used by support or ops, not end users.

## User Flows

- Sign up or register as admin (admin/signup, admin/register); or use existing admin user.
- View admin dashboard (metrics, counts).
- List and block/unblock users.
- Manage invites (list, validate, resend or revoke).
- Manage promo codes (create, list, deactivate).
- View and reply to contact form submissions.
- View feedback list.
- Manage plans (Stripe products/prices or app-specific plan config) via admin/plans.
- Update system settings (feature flags, limits, etc.).

## Behavior / Logic

- **Access:** Every admin route and page must verify the current user has admin role (e.g. `user.role === 'admin'` or super_admin). Unauthorized requests return 403. No subscription check; admin is role-based only.
- **Docs viewer:** GET `/api/v2/admin/docs?path=...` returns raw markdown for a doc under `docs/`; the in-app viewer at `/admin/docs` uses this and renders with a sidebar (DOC_ITEMS). Same files as this documentation index.
- **Resend:** When blocking users or ending subscriptions, admin may call Resend segment helpers to move the contact to the “cancelled” segment for email campaigns.

## Key Routes / Pages

- **Admin app** at `/admin` with its own sidebar (see `components/admin/admin-side-nav.tsx`): Dashboard, Users, Promo Codes, System Entities, Contact Forms, Feedback, Plans, Subscription Services, Tax Rates, SEO Settings, Sanity Studio, **Docs**.
- **Docs** at `/admin/docs`: in-app documentation viewer (sidebar list of App Overview + all feature docs, markdown rendered). Available after Sanity Studio in the menu.
- Other pages: users, invites, promo codes, contact forms, feedback, plans, system settings.
- API routes under `/api/v2/admin/` are admin-only (role or secret checked in route or feature guard).

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v2/admin/signup` | Admin signup. |
| POST | `/api/v2/admin/register` | Admin register. |
| GET | `/api/v2/admin/invites` | List invites. |
| GET | `/api/v2/admin/invites/validate` | Validate invite (query `token=...`). |
| GET | `/api/v2/admin/users` | List users. |
| PUT | `/api/v2/admin/users/block` | Block user. |
| PUT | `/api/v2/admin/users/unblock` | Unblock user. |
| GET | `/api/v2/admin/promo-codes` | List promo codes. |
| POST | `/api/v2/admin/promo-codes` | Create promo code. |
| PUT | `/api/v2/admin/promo-codes` | Update promo code. |
| DELETE | `/api/v2/admin/promo-codes` | Delete/deactivate promo code. |
| GET | `/api/v2/admin/dashboard` | Admin dashboard data. |
| GET | `/api/v2/admin/system-settings` | Get system settings. |
| PUT | `/api/v2/admin/system-settings` | Update system settings. |
| GET | `/api/v2/admin/contact-forms` | List contact form submissions. |
| PUT | `/api/v2/admin/contact-forms` | Update contact form (e.g. reply, status). |
| GET | `/api/v2/admin/feedback` | List feedback. |
| GET | `/api/v2/admin/plans` | List plans. |
| PUT | `/api/v2/admin/plans` | Update plans. |
| GET | `/api/v2/admin/docs` | Get raw markdown for a doc (query `path=APP_OVERVIEW.md` or `path=features/AUTH.md`). Used by the in-app Docs viewer. |

## Domain / Application

- **Domain:** `src/domain/admin/` – `admin.types.ts`, `admin.validations.ts`, `admin.constants.ts`.
- **Application:** `src/application/admin/` – `admin.service.ts`, `admin.factory.ts`. Uses user, invite, feedback, contact repositories and Stripe for promo/plans.

## Infrastructure

- Same Supabase (and Stripe) as main app. Admin role stored in user table or auth metadata; RLS or service layer enforces admin-only access. Stripe for promo codes and plans.
- **Resend segments:** When blocking users or ending subscriptions, the admin flow may sync the contact to the “cancelled” segment via `lib/utils/resend-segments.ts` (`moveContactToCancelledSegment`).

## Dependencies

- Auth (admin role). User, Members/Invites, Feedback, Contact, Billing/Stripe.

## Subscription / Access

- All admin endpoints are **admin-only**. Enforced via `getCurrentUserId()` plus role check (e.g. user.role === 'admin') in route or feature guard; return 403 if not admin.
