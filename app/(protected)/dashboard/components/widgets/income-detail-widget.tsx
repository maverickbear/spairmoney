"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { formatMoney } from "@/components/common/money";
import { format } from "date-fns";
import type { TransactionWithRelations } from "@/src/domain/transactions/transactions.types";
import { getCategoryColor } from "@/lib/utils/category-colors";
import { sentiment } from "@/lib/design-system/colors";

interface IncomeDetailWidgetProps {
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
          {data.name || "Uncategorized"}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Amount:</span>
            <span className="text-sm font-semibold text-foreground">
              {formatMoney(data.value)}
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

export function IncomeDetailWidget({
  selectedMonthTransactions,
  lastMonthTransactions,
  selectedMonthDate,
}: IncomeDetailWidgetProps) {
  // Filter income transactions
  const currentMonthIncome = useMemo(() => {
    return selectedMonthTransactions.filter((t) => t && t.type === "income");
  }, [selectedMonthTransactions]);

  const lastMonthIncome = useMemo(() => {
    return lastMonthTransactions.filter((t) => t && t.type === "income");
  }, [lastMonthTransactions]);

  // Calculate totals
  const currentTotal = useMemo(() => {
    return currentMonthIncome.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);
  }, [currentMonthIncome]);

  const lastMonthTotal = useMemo(() => {
    return lastMonthIncome.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);
  }, [lastMonthIncome]);

  const difference = currentTotal - lastMonthTotal;
  const percentageChange = lastMonthTotal > 0 ? (difference / lastMonthTotal) * 100 : 0;

  // Group by category
  const incomeByCategory = useMemo(() => {
    const grouped = currentMonthIncome.reduce(
      (acc, t) => {
        const categoryName = t.category?.name || "Uncategorized";
        const amount = Number(t.amount) || 0;
        const absAmount = Math.abs(amount);

        if (!acc[categoryName]) {
          acc[categoryName] = { value: 0, count: 0 };
        }
        acc[categoryName].value += absAmount;
        acc[categoryName].count += 1;
        return acc;
      },
      {} as Record<string, { value: number; count: number }>
    );

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthIncome]);

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...currentMonthIncome]
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [currentMonthIncome]);

  // Calculate days remaining in month
  const today = new Date();
  const endOfMonth = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 0);
  const daysRemaining = Math.max(0, endOfMonth.getDate() - today.getDate());
  const daysInMonth = endOfMonth.getDate();
  const daysElapsed = daysInMonth - daysRemaining;
  
  // Project income for rest of month (simple projection based on current rate)
  const dailyAverage = daysElapsed > 0 ? currentTotal / daysElapsed : 0;
  const projectedIncome = currentTotal + (dailyAverage * daysRemaining);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">This Month</div>
          <div className="text-2xl font-bold text-foreground">{formatMoney(currentTotal)}</div>
          {difference !== 0 && (
            <div className={`text-xs mt-1 ${difference > 0 ? "text-sentiment-positive" : "text-sentiment-negative"}`}>
              {difference > 0 ? "+" : ""}
              {formatMoney(difference)} ({percentageChange > 0 ? "+" : ""}
              {percentageChange.toFixed(1)}%) vs last month
            </div>
          )}
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Projected This Month</div>
          <div className="text-2xl font-bold text-foreground">{formatMoney(projectedIncome)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on {daysElapsed} days ({daysRemaining} remaining)
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

      {/* Income by Category Chart */}
      {incomeByCategory.length > 0 && (
        <ChartCard
          title="Income by Category"
          description="Breakdown of income sources for this month"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
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
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {incomeByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || sentiment.positive} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Income Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => {
              const amount = Math.abs(Number(transaction.amount) || 0);
              const date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {transaction.description || "No description"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.category?.name || "Uncategorized"} • {format(date, "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-sentiment-positive ml-4">
                    {formatMoney(amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentMonthIncome.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No income transactions found for this month.</p>
          <p className="text-xs mt-1">Add income transactions to see detailed breakdown.</p>
        </div>
      )}
    </div>
  );
}

