"use client";

import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";

interface BlogBreadcrumbsProps {
  postTitle: string;
}

/**
 * Nav breadcrumbs for blog post (Home > Blog > Post). Supports SEO and accessibility.
 */
export function BlogBreadcrumbs({ postTitle }: BlogBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol
        className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="flex items-center gap-1"
        >
          <Link href="/" itemProp="item" className="hover:text-foreground hover:underline">
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </li>
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="flex items-center gap-1"
        >
          <Link href="/blog" itemProp="item" className="hover:text-foreground hover:underline">
            <span itemProp="name">Blog</span>
          </Link>
          <meta itemProp="position" content="2" />
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </li>
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="truncate text-foreground"
        >
          <span itemProp="name">{postTitle}</span>
          <meta itemProp="position" content="3" />
        </li>
      </ol>
    </nav>
  );
}
