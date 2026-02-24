import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: `${t("pages.plannedPayments")} - ${t("titleSuffix")}`,
    description: t("description"),
  };
}

export default function PlannedPaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
