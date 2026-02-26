import { getTranslations } from "next-intl/server";
import { Building2 } from "lucide-react";
import { ContentPageLayout } from "@/components/common/content-page-layout";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
  };
}

export default async function AboutUsPage() {
  const t = await getTranslations("about");

  return (
    <ContentPageLayout
      hero={{
        icon: (
          <Building2 className="h-10 w-10 shrink-0 --sentiment-positive" />
        ),
        title: t("title"),
      }}
    >
      <article className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-muted-foreground">
        <p>{t("intro1")}</p>
        <p>{t("intro2")}</p>
        <p>{t("intro3")}</p>
        <p>{t("intro4")}</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>{t("list1")}</strong></li>
          <li><strong>{t("list2")}</strong></li>
          <li><strong>{t("list3")}</strong></li>
        </ul>
        <p>{t("noJudgment")}</p>
        <p>{t("justClarity")}</p>
        <p>{t("becauseConfidence")}</p>
        <p>{t("welcome")}</p>
      </article>
    </ContentPageLayout>
  );
}
