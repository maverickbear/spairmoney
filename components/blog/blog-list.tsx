import { useTranslations } from "next-intl";
import { BlogPostCard } from "./blog-post-card";
import type { BlogPostListItem } from "@/src/domain/blog/blog.types";

interface BlogListProps {
  posts: BlogPostListItem[];
}

export function BlogList({ posts }: BlogListProps) {
  const t = useTranslations("common");
  if (posts.length === 0) {
    return (
      <section aria-label="Blog posts" className="py-8">
        <p className="text-center text-muted-foreground">
          {t("noPostsYet")}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Blog posts"
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {posts.map((post) => (
        <BlogPostCard key={post.slug} post={post} />
      ))}
    </section>
  );
}
