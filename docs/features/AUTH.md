# Auth

## Purpose

Handles user authentication: sign-up (email), sign-in (email or Google), sign-out, and password reset. Session is managed by Supabase Auth with HTTP-only cookies.

## User Flows

- **Sign up:** User submits email and password; account is created; email verification can be required.
- **Sign in:** User signs in with email/password or Google OAuth; session is established.
- **Sign out:** User signs out; session is cleared.
- **Reset password:** User requests reset link; after following the link, can set a new password.

## Behavior / Logic

- **Sign up:** Email and password validated with `signUpSchema`; Supabase Auth creates the user. Email verification may be required by config. On success, the app may add the contact to the Resend “active” segment (best-effort, non-blocking).
- **Sign in:** Email/password or Google OAuth; session is stored in HTTP-only cookies via `@supabase/ssr`. Only one active session per user is assumed; sign-out clears the session.
- **Reset password:** Request sends a reset link to the user’s email; completion endpoint sets the new password. No subscription or feature gates; auth is the entry point for all protected areas.

## Key Routes / Pages

- `app/auth/` – Login, signup, reset password pages.
- `contexts/auth-context.tsx` – Client-side auth state and helpers.

## Trusted device (skip OTP for 30 days)

After the user verifies OTP (email or Google), they can check “Ask again in 30 days”. That choice is stored in Supabase in the `trusted_browsers` table (per user, per browser fingerprint). On the next login, if the device is trusted, the app skips OTP and signs in with password (or Google) only. Trust expires after 30 days. See `scripts/add-trusted-browsers-table.sql` for the schema.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v2/auth/signup` | Register new user (validates with `signUpSchema`). |
| POST | `/api/v2/auth/google-signin` | Initiate or complete Google OAuth sign-in. |
| POST | `/api/v2/auth/sign-out` | Sign out and clear session. |
| POST | `/api/v2/auth/reset-password` | Request or complete password reset. |
| POST | `/api/v2/auth/trusted-device` | Register current device as trusted (auth required). |
| POST | `/api/v2/auth/trusted-device/check` | Check if email + fingerprint is trusted (login flow). |

## Domain / Application

- **Domain:** `src/domain/auth/` – `auth.types.ts`, `auth.validations.ts` (e.g. `signUpSchema`).
- **Application:** `src/application/auth/` – `auth.service.ts` (signUp, signIn, etc.), `auth.mapper.ts`, `auth.factory.ts` (`makeAuthService()`).
- Validations: Zod schemas in domain; API routes parse body and call service.

## Infrastructure

- Supabase Auth (email/password and Google provider).
- Auth repository or direct Supabase Auth client usage from infrastructure.
- Session/cookies via `@supabase/ssr`.
- **Resend (optional):** On signup, the app can add the contact to an “active” Resend segment for email campaigns via `lib/utils/resend-segments.ts` (`ensureContactInActiveSegment`). Segment sync is best-effort and does not block registration.

## Dependencies

- None (auth is the entry point for protected features).

## Subscription / Access

- Not gated by subscription. All users must be authenticated to use protected areas; subscription gates specific features elsewhere.
