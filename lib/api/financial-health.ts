"use server";

import { getAccounts } from "./accounts";
import { getTransactions } from "./transactions";
import { formatDateStart, formatDateEnd } from "@/lib/utils/timestamp";
import { startOfMonth, endOfMonth, subMonths, addMonths, eachMonthOfInterval } from "date-fns";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface FinancialHealthData {
  score: number;
  classification: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  totalBalance: number;
  monthsOfReserve: number;
  savingsRate: number;
  spendingTrend: number;
  futureProjection: {
    months: Array<{
      month: string;
      projectedBalance: number;
      projectedIncome: number;
      projectedExpenses: number;
    }>;
    willGoNegative: boolean;
    monthsUntilNegative: number | null;
  };
  factors: {
    liquidity: number; // 0-100
    savingsRate: number; // 0-100
    trend: number; // 0-100
    futureRisk: number; // 0-100 (higher = better, lower = more risk)
  };
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

export async function calculateFinancialHealth(): Promise<FinancialHealthData> {
  const now = new Date();
  const currentMonth = startOfMonth(now);
  
  // Get all accounts (excluding investment accounts for balance calculation)
  const accounts = await getAccounts();
  const nonInvestmentAccounts = accounts.filter(acc => acc.type !== "investment");
  
  // Calculate total balance
  const totalBalance = nonInvestmentAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  
  // Get transactions for last 3 months
  const months = eachMonthOfInterval({
    start: subMonths(currentMonth, 3),
    end: currentMonth
  });
  
  const monthlyData = await Promise.all(
    months.map(async (month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const transactions = await getTransactions({
        startDate: monthStart,
        endDate: monthEnd,
      });
      
      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month,
        income,
        expenses,
        net: income - expenses,
      };
    })
  );
  
  // Current month data
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const avgMonthlyIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length;
  const avgMonthlyExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;
  const avgMonthlyNet = avgMonthlyIncome - avgMonthlyExpenses;
  
  // Calculate savings rate
  const savingsRate = avgMonthlyIncome > 0 
    ? (avgMonthlyNet / avgMonthlyIncome) * 100 
    : 0;
  
  // Calculate months of reserve
  const monthsOfReserve = avgMonthlyExpenses > 0 
    ? totalBalance / avgMonthlyExpenses 
    : Infinity;
  
  // Calculate spending trend (comparing last 3 months)
  const last3Months = monthlyData.slice(-3);
  let spendingTrend = 0;
  
  if (last3Months.length >= 2) {
    const firstMonth = last3Months[0].expenses;
    const lastMonth = last3Months[last3Months.length - 1].expenses;
    spendingTrend = firstMonth > 0 
      ? ((lastMonth - firstMonth) / firstMonth) * 100 
      : 0;
  }
  
  // Calculate future projection (next 3 months)
  const futureProjection = await calculateFutureProjection(
    totalBalance,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    now
  );
  
  // Calculate factors for score
  const liquidityScore = Math.min((monthsOfReserve / 6) * 100, 100);
  const savingsRateScore = Math.max(0, Math.min(savingsRate * 100, 100)); // Convert to 0-100 scale
  const trendScore = spendingTrend < 0 
    ? 100 // Decreasing spending is good
    : Math.max(0, 100 - (spendingTrend * 2)); // Increasing spending is bad
  const futureRiskScore = futureProjection.willGoNegative 
    ? 0 
    : Math.max(0, 100 - (futureProjection.monthsUntilNegative ? (futureProjection.monthsUntilNegative * 10) : 0));
  
  // Calculate weighted score
  const score = Math.round(
    liquidityScore * 0.4 +
    savingsRateScore * 0.3 +
    trendScore * 0.2 +
    futureRiskScore * 0.1
  );
  
  // Determine classification
  let classification: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  if (score >= 80) classification = "Excellent";
  else if (score >= 60) classification = "Good";
  else if (score >= 40) classification = "Fair";
  else if (score >= 20) classification = "Poor";
  else classification = "Critical";
  
  // Identify alerts
  const alerts = identifyAlerts({
    totalBalance,
    monthsOfReserve,
    savingsRate,
    spendingTrend,
    futureProjection,
    currentMonthData,
    avgMonthlyExpenses,
    avgMonthlyIncome,
  });
  
  // Generate suggestions
  const suggestions = generateSuggestions({
    score,
    classification,
    totalBalance,
    monthsOfReserve,
    savingsRate,
    spendingTrend,
    futureProjection,
    currentMonthData,
    avgMonthlyExpenses,
    avgMonthlyIncome,
    alerts,
  });
  
  return {
    score,
    classification,
    totalBalance,
    monthsOfReserve,
    savingsRate,
    spendingTrend,
    futureProjection,
    factors: {
      liquidity: liquidityScore,
      savingsRate: savingsRateScore,
      trend: trendScore,
      futureRisk: futureRiskScore,
    },
    alerts,
    suggestions,
  };
}

async function calculateFutureProjection(
  currentBalance: number,
  avgIncome: number,
  avgExpenses: number,
  startDate: Date
) {
  const projectionMonths = [];
  let balance = currentBalance;
  let willGoNegative = false;
  let monthsUntilNegative: number | null = null;
  
  // Get recurring transactions for more accurate projection
  const recurringTransactions = await getTransactions({
    recurring: true,
  });
  
  // Calculate total recurring income and expenses per month
  let recurringMonthlyIncome = 0;
  let recurringMonthlyExpenses = 0;
  
  for (const tx of recurringTransactions) {
    if (tx.type === "income") {
      recurringMonthlyIncome += tx.amount;
    } else if (tx.type === "expense") {
      recurringMonthlyExpenses += tx.amount;
    }
  }
  
  // Project next 3 months
  for (let i = 1; i <= 3; i++) {
    const monthDate = addMonths(startDate, i);
    
    // Use recurring if available, otherwise use average
    const projectedIncome = recurringMonthlyIncome > 0 ? recurringMonthlyIncome : avgIncome;
    const projectedExpenses = recurringMonthlyExpenses > 0 ? recurringMonthlyExpenses : avgExpenses;
    
    balance = balance + projectedIncome - projectedExpenses;
    
    projectionMonths.push({
      month: monthDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
      projectedBalance: balance,
      projectedIncome,
      projectedExpenses,
    });
    
    if (!willGoNegative && balance < 0) {
      willGoNegative = true;
      monthsUntilNegative = i;
    }
  }
  
  return {
    months: projectionMonths,
    willGoNegative,
    monthsUntilNegative,
  };
}

function identifyAlerts(data: {
  totalBalance: number;
  monthsOfReserve: number;
  savingsRate: number;
  spendingTrend: number;
  futureProjection: { willGoNegative: boolean; monthsUntilNegative: number | null };
  currentMonthData: { income: number; expenses: number; net: number };
  avgMonthlyExpenses: number;
  avgMonthlyIncome: number;
}): Array<{
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  action: string;
}> {
  const alerts = [];
  
  // Negative balance
  if (data.totalBalance < 0) {
    alerts.push({
      id: "negative_balance",
      title: "Negative Balance",
      description: `Your current balance is negative by ${formatMoney(Math.abs(data.totalBalance))}.`,
      severity: "critical" as const,
      action: "Prioritize paying debts and reducing expenses immediately.",
    });
  }
  
  // Expenses exceeding income
  if (data.currentMonthData.expenses > data.currentMonthData.income) {
    alerts.push({
      id: "expenses_exceeding_income",
      title: "Expenses Exceeding Income",
      description: `This month you spent ${((data.currentMonthData.expenses / data.currentMonthData.income - 1) * 100).toFixed(1)}% more than you earned.`,
      severity: "critical" as const,
      action: "Review your expenses and identify where you can cut costs.",
    });
  }
  
  // Negative savings rate
  if (data.savingsRate < 0) {
    alerts.push({
      id: "negative_savings_rate",
      title: "Negative Savings Rate",
      description: `You are spending more than you earn monthly.`,
      severity: "critical" as const,
      action: "Create a strict budget and increase your income or reduce expenses.",
    });
  }
  
  // Less than 1 month of reserve
  if (data.monthsOfReserve < 1) {
    alerts.push({
      id: "insufficient_reserve",
      title: "Insufficient Emergency Reserve",
      description: `You have only ${(data.monthsOfReserve * 30).toFixed(0)} days of reserve. The ideal is to have at least 3-6 months.`,
      severity: "critical" as const,
      action: "Prioritize building an emergency reserve equivalent to 3-6 months of expenses.",
    });
  }
  
  // High spending trend
  if (data.spendingTrend > 20) {
    alerts.push({
      id: "high_spending_trend",
      title: "Rising Spending Trend",
      description: `Your expenses have increased by ${data.spendingTrend.toFixed(1)}% in recent months.`,
      severity: "warning" as const,
      action: "Analyze your recent expenses and identify patterns that can be reduced.",
    });
  }
  
  // Future negative projection
  if (data.futureProjection.willGoNegative) {
    alerts.push({
      id: "future_negative",
      title: "Projected Negative Balance",
      description: `If you continue like this, your balance will become negative in ${data.futureProjection.monthsUntilNegative} ${data.futureProjection.monthsUntilNegative === 1 ? "month" : "months"}.`,
      severity: "warning" as const,
      action: "Adjust your expenses or increase your income to avoid a negative balance.",
    });
  }
  
  // Less than 3 months reserve
  if (data.monthsOfReserve < 3 && data.monthsOfReserve >= 1) {
    alerts.push({
      id: "low_reserve",
      title: "Low Emergency Reserve",
      description: `You have only ${data.monthsOfReserve.toFixed(1)} ${data.monthsOfReserve < 2 ? "month" : "months"} of reserve.`,
      severity: "warning" as const,
      action: "Continue saving to reach the goal of 3-6 months of reserve.",
    });
  }
  
  // Low savings rate (but positive)
  if (data.savingsRate > 0 && data.savingsRate < 10) {
    alerts.push({
      id: "low_savings_rate",
      title: "Low Savings Rate",
      description: `You are saving only ${data.savingsRate.toFixed(1)}% of your income.`,
      severity: "info" as const,
      action: "Try to increase your savings rate to at least 20%.",
    });
  }
  
  return alerts;
}

function generateSuggestions(data: {
  score: number;
  classification: string;
  totalBalance: number;
  monthsOfReserve: number;
  savingsRate: number;
  spendingTrend: number;
  futureProjection: { willGoNegative: boolean; monthsUntilNegative: number | null };
  currentMonthData: { income: number; expenses: number; net: number };
  avgMonthlyExpenses: number;
  avgMonthlyIncome: number;
  alerts: Array<{ id: string; severity: string }>;
}): Array<{
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}> {
  const suggestions = [];
  
  // High impact suggestions
  if (data.totalBalance < 0) {
    suggestions.push({
      id: "pay_debt",
      title: "Pay Debts Immediately",
      description: "Focus on eliminating negative balances before investing. Use the snowball or avalanche strategy.",
      impact: "high" as const,
    });
  }
  
  if (data.monthsOfReserve < 3) {
    suggestions.push({
      id: "build_emergency_fund",
      title: "Build Emergency Reserve",
      description: `Create an emergency reserve equivalent to ${formatMoney(data.avgMonthlyExpenses * 3)} (3 months of expenses).`,
      impact: "high" as const,
    });
  }
  
  if (data.savingsRate < 10) {
    suggestions.push({
      id: "increase_savings_rate",
      title: "Increase Savings Rate",
      description: `Try to save at least 20% of your income. This means saving ${formatMoney(data.avgMonthlyIncome * 0.2)} per month.`,
      impact: "high" as const,
    });
  }
  
  // Medium impact suggestions
  if (data.spendingTrend > 10) {
    suggestions.push({
      id: "review_spending",
      title: "Review Recent Expenses",
      description: "Analyze your expense categories and identify where you can reduce without affecting your quality of life.",
      impact: "medium" as const,
    });
  }
  
  if (data.futureProjection.willGoNegative) {
    suggestions.push({
      id: "adjust_budget",
      title: "Adjust Budget",
      description: `Reduce expenses by ${formatMoney(data.avgMonthlyExpenses - data.avgMonthlyIncome)} per month to avoid a negative balance.`,
      impact: "medium" as const,
    });
  }
  
  // Low impact suggestions
  if (data.savingsRate >= 10 && data.savingsRate < 20) {
    suggestions.push({
      id: "optimize_savings",
      title: "Optimize Savings",
      description: "You're on the right track! Consider automating your savings and investing in low-risk applications.",
      impact: "low" as const,
    });
  }
  
  if (data.monthsOfReserve >= 3 && data.monthsOfReserve < 6) {
    suggestions.push({
      id: "expand_reserve",
      title: "Expand Reserve",
      description: "Continue increasing your reserve to 6 months of expenses for greater financial security.",
      impact: "low" as const,
    });
  }
  
  return suggestions;
}
