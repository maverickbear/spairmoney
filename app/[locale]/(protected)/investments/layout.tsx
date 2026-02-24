import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: `${t("pages.investments")} - ${t("titleSuffix")}`,
    description: t("description"),
  };
}

export default function InvestmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
