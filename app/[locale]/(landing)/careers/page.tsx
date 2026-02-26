import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { ContentPageLayout } from "@/components/common/content-page-layout";
import { LegalSection } from "@/components/common/legal-section";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("careersTitle"),
    description: t("careersDescription"),
  };
}

export default async function CareersPage() {
  const t = await getTranslations("careers");

  return (
    <ContentPageLayout
      hero={{
        icon: (
          <Briefcase className="h-10 w-10 shrink-0 --sentiment-positive" />
        ),
        title: t("title"),
      }}
    >
      <article className="space-y-6">
        <LegalSection title={t("workWithUsTitle")}>
          <p>{t("workWithUsBody")}</p>
        </LegalSection>

        <LegalSection title={t("openPositionsTitle")}>
          <p>
            {t.rich("openPositionsBody", {
              link: () => (
                <Link href="/contact" className="text-foreground underline underline-offset-4 hover:--sentiment-positive">
                  {t("getInTouch")}
                </Link>
              ),
            })}
          </p>
        </LegalSection>
      </article>
    </ContentPageLayout>
  );
}
