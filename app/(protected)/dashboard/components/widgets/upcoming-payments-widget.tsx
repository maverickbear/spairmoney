"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { formatMoney } from "@/components/common/money";
import { format, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import type { UpcomingTransaction } from "@/src/domain/transactions/transactions.types";
import { sentiment } from "@/lib/design-system/colors";
import Link from "next/link";

interface UpcomingPaymentsWidgetProps {
  upcomingTransactions: UpcomingTransaction[];
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
              <span className="text-xs text-muted-foreground">Payments:</span>
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

export function UpcomingPaymentsWidget({
  upcomingTransactions,
}: UpcomingPaymentsWidgetProps) {
  // Filter expense transactions
  const upcomingExpenses = useMemo(() => {
    return upcomingTransactions.filter((t) => t.type === "expense");
  }, [upcomingTransactions]);

  // Calculate total
  const total = useMemo(() => {
    return upcomingExpenses.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  }, [upcomingExpenses]);

  // Group by date for calendar view
  const paymentsByDate = useMemo(() => {
    const grouped = new Map<string, { amount: number; count: number; transactions: UpcomingTransaction[] }>();
    
    upcomingExpenses.forEach((t) => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      const dateKey = format(date, "MMM d");
      
      const existing = grouped.get(dateKey) || { amount: 0, count: 0, transactions: [] };
      existing.amount += Math.abs(t.amount || 0);
      existing.count += 1;
      existing.transactions.push(t);
      grouped.set(dateKey, existing);
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
        transactions: data.transactions,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [upcomingExpenses]);

  // Group by week for weekly chart
  const paymentsByWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30Days = addDays(today, 30);
    
    const weeks = new Map<string, { amount: number; count: number }>();
    
    upcomingExpenses.forEach((t) => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      if (date > next30Days) return;
      
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekKey = format(weekStart, "MMM d");
      
      const existing = weeks.get(weekKey) || { amount: 0, count: 0 };
      existing.amount += Math.abs(t.amount || 0);
      existing.count += 1;
      weeks.set(weekKey, existing);
    });

    return Array.from(weeks.entries())
      .map(([week, data]) => ({
        week: `Week of ${week}`,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.week);
        const dateB = new Date(b.week);
        return dateA.getTime() - dateB.getTime();
      });
  }, [upcomingExpenses]);

  // Group by category
  const paymentsByCategory = useMemo(() => {
    const grouped = upcomingExpenses.reduce(
      (acc, t) => {
        const categoryName = t.category?.name || "Uncategorized";
        const amount = Math.abs(t.amount || 0);

        if (!acc[categoryName]) {
          acc[categoryName] = { amount: 0, count: 0 };
        }
        acc[categoryName].amount += amount;
        acc[categoryName].count += 1;
        return acc;
      },
      {} as Record<string, { amount: number; count: number }>
    );

    return Object.entries(grouped)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [upcomingExpenses]);

  // Get next payment
  const nextPayment = useMemo(() => {
    if (upcomingExpenses.length === 0) return null;
    const sorted = [...upcomingExpenses].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    return sorted[0];
  }, [upcomingExpenses]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Upcoming</div>
          <div className="text-2xl font-bold text-foreground">{formatMoney(total)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {upcomingExpenses.length} {upcomingExpenses.length === 1 ? "payment" : "payments"}
          </div>
        </div>
        {nextPayment && (
          <div className="border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Next Payment</div>
            <div className="text-2xl font-bold text-foreground">
              {formatMoney(Math.abs(nextPayment.amount || 0))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {(() => {
                const date = nextPayment.date instanceof Date ? nextPayment.date : new Date(nextPayment.date);
                const days = differenceInDays(date, new Date());
                if (days === 0) return "Today";
                if (days === 1) return "Tomorrow";
                if (days > 0) return `In ${days} days`;
                return `${Math.abs(days)} days ago`;
              })()}
            </div>
          </div>
        )}
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Categories</div>
          <div className="text-2xl font-bold text-foreground">{paymentsByCategory.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Different categories</div>
        </div>
      </div>

      {/* Weekly Payments Chart */}
      {paymentsByWeek.length > 0 && (
        <ChartCard
          title="Payments by Week"
          description="Upcoming payments grouped by week"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentsByWeek} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="week"
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
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {paymentsByWeek.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={sentiment.negative} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Payments by Category */}
      {paymentsByCategory.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payments by Category</h3>
          <div className="space-y-3">
            {paymentsByCategory.slice(0, 5).map((category) => {
              const percentage = (category.amount / total) * 100;
              return (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {category.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {category.count} {category.count === 1 ? "payment" : "payments"}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatMoney(category.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-sentiment-negative h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Payments List */}
      {paymentsByDate.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Upcoming Payments</h3>
            <Link
              href="/planned-payment"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Manage payments
            </Link>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {paymentsByDate.map((dayData) => (
              <div key={dayData.date} className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <div className="text-sm font-medium text-foreground">{dayData.date}</div>
                    <div className="text-xs text-muted-foreground">
                      {dayData.count} {dayData.count === 1 ? "payment" : "payments"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatMoney(dayData.amount)}
                  </div>
                </div>
                <div className="space-y-1 pl-2">
                  {dayData.transactions.map((transaction) => {
                    const amount = Math.abs(transaction.amount || 0);
                    const date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
                    const days = differenceInDays(date, new Date());
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-1.5 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground truncate">
                            {transaction.description || transaction.category?.name || "Payment"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.category?.name || "Uncategorized"}
                            {days === 0 && " • Today"}
                            {days === 1 && " • Tomorrow"}
                            {days > 1 && ` • In ${days} days`}
                            {days < 0 && ` • ${Math.abs(days)} days ago`}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-foreground ml-4">
                          {formatMoney(amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingExpenses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No upcoming payments found.</p>
          <p className="text-xs mt-1">Add planned payments to see them here.</p>
        </div>
      )}
    </div>
  );
}

