import { MetadataRoute } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { makeBlogService } from "@/src/application/blog/blog.factory";

/**
 * Sitemap configuration
 *
 * Generates XML sitemap for search engines with all public pages.
 * Set NEXT_PUBLIC_APP_URL to your canonical domain (e.g. https://spair.co) in production.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  noStore();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const currentDate = new Date();
  const blogService = makeBlogService();
  const posts = await blogService.getAllPosts();

  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/blog`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.dateModified
        ? new Date(post.dateModified + (post.dateModified.includes("T") ? "" : "T12:00:00Z"))
        : new Date(post.datePublished + (post.datePublished.includes("T") ? "" : "T12:00:00Z")),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  // Public pages that should be indexed
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/faq`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${base}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${base}/auth/signup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/auth/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...blogEntries,
  ];

  return publicPages;
}

