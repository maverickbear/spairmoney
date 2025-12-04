/**
 * Format Expected Income Range for Display
 * Utility functions for formatting expected income ranges
 */

import { ExpectedIncomeRange } from "@/src/domain/onboarding/onboarding.types";
import { formatMoney } from "@/components/common/money";

/**
 * Format expected income range to display string
 */
export function formatExpectedIncomeRange(incomeRange: ExpectedIncomeRange | string | null): string {
  if (!incomeRange) {
    return "";
  }

  const range = incomeRange as string;
  
  if (range === "0-50k") {
    return "$0 - $50,000";
  }
  if (range === "50k-100k") {
    return "$50,000 - $100,000";
  }
  if (range === "100k-150k") {
    return "$100,000 - $150,000";
  }
  if (range === "150k-250k") {
    return "$150,000 - $250,000";
  }
  if (range === "250k+") {
    return "$250,000+";
  }

  return range;
}

/**
 * Get short format for expected income range
 */
export function formatExpectedIncomeRangeShort(incomeRange: ExpectedIncomeRange | string | null): string {
  if (!incomeRange) {
    return "";
  }

  const range = incomeRange as string;
  
  if (range === "0-50k") {
    return "$0-50k";
  }
  if (range === "50k-100k") {
    return "$50k-100k";
  }
  if (range === "100k-150k") {
    return "$100k-150k";
  }
  if (range === "150k-250k") {
    return "$150k-250k";
  }
  if (range === "250k+") {
    return "$250k+";
  }

  return range;
}

/**
 * Get monthly income value from annual income range
 * Uses the same conversion logic as OnboardingService.getMonthlyIncomeFromRange
 */
function getMonthlyIncomeFromRange(incomeRange: ExpectedIncomeRange | string | null): number {
  if (!incomeRange) {
    return 0;
  }

  const range = incomeRange as string;
  
  // Income range to monthly income conversion (using midpoint of range)
  const INCOME_RANGE_TO_MONTHLY: Record<NonNullable<ExpectedIncomeRange>, number> = {
    "0-50k": 25000 / 12, // ~$2,083/month
    "50k-100k": 75000 / 12, // ~$6,250/month
    "100k-150k": 125000 / 12, // ~$10,417/month
    "150k-250k": 200000 / 12, // ~$16,667/month
    "250k+": 300000 / 12, // ~$25,000/month
  };

  return INCOME_RANGE_TO_MONTHLY[range as NonNullable<ExpectedIncomeRange>] || 0;
}

/**
 * Format monthly income from annual income range for display
 * Returns formatted string like "$2,083/month" or empty string if no range
 */
export function formatMonthlyIncomeFromRange(incomeRange: ExpectedIncomeRange | string | null): string {
  if (!incomeRange) {
    return "";
  }

  const monthlyIncome = getMonthlyIncomeFromRange(incomeRange);
  if (monthlyIncome === 0) {
    return "";
  }

  return formatMoney(monthlyIncome);
}

/**
 * Format expected income range with monthly equivalent
 * Returns string like "$50,000 - $100,000 ($6,250/month)" or just the range if monthly is not needed
 */
export function formatExpectedIncomeRangeWithMonthly(
  incomeRange: ExpectedIncomeRange | string | null,
  showMonthly: boolean = true
): string {
  if (!incomeRange) {
    return "";
  }

  const annualRange = formatExpectedIncomeRange(incomeRange);
  
  if (!showMonthly) {
    return annualRange;
  }

  const monthlyIncome = formatMonthlyIncomeFromRange(incomeRange);
  if (!monthlyIncome) {
    return annualRange;
  }

  return `${annualRange} (${monthlyIncome}/month)`;
}

