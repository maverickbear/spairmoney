/**
 * Insights Service
 * Builds context from financial data and generates narrative insights via OpenAI
 */

import OpenAI from "openai";
import { format } from "date-fns";
import type { InsightContext, InsightsPanorama, InsightItem } from "@/src/domain/insights/types";
import { insightsPanoramaSchema } from "@/src/domain/insights/validations";
import type { TransactionWithRelations } from "@/src/domain/transactions/transactions.types";
import type { DebtWithCalculations } from "@/src/domain/debts/debts.types";
import type { FinancialHealthData } from "@/src/application/shared/financial-health";
import type { UserServiceSubscription } from "@/src/domain/subscriptions/subscriptions.types";
import type { BudgetWithRelations } from "@/src/domain/budgets/budgets.types";
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  groupExpensesByCategory,
} from "@/lib/services/transaction-calculations";
import { logger } from "@/src/infrastructure/utils/logger";

const HIGH_INTEREST_RATE_THRESHOLD = 15;
const TOP_CATEGORIES_LIMIT = 8;

/** Normalize subscription amount to monthly equivalent */
function subscriptionAmountToMonthly(
  amount: number,
  frequency: UserServiceSubscription["billingFrequency"]
): number {
  switch (frequency) {
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
    case "weekly":
      return amount * (52 / 12);
    case "biweekly":
      return amount * (26 / 12);
    case "semimonthly":
      return amount * 2;
    case "daily":
      return amount * 30;
    default:
      return amount;
  }
}

export interface BuildContextInput {
  monthDate: Date;
  currentMonthTransactions: TransactionWithRelations[];
  lastMonthTransactions: TransactionWithRelations[];
  debts: DebtWithCalculations[];
  financialHealth: FinancialHealthData | null;
  subscriptions: UserServiceSubscription[];
  budgets: BudgetWithRelations[];
}

/**
 * Build structured context (no PII) for OpenAI from raw financial data
 */
export function buildContextFromData(input: BuildContextInput): InsightContext {
  const {
    monthDate,
    currentMonthTransactions,
    lastMonthTransactions,
    debts,
    financialHealth,
    subscriptions,
    budgets,
  } = input;

  const monthLabel = format(monthDate, "MMMM yyyy");
  const income = calculateTotalIncome(currentMonthTransactions);
  const expenses = calculateTotalExpenses(currentMonthTransactions);
  const netAmount = income - expenses;
  const savingsRatePercent =
    income > 0 ? (netAmount / income) * 100 : (expenses > 0 ? -100 : 0);

  const currentByCategory = groupExpensesByCategory(currentMonthTransactions);
  const lastByCategory = groupExpensesByCategory(lastMonthTransactions);
  const totalExpensesCurrent = expenses;

  const topCategories = Object.entries(currentByCategory)
    .map(([name, amount]) => {
      const percentOfExpenses =
        totalExpensesCurrent > 0 ? (amount / totalExpensesCurrent) * 100 : 0;
      const lastAmount = lastByCategory[name] ?? 0;
      const trendVsLastMonthPercent =
        lastAmount > 0
          ? ((amount - lastAmount) / lastAmount) * 100
          : amount > 0
            ? 100
            : null;
      return {
        name,
        amount,
        percentOfExpenses,
        trendVsLastMonthPercent,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_CATEGORIES_LIMIT);

  const activeDebts = debts.filter((d) => !d.isPaidOff && d.currentBalance > 0);
  const totalBalance = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0);
  const totalMonthlyPayment = activeDebts.reduce(
    (sum, d) => sum + (d.monthlyPayment ?? 0),
    0
  );
  const debtToIncomePercent =
    income > 0 ? (totalMonthlyPayment / income) * 100 : null;
  const hasHighInterestDebt = activeDebts.some(
    (d) => d.interestRate >= HIGH_INTEREST_RATE_THRESHOLD
  );
  const debtTypes = [...new Set(activeDebts.map((d) => d.loanType))];

  const subscriptionsTotalMonthly = subscriptions
    .filter((s) => s.isActive)
    .reduce(
      (sum, s) => sum + subscriptionAmountToMonthly(s.amount, s.billingFrequency),
      0
    );

  const lastMonthExpenses = calculateTotalExpenses(lastMonthTransactions);
  const expenseTrendVsLastMonthPercent =
    lastMonthExpenses > 0
      ? ((expenses - lastMonthExpenses) / lastMonthExpenses) * 100
      : expenses > 0
        ? 100
        : null;

  const budgetOverUnder = budgets
    .filter((b) => b.actualSpend != null && b.amount != null && b.amount > 0)
    .map((b) => {
      const actual = b.actualSpend ?? 0;
      const budgeted = b.amount ?? 0;
      const overBy = Math.max(0, actual - budgeted);
      return {
        categoryName: b.displayName ?? b.category?.name ?? "Uncategorized",
        budgeted,
        actual,
        overBy,
      };
    })
    .filter((b) => b.overBy > 0);

  const existingAlerts = (financialHealth?.alerts ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    severity: a.severity,
  }));

  return {
    monthLabel,
    income,
    expenses,
    netAmount,
    savingsRatePercent,
    topCategories,
    debtSummary: {
      totalBalance,
      totalMonthlyPayment,
      debtToIncomePercent,
      hasHighInterestDebt,
      debtCount: activeDebts.length,
      types: debtTypes,
    },
    subscriptionsTotalMonthly,
    emergencyFundMonths: financialHealth?.emergencyFundMonths ?? 0,
    spairScore: financialHealth?.score ?? 0,
    spendingDiscipline: financialHealth?.spendingDiscipline ?? "Unknown",
    debtExposure: financialHealth?.debtExposure ?? "Low",
    budgetOverUnder,
    existingAlerts,
    expenseTrendVsLastMonthPercent,
  };
}

/**
 * Generate panorama and insight items from context using OpenAI.
 * Returns validated InsightsPanorama or null if OpenAI is unavailable or fails.
 */
export async function generateInsightsWithOpenAI(
  context: InsightContext,
  locale?: string
): Promise<InsightsPanorama | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn("[InsightsService] OPENAI_API_KEY not set, skipping AI insights");
    return null;
  }

  const lang = locale?.startsWith("pt") ? "Portuguese" : locale?.startsWith("es") ? "Spanish" : "English";

  const prompt = `You are a supportive, clear personal finance coach for a family or individual. Based on the following anonymized financial summary for ${context.monthLabel}, write a short panorama (2-4 sentences) and 3-6 actionable insight items. Use simple language and avoid jargon. Write everything in ${lang}.

Financial summary (no PII):
- Income: ${context.income.toFixed(2)}, Expenses: ${context.expenses.toFixed(2)}, Net: ${context.netAmount.toFixed(2)}, Savings rate: ${context.savingsRatePercent.toFixed(1)}%
- Top spending categories: ${context.topCategories.map((c) => `${c.name}: ${c.amount.toFixed(2)} (${c.percentOfExpenses.toFixed(0)}% of expenses)${c.trendVsLastMonthPercent != null ? `, trend vs last month: ${c.trendVsLastMonthPercent.toFixed(0)}%` : ""}`).join("; ")}
- Debt: total balance ${context.debtSummary.totalBalance.toFixed(2)}, monthly payment ${context.debtSummary.totalMonthlyPayment.toFixed(2)}${context.debtSummary.debtToIncomePercent != null ? `, ${context.debtSummary.debtToIncomePercent.toFixed(0)}% of income` : ""}, high-interest: ${context.debtSummary.hasHighInterestDebt}, types: ${context.debtSummary.types.join(", ") || "none"}
- Subscriptions (monthly equivalent): ${context.subscriptionsTotalMonthly.toFixed(2)}
- Emergency fund: ${context.emergencyFundMonths.toFixed(1)} months of expenses
- Spair Score: ${context.spairScore}, Spending discipline: ${context.spendingDiscipline}, Debt exposure: ${context.debtExposure}
${context.expenseTrendVsLastMonthPercent != null ? `- Expense trend vs last month: ${context.expenseTrendVsLastMonthPercent.toFixed(0)}%` : ""}
${context.budgetOverUnder.length > 0 ? `- Over budget: ${context.budgetOverUnder.map((b) => `${b.categoryName}: ${b.overBy.toFixed(2)} over`).join("; ")}` : ""}
${context.existingAlerts.length > 0 ? `- Existing alerts: ${context.existingAlerts.map((a) => `${a.title}: ${a.description}`).join(" | ")}` : ""}

Return a JSON object with exactly these keys:
- "panorama": string (2-4 sentences summarizing the month and main pressure points or wins; friendly and actionable)
- "insightItems": array of objects, each with: "id" (short unique id, e.g. "debt-high-interest"), "title" (short headline), "description" (1-2 sentences), "action" (one concrete next step), "priority" ("high" | "medium" | "low"), "category" ("spending" | "debt" | "security" | "habits")

Focus on what most affects quality of life: debt burden, savings, recurring costs, overspending in key categories, emergency fund. Order insightItems by priority (high first).`;

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a personal finance coach. Return only valid JSON with keys: panorama, insightItems. Each insightItem has: id, title, description, action, priority, category.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      logger.warn("[InsightsService] Empty response from OpenAI");
      return null;
    }

    const parsed = JSON.parse(raw) as { panorama?: string; insightItems?: unknown[] };
    const validated = insightsPanoramaSchema.safeParse({
      panorama: parsed.panorama ?? "",
      insightItems: (parsed.insightItems ?? []).map((item: any, i: number) => ({
        id: item?.id ?? `insight-${i}`,
        title: item?.title ?? "",
        description: item?.description ?? "",
        action: item?.action ?? "",
        priority: ["high", "medium", "low"].includes(item?.priority) ? item.priority : "medium",
        category: ["spending", "debt", "security", "habits"].includes(item?.category) ? item.category : "spending",
      })),
    });

    if (!validated.success) {
      logger.warn("[InsightsService] OpenAI response validation failed", validated.error.flatten());
      return null;
    }

    return validated.data;
  } catch (err) {
    logger.error("[InsightsService] OpenAI request failed", err);
    return null;
  }
}

export class InsightsService {
  /**
   * Build context from raw data (for use by API or server loader)
   */
  buildContext(input: BuildContextInput): InsightContext {
    return buildContextFromData(input);
  }

  /**
   * Generate AI insights from context. Returns null if OpenAI is unavailable or fails.
   */
  async generateInsights(
    context: InsightContext,
    locale?: string
  ): Promise<InsightsPanorama | null> {
    return generateInsightsWithOpenAI(context, locale);
  }
}
