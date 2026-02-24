import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: `${t("pages.settings")} - ${t("titleSuffix")}`,
    description: t("description"),
  };
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">{children}</div>
  );
}

