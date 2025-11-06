import { getTransactions } from "@/lib/api/transactions";
import { getTotalInvestmentsValue } from "@/lib/api/simple-investments";
import { getBudgets } from "@/lib/api/budgets";
import { getUpcomingTransactions } from "@/lib/api/transactions";
import { calculateFinancialHealth } from "@/lib/api/financial-health";
import { getGoals } from "@/lib/api/goals";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

interface DashboardData {
  selectedMonthTransactions: any[];
  lastMonthTransactions: any[];
  savings: number;
  budgets: any[];
  upcomingTransactions: any[];
  financialHealth: any;
  goals: any[];
  chartTransactions: any[];
}

export async function loadDashboardData(selectedMonthDate: Date): Promise<DashboardData> {
  const selectedMonth = startOfMonth(selectedMonthDate);
  const lastMonth = subMonths(selectedMonth, 1);
  const sixMonthsAgo = subMonths(selectedMonthDate, 5);
  const chartStart = startOfMonth(sixMonthsAgo);
  const chartEnd = endOfMonth(selectedMonthDate);

  // Fetch all data in parallel
  const [
    selectedMonthTransactions,
    lastMonthTransactions,
    savings,
    budgets,
    upcomingTransactions,
    financialHealth,
    goals,
    chartTransactions,
  ] = await Promise.all([
    getTransactions({
      startDate: selectedMonth,
      endDate: endOfMonth(selectedMonthDate),
    }).catch((error) => {
      console.error("Error fetching selected month transactions:", error);
      return [];
    }),
    getTransactions({
      startDate: lastMonth,
      endDate: endOfMonth(lastMonth),
    }).catch((error) => {
      console.error("Error fetching last month transactions:", error);
      return [];
    }),
    getTotalInvestmentsValue().catch((error) => {
      console.error("Error fetching total investments value:", error);
      return 0;
    }),
    getBudgets(selectedMonthDate).catch((error) => {
      console.error("Error fetching budgets:", error);
      return [];
    }),
    getUpcomingTransactions(5).catch((error) => {
      console.error("Error fetching upcoming transactions:", error);
      return [];
    }),
    calculateFinancialHealth(selectedMonthDate).catch((error) => {
      console.error("Error calculating financial health:", error);
      return null;
    }),
    getGoals().catch((error) => {
      console.error("Error fetching goals:", error);
      return [];
    }),
    getTransactions({
      startDate: chartStart,
      endDate: chartEnd,
    }).catch((error) => {
      console.error("Error fetching chart transactions:", error);
      return [];
    }),
  ]);

  return {
    selectedMonthTransactions,
    lastMonthTransactions,
    savings,
    budgets,
    upcomingTransactions,
    financialHealth,
    goals,
    chartTransactions,
  };
}

