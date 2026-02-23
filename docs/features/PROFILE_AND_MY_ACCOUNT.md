# Profile & My Account

## Purpose

**Profile:** User profile data (name, email, avatar, etc.) and preferences. **My Account:** Account-level settings, role, and destructive actions (e.g. delete account). Avatar upload and profile update use API; delete account anonymizes or removes user data and may revoke auth.

## User Flows

- View and edit profile (name, email, avatar) on settings/profile.
- Upload avatar (profile/avatar endpoint).
- View “My Account” (settings/myaccount): user info, role, delete account.
- Delete account: confirm then call delete-account API; data is anonymized or removed per profile-anonymization service.
- User/role endpoints support role display or admin assignment.

## Behavior / Logic

- **Profile:** Name, email, avatar are stored in profile or user table; avatar may be in storage (e.g. Supabase Storage). Update and avatar upload validate input and persist via profile service; no business rules beyond ownership.
- **Delete account:** delete-account endpoint calls profile-anonymization service: anonymize or remove PII (e.g. transactions, profile), then revoke auth/session. Irreversible; confirmation is required in the UI. Role changes (e.g. user/role PATCH) are typically admin-only and enforced in the service.

## Key Routes / Pages

- `app/(protected)/settings/profile/page.tsx` – Profile form and avatar.
- `app/(protected)/settings/myaccount/page.tsx` – My account (user, role, delete).
- `app/(protected)/settings/page.tsx` – Settings shell (links to profile, billing, household, categories).

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/profile` | Get current user profile. |
| PATCH/PUT | `/api/v2/profile` | Update profile. |
| POST | `/api/v2/profile/avatar` | Upload avatar. |
| DELETE | `/api/v2/profile/delete-account` | Delete account (anonymize/remove data, revoke auth). |
| GET | `/api/v2/user` | Get current user (e.g. id, email). |
| GET | `/api/v2/user/role` | Get user role. |
| PATCH | `/api/v2/user/role` | Update user role (e.g. admin). |

## Domain / Application

- **Domain:** `src/domain/profile/` – `profile.types.ts`, `profile.validations.ts`.
- **Application:** `src/application/profile/` – `profile.service.ts`, `profile.mapper.ts`, `profile.factory.ts`; `profile-anonymization.service.ts` for delete-account (anonymize transactions, remove PII, etc.).

## Infrastructure

- Repositories for profile/user (Supabase Auth + custom profile table if any). Storage (Supabase Storage or similar) for avatar. Auth for session and delete-account (sign out, delete user).

## Dependencies

- Auth (current user). Billing/subscription may be shown on my account or settings.

## Subscription / Access

- Authenticated users only. Role changes may be admin-only (enforced in service).
