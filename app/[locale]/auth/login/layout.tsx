import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";
const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
const canonicalUrl = `${base}/auth/login`;

export const metadata: Metadata = {
  title: "Log In | Spair Money",
  description: "Sign in to your Spair Money account. Access your dashboard, budgets, and financial overview.",
  robots: { index: true, follow: true },
  alternates: { canonical: canonicalUrl },
  openGraph: {
    type: "website",
    url: canonicalUrl,
    siteName: "Spair Money",
    title: "Log In | Spair Money",
    description: "Sign in to your Spair Money account.",
  },
  twitter: { card: "summary_large_image", title: "Log In | Spair Money", description: "Sign in to your account." },
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
