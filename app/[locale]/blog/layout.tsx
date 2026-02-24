import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/landing-header";
import { SimpleFooter } from "@/components/common/simple-footer";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";

export const metadata: Metadata = {
  title: "Blog - Personal Finance Tips & Guides | Spair Money",
  description:
    "Practical personal finance articles: budgeting, expense tracking, saving, and financial peace. Tips and guides from Spair Money.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${baseUrl}/blog`,
    siteName: "Spair Money",
    title: "Blog - Personal Finance Tips & Guides | Spair Money",
    description:
      "Practical personal finance articles: budgeting, expense tracking, saving, and financial peace.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - Personal Finance Tips & Guides | Spair Money",
    description: "Practical personal finance articles and guides from Spair Money.",
  },
  alternates: {
    canonical: `${baseUrl}/blog`,
    types: {
      "application/rss+xml": `${baseUrl}/blog/feed`,
    },
  },
};

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
      <SimpleFooter />
    </div>
  );
}
