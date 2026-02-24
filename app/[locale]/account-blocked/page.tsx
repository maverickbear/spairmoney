import { getTranslations } from "next-intl/server";
import { LandingHeader } from "@/components/landing/landing-header";
import { Shield, Mail, AlertCircle } from "lucide-react";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getTranslations("accountStatus.blocked");
  return {
    title: `${t("title")} - Spair Money`,
    description: t("description"),
  };
}

export default async function AccountBlockedPage() {
  const t = await getTranslations("accountStatus.blocked");
  // Check authentication status on server to show correct buttons in header
  const authService = makeAuthService();
  const user = await authService.getCurrentUser();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <div className="flex-1 flex items-center justify-center p-4 pt-24 md:pt-28">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Blocked Icon */}
          <div className="flex justify-center">
            <div className="p-6 bg-destructive/10 rounded-full">
              <Shield className="w-12 h-12 text-destructive" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          {/* Info Card */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div className="text-left space-y-1">
                <p className="font-medium">{t("whatDoesThisMean")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("whatDoesThisMeanDescription")}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="bg-primary/5 rounded-lg p-6 space-y-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 --sentiment-positive mt-0.5 shrink-0" />
              <div className="text-left space-y-2">
                <p className="font-medium">{t("needHelp")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("needHelpDescription")}
                </p>
                <div className="pt-2">
                  <Link
                    href="mailto:support@spair.co"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    support@spair.co
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-muted-foreground">{t("footer")}</p>
        </div>
      </div>
    </div>
  );
}

