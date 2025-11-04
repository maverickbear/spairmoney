import { getBudgets } from "@/lib/api/budgets";
import { getTransactions, getUpcomingTransactions } from "@/lib/api/transactions";
import { getTotalInvestmentsValue } from "@/lib/api/simple-investments";
import { calculateFinancialHealth } from "@/lib/api/financial-health";
import { getGoals } from "@/lib/api/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/components/common/money";
import { GoalsOverview } from "@/components/dashboard/goals-overview";
import { CategoryExpensesChart } from "@/components/charts/category-expenses-chart";
import { BudgetExecutionChart } from "@/components/charts/budget-execution-chart";
import { IncomeExpensesChart } from "@/components/charts/income-expenses-chart";
import { UpcomingTransactions } from "@/components/dashboard/upcoming-transactions";
import { FinancialHealthWidget } from "@/components/dashboard/financial-health-widget";
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from "date-fns";
import { MonthSelector } from "@/components/dashboard/month-selector";

interface DashboardProps {
  searchParams: Promise<{ month?: string }> | { month?: string };
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  try {
    // Get selected month from URL or use current month
    const params = await Promise.resolve(searchParams);
    const selectedMonthParam = params?.month;
    const selectedMonthDate = selectedMonthParam 
      ? new Date(selectedMonthParam)
      : new Date();
    
    const now = new Date();
    const selectedMonth = startOfMonth(selectedMonthDate);
    const currentMonth = startOfMonth(now);
    const lastMonth = subMonths(selectedMonth, 1);

    // Get transactions for selected month
    const selectedMonthTransactions = await getTransactions({
      startDate: selectedMonth,
      endDate: endOfMonth(selectedMonthDate),
    }).catch((error) => {
      console.error("Error fetching selected month transactions:", error);
      return [];
    });

    // Get transactions for last month
    const lastMonthTransactions = await getTransactions({
      startDate: lastMonth,
      endDate: endOfMonth(lastMonth),
    }).catch((error) => {
      console.error("Error fetching last month transactions:", error);
      return [];
    });

  // Calculate metrics
  const currentIncome = selectedMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentExpenses = selectedMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const momChange = lastMonthExpenses > 0
    ? ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
    : 0;

  // Get total investments value from simple investments
  const savings = await getTotalInvestmentsValue().catch((error) => {
    console.error("Error fetching total investments value:", error);
    return 0;
  });

  // Expenses by category
  const expensesByCategory = selectedMonthTransactions
    .filter((t) => t.type === "expense" && t.category && t.category.name)
    .reduce((acc, t) => {
      const catName = t.category?.name || "Uncategorized";
      if (!acc[catName]) {
        acc[catName] = 0;
      }
      acc[catName] += t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryExpensesData = Object.entries(expensesByCategory).map(
    ([name, value]) => ({ name, value: value as number })
  );

  // Budget execution data
  const budgets = await getBudgets(selectedMonthDate).catch((error) => {
    console.error("Error fetching budgets:", error);
    return [];
  });
  
  const budgetExecutionData = budgets
    .filter((b) => b.category)
    .map((b) => ({
      category: b.category?.name || "Unknown",
      percentage: b.percentage || 0,
    }));

  // Get upcoming transactions
  const upcomingTransactions = await getUpcomingTransactions(5).catch((error) => {
    console.error("Error fetching upcoming transactions:", error);
    return [];
  });

  // Get financial health data for selected month
  const financialHealth = await calculateFinancialHealth(selectedMonthDate).catch((error) => {
    console.error("Error calculating financial health:", error);
    return null;
  });

  // Get goals data
  const goals = await getGoals().catch((error) => {
    console.error("Error fetching goals:", error);
    return [];
  });

  // Get transactions for the last 6 months for Income vs Expenses chart (ending at selected month)
  const sixMonthsAgo = subMonths(selectedMonthDate, 5); // 5 months ago + selected month = 6 months
  const chartStart = startOfMonth(sixMonthsAgo);
  const chartEnd = endOfMonth(selectedMonthDate);
  const chartTransactions = await getTransactions({
    startDate: chartStart,
    endDate: chartEnd,
  }).catch((error) => {
    console.error("Error fetching chart transactions:", error);
    return [];
  });

  // Calculate monthly income and expenses for the last 6 months
  const months = eachMonthOfInterval({ start: chartStart, end: chartEnd });
  const monthlyData = months.map((month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthTransactions = chartTransactions.filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: format(month, "MMM"),
      income,
      expenses,
    };
  });

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Overview of your finances</p>
        </div>
        <MonthSelector />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-green-600">{formatMoney(currentIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-red-600">{formatMoney(currentExpenses)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Savings/Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{formatMoney(savings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Month-over-Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg md:text-2xl font-bold ${momChange >= 0 ? "text-red-600" : "text-green-600"}`}>
              {momChange >= 0 ? "+" : ""}{momChange.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow and Financial Health */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <IncomeExpensesChart data={monthlyData} />
        {financialHealth && (
          <FinancialHealthWidget data={financialHealth} />
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <GoalsOverview goals={goals} />
        {categoryExpensesData.length > 0 && (
          <CategoryExpensesChart data={categoryExpensesData} totalIncome={currentIncome} />
        )}
      </div>

      {/* Upcoming Transactions and Budget Execution */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <UpcomingTransactions transactions={upcomingTransactions} />
        {budgetExecutionData.length > 0 && (
          <BudgetExecutionChart data={budgetExecutionData} />
        )}
      </div>
    </div>
  );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your finances</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading dashboard. Please check the console for details.</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
