import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${baseUrl}/blog`,
      siteName: t("titleSuffix"),
      title: t("blogTitle"),
      description: t("blogOgDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("blogTitle"),
      description: t("blogTwitterDescription"),
    },
    alternates: {
      canonical: `${baseUrl}/blog`,
      types: {
        "application/rss+xml": `${baseUrl}/blog/feed`,
      },
    },
  };
}

/** Header and footer are provided by (landing) layout. Main is full width so the blog hero banner can span edge-to-edge; content uses its own container. */
export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="w-full flex-1 overflow-x-hidden -mt-[var(--landing-header-offset)]">
      {children}
    </main>
  );
}
