/**
 * Formats monetary amounts using the app's display currency (from household settings).
 * Handles edge cases: undefined, null, NaN, and ensures 0 displays correctly.
 * Use optional currency override for specific cases (e.g. invoice in original currency).
 */

import {
  getDisplayCurrency,
  getDisplayCurrencyLocale,
} from "@/src/presentation/stores/currency-store";

/** Fallback for override currency or SSR when store locale is not set. */
const FALLBACK_LOCALE: Record<string, string> = {
  CAD: "en-CA",
  USD: "en-US",
  BRL: "pt-BR",
};

function getLocaleForCurrency(currencyCode: string): string {
  const code = currencyCode.toUpperCase();
  if (code === getDisplayCurrency()) {
    return getDisplayCurrencyLocale();
  }
  return FALLBACK_LOCALE[code] ?? "en";
}

/**
 * Returns the currency symbol for the given (or display) currency (e.g. "$", "R$", "€").
 * Use for inputs or compact labels where full formatMoney is not needed.
 */
export function getCurrencySymbol(currency?: string): string {
  const code = (currency ?? getDisplayCurrency()).toUpperCase();
  const locale = getLocaleForCurrency(code);
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(0);
  const raw = formatted.replace(/\d/g, "").replace(/\s/g, " ").trim();
  return raw ? raw.replace(/\s+$/, "") : code;
}

export interface FormatMoneyOptions {
  /** Override display currency (e.g. for invoices in original currency). Default: household setting. */
  currency?: string;
}

/**
 * Formats a monetary amount as currency using the app's display currency (or override).
 *
 * @param amount - The amount to format (can be number, string, null, or undefined)
 * @param options - Optional currency override
 * @returns Formatted currency string (e.g. "$0.00", "$1,234.56")
 */
export function formatMoney(
  amount: number | string | null | undefined,
  options?: FormatMoneyOptions
): string {
  const currency = (options?.currency ?? getDisplayCurrency()).toUpperCase();
  const locale = getLocaleForCurrency(currency);

  if (amount == null || amount === "") {
    const zeroFormatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
    return zeroFormatted.replace(/^([\-]?[^\d,.\s]*)\s*(\d)/, "$1 $2").replace(/\s{2,}/g, " ");
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : Number(amount);

  if (isNaN(numAmount) || !isFinite(numAmount)) {
    const zeroFormatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
    return zeroFormatted.replace(/^([\-]?[^\d,.\s]*)\s*(\d)/, "$1 $2").replace(/\s{2,}/g, " ");
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
  // Ensure exactly one space between currency symbol and first digit
  return formatted.replace(/^([\-]?[^\d,.\s]*)\s*(\d)/, "$1 $2").replace(/\s{2,}/g, " ");
}

export function Money({
  amount,
  currency,
}: {
  amount: number;
  currency?: string;
}) {
  return <span>{formatMoney(amount, currency ? { currency } : undefined)}</span>;
}

export interface FormatMoneyCompactOptions {
  showDecimals?: boolean;
  threshold?: number;
  /** Override display currency. */
  currency?: string;
}

/**
 * Formats a monetary amount in compact notation (1K, 1M, etc.)
 *
 * @param amount - The amount to format
 * @param options - Optional configuration
 * @returns Formatted currency string (e.g. "$1.2K", "$1.5M")
 */
export function formatMoneyCompact(
  amount: number | string | null | undefined,
  options?: FormatMoneyCompactOptions
): string {
  const { showDecimals = true, threshold = 1000, currency } = options ?? {};

  if (amount == null || amount === "") {
    return formatMoney(0, currency ? { currency } : undefined);
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : Number(amount);

  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return formatMoney(0, currency ? { currency } : undefined);
  }

  const absAmount = Math.abs(numAmount);
  const sign = numAmount < 0 ? "-" : "";

  if (absAmount < threshold) {
    return formatMoney(numAmount, currency ? { currency } : undefined);
  }

  let compactValue: string;
  let suffix: string;

  if (absAmount >= 1_000_000_000) {
    compactValue = (absAmount / 1_000_000_000).toFixed(showDecimals ? 1 : 0);
    suffix = "B";
  } else if (absAmount >= 1_000_000) {
    compactValue = (absAmount / 1_000_000).toFixed(showDecimals ? 1 : 0);
    suffix = "M";
  } else if (absAmount >= 1_000) {
    compactValue = (absAmount / 1_000).toFixed(showDecimals ? 1 : 0);
    suffix = "K";
  } else {
    return formatMoney(numAmount, currency ? { currency } : undefined);
  }

  if (!showDecimals) {
    compactValue = compactValue.replace(/\.0$/, "");
  } else {
    compactValue = compactValue.replace(/\.?0+$/, "");
  }

  const curr = (currency ?? getDisplayCurrency()).toUpperCase();
  const symbol =
    curr === "USD" || curr === "CAD"
      ? "$"
      : new Intl.NumberFormat(getLocaleForCurrency(curr), {
          style: "currency",
          currency: curr,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
          .format(0)
          .replace(/\d/g, "")
          .trim() || curr + " ";

  return `${sign}${symbol.replace(/\s+$/, "")} ${compactValue}${suffix}`;
}
