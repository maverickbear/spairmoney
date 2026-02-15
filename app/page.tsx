import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { StructuredData } from "@/src/presentation/components/seo/structured-data";
import { makeAuthService } from "@/src/application/auth/auth.factory";

const envUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";
const baseUrl = envUrl.includes("=") ? envUrl.split("=")[1] : envUrl;

const defaultSEOSettings = {
  title: "Spair Money - Personal Finance at Peace",
  titleTemplate: "%s | Spair Money",
  description:
    "Track accounts and transactions, see your whole picture, and move from anxiety to control. Dashboard, reports, Spair Score, budgets, goals, receipts, and household—one calm place for your money. Start your 30-day free trial.",
  keywords: [
    "personal finance",
    "expense tracking",
    "budget management",
    "financial planning",
    "money management",
    "household finance",
    "savings goals",
    "investment tracking",
    "debt management",
    "financial dashboard",
    "budget app",
    "finance software",
    "money tracker",
    "expense manager",
  ],
  author: "Spair Money",
  publisher: "Spair Money",
  openGraph: {
    title: "Spair Money - Personal Finance at Peace",
    description:
      "Track accounts and transactions, see your whole picture. One calm place for your money. Start your 30-day free trial.",
    image: "/og-image.png",
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt: "Spair Money - Personal Finance Management",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spair Money - Personal Finance at Peace",
    description: "One calm place for your money. Start your 30-day free trial.",
    image: "/og-image.png",
    creator: "@spairmoney",
  },
};

async function getSEOSettings() {
  try {
    const { makeAdminService } = await import("@/src/application/admin/admin.factory");
    const adminService = makeAdminService();
    return await adminService.getPublicSeoSettings();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    if (
      typeof errorMessage === "string" &&
      (errorMessage.includes("prerender") ||
        errorMessage.includes("HANGING_PROMISE") ||
        errorMessage.includes("fetch() rejects") ||
        errorMessage.includes("Dynamic data sources"))
    ) {
      return null;
    }
    console.error("Error fetching SEO settings:", error);
  }
  return null;
}

export async function generateMetadata() {
  await headers();
  const seoSettings = await getSEOSettings();
  const settings = seoSettings || defaultSEOSettings;

  return {
    metadataBase: new URL(baseUrl),
    title: { default: settings.title, template: settings.titleTemplate },
    description: settings.description,
    keywords: settings.keywords,
    authors: [{ name: settings.author }],
    creator: settings.author,
    publisher: settings.publisher,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      siteName: "Spair Money",
      title: settings.openGraph.title,
      description: settings.openGraph.description,
      images: [{ url: settings.openGraph.image, width: settings.openGraph.imageWidth, height: settings.openGraph.imageHeight, alt: settings.openGraph.imageAlt }],
    },
    twitter: {
      card: settings.twitter.card as "summary" | "summary_large_image",
      title: settings.twitter.title,
      description: settings.twitter.description,
      images: [settings.twitter.image],
      creator: settings.twitter.creator,
    },
    alternates: { canonical: baseUrl },
    category: "Finance",
    classification: "Business",
  };
}

async function AuthCheck() {
  try {
    const authService = makeAuthService();
    const user = await authService.getCurrentUser();
    await headers();
    const { makeAdminService } = await import("@/src/application/admin/admin.factory");
    const adminService = makeAdminService();
    const settings = await adminService.getPublicSystemSettings();
    const isMaintenanceMode = settings.maintenanceMode || false;

    if (isMaintenanceMode) return null;
    if (user) {
      const { makeAdminService } = await import("@/src/application/admin/admin.factory");
      const adminService = makeAdminService();
      const isPortalAdmin = await adminService.isSuperAdmin(user.id);
      redirect(isPortalAdmin ? "/admin" : "/dashboard");
    }
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error && typeof (error as { digest?: string }).digest === "string" && (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "";
    if (
      typeof errorMessage === "string" &&
      (errorMessage.includes("prerender") || errorMessage.includes("HANGING_PROMISE") || errorMessage.includes("cookies() rejects") || errorMessage.includes("Dynamic data sources"))
    ) {
      return null;
    }
    console.error("Error checking authentication:", error);
  }
  return null;
}

async function SEOSettingsFetch() {
  await headers();
  try {
    const { makeAdminService } = await import("@/src/application/admin/admin.factory");
    const adminService = makeAdminService();
    return await adminService.getPublicSeoSettings();
  } catch (error) {
    console.error("Error fetching SEO settings:", error);
    return null;
  }
}

async function LandingOrMaintenance(): Promise<ReactNode> {
  await headers();
  try {
    const { makeAdminService } = await import("@/src/application/admin/admin.factory");
    const adminService = makeAdminService();
    const settings = await adminService.getPublicSystemSettings();
    if (settings.maintenanceMode) {
      const authService = makeAuthService();
      const user = await authService.getCurrentUser();
      if (user) {
        const adminService = makeAdminService();
        const isPortalAdmin = await adminService.isSuperAdmin(user.id);
        if (!isPortalAdmin) redirect("/maintenance");
      } else {
        redirect("/maintenance");
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error && typeof (error as { digest?: string }).digest === "string" && (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
  }
  const { LandingView } = await import("@/components/landing/landing-view");
  return <LandingView />;
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <SEOSettingsWrapper />
      </Suspense>
      <Suspense fallback={null}>
        <AuthCheck />
      </Suspense>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-pulse rounded-full h-8 w-8 border-2 border-border border-t-primary" />
          </div>
        }
      >
        <LandingOrMaintenance />
      </Suspense>
    </>
  );
}

async function SEOSettingsWrapper() {
  const seoSettings = await SEOSettingsFetch();
  return <StructuredData seoSettings={seoSettings} />;
}
