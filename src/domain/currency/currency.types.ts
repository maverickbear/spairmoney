/**
 * Currency Domain Types
 * Pure domain types for display currency feature
 */

/** A supported display currency option (from DB or fallback list). */
export interface DisplayCurrencyOption {
  code: string;
  name: string;
  locale: string;
  sortOrder: number;
}
