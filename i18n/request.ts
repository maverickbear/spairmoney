import { cache } from "react";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const loadMessages = cache(
  async (locale: string) =>
    (await import(`../messages/${locale}.json`)).default
);

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
    timeZone: "UTC",
    getMessageFallback({ namespace, key }) {
      if (process.env.NODE_ENV === "development") {
        return `${namespace}.${key}`;
      }
      return "—";
    },
  };
});
