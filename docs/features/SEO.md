# SEO – Diagnosis, Changes, and Checklist

This document describes the SEO setup for the Spair Money landing and blog, what was diagnosed, what was changed, and how to validate and improve further.

---

## (a) Diagnosis – What Was Found

### Structure and headings

- **Landing:** One H1 per page (hero headline). Sections use H2 (e.g. “Spair turns transactions into clarity”, “Take it with you”, “FAQ”). Hierarchy is correct.
- **Blog list:** No H1 on the list page (hero/banner may use a heading); consider adding a single H1 such as “Blog” or “Personal finance tips” for clarity.
- **Blog post:** Post title is the only H1 (in hero or in content header). Portable Text was rendering content `h1` as `<h1>`, which could create a second H1; this was fixed by rendering content `h1` as `<h2>` in the blog context.

### Titles and meta descriptions

- **Landing:** Title and description come from Admin → SEO Settings (Supabase). Fallback `defaultSEOSettings` in `app/[locale]/(landing)/page.tsx` is used when DB is unavailable. Descriptions are unique and keyword-aware.
- **Blog index:** Title/description from i18n `metadata.blogTitle` and `metadata.blogDescription`. Canonical and OG/Twitter are set.
- **Blog post:** Unique title (`Post title | Spair Money Blog`), description from post, canonical and OG/Twitter (including article dates and optional OG image). Keywords from post when present.

### Canonical, robots, sitemap

- **Canonical:** Landing and blog (index and posts) set `alternates.canonical` to the correct absolute URL. Base URL comes from `NEXT_PUBLIC_APP_URL`.
- **robots.txt:** Served by `app/robots.ts`. Allows `/`, `/blog`, `/faq`, `/contact`, terms, privacy, auth signup/login. Disallows dashboard, api, app routes. Sitemap URL is `{base}/sitemap.xml`. Path prefix `/blog` allows all `/blog/*` URLs.
- **sitemap.xml:** Served by `app/sitemap.ts`. Includes home, faq, terms, privacy, signup, login, contact, blog index, and all blog post URLs with `lastModified` and priorities. Base URL normalized (no trailing slash) for consistent URLs.

### Open Graph and Twitter cards

- **Landing:** OG and Twitter set in `generateMetadata` (landing page), including image (from SEO settings or `/og-image.png`).
- **Blog index:** OG and Twitter set in blog layout.
- **Blog post:** OG type `article` with `publishedTime` / `modifiedTime` and authors. OG/Twitter image added when the post has an image.

### Favicon and app icons

- **Current:** `app/icon.svg` is used for favicon and shortcut. Root layout now also sets `apple` to `/icon.svg` for Apple devices.
- **Gap:** No dedicated `icon-512x512.png` or `apple-touch-icon.png` in the repo; schema and PWA may expect a 512px icon. Logo in JSON-LD was updated to use `/icon.svg` so it works without that file.

### Schema.org (JSON-LD)

- **Landing:** Organization, WebSite (with `@id`), BreadcrumbList (Home), WebPage (homepage), SoftwareApplication, FAQPage (from `LANDING_FAQ_ITEMS`).
- **Blog list:** Blog with `blogPost` array (BlogPosting items).
- **Blog post:** BlogPosting (headline, dates, author, publisher, image) and BreadcrumbList (Home > Blog > Post).

### Internal links

- **Landing:** Header/footer link to Blog, FAQ, Pricing, Contact. FAQ section was present in code but not rendered on the landing; it is now included so users and crawlers see the same FAQs as in FAQPage schema.
- **Blog:** List links to each post. Post page now has breadcrumbs (Home > Blog > Post) and a “Related articles” block with links to related posts (by tags, then recency).

### Accessibility

- **Landing:** Skip link “Skip to main content”, `main` with `aria-label`, hero image uses translated `alt`. FAQ section uses semantic headings and accordion.
- **Blog:** Breadcrumbs with `aria-label="Breadcrumb"`. Post hero image uses `alt` from post (or title). Form labels should be checked on auth/signup flows (outside this SEO pass).

### Performance

- **Landing hero:** Hero image uses Next.js `Image` with `priority` (eager load, LCP-friendly).
- **Blog post images:** Hero uses `priority`; inline images in Portable Text use default loading. Preconnect for Fontshare and Stripe is in root layout.
- **Recommendation:** Keep an eye on Core Web Vitals (LCP, INP, CLS) via Vercel Speed Insights or PageSpeed Insights; no render-blocking or heavy JS changes were introduced.

### Duplicate content and thin content

- **Locale:** `localePrefix: "never"` with default locale `en` means the site is served at `/` (no `/en`), so no duplicate locale URLs.
- **Blog:** Each post has a single canonical URL and unique title/description. No duplicate or thin post URLs were identified.

### Public pages (excluding blog) – gaps fixed

- **Landing (home):** Full metadata, canonical, OG/Twitter, schema. OK from the start.
- **FAQ (`/faq`):** Page is a client component and had no dedicated metadata; it inherited the generic locale title/description and had no canonical or OG. **Fixed:** added `(landing)/faq/layout.tsx` with unique title, description, canonical, robots, openGraph, twitter.
- **Contact (`/contact`):** Same as FAQ. **Fixed:** added `(landing)/contact/layout.tsx` with unique title, description, canonical, robots, openGraph, twitter.
- **Terms of Service (`/terms-of-service`):** Had only `title` and `description`; no canonical or OG. **Fixed:** added canonical, robots, openGraph, twitter to page metadata.
- **Privacy Policy (`/privacy-policy`):** Same as Terms. **Fixed:** added canonical, robots, openGraph, twitter.
- **Sign up (`/auth/signup`) and Log in (`/auth/login`):** No dedicated metadata; they inherited locale metadata. **Fixed:** added `auth/signup/layout.tsx` and `auth/login/layout.tsx` with unique title, description, canonical, robots, openGraph, twitter.

With these changes, **all public pages (excluding blog posts) now follow SEO best practices:** unique title and meta description, canonical URL, Open Graph and Twitter cards, and explicit robots where relevant.

---

## (b) List of Changes (Files and Relevant Parts)

| Area | File(s) | Change |
|------|--------|--------|
| Landing FAQ | `components/landing/landing-view.tsx` | Import and render `FAQSection` between Trust and Pricing so the FAQ block is visible and matches FAQPage schema. |
| WebPage schema | `src/presentation/components/seo/structured-data.tsx` | Added WebPage JSON-LD for homepage (`@id`, `isPartOf` → WebSite, `about` → Organization). Added `@id` to WebSite for reference. Fallback logo changed from `icon-512x512.png` to `icon.svg`. |
| Single H1 in blog body | `components/blog/blog-portable-text.tsx` | Content `h1` from Portable Text is now rendered as `<h2>` so the page has only one H1 (the post title). |
| Related posts | `src/application/blog/blog.service.ts` | New `getRelatedPosts(slug, count)` returning posts by shared tags then recency (excludes current). |
| Blog breadcrumbs | `components/blog/blog-breadcrumbs.tsx` | New component: nav with Home > Blog > Post title and schema-friendly markup. |
| Blog related UI | `components/blog/blog-related-posts.tsx` | New component: “Related articles” list with links to related posts. |
| Blog post page | `app/[locale]/(landing)/blog/[slug]/page.tsx` | Fetches related posts; renders `BlogBreadcrumbs` and `BlogRelatedPosts`. OG/Twitter image set when post has image. `modifiedTime` only when present. |
| Blog post schema | `components/blog/blog-structured-data.tsx` | Publisher logo URL set to `/icon.svg`. Added BreadcrumbList JSON-LD (Home > Blog > Post). |
| Blog layout metadata | `app/[locale]/(landing)/blog/layout.tsx` | Added `robots: { index: true, follow: true }` and `keywords` for the blog index. |
| Root layout icons | `app/layout.tsx` | Added `apple: "/icon.svg"` for Apple touch icon. |
| Sitemap | `app/sitemap.ts` | Comment that `NEXT_PUBLIC_APP_URL` should be the canonical domain (e.g. https://spair.co). Normalized base URL (no trailing slash) for all sitemap URLs. |
| Robots | `app/robots.ts` | Comment that `/blog` allows all `/blog/*` URLs. Normalized base URL for sitemap. |
| FAQ metadata | `app/[locale]/(landing)/faq/layout.tsx` | New layout: unique title (from i18n faq.title), description, canonical, robots, OG, Twitter. |
| Contact metadata | `app/[locale]/(landing)/contact/layout.tsx` | New layout: unique title (from i18n contactPage.title), description, canonical, robots, OG, Twitter. |
| Terms metadata | `app/[locale]/(landing)/terms-of-service/page.tsx` | Added canonical, robots, openGraph, twitter to metadata. |
| Privacy metadata | `app/[locale]/(landing)/privacy-policy/page.tsx` | Added canonical, robots, openGraph, twitter to metadata. |
| Sign up metadata | `app/[locale]/auth/signup/layout.tsx` | New layout: unique title, description, canonical, robots, OG, Twitter. |
| Log in metadata | `app/[locale]/auth/login/layout.tsx` | New layout: unique title, description, canonical, robots, OG, Twitter. |

---

## (c) Recommendations – Content and Keywords for Next Steps

- **Landing copy:** Keep one clear value proposition in the H1 and subheadline. Current hero is on-brand; if testing CTR, consider A/B testing meta title/description from Admin SEO Settings (e.g. include “free trial” or “personal finance app” where natural).
- **Blog content:** Target long-tail queries such as “how to build a monthly budget”, “why track expenses”, “get out of debt without stress”. Reuse existing tags (Budget, Tips, Spending, Debt, Planning) and add new ones (e.g. “Savings”, “Subscriptions”, “Spair Score”) as you publish.
- **New post ideas:** “How to set up a household budget with your partner”, “What is the 50/30/20 rule and how to use it”, “Best way to track subscriptions”, “How to use Spair Score to improve your finances”, “CSV import: how to bring your bank history into Spair”.
- **Keywords to use naturally:** personal finance, expense tracking, budget app, savings goals, debt payoff, household finance, financial clarity, Spair Money, Spair Score.
- **Future technical:** Add a dedicated 512×512 PNG for PWA/rich results if you want a larger icon. Consider `lastmod` in sitemap from CMS when using Sanity. Optional: table of contents (TOC) for long posts with multiple H2s.

---

## (d) Checklist – Validate After Deployment

Use this list to confirm SEO and performance after going live.

- [ ] **Canonical domain:** `NEXT_PUBLIC_APP_URL` is set to the canonical domain (e.g. `https://spair.co` or `https://app.spair.co`) in production.
- [ ] **Sitemap:** Open `https://<canonical>/sitemap.xml` and confirm home, faq, terms, privacy, contact, signup, login, blog, and all blog post URLs appear with correct `lastmod` and no trailing slash on base.
- [ ] **Robots:** Open `https://<canonical>/robots.txt` and confirm `Allow: /` and `Allow: /blog`, `Sitemap:` URL correct, and no accidental disallow of public pages.
- [ ] **Landing meta:** View source on `/`. Check one `<title>`, one meta description, one canonical link, and OG/Twitter tags. Check that FAQ section is visible on the page.
- [ ] **Blog index:** View source on `/blog`. Check title, description, canonical, and Blog JSON-LD.
- [ ] **Blog post:** View source on a post URL. Check single H1 (post title), BreadcrumbList and BlogPosting JSON-LD, canonical, OG article with image when present, and “Related articles” links at the bottom.
- [ ] **Public pages (no blog):** View source on `/faq`, `/contact`, `/terms-of-service`, `/privacy-policy`, `/auth/signup`, `/auth/login`. Each should have a unique `<title>`, meta description, canonical link, and OG/Twitter tags.
- [ ] **Rich results:** Use [Google Rich Results Test](https://search.google.com/test/rich-results) for the homepage and one blog post. Confirm Organization, WebSite, WebPage, FAQPage (home), BlogPosting and BreadcrumbList (post) are valid.
- [ ] **PageSpeed / Core Web Vitals:** Run [PageSpeed Insights](https://pagespeed.web.dev/) on the landing and one blog post. Ensure LCP is acceptable; hero image uses `priority` and should not block LCP.
- [ ] **Indexation:** In Google Search Console, request indexing for the sitemap and spot-check important URLs. Confirm no critical pages are “Blocked” or “Crawled – currently not indexed” without reason.
- [ ] **Mobile and accessibility:** Quick check: skip link works, one H1 per page, images have alt text, breadcrumbs and FAQ are readable and focusable.
