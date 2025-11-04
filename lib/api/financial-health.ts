"use server";

import { getTransactions } from "./transactions";
import { startOfMonth, endOfMonth } from "date-fns";

export interface FinancialHealthData {
  score: number;
  classification: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  monthlyIncome: number;
  monthlyExpenses: number;
  netAmount: number;
  savingsRate: number;
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

export async function calculateFinancialHealth(selectedDate?: Date): Promise<FinancialHealthData> {
  const date = selectedDate || new Date();
  const selectedMonth = startOfMonth(date);
  const selectedMonthEnd = endOfMonth(date);
  
  // Get transactions for selected month only (to match the cards at the top)
  const transactions = await getTransactions({
    startDate: selectedMonth,
    endDate: selectedMonthEnd,
  });
  
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
  
  // Calculate score based on income vs expenses ratio
  // Score ranges from 0-100 based on savings rate
  // -50% or less (expenses > 150% of income) = 0
  // 0% (expenses = income) = 50
  // 50%+ savings rate = 100
  let score: number;
  if (savingsRate >= 50) {
    score = 100;
  } else if (savingsRate >= 30) {
    score = 80;
  } else if (savingsRate >= 20) {
    score = 60;
  } else if (savingsRate >= 10) {
    score = 40;
  } else if (savingsRate >= 0) {
    score = 20;
  } else if (savingsRate >= -20) {
    score = 10;
  } else {
    score = 0;
  }
  
  // Determine classification
  let classification: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  if (score >= 80) classification = "Excellent";
  else if (score >= 60) classification = "Good";
  else if (score >= 40) classification = "Fair";
  else if (score >= 20) classification = "Poor";
  else classification = "Critical";
  
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
    alerts,
    suggestions,
  };
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
      title: "Despesas Excedem Renda",
      description: `Suas despesas mensais (${formatMoney(data.monthlyExpenses)}) são ${excessPercentage}% maiores que sua renda mensal (${formatMoney(data.monthlyIncome)}).`,
      severity: "critical" as const,
      action: "Revise suas despesas e identifique onde pode reduzir custos.",
    });
  }
  
  // Negative savings rate
  if (data.savingsRate < 0) {
    alerts.push({
      id: "negative_savings_rate",
      title: "Taxa de Poupança Negativa",
      description: `Você está gastando ${formatMoney(Math.abs(data.netAmount))} a mais do que ganha por mês.`,
      severity: "critical" as const,
      action: "Crie um orçamento rigoroso e aumente sua renda ou reduza despesas.",
    });
  }
  
  // Low savings rate (but positive)
  if (data.savingsRate > 0 && data.savingsRate < 10) {
    alerts.push({
      id: "low_savings_rate",
      title: "Taxa de Poupança Baixa",
      description: `Você está poupando apenas ${data.savingsRate.toFixed(1)}% da sua renda (${formatMoney(data.netAmount)}/mês).`,
      severity: "warning" as const,
      action: "Tente aumentar sua taxa de poupança para pelo menos 20%.",
    });
  }
  
  // Very low savings rate (positive but < 5%)
  if (data.savingsRate > 0 && data.savingsRate < 5) {
    alerts.push({
      id: "very_low_savings_rate",
      title: "Taxa de Poupança Muito Baixa",
      description: `Sua taxa de poupança de ${data.savingsRate.toFixed(1)}% está abaixo do recomendado.`,
      severity: "info" as const,
      action: "Considere revisar suas despesas para aumentar sua capacidade de poupança.",
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
      title: "Reduzir Despesas Urgente",
      description: `Você precisa reduzir ${formatMoney(reductionNeeded)} por mês para equilibrar sua renda e despesas.`,
      impact: "high" as const,
    });
  }
  
  if (data.savingsRate < 0) {
    suggestions.push({
      id: "increase_income_or_reduce_expenses",
      title: "Aumentar Renda ou Reduzir Despesas",
      description: `Você está gastando ${formatMoney(Math.abs(data.netAmount))} a mais do que ganha. Priorize aumentar sua renda ou reduzir despesas.`,
      impact: "high" as const,
    });
  }
  
  if (data.savingsRate >= 0 && data.savingsRate < 10) {
    const targetSavings = data.monthlyIncome * 0.2;
    suggestions.push({
      id: "increase_savings_rate",
      title: "Aumentar Taxa de Poupança",
      description: `Tente poupar pelo menos 20% da sua renda. Isso significa poupar ${formatMoney(targetSavings)} por mês.`,
      impact: "high" as const,
    });
  }
  
  // Medium impact suggestions
  if (data.savingsRate >= 10 && data.savingsRate < 20) {
    suggestions.push({
      id: "review_spending",
      title: "Revisar Despesas",
      description: "Analise suas categorias de despesas e identifique onde pode reduzir sem afetar sua qualidade de vida.",
      impact: "medium" as const,
    });
  }
  
  if (data.monthlyExpenses > data.monthlyIncome * 0.9) {
    suggestions.push({
      id: "create_budget",
      title: "Criar Orçamento",
      description: "Crie um orçamento detalhado para controlar melhor suas despesas e garantir que você poupe regularmente.",
      impact: "medium" as const,
    });
  }
  
  // Low impact suggestions
  if (data.savingsRate >= 20 && data.savingsRate < 30) {
    suggestions.push({
      id: "optimize_savings",
      title: "Otimizar Poupança",
      description: "Você está no caminho certo! Considere automatizar suas poupanças e investir em aplicações de baixo risco.",
      impact: "low" as const,
    });
  }
  
  if (data.savingsRate >= 30) {
    suggestions.push({
      id: "maintain_good_habits",
      title: "Manter Boas Práticas",
      description: "Excelente! Você está mantendo uma taxa de poupança muito saudável. Continue assim!",
      impact: "low" as const,
    });
  }
  
  return suggestions;
}
