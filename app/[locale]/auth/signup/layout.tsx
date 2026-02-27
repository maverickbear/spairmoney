import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";
const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
const canonicalUrl = `${base}/auth/signup`;

export const metadata: Metadata = {
  title: "Sign Up | Spair Money",
  description: "Create your Spair Money account. Start your 30-day free trial. Track expenses, budgets, and goals in one place.",
  robots: { index: true, follow: true },
  alternates: { canonical: canonicalUrl },
  openGraph: {
    type: "website",
    url: canonicalUrl,
    siteName: "Spair Money",
    title: "Sign Up | Spair Money",
    description: "Create your account and start your 30-day free trial.",
  },
  twitter: { card: "summary_large_image", title: "Sign Up | Spair Money", description: "Create your Spair Money account." },
};

export default function SignUpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
