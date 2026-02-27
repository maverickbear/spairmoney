import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";
const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contactPage");
  const title = `${t("title")} | Spair Money`;
  const description = t("subtitle");
  const url = `${base}/contact`;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: "Spair Money",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: url },
  };
}

export default function ContactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
