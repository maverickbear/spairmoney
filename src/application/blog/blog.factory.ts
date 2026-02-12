/**
 * Blog factory – dependency injection for BlogService.
 * Uses Sanity when NEXT_PUBLIC_SANITY_PROJECT_ID is set, otherwise static posts.
 *
 * Production: set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET
 * in your host (e.g. Vercel) so the blog uses Sanity. Resolved per call so
 * runtime env is always respected (no stale choice from build).
 */

import { isSanityConfigured } from "@/src/infrastructure/external/sanity/sanity-client";
import { BlogService } from "./blog.service";
import { sanityBlogRepositoryAdapter } from "./sanity-blog-repository.adapter";
import { staticBlogRepository } from "./static-blog.repository";

export function makeBlogService(): BlogService {
  const repo = isSanityConfigured() ? sanityBlogRepositoryAdapter : staticBlogRepository;
  return new BlogService(repo);
}
