import { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 *
 * Controls how search engine crawlers access and index the site.
 * Allow rules use path prefix: "/blog" allows /blog and all /blog/* URLs.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/faq",
          "/contact",
          "/terms-of-service",
          "/privacy-policy",
          "/auth/signup",
          "/auth/login",
        ],
        disallow: [
          "/dashboard",
          "/api",
          "/transactions",
          "/accounts",
          "/investments",
          "/reports",
          "/insights",
          "/planning",
          "/banking",
          "/members",
          "/subscription",
          "/account-blocked",
          "/account-deleted",
          "/maintenance",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/blog",
          "/faq",
          "/contact",
          "/terms-of-service",
          "/privacy-policy",
        ],
        disallow: [
          "/dashboard",
          "/api",
          "/transactions",
          "/accounts",
          "/investments",
          "/reports",
          "/insights",
          "/planning",
          "/banking",
          "/members",
          "/subscription",
          "/account-blocked",
          "/account-deleted",
          "/maintenance",
        ],
        crawlDelay: 0,
      },
      {
        userAgent: "Bingbot",
        allow: [
          "/",
          "/blog",
          "/faq",
          "/contact",
          "/terms-of-service",
          "/privacy-policy",
        ],
        disallow: [
          "/dashboard",
          "/api",
          "/transactions",
          "/accounts",
          "/investments",
          "/reports",
          "/insights",
          "/planning",
          "/banking",
          "/members",
          "/subscription",
          "/account-blocked",
          "/account-deleted",
          "/maintenance",
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

