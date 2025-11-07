import { getTransactions } from "@/lib/api/transactions";
import { getTotalInvestmentsValue } from "@/lib/api/simple-investments";
import { getBudgets } from "@/lib/api/budgets";
import { getUpcomingTransactions } from "@/lib/api/transactions";
import { calculateFinancialHealth } from "@/lib/api/financial-health";
import { getGoals } from "@/lib/api/goals";
import { getAccounts } from "@/lib/api/accounts";
import { checkOnboardingStatus } from "@/lib/api/onboarding";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

interface DashboardData {
  selectedMonthTransactions: any[];
  lastMonthTransactions: any[];
  allIncomeTransactions: any[];
  savings: number;
  budgets: any[];
  upcomingTransactions: any[];
  financialHealth: any;
  goals: any[];
  chartTransactions: any[];
  totalBalance: number;
  lastMonthTotalBalance: number;
  accounts: any[];
  onboardingStatus: any;
}

export async function loadDashboardData(selectedMonthDate: Date): Promise<DashboardData> {
  // Ensure we're working with the start of the month
  const selectedMonth = startOfMonth(selectedMonthDate);
  const selectedMonthEnd = endOfMonth(selectedMonth);
  const lastMonth = subMonths(selectedMonth, 1);
  const lastMonthEnd = endOfMonth(lastMonth);
  const sixMonthsAgo = subMonths(selectedMonth, 5);
  const chartStart = startOfMonth(sixMonthsAgo);
  const chartEnd = endOfMonth(selectedMonth);

  console.log("🔍 [data-loader] Date calculations:", {
    selectedMonthDate: selectedMonthDate.toISOString(),
    selectedMonth: {
      start: selectedMonth.toISOString(),
      end: selectedMonthEnd.toISOString(),
    },
    lastMonth: {
      start: lastMonth.toISOString(),
      end: lastMonthEnd.toISOString(),
    },
    chartRange: {
      start: chartStart.toISOString(),
      end: chartEnd.toISOString(),
    },
  });

  // Fetch all data in parallel
  const [
    selectedMonthTransactions,
    lastMonthTransactions,
    allIncomeTransactions,
    savings,
    budgets,
    upcomingTransactions,
    financialHealth,
    goals,
    chartTransactions,
    accounts,
    onboardingStatus,
  ] = await Promise.all([
    getTransactions({
      startDate: selectedMonth,
      endDate: selectedMonthEnd,
    }).then((transactions) => {
      // Debug: Log transactions to understand the issue
      console.log("🔍 [data-loader] Selected Month Transactions loaded:", {
          count: transactions.length,
          dateRange: {
            start: selectedMonth.toISOString(),
            end: selectedMonthEnd.toISOString(),
          },
        transactionTypes: [...new Set(transactions.map(t => t?.type).filter(Boolean))],
        incomeCount: transactions.filter(t => t?.type === "income").length,
        expenseCount: transactions.filter(t => t?.type === "expense").length,
        incomeTransactions: transactions.filter(t => t?.type === "income").map(t => ({
          id: t?.id,
          type: t?.type,
          amount: t?.amount,
          amountType: typeof t?.amount,
          parsedAmount: t?.amount != null ? (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)) : null,
          date: t?.date,
          description: t?.description,
        })),
        incomeTotal: transactions.filter(t => t?.type === "income").reduce((sum, t) => {
          const amount = t?.amount != null ? (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)) : 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0),
        expenseTotal: transactions.filter(t => t?.type === "expense").reduce((sum, t) => {
          const amount = t?.amount != null ? (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)) : 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0),
        sampleTransaction: transactions[0] ? {
          id: transactions[0].id,
          type: transactions[0].type,
          amount: transactions[0].amount,
          amountType: typeof transactions[0].amount,
          date: transactions[0].date,
        } : null,
      });
      return transactions;
    }).catch((error) => {
      console.error("❌ [data-loader] Error fetching selected month transactions:", error);
      return [];
    }),
    getTransactions({
      startDate: lastMonth,
      endDate: lastMonthEnd,
    }).catch((error) => {
      console.error("Error fetching last month transactions:", error);
      return [];
    }),
    // Fetch ALL income transactions (no date filter) for the Total Income widget
    getTransactions({
      type: "income",
    }).then(async (transactions) => {
      console.log("🔍 [data-loader] All Income Transactions loaded for Total Income Widget:", {
        count: transactions.length,
        transactions: transactions.slice(0, 5).map(t => ({
          id: t?.id,
          type: t?.type,
          amount: t?.amount,
          amountType: typeof t?.amount,
          parsedAmount: t?.amount != null ? (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)) : null,
          date: t?.date,
          description: t?.description,
          accountId: t?.accountId,
        })),
        totalIncome: transactions.reduce((sum, t) => {
          const amount = t?.amount != null ? (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)) : 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0),
      });

      // If no transactions found, check if user has accounts
      if (transactions.length === 0) {
        const { getAccounts } = await import("@/lib/api/accounts");
        const userAccounts = await getAccounts();
        console.log("🔍 [data-loader] No income transactions found. Checking user accounts:", {
          accountsCount: userAccounts.length,
          accounts: userAccounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            userId: (acc as any).userId,
            ownerIds: (acc as any).ownerIds,
          })),
        });
      }

      return transactions;
    }).catch((error) => {
      console.error("❌ [data-loader] Error fetching all income transactions:", error);
      return [];
    }),
    getTotalInvestmentsValue().catch((error) => {
      console.error("Error fetching total investments value:", error);
      return 0;
    }),
    getBudgets(selectedMonth).catch((error) => {
      console.error("Error fetching budgets:", error);
      return [];
    }),
    getUpcomingTransactions(5).catch((error) => {
      console.error("Error fetching upcoming transactions:", error);
      return [];
    }),
    calculateFinancialHealth(selectedMonth).catch((error) => {
      console.error("❌ [data-loader] Error calculating financial health:", {
        error: error?.message,
        stack: error?.stack,
        errorType: error?.constructor?.name,
      });
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
    getAccounts().catch((error) => {
      console.error("Error fetching accounts:", error);
      return [];
    }),
    checkOnboardingStatus().catch((error) => {
      console.error("Error checking onboarding status:", error);
      return null;
    }),
  ]);

  // Calculate total balance for ALL accounts (all households)
  const totalBalance = accounts.reduce(
    (sum: number, acc: any) => sum + (acc.balance || 0),
    0
  );

  // Calculate last month's total balance more efficiently
  // Instead of fetching ALL transactions from beginning of time, we can:
  // 1. Use the current account balance
  // 2. Subtract transactions from current month to get last month's balance
  // This is much more efficient than fetching all historical transactions
  // Get current month transactions (we already have selectedMonthTransactions)
  // Calculate the difference between current balance and current month transactions
  // to get last month's balance
  const currentMonthTransactions = selectedMonthTransactions;
  
  // Calculate last month's balance by subtracting current month transactions from current balance
  const currentMonthNetChange = currentMonthTransactions.reduce((sum: number, tx: any) => {
    if (tx.type === "income") {
      return sum + (Number(tx.amount) || 0);
    } else if (tx.type === "expense") {
      return sum - (Number(tx.amount) || 0);
    } else if (tx.type === "transfer") {
      // For transfers, we need to check if it's incoming or outgoing
      // This is simplified - in a real scenario, we'd need to check transferToId
      return sum; // Transfers don't change total balance
    }
    return sum;
  }, 0);

  // Last month's balance = current balance - current month net change
  const lastMonthTotalBalance = totalBalance - currentMonthNetChange;

  return {
    selectedMonthTransactions,
    lastMonthTransactions,
    allIncomeTransactions,
    savings,
    budgets,
    upcomingTransactions,
    financialHealth,
    goals,
    chartTransactions,
    totalBalance,
    lastMonthTotalBalance,
    accounts,
    onboardingStatus,
  };
}

