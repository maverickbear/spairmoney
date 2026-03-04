/**
 * Domain types for Insights (AI-generated financial panorama)
 * Pure TypeScript types with no external dependencies
 */

export type InsightCategory = "spending" | "debt" | "security" | "habits";

export type InsightPriority = "high" | "medium" | "low";

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: InsightPriority;
  category: InsightCategory;
}

export interface InsightsPanorama {
  panorama: string;
  insightItems: InsightItem[];
}

/**
 * Structured context sent to OpenAI (no PII).
 * Aggregated numbers, category names, debt types only.
 */
export interface InsightContext {
  monthLabel: string;
  income: number;
  expenses: number;
  netAmount: number;
  savingsRatePercent: number;
  topCategories: Array<{
    name: string;
    amount: number;
    percentOfExpenses: number;
    trendVsLastMonthPercent: number | null;
  }>;
  debtSummary: {
    totalBalance: number;
    totalMonthlyPayment: number;
    debtToIncomePercent: number | null;
    hasHighInterestDebt: boolean;
    debtCount: number;
    types: string[];
  };
  subscriptionsTotalMonthly: number;
  emergencyFundMonths: number;
  spairScore: number;
  spendingDiscipline: string;
  debtExposure: string;
  budgetOverUnder: Array<{
    categoryName: string;
    budgeted: number;
    actual: number;
    overBy: number;
  }>;
  existingAlerts: Array<{
    title: string;
    description: string;
    severity: string;
  }>;
  expenseTrendVsLastMonthPercent: number | null;
}
