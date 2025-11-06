"use server";

import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { getTransactionsInternal } from "./transactions";
import { startOfMonth, endOfMonth } from "date-fns";

export interface FinancialHealthData {
  score: number;
  classification: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  monthlyIncome: number;
  monthlyExpenses: number;
  netAmount: number;
  savingsRate: number;
  message: string;
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: "critical" | "warning" | "info";
    action: string;
  }>;
  suggestions: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
  }>;
}

async function calculateFinancialHealthInternal(
  selectedDate?: Date,
  accessToken?: string,
  refreshToken?: string
): Promise<FinancialHealthData> {
  const date = selectedDate || new Date();
  const selectedMonth = startOfMonth(date);
  const selectedMonthEnd = endOfMonth(date);
  
  // Get transactions for selected month only (to match the cards at the top)
  // Call internal function directly to avoid reading cookies inside cached function
  const transactions = await getTransactionsInternal(
    {
      startDate: selectedMonth,
      endDate: selectedMonthEnd,
    },
    accessToken,
    refreshToken
  );
  
  // Filter out transfer transactions - only count income and expense
  const monthlyIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const monthlyExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const netAmount = monthlyIncome - monthlyExpenses;
  
  // Log for debugging
  console.log("Financial Health Calculation (Selected Month):", {
    month: selectedMonth.toISOString().split('T')[0],
    transactionsCount: transactions.length,
    monthlyIncome,
    monthlyExpenses,
    netAmount,
  });
  
  // Calculate savings rate (net amount as percentage of income)
  // If no income, savings rate is 0 (or negative if expenses > 0)
  const savingsRate = monthlyIncome > 0 
    ? (netAmount / monthlyIncome) * 100 
    : monthlyExpenses > 0 
    ? -100 // If expenses but no income, savings rate is -100%
    : 0; // No income and no expenses
  
  // Calculate expense ratio (expenses as percentage of income)
  // This is the key metric for the new classification system
  const expenseRatio = monthlyIncome > 0 
    ? (monthlyExpenses / monthlyIncome) * 100 
    : monthlyExpenses > 0 
    ? 100 // If expenses but no income, ratio is 100%+
    : 0; // No income and no expenses
  
  // Calculate score based on expense ratio
  // Score ranges from 0-100 based on expense ratio
  // 0-60% expense ratio = 100-91 score (Excellent)
  // 61-70% expense ratio = 90-81 score (Good)
  // 71-80% expense ratio = 80-71 score (Fair)
  // 81-90% expense ratio = 70-61 score (Poor)
  // 91-100%+ expense ratio = 60-0 score (Critical)
  let score: number;
  if (expenseRatio <= 60) {
    // Excellent: 0-60% expenses, score 100-91
    score = Math.max(91, 100 - (expenseRatio / 60) * 9);
  } else if (expenseRatio <= 70) {
    // Good: 61-70% expenses, score 90-81
    score = Math.max(81, 90 - ((expenseRatio - 60) / 10) * 9);
  } else if (expenseRatio <= 80) {
    // Fair: 71-80% expenses, score 80-71
    score = Math.max(71, 80 - ((expenseRatio - 70) / 10) * 9);
  } else if (expenseRatio <= 90) {
    // Poor: 81-90% expenses, score 70-61
    score = Math.max(61, 70 - ((expenseRatio - 80) / 10) * 9);
  } else {
    // Critical: 91-100%+ expenses, score 60-0
    score = Math.max(0, 60 - ((expenseRatio - 90) / 10) * 60);
  }
  
  // Round score to nearest integer
  score = Math.round(score);
  
  // Determine classification based on expense ratio
  let classification: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  if (expenseRatio <= 60) classification = "Excellent";
  else if (expenseRatio <= 70) classification = "Good";
  else if (expenseRatio <= 80) classification = "Fair";
  else if (expenseRatio <= 90) classification = "Poor";
  else classification = "Critical";
  
  // Generate personalized message based on classification
  let message: string;
  switch (classification) {
    case "Excellent":
      message = "You're living below your means — great job!";
      break;
    case "Good":
    case "Fair":
      message = "Your expenses are balanced but close to your limit.";
      break;
    case "Poor":
    case "Critical":
      message = "Warning: you're spending more than you earn!";
      break;
    default:
      message = "";
  }
  
  // Identify alerts
  const alerts = identifyAlerts({
    monthlyIncome,
    monthlyExpenses,
    netAmount,
    savingsRate,
  });
  
  // Generate suggestions
  const suggestions = generateSuggestions({
    monthlyIncome,
    monthlyExpenses,
    netAmount,
    savingsRate,
    score,
    classification,
  });
  
  return {
    score,
    classification,
    monthlyIncome,
    monthlyExpenses,
    netAmount,
    savingsRate,
    message,
    alerts,
    suggestions,
  };
}

export async function calculateFinancialHealth(selectedDate?: Date): Promise<FinancialHealthData> {
  // Get tokens from cookies outside of cached function
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;
  
  const date = selectedDate || new Date();
  const cacheKey = `financial-health-${date.getFullYear()}-${date.getMonth()}`;
  return unstable_cache(
    async () => calculateFinancialHealthInternal(selectedDate, accessToken, refreshToken),
    [cacheKey],
    { revalidate: 60, tags: ['financial-health', 'transactions'] }
  )();
}


function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function identifyAlerts(data: {
  monthlyIncome: number;
  monthlyExpenses: number;
  netAmount: number;
  savingsRate: number;
}): Array<{
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  action: string;
}> {
  const alerts = [];
  
  // Expenses exceeding income
  if (data.monthlyExpenses > data.monthlyIncome) {
    const excessPercentage = ((data.monthlyExpenses / data.monthlyIncome - 1) * 100).toFixed(1);
    alerts.push({
      id: "expenses_exceeding_income",
      title: "Expenses Exceeding Income",
      description: `Your monthly expenses (${formatMoney(data.monthlyExpenses)}) are ${excessPercentage}% higher than your monthly income (${formatMoney(data.monthlyIncome)}).`,
      severity: "critical" as const,
      action: "Review your expenses and identify where you can reduce costs.",
    });
  }
  
  // Negative savings rate
  if (data.savingsRate < 0) {
    alerts.push({
      id: "negative_savings_rate",
      title: "Negative Savings Rate",
      description: `You are spending ${formatMoney(Math.abs(data.netAmount))} more than you earn per month.`,
      severity: "critical" as const,
      action: "Create a strict budget and increase your income or reduce expenses.",
    });
  }
  
  // Low savings rate (but positive)
  if (data.savingsRate > 0 && data.savingsRate < 10) {
    alerts.push({
      id: "low_savings_rate",
      title: "Low Savings Rate",
      description: `You are saving only ${data.savingsRate.toFixed(1)}% of your income (${formatMoney(data.netAmount)}/month).`,
      severity: "warning" as const,
      action: "Try to increase your savings rate to at least 20%.",
    });
  }
  
  // Very low savings rate (positive but < 5%)
  if (data.savingsRate > 0 && data.savingsRate < 5) {
    alerts.push({
      id: "very_low_savings_rate",
      title: "Very Low Savings Rate",
      description: `Your savings rate of ${data.savingsRate.toFixed(1)}% is below recommended.`,
      severity: "info" as const,
      action: "Consider reviewing your expenses to increase your savings capacity.",
    });
  }
  
  return alerts;
}

function generateSuggestions(data: {
  monthlyIncome: number;
  monthlyExpenses: number;
  netAmount: number;
  savingsRate: number;
  score: number;
  classification: string;
}): Array<{
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}> {
  const suggestions = [];
  
  // High impact suggestions
  if (data.monthlyExpenses > data.monthlyIncome) {
    const reductionNeeded = data.monthlyExpenses - data.monthlyIncome;
    suggestions.push({
      id: "reduce_expenses",
      title: "Urgently Reduce Expenses",
      description: `You need to reduce ${formatMoney(reductionNeeded)} per month to balance your income and expenses.`,
      impact: "high" as const,
    });
  }
  
  if (data.savingsRate < 0) {
    suggestions.push({
      id: "increase_income_or_reduce_expenses",
      title: "Increase Income or Reduce Expenses",
      description: `You are spending ${formatMoney(Math.abs(data.netAmount))} more than you earn. Prioritize increasing your income or reducing expenses.`,
      impact: "high" as const,
    });
  }
  
  if (data.savingsRate >= 0 && data.savingsRate < 10) {
    const targetSavings = data.monthlyIncome * 0.2;
    suggestions.push({
      id: "increase_savings_rate",
      title: "Increase Savings Rate",
      description: `Try to save at least 20% of your income. This means saving ${formatMoney(targetSavings)} per month.`,
      impact: "high" as const,
    });
  }
  
  // Medium impact suggestions
  if (data.savingsRate >= 10 && data.savingsRate < 20) {
    suggestions.push({
      id: "review_spending",
      title: "Review Expenses",
      description: "Analyze your expense categories and identify where you can reduce without affecting your quality of life.",
      impact: "medium" as const,
    });
  }
  
  if (data.monthlyExpenses > data.monthlyIncome * 0.9) {
    suggestions.push({
      id: "create_budget",
      title: "Create Budget",
      description: "Create a detailed budget to better control your expenses and ensure you save regularly.",
      impact: "medium" as const,
    });
  }
  
  // Low impact suggestions
  if (data.savingsRate >= 20 && data.savingsRate < 30) {
    suggestions.push({
      id: "optimize_savings",
      title: "Optimize Savings",
      description: "You're on the right track! Consider automating your savings and investing in low-risk applications.",
      impact: "low" as const,
    });
  }
  
  if (data.savingsRate >= 30) {
    suggestions.push({
      id: "maintain_good_habits",
      title: "Maintain Good Practices",
      description: "Excellent! You're maintaining a very healthy savings rate. Keep it up!",
      impact: "low" as const,
    });
  }
  
  return suggestions;
}
