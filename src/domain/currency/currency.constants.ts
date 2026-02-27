/**
 * Currency Domain Constants
 * Fallback list when DB is not used; single entry point for "allowed" display currencies.
 */

export const DEFAULT_DISPLAY_CURRENCY = "CAD" as const;

/** Fallback supported codes (used when currencies table is empty or unavailable). */
export const SUPPORTED_DISPLAY_CURRENCIES_FALLBACK = ["CAD", "USD"] as const;

export type SupportedDisplayCurrencyCode =
  (typeof SUPPORTED_DISPLAY_CURRENCIES_FALLBACK)[number];
