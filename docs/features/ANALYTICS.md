# Analytics (Landing Page)

Landing page tracking uses **Google Analytics 4 (GA4)**. The Measurement ID is configured in **Admin → SEO Settings** (`googleTagId`), stored in Supabase `system_config_settings.seo_settings`, and loaded by the client via `GET /api/seo-settings/public`. The tag is injected in the root layout ([components/common/google-tag.tsx](../../components/common/google-tag.tsx)) and runs on all pages; filter in GA4 by page path to analyze landing-only traffic.

## Traffic sources (“de onde vêm”)

GA4 **Acquisition** reports provide source/medium/campaign:

- **Where:** GA4 → Reports → Acquisition → User acquisition (or Traffic acquisition).
- **Dimensions:** Session source, Session medium, Session campaign.
- **Data:** Comes from UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`) on campaign URLs, or from HTTP referrer when no UTM is present.

Use UTM on marketing links (e.g. `?utm_source=facebook&utm_medium=cpc&utm_campaign=launch`) so campaigns appear correctly in Acquisition. Ensure **Enhanced measurement** is enabled in GA4 (Admin → Data streams → your web stream) for outbound clicks, file downloads, and scrolls.

## Click tracking (“o que eles clicam”)

Custom events are sent for landing CTAs and links so you can segment by section and link in GA4.

- **Event name:** `landing_click`
- **Helper:** [lib/analytics/landing-events.ts](../../lib/analytics/landing-events.ts) — `trackLandingClick({ section, link_id, destination?, interval? })`
- **Types:** [lib/analytics/gtag.d.ts](../../lib/analytics/gtag.d.ts) extends `Window` with `gtag` and `dataLayer`.

### Event parameters

| Parameter    | Description                          |
|-------------|--------------------------------------|
| `section`   | Section of the page (header, hero, pricing, cta, footer). |
| `link_id`   | Identifier for the clicked element (see table below).     |
| `destination` | Optional; target URL or hash (e.g. `/auth/signup`, `#features`). |
| `interval`  | Optional; only for pricing CTA: `month` or `year`.       |

### Where events are sent

| Section  | link_id                | destination   |
|----------|------------------------|---------------|
| **header** | nav_home, nav_features, nav_pricing, nav_blog | /, /#features, /#pricing, /blog |
| **header** | header_sign_in, header_start_trial    | /auth/login, /auth/signup |
| **header** | header_dashboard, header_logout       | /dashboard, (none) |
| **hero**   | cta_start_trial, cta_how_it_works    | /auth/signup, #features |
| **pricing**| pricing_toggle_monthly, pricing_toggle_yearly | (none) |
| **pricing**| cta_start_trial                      | /auth/signup (+ interval) |
| **cta**    | cta_reveal_spending                  | /auth/signup |
| **footer** | footer_features, footer_pricing, footer_faq, footer_contact, footer_privacy, footer_terms, footer_help | #features, #pricing, #faq, /contact, /privacy-policy, /terms-of-service, /faq |

In GA4, use **Reports → Engagement → Events** and filter by event name `landing_click`, then break down by `section` or `link_id` (if registered as custom dimensions).
