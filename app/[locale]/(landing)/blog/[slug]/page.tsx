import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { makeBlogService } from "@/src/application/blog/blog.factory";
import { BlogPostContent } from "@/components/blog/blog-post-content";
import { BlogPostHero } from "@/components/blog/blog-post-hero";
import { BlogPostStructuredData } from "@/components/blog/blog-structured-data";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogRelatedPosts } from "@/components/blog/blog-related-posts";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  noStore();
  const { slug } = await params;
  const blogService = makeBlogService();
  const post = await blogService.getPostBySlug(slug);
  if (!post) {
    return { title: "Post not found" };
  }
  const url = `${BASE_URL}/blog/${post.slug}`;
  const ogImage =
    post.image?.src &&
    (post.image.src.startsWith("http") ? post.image.src : `${BASE_URL}${post.image.src}`);
  return {
    title: `${post.title} | Spair Money Blog`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified ?? undefined,
      authors: [post.author],
      siteName: "Spair Money",
      ...(ogImage && {
        images: [{ url: ogImage, width: post.image?.width, height: post.image?.height, alt: post.image?.alt ?? post.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(ogImage && { images: [ogImage] }),
    },
    ...(post.keywords?.length && { keywords: post.keywords }),
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  noStore();
  const { slug } = await params;
  const blogService = makeBlogService();
  const [post, relatedPosts] = await Promise.all([
    blogService.getPostBySlug(slug),
    blogService.getRelatedPosts(slug, 3),
  ]);
  if (!post) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <BlogPostStructuredData post={post} />
      <BlogBreadcrumbs postTitle={post.title} />
      <BlogPostHero post={post} />
      <BlogPostContent post={post} />
      <BlogRelatedPosts posts={relatedPosts} />
    </div>
  );
}
