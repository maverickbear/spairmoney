# Production deployment

Checklist and notes for deploying Spair Money to production.

## Build and run

```bash
npm ci
npm run build
npm run start
```

- **Build:** `next build` (Turbopack). Ensure `NODE_ENV=production` (set automatically by `next build`).
- **Start:** `next start` serves the built app. Use a process manager (e.g. PM2, systemd) or a platform (Vercel, Railway, etc.) in production.

## Environment variables (production)

Set these in your hosting (e.g. Vercel project settings). Do not commit `.env.production` or secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/publishable key (client-safe) |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret for `/api/stripe/webhook` |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (e.g. `https://app.spair.co`) for redirects and emails |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for error tracking (client + server) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Optional | For Sentry source map upload during build |
| `RESEND_API_KEY` | Yes (for email) | Resend API key for transactional email |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` | Optional | Sanity blog/CMS |
| `OPENAI_API_KEY` | Optional | OpenAI for category suggestions, Spair Score, receipts AI |
| `ENCRYPTION_KEY` or `NEXT_PUBLIC_ENCRYPTION_KEY` | Optional | For encrypted fields (see app docs) |
| `CRON_SECRET` | Optional | Shared secret for cron-triggered routes (e.g. import jobs, welcome email batch) |

## Pre-deploy checklist

- [ ] All production env vars set (Supabase, Stripe, Resend, `NEXT_PUBLIC_APP_URL`).
- [ ] Stripe webhook endpoint configured to `https://<your-domain>/api/stripe/webhook` with the correct events; `STRIPE_WEBHOOK_SECRET` matches.
- [ ] Supabase Auth redirect URLs include your production URL and (if used) custom domain.
- [ ] Sentry project created and DSN set if using error tracking.
- [ ] `npm run build` succeeds locally (or in CI).
- [ ] No secrets in client bundle; only `NEXT_PUBLIC_*` and publishable keys are exposed.

## Production behavior

- **Language selector:** Hidden in production; visible only in development. Locale is determined by cookie and `Accept-Language`.
- **Sanity Vision:** Loaded only in development; production build does not bundle `@sanity/vision`.
- **Console:** `console.log` / `console.info` / `console.debug` are removed in production builds (see `next.config.ts`); `console.error` and `console.warn` are kept.
- **Security headers:** Set in `next.config.ts` (HSTS, X-Frame-Options, CSP, etc.) for all routes.
- **Caching:** Dynamic app routes use `Cache-Control: no-store`; static assets and landing use appropriate cache headers.

## Optional: Vercel

- Connect the repo; set env vars in Project Settings.
- Build command: `npm run build` (or leave default). Output: Next.js.
- Stripe webhook URL: `https://<vercel-domain>/api/stripe/webhook`.
- If using a custom domain (e.g. `app.spair.co`), set `NEXT_PUBLIC_APP_URL` to that URL.

## Optional: Sentry

- Set `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, and `SENTRY_PROJECT` so the Sentry Next.js config can upload source maps and link errors.
- Sample rates for production are set in `sentry.client.config.ts` and `sentry.server.config.ts` (e.g. `tracesSampleRate: 0.1`, `replaysSessionSampleRate: 0.1`).
