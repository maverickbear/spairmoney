"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { formatMoney } from "@/components/common/money";
import type { AccountWithBalance } from "@/src/domain/accounts/accounts.types";
import type { DebtWithCalculations } from "@/src/domain/debts/debts.types";
import { sentiment } from "@/lib/design-system/colors";
import Link from "next/link";

interface NetWorthDetailWidgetProps {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  accounts: AccountWithBalance[];
  debts: DebtWithCalculations[];
  liabilities: AccountWithBalance[];
  chartTransactions?: Array<{ month: string; income: number; expenses: number }>;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg bg-card p-3 backdrop-blur-sm border border-border shadow-lg">
        <p className="mb-2 text-sm font-medium text-foreground">
          {data.month || data.name}
        </p>
        <div className="space-y-1">
          {data.netWorth !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Net Worth:</span>
              <span
                className={`text-sm font-semibold ${
                  data.netWorth >= 0 ? "text-sentiment-positive" : "text-sentiment-negative"
                }`}
              >
                {formatMoney(data.netWorth)}
              </span>
            </div>
          )}
          {data.assets !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Assets:</span>
              <span className="text-sm font-semibold text-foreground">
                {formatMoney(data.assets)}
              </span>
            </div>
          )}
          {data.debts !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Debts:</span>
              <span className="text-sm font-semibold text-foreground">
                {formatMoney(data.debts)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function NetWorthDetailWidget({
  netWorth,
  totalAssets,
  totalDebts,
  accounts,
  debts,
  liabilities,
  chartTransactions = [],
}: NetWorthDetailWidgetProps) {
  // Calculate net worth trend (simplified - would need historical data)
  const netWorthTrend = useMemo(() => {
    // Estimate trend from chart transactions
    // In a real scenario, we'd have historical net worth data
    if (chartTransactions.length < 2) return [];
    
    return chartTransactions.map((item, index) => {
      // Simple estimation: assume net worth changes by net cash flow
      const netCashFlow = item.income - item.expenses;
      // This is a simplified calculation - real implementation would track actual net worth
      const estimatedNetWorth = netWorth - (netCashFlow * (chartTransactions.length - index - 1));
      return {
        month: item.month,
        netWorth: estimatedNetWorth,
        assets: totalAssets, // Simplified - would need historical data
        debts: totalDebts, // Simplified - would need historical data
      };
    }).reverse();
  }, [chartTransactions, netWorth, totalAssets, totalDebts]);

  // Breakdown by account type
  const assetsByType = useMemo(() => {
    const grouped = accounts.reduce(
      (acc, account) => {
        const type = account.type || "other";
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type] += account.balance || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(grouped)
      .map(([type, value]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: Math.max(0, value), // Only positive assets
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  // Debts breakdown
  const debtsBreakdown = useMemo(() => {
    const activeDebts = debts.filter((d) => !d.isPaidOff);
    const debtFromLiabilities = liabilities
      .filter((l) => (l.balance || 0) < 0)
      .reduce((sum, l) => sum + Math.abs(l.balance || 0), 0);
    
    const debtFromDebts = activeDebts.reduce((sum, d) => sum + (d.currentBalance || 0), 0);

    return [
      { name: "Debts", value: debtFromDebts },
      { name: "Liabilities", value: debtFromLiabilities },
    ].filter((item) => item.value > 0);
  }, [debts, liabilities]);

  // Calculate change (would need previous month data)
  const netWorthChange = netWorthTrend.length >= 2
    ? netWorth - netWorthTrend[netWorthTrend.length - 2].netWorth
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Net Worth</div>
          <div
            className={`text-2xl font-bold ${
              netWorth >= 0 ? "text-sentiment-positive" : "text-sentiment-negative"
            }`}
          >
            {formatMoney(netWorth)}
          </div>
          {netWorthChange !== 0 && (
            <div className={`text-xs mt-1 ${netWorthChange > 0 ? "text-sentiment-positive" : "text-sentiment-negative"}`}>
              {netWorthChange > 0 ? "+" : ""}
              {formatMoney(netWorthChange)} change
            </div>
          )}
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Assets</div>
          <div className="text-2xl font-bold text-foreground">{formatMoney(totalAssets)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          </div>
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Debts</div>
          <div className="text-2xl font-bold text-sentiment-negative">{formatMoney(totalDebts)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {debts.filter((d) => !d.isPaidOff).length} active {debts.filter((d) => !d.isPaidOff).length === 1 ? "debt" : "debts"}
          </div>
        </div>
      </div>

      {/* Net Worth Trend */}
      {netWorthTrend.length > 0 && (
        <ChartCard
          title="Net Worth Trend"
          description="Estimated net worth over the last 6 months"
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={netWorthTrend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
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
                dataKey="netWorth"
                stroke={sentiment.positive}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {/* Zero line */}
              <Line
                type="monotone"
                dataKey={() => 0}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Assets vs Debts Breakdown */}
      <ChartCard
        title="Assets vs Debts"
        description="Breakdown of your financial position"
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              { name: "Assets", value: totalAssets },
              { name: "Debts", value: -totalDebts },
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
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
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              width={60}
              tickFormatter={(value) => {
                if (Math.abs(value) >= 1000) return `$${(Math.abs(value) / 1000).toFixed(0)}k`;
                return `$${Math.abs(value)}`;
              }}
            />
            <Tooltip
              formatter={(value: number) => formatMoney(Math.abs(value))}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <Cell fill={sentiment.positive} />
              <Cell fill={sentiment.negative} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Assets by Type */}
      {assetsByType.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Assets by Type</h3>
            <Link
              href="/accounts"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Manage accounts
            </Link>
          </div>
          <div className="space-y-3">
            {assetsByType.map((item) => {
              const percentage = (item.value / totalAssets) * 100;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatMoney(item.value)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-sentiment-positive h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total assets
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Debts Breakdown */}
      {debtsBreakdown.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Debts Breakdown</h3>
            <Link
              href="/debts"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Manage debts
            </Link>
          </div>
          <div className="space-y-3">
            {debtsBreakdown.map((item) => {
              const percentage = (item.value / totalDebts) * 100;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <span className="text-sm font-semibold text-sentiment-negative">
                      {formatMoney(item.value)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-sentiment-negative h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total debts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

