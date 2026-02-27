import { useLocale } from "next-intl";
import { parseDateWithoutTimezone } from "@/src/infrastructure/utils/timestamp";

/**
 * Next-intl locale codes supported by the app.
 */
export type AppLocale = "en" | "pt" | "es";

/**
 * Map app locale to Intl locale for date/number formatting.
 * en -> en-US, pt -> pt-BR, es -> es-419 (Latin America) or es-ES.
 */
const APP_LOCALE_TO_INTL: Record<AppLocale, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-419",
};

/**
 * Get Intl locale string from app locale. Falls back to en-US for unknown locales.
 */
export function getIntlLocale(appLocale: string): string {
  return APP_LOCALE_TO_INTL[appLocale as AppLocale] ?? "en-US";
}

/**
 * Presets for consistent date display across the app.
 * All format dates in the user's locale.
 */
export type DateFormatPreset =
  | "short"           // e.g. Jan 15
  | "shortDate"       // e.g. Jan 15, 2024
  | "longDate"        // e.g. January 15, 2024
  | "monthYear"       // e.g. January 2024
  | "dateTime"        // date + short time (e.g. Jan 15, 2024, 10:30 AM)
  | "dateTime24h"     // date + 24h time
  | "longDateOnly";   // long date, no time (alias for longDate)

function getIntlOptions(
  preset: DateFormatPreset
): Intl.DateTimeFormatOptions {
  switch (preset) {
    case "short":
      return { month: "short", day: "numeric" };
    case "shortDate":
      return { year: "numeric", month: "short", day: "numeric" };
    case "longDate":
    case "longDateOnly":
      return { year: "numeric", month: "long", day: "numeric" };
    case "monthYear":
      return { year: "numeric", month: "long" };
    case "dateTime":
      return {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
    case "dateTime24h":
      return {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
    default:
      return { year: "numeric", month: "short", day: "numeric" };
  }
}

/**
 * Format a date for display in the given app locale.
 * Uses parseDateWithoutTimezone so that date-only strings (YYYY-MM-DD) are shown without timezone shift.
 * Works in both client and server components.
 *
 * @param date - Date instance or ISO/YYYY-MM-DD string
 * @param locale - App locale (en, pt, es)
 * @param preset - Display preset
 */
export function formatDisplayDate(
  date: Date | string,
  locale: string,
  preset: DateFormatPreset = "shortDate"
): string {
  const d =
    typeof date === "string" ? parseDateWithoutTimezone(date) : date;
  if (isNaN(d.getTime())) return "";
  const intlLocale = getIntlLocale(locale);
  const options = getIntlOptions(preset);
  return new Intl.DateTimeFormat(intlLocale, options).format(d);
}

/**
 * Hook for client components: returns a formatter that uses the current next-intl locale.
 * Use formatDisplayDate(date, locale, preset) in server components with getLocale().
 */
export function useFormatDisplayDate(): (
  date: Date | string,
  preset?: DateFormatPreset
) => string {
  const locale = useLocale() as string;
  return (date: Date | string, preset: DateFormatPreset = "shortDate") =>
    formatDisplayDate(date, locale, preset);
}
