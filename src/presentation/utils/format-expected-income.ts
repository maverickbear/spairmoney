/**
 * Format Expected Income for Display
 * Utility functions for formatting expected annual income
 */

import { formatMoney } from "@/components/common/money";

/**
 * Format expected annual income for display (e.g. "$75,000")
 */
export function formatExpectedAnnualIncome(annualIncome: number | null | undefined): string {
  if (annualIncome == null || annualIncome <= 0) {
    return "";
  }
  return formatMoney(annualIncome);
}

/**
 * Format monthly income derived from annual for display (e.g. "$6,250/month")
 */
export function formatMonthlyFromAnnual(annualIncome: number | null | undefined): string {
  if (annualIncome == null || annualIncome <= 0) {
    return "";
  }
  const monthly = annualIncome / 12;
  return `${formatMoney(monthly)}/month`;
}

/**
 * Format expected income with monthly equivalent
 * Returns string like "$75,000 ($6,250/month)" or just annual if showMonthly is false
 */
export function formatExpectedIncomeWithMonthly(
  annualIncome: number | null | undefined,
  showMonthly = true
): string {
  if (annualIncome == null || annualIncome <= 0) {
    return "";
  }
  const annual = formatMoney(annualIncome);
  if (!showMonthly) {
    return annual;
  }
  const monthly = formatMonthlyFromAnnual(annualIncome);
  return `${annual} (${monthly})`;
}
