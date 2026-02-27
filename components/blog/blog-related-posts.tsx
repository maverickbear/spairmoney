"use client";

import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import type { BlogPostListItem } from "@/src/domain/blog/blog.types";

interface BlogRelatedPostsProps {
  posts: BlogPostListItem[];
  title?: string;
}

/**
 * Related posts section for blog post page. Internal links for SEO and engagement.
 */
export function BlogRelatedPosts({ posts, title = "Related articles" }: BlogRelatedPostsProps) {
  if (!posts.length) return null;

  return (
    <aside className="mt-16 pt-10 border-t border-border" aria-label="Related articles">
      <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
        {posts.map((post) => {
          const date = post.datePublished.includes("T")
            ? new Date(post.datePublished)
            : new Date(post.datePublished + "T12:00:00Z");
          return (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block group p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground group-hover:underline block line-clamp-2">
                  {post.title}
                </span>
                <time dateTime={post.datePublished} className="text-xs text-muted-foreground mt-1 block">
                  {format(date, "MMM d, yyyy")}
                </time>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
