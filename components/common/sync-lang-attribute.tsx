"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/**
 * Syncs the document <html lang> attribute with the current locale.
 * Renders nothing; must be used inside NextIntlClientProvider.
 * Fixes lang for accessibility/SEO when root layout cannot read headers (Suspense rule).
 */
export function SyncLangAttribute() {
  const locale = useLocale();

  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale]);

  return null;
}
