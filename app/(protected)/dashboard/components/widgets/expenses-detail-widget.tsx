"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { ExpensesPieChartWidget } from "@/components/dashboard/expenses-pie-chart-widget";
import { formatMoney } from "@/components/common/money";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import type { TransactionWithRelations } from "@/src/domain/transactions/transactions.types";
import { sentiment } from "@/lib/design-system/colors";

interface ExpensesDetailWidgetProps {
  selectedMonthTransactions: TransactionWithRelations[];
  lastMonthTransactions: TransactionWithRelations[];
  selectedMonthDate: Date;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg bg-card p-3 backdrop-blur-sm border border-border shadow-lg">
        <p className="mb-2 text-sm font-medium text-foreground">
          {data.date}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Amount:</span>
            <span className="text-sm font-semibold text-foreground">
              {formatMoney(data.amount)}
            </span>
          </div>
          {data.count && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Transactions:</span>
              <span className="text-sm font-semibold text-foreground">
                {data.count}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function ExpensesDetailWidget({
  selectedMonthTransactions,
  lastMonthTransactions,
  selectedMonthDate,
}: ExpensesDetailWidgetProps) {
  // Filter expense transactions
  const currentMonthExpenses = useMemo(() => {
    return selectedMonthTransactions.filter((t) => t && t.type === "expense");
  }, [selectedMonthTransactions]);

  const lastMonthExpenses = useMemo(() => {
    return lastMonthTransactions.filter((t) => t && t.type === "expense");
  }, [lastMonthTransactions]);

  // Calculate totals
  const currentTotal = useMemo(() => {
    return currentMonthExpenses.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);
  }, [currentMonthExpenses]);

  const lastMonthTotal = useMemo(() => {
    return lastMonthExpenses.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);
  }, [lastMonthExpenses]);

  const difference = currentTotal - lastMonthTotal;
  const percentageChange = lastMonthTotal > 0 ? (difference / lastMonthTotal) * 100 : 0;

  // Daily expenses for current month
  const dailyExpenses = useMemo(() => {
    const monthStart = startOfMonth(selectedMonthDate);
    const monthEnd = endOfMonth(selectedMonthDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const expensesByDay = new Map<string, { amount: number; count: number }>();

    // Initialize all days with 0
    days.forEach((day) => {
      const dayKey = format(day, "MMM d");
      expensesByDay.set(dayKey, { amount: 0, count: 0 });
    });

    // Add actual expenses
    currentMonthExpenses.forEach((t) => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      const dayKey = format(date, "MMM d");
      const existing = expensesByDay.get(dayKey) || { amount: 0, count: 0 };
      const amount = Math.abs(Number(t.amount) || 0);
      expensesByDay.set(dayKey, {
        amount: existing.amount + amount,
        count: existing.count + 1,
      });
    });

    return Array.from(expensesByDay.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count,
    }));
  }, [currentMonthExpenses, selectedMonthDate]);

  // Top 5 categories
  const topCategories = useMemo(() => {
    const grouped = currentMonthExpenses.reduce(
      (acc, t) => {
        const categoryName = t.category?.name || "Uncategorized";
        const amount = Math.abs(Number(t.amount) || 0);

        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [currentMonthExpenses]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">This Month</div>
          <div className="text-2xl font-bold text-foreground">{formatMoney(currentTotal)}</div>
          {difference !== 0 && (
            <div className={`text-xs mt-1 ${difference < 0 ? "text-sentiment-positive" : "text-sentiment-negative"}`}>
              {difference > 0 ? "+" : ""}
              {formatMoney(difference)} ({percentageChange > 0 ? "+" : ""}
              {percentageChange.toFixed(1)}%) vs last month
            </div>
          )}
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Daily Average</div>
          <div className="text-2xl font-bold text-foreground">
            {formatMoney(currentTotal / Math.max(1, new Date().getDate()))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on {new Date().getDate()} days
          </div>
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Last Month</div>
          <div className="text-2xl font-bold text-foreground">{formatMoney(lastMonthTotal)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {format(new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() - 1, 1), "MMM yyyy")}
          </div>
        </div>
      </div>

      {/* Daily Expenses Chart */}
      {dailyExpenses.length > 0 && (
        <ChartCard
          title="Daily Expenses"
          description="Expenses by day for current month"
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyExpenses} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                width={60}
                tickFormatter={(value) => {
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                  return `$${value}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke={sentiment.negative}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Expenses by Category Pie Chart */}
      {currentMonthExpenses.length > 0 && (
        <ExpensesPieChartWidget selectedMonthTransactions={selectedMonthTransactions} />
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Categories</h3>
          <div className="space-y-3">
            {topCategories.map((category, index) => {
              const percentage = (category.value / currentTotal) * 100;
              return (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatMoney(category.value)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-sentiment-negative h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total expenses
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentMonthExpenses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No expense transactions found for this month.</p>
          <p className="text-xs mt-1">Add expense transactions to see detailed breakdown.</p>
        </div>
      )}
    </div>
  );
}

