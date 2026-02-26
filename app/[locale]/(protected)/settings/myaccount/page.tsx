"use client";

import { usePagePerformance } from "@/hooks/use-page-performance";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ProfileModule } from "../profile/profile-module";
import { RequestPasswordResetLink } from "@/components/profile/request-password-reset-link";
import { DeleteAccountSection } from "@/components/profile/delete-account-section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";

export default function MyAccountPage() {
  const tNav = useTranslations("nav");
  const tSettings = useTranslations("settings");
  const perf = usePagePerformance("Settings - My Account");

  useEffect(() => {
    const timer = setTimeout(() => {
      perf.markComplete();
    }, 100);
    return () => clearTimeout(timer);
  }, [perf]);

  return (
    <div>
      <PageHeader
        title={tNav("items.myAccount")}
      />

      <div className="w-full p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Profile Card */}
        <div>
          <ProfileModule />
        </div>

        {/* Right Column - Other Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{tSettings("changePassword")}</h2>
            </CardHeader>
            <CardContent>
              <RequestPasswordResetLink />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{tSettings("deleteAccount")}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {tSettings("deleteAccountDescription")}
              </p>
              <DeleteAccountSection />
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
