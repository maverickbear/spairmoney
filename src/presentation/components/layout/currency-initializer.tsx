"use client";

import { useEffect } from "react";
import { setDisplayCurrency } from "@/src/presentation/stores/currency-store";
import { apiUrl } from "@/lib/utils/api-base-url";

interface SettingsData {
  displayCurrency?: string;
  displayCurrencyLocale?: string;
  supportedCurrencies?: { code: string; name: string; locale: string; sortOrder: number }[];
}

/**
 * Fetches household settings (display currency + locale) and updates the currency store
 * so formatMoney uses the user's choice and correct locale from DB.
 */
export function CurrencyInitializer() {
  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/v2/household/settings"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SettingsData | null) => {
        if (cancelled || !data?.displayCurrency) return;
        const locale =
          data.displayCurrencyLocale ??
          data.supportedCurrencies?.find((c) => c.code === data.displayCurrency)?.locale;
        setDisplayCurrency(data.displayCurrency, locale);
      })
      .catch(() => {
        // Keep default (CAD) on error
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
