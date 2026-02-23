# Household & Members

## Purpose

Supports **households**: a shared space for accounts, transactions, and budgets (e.g. family). The **household** has info (name, currency, etc.); **members** are invited by email, accept (with or without password), and have roles (e.g. owner, member). Invites can be validated and resent; OTP flow supports completion after email verification.

## User Flows

- View household info (settings/household).
- Update household details (name, currency, etc.).
- List members; invite by email (validate invite endpoint may check availability).
- Resend invite; revoke or remove member.
- Accept invite: member follows link, may set password or complete after OTP (`accept-with-password`, `complete-after-otp`, `accept`).
- View members list on a dedicated members page.
- Onboarding may set household income (household-income-settings).

## Behavior / Logic

- **Household:** A user has an active household (or none). Household info (name, currency) is editable by members with the right role. All financial data (accounts, transactions, budgets, etc.) is scoped by household where applicable.
- **Invites:** Invite by email creates a pending member record and sends an email (Resend) with a link. Accept flows: accept-with-password (set password), complete-after-otp (after email verification), or generic accept. Only owners/admins can invite or remove members; role is enforced in the service.
- **Members list:** List shows current members and pending invites. Resend invite re-sends the email; revoke/remove deletes or deactivates the member.

## Key Routes / Pages

- `app/(protected)/settings/household/page.tsx` – Household settings.
- `app/(protected)/members/page.tsx` – Members list and invites.
- `src/presentation/components/features/household/household-module.tsx`.
- `src/presentation/components/features/onboarding/household-income-settings.tsx` (onboarding).

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/household/list` | List households (or current). |
| GET | `/api/v2/household/info` | Current household info. |
| GET | `/api/v2/members` | List members. |
| POST | `/api/v2/members` | Invite member (or create). |
| GET | `/api/v2/members/invite/validate` | Validate invite (e.g. token/email). |
| POST | `/api/v2/members/invite/accept-with-password` | Accept invite and set password. |
| POST | `/api/v2/members/invite/complete-after-otp` | Complete accept after OTP. |
| POST | `/api/v2/members/accept` | Accept invite (generic). |
| GET | `/api/v2/members/[id]` | Get member. |
| PATCH | `/api/v2/members/[id]` | Update member (e.g. role). |
| DELETE | `/api/v2/members/[id]` | Remove member. |
| POST | `/api/v2/members/[id]/resend` | Resend invite. |

## Domain / Application

- **Domain:** `src/domain/household/` – `household.types.ts`; `src/domain/members/` – `members.types.ts`, `members.validations.ts`.
- **Application:** `src/application/members/` – `members.service.ts`, `members.mapper.ts`, `members.factory.ts`. Household logic may be in members or a dedicated household service; list/info routes call application layer.

## Infrastructure

- Repositories for households and members (and invites). Supabase Auth for inviting (email) and OTP. Emails (Resend) for invite links.

## Dependencies

- Auth (for current user and invite flows). Billing/subscription may affect member limits per plan.

## Subscription / Access

- Authenticated users. Household/member count may be limited by plan. Only owners/admins may invite or remove members (enforced in service).
