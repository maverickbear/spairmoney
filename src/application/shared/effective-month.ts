/**
 * Effective month helper for transactions.
 * When competencyMonth is set and valid, use it; otherwise use the month derived from date.
 * Used for all monthly analytics (cash flow, financial health, budgets, reports).
 */

const COMPETENCY_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface TransactionForEffectiveMonth {
  date: string | Date;
  competencyMonth?: string | null;
}

/**
 * Returns YYYY-MM for the month this transaction counts toward.
 * Uses competencyMonth when present and valid; otherwise derives from date.
 */
export function getEffectiveMonth(tx: TransactionForEffectiveMonth): string {
  if (tx.competencyMonth && COMPETENCY_MONTH_REGEX.test(tx.competencyMonth)) {
    return tx.competencyMonth;
  }
  const d = typeof tx.date === "string" ? new Date(tx.date) : tx.date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}
