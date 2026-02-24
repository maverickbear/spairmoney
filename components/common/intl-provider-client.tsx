"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";

type IntlProviderClientProps = {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
};

/**
 * Client wrapper for NextIntlClientProvider that defines getMessageFallback
 * in the client bundle. Passing getMessageFallback from a Server Component
 * is not allowed (functions are not serializable).
 */
export function IntlProviderClient({ locale, messages, children }: IntlProviderClientProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      getMessageFallback={({ namespace, key }) =>
        process.env.NODE_ENV === "development" ? `${namespace}.${key}` : "—"
      }
    >
      {children}
    </NextIntlClientProvider>
  );
}
