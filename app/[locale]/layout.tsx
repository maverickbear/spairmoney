import { Suspense } from "react";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { routing } from "@/i18n/routing";
import { IntlProviderClient } from "@/components/common/intl-provider-client";
import { SyncLangAttribute } from "@/components/common/sync-lang-attribute";
import { LayoutWrapperClient } from "@/components/layout-wrapper-client";
import { KBarWrapper } from "@/components/kbar-wrapper";
import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Async inner layout so params + getMessages() run inside Suspense (avoids Next.js 15 "blocking route" for runtime data). */
async function LocaleLayoutInner({ params, children }: { params: Promise<{ locale: string }>; children: React.ReactNode }) {
  unstable_noStore();
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <IntlProviderClient locale={locale} messages={messages}>
      <SyncLangAttribute />
      <LayoutWrapperClient>
        {children}
      </LayoutWrapperClient>
      <KBarWrapper />
    </IntlProviderClient>
  );
}

export default function LocaleLayout({ children, params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleLayoutInner params={params}>
        {children}
      </LocaleLayoutInner>
    </Suspense>
  );
}
