import { unstable_cache } from "next/cache";
import { getTransactions } from "@/lib/api/transactions";
import { getTotalInvestmentsValue } from "@/lib/api/simple-investments";
import { getBudgets } from "@/lib/api/budgets";
import { getUpcomingTransactions } from "@/lib/api/transactions";
import { calculateFinancialHealth } from "@/lib/api/financial-health";
import { getGoals } from "@/lib/api/goals";
import { getAccounts } from "@/lib/api/accounts";
import { checkOnboardingStatus, type OnboardingStatus } from "@/lib/api/onboarding";
import { getUserLiabilities } from "@/lib/api/plaid/liabilities";
import { getDebts } from "@/lib/api/debts";
import { getCurrentUserId } from "@/lib/api/feature-guard";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { subMonths } from "date-fns/subMonths";
import { logger } from "@/lib/utils/logger";

interface DashboardData {
  selectedMonthTransactions: any[];
  lastMonthTransactions: any[];
  savings: number;
  budgets: any[];
  upcomingTransactions: any[];
  financialHealth: any;
  goals: any[];
  chartTransactions: any[];
  totalBalance: number;
  lastMonthTotalBalance: number;
  accounts: any[];
  liabilities: any[];
  debts: any[];
  onboardingStatus: OnboardingStatus | null;
}

async function loadDashboardDataInternal(selectedMonthDate: Date, userId: string | null): Promise<DashboardData> {
  // Ensure we're working with the start of the month
  const selectedMonth = startOfMonth(selectedMonthDate);
  const selectedMonthEnd = endOfMonth(selectedMonth);
  const lastMonth = subMonths(selectedMonth, 1);
  const lastMonthEnd = endOfMonth(lastMonth);
  const sixMonthsAgo = subMonths(selectedMonth, 5);
  const chartStart = startOfMonth(sixMonthsAgo);
  const chartEnd = endOfMonth(selectedMonth);

  // Fetch all data in parallel
  const [
    selectedMonthTransactionsResult,
    lastMonthTransactionsResult,
    savings,
    budgets,
    upcomingTransactions,
    financialHealth,
    goals,
    chartTransactionsResult,
    accounts,
    liabilities,
    debts,
    onboardingStatus,
  ] = await Promise.all([
    getTransactions({
      startDate: selectedMonth,
      endDate: selectedMonthEnd,
    }).catch((error) => {
      console.error("Error fetching selected month transactions:", error);
      return { transactions: [], total: 0 };
    }),
    getTransactions({
      startDate: lastMonth,
      endDate: lastMonthEnd,
    }).catch((error) => {
      console.error("Error fetching last month transactions:", error);
      return { transactions: [], total: 0 };
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
      return { transactions: [], total: 0 };
    }),
    getAccounts().catch((error) => {
      console.error("Error fetching accounts:", error);
      return [];
    }),
    userId ? getUserLiabilities(userId).catch((error) => {
      console.error("Error fetching liabilities:", error);
      return [];
    }) : Promise.resolve([]),
    getDebts().catch((error) => {
      console.error("Error fetching debts:", error);
      return [];
    }),
    checkOnboardingStatus().catch((error) => {
      console.error("Error checking onboarding status:", error);
      // Return default status on error so widget can still appear
      return {
        hasAccount: false,
        hasCompleteProfile: false,
        completedCount: 0,
        totalCount: 2,
      };
    }),
  ]);

  // Extract transactions arrays from the results
  const selectedMonthTransactions = Array.isArray(selectedMonthTransactionsResult) 
    ? selectedMonthTransactionsResult 
    : (selectedMonthTransactionsResult?.transactions || []);
  const lastMonthTransactions = Array.isArray(lastMonthTransactionsResult)
    ? lastMonthTransactionsResult
    : (lastMonthTransactionsResult?.transactions || []);
  const chartTransactions = Array.isArray(chartTransactionsResult)
    ? chartTransactionsResult
    : (chartTransactionsResult?.transactions || []);

  // Calculate total balance for ALL accounts (all households)
  const totalBalance = accounts.reduce(
    (sum: number, acc: any) => sum + (acc.balance || 0),
    0
  );

  // Calculate last month's total balance more efficiently
  // Use centralized service for consistent calculation
  const { calculateLastMonthBalanceFromCurrent } = await import('@/lib/services/balance-calculator');
  const lastMonthTotalBalance = calculateLastMonthBalanceFromCurrent(
    totalBalance,
    selectedMonthTransactions
  );

  return {
    selectedMonthTransactions,
    lastMonthTransactions,
    savings,
    budgets,
    upcomingTransactions,
    financialHealth,
    goals,
    chartTransactions,
    totalBalance,
    lastMonthTotalBalance,
    accounts,
    liabilities,
    debts,
    onboardingStatus,
  };
}

// Load dashboard data with caching
// Cache is invalidated when transactions, budgets, goals, or accounts change
export async function loadDashboardData(selectedMonthDate: Date): Promise<DashboardData> {
  // Get userId BEFORE caching (cookies can't be accessed inside unstable_cache)
  const userId = await getCurrentUserId();
  
  // Import cache utilities
  const { withCache, generateCacheKey, CACHE_TAGS, CACHE_DURATIONS } = await import('@/lib/services/cache-manager');
  
  try {
    // Use centralized cache manager with proper tags
    const cacheKey = generateCacheKey.dashboard({
      userId: userId || undefined,
      month: selectedMonthDate,
    });
    
    return await withCache(
      async () => loadDashboardDataInternal(selectedMonthDate, userId),
      {
        key: cacheKey,
        tags: [
          CACHE_TAGS.DASHBOARD,
          CACHE_TAGS.TRANSACTIONS,
          CACHE_TAGS.ACCOUNTS,
          CACHE_TAGS.BUDGETS,
          CACHE_TAGS.GOALS,
        ],
        revalidate: CACHE_DURATIONS.SHORT, // 10 seconds for fresh data
      }
    );
  } catch (error) {
    logger.error('[Dashboard] Error loading data:', error);
    throw error;
  }
}

