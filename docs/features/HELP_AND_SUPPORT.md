# Help & Support

## Purpose

Provides in-app help content (FAQs, how-to) and a **contact form** for users to send support or general inquiries. Form submissions may be stored and viewed in the admin panel (contact forms).

## User Flows

- Open Help & Support page (/help-support).
- Read accordion or static help content (setup, accounts, transactions, billing, etc.).
- Submit contact form (name, email, subject, message); optional validation (e.g. Zod schema in lib/validations/contact).
- See confirmation after submit; admin can view submissions via admin/contact-forms.

## Behavior / Logic

- **Help content:** Static or accordion content (FAQs, how-to) is rendered on the help-support page; no API for content unless it is loaded from CMS or config. Form validation uses `contactFormSchema` (e.g. in `lib/validations/contact`).
- **Contact form:** The help-support page POSTs to **`/api/contact`** (legacy route). The contact service persists the submission; admin lists and updates submissions via GET/PUT `/api/v2/admin/contact-forms`. Optional: Resend to notify support on submit.
- **Scope:** Any authenticated user can view help and submit the form; listing submissions is admin-only.

## Key Routes / Pages

- `app/(protected)/help-support/page.tsx` – Client page with form and accordion content; uses `contactFormSchema`, `ContactFormData` from `lib/validations/contact`.
- No dedicated feature folder under presentation/features for “help”; form may POST to a legacy or v2 contact API.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/contact` | Submit contact form (legacy route; used by help-support page). |
| GET | `/api/v2/admin/contact-forms` | List contact form submissions (admin only). |
| PUT | `/api/v2/admin/contact-forms` | Update submission (e.g. reply, status) (admin only). |

Application layer: `src/application/contact/` – `contact.service.ts`, `contact.factory.ts`, `contact.mapper.ts`; domain `src/domain/contact/` – types and validations. The legacy `/api/contact` route persists via the contact service.

## Domain / Application

- **Domain:** `src/domain/contact/` – `contact.types.ts`, `contact.validations.ts`.
- **Application:** `src/application/contact/` – `contact.service.ts`, `contact.mapper.ts`, `contact.factory.ts` (create submission, list for admin).
- **Presentation:** Help page uses `lib/validations/contact` for form; may call fetch to contact API.

## Infrastructure

- Repository or table for contact_form_submissions (or equivalent). Email (Resend) optional to notify support on submit.

## Dependencies

- Auth (user context for pre-filling or identification). Admin feature to view submissions.

## Subscription / Access

- Available to all authenticated users. Admin contact-forms endpoint is admin-only.
