# Feedback

## Purpose

Lets users submit **product feedback** (rating and free text). Submissions are stored and visible in the admin panel. Used for product improvement and support.

## User Flows

- Open Feedback page (/feedback).
- Select rating (e.g. 1–5 stars); optionally write feedback text.
- Submit form (validated with feedbackSchema).
- See confirmation. Admin views feedback via admin/feedback API.

## Behavior / Logic

- **Submit:** The feedback page POSTs to **`/api/feedback`** (legacy route). User submits rating (e.g. 1–5) and optional text; validated with `feedbackSchema` from `lib/validations/feedback`. Feedback service persists to DB; submission is tied to user or session for attribution.
- **Admin:** GET `/api/v2/admin/feedback` lists all feedback entries (admin-only). No reply flow in the doc; admin can view only unless a reply feature is added.
- **Scope:** All authenticated users can submit; listing is admin-only. No feature gate on submission.

## Key Routes / Pages

- `app/(protected)/feedback/page.tsx` – Client page with rating and textarea; uses `feedbackSchema`, `FeedbackData` from `lib/validations/feedback`.
- Form may POST to a feedback API (v2 or legacy).

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/feedback` | Submit feedback (legacy route; used by feedback page). |
| GET | `/api/v2/admin/feedback` | List feedback entries (admin only). |

Application: `src/application/feedback/` – `feedback.service.ts`, `feedback.mapper.ts`, `feedback.factory.ts`. The legacy `/api/feedback` route calls the feedback service and validates with domain schema.

## Domain / Application

- **Domain:** `src/domain/feedback/` – `feedback.types.ts`, `feedback.validations.ts`.
- **Application:** `src/application/feedback/` – `feedback.service.ts`, `feedback.mapper.ts`, `feedback.factory.ts`.

## Infrastructure

- Repository for feedback table (snake_case). Supabase or same DB.

## Dependencies

- Auth (to associate feedback with user or session). Admin to list feedback.

## Subscription / Access

- All authenticated users can submit. Admin-only for listing feedback.
