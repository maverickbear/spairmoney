"use client";

import { usePagePerformance } from "@/hooks/use-page-performance";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ProfileModule } from "../profile/profile-module";
import { HouseholdIncomeSettings } from "@/src/presentation/components/features/onboarding/household-income-settings";
import { BudgetPlanSettings } from "@/src/presentation/components/features/onboarding/budget-plan-settings";
import { RequestPasswordResetLink } from "@/components/profile/request-password-reset-link";
import { DeleteAccountSection } from "@/components/profile/delete-account-section";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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

        {/* Right Column - Other Settings Cards */}
        <div>
          <Accordion type="single" collapsible className="space-y-6">
            <AccordionItem value="income">
              <AccordionTrigger>{tSettings("expectedHouseholdIncome")}</AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground">
                    {tSettings("expectedHouseholdIncomeDescription")}
                  </p>
                </div>
                <HouseholdIncomeSettings />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="budget">
              <AccordionTrigger>{tSettings("budgetPlan")}</AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground">
                    {tSettings("budgetPlanDescription")}
                  </p>
                </div>
                <BudgetPlanSettings />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="password">
              <AccordionTrigger>{tSettings("changePassword")}</AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="px-6 pb-4">
                  <RequestPasswordResetLink />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="delete">
              <AccordionTrigger>{tSettings("deleteAccount")}</AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground">
                    {tSettings("deleteAccountDescription")}
                  </p>
                </div>
                <DeleteAccountSection />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      </div>
    </div>
  );
}
