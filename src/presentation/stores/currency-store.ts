/**
 * Client-side store for display currency.
 * Set by CurrencyInitializer when household settings are loaded; read by formatMoney.
 * Holds code and locale so any currency (e.g. BRL with pt-BR) formats correctly.
 */

import { DEFAULT_DISPLAY_CURRENCY } from "@/src/domain/currency/currency.constants";

let displayCurrencyCode: string = DEFAULT_DISPLAY_CURRENCY;
let displayCurrencyLocale: string | null = null;

/** Fallback locale when API has not yet provided locale (SSR / first paint). */
const FALLBACK_LOCALE: Record<string, string> = {
  CAD: "en-CA",
  USD: "en-US",
  BRL: "pt-BR",
};

function fallbackLocaleForCode(code: string): string {
  return FALLBACK_LOCALE[code] ?? "en";
}

export function getDisplayCurrency(): string {
  return displayCurrencyCode;
}

export function getDisplayCurrencyLocale(): string {
  return displayCurrencyLocale ?? fallbackLocaleForCode(displayCurrencyCode);
}

export function setDisplayCurrency(code: string, locale?: string): void {
  if (code && code.length === 3) {
    displayCurrencyCode = code.toUpperCase();
    displayCurrencyLocale = locale != null ? locale : null;
  }
}
