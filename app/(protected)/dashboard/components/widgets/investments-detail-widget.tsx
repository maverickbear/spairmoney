"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { formatMoney } from "@/components/common/money";
import type { AccountWithBalance } from "@/src/domain/accounts/accounts.types";
import { sentiment } from "@/lib/design-system/colors";
import Link from "next/link";

interface InvestmentsDetailWidgetProps {
  accounts: AccountWithBalance[];
}

const COLORS = [
  sentiment.positive,
  "#94DD78",
  "#2F5711",
  "#4A7C2A",
  "#6BA84F",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg bg-card p-3 backdrop-blur-sm border border-border shadow-lg">
        <p className="mb-2 text-sm font-medium text-foreground">
          {data.name || "Unknown"}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: data.payload.fill }}
            />
            <span className="text-xs text-muted-foreground">Amount:</span>
            <span className="text-sm font-semibold text-foreground">
              {formatMoney(data.value)}
            </span>
          </div>
          {data.payload.percentage && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Percentage:</span>
              <span className="text-sm font-semibold text-foreground">
                {data.payload.percentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {entry.value || "Unknown"}
          </span>
        </div>
      ))}
    </div>
  );
};

export function InvestmentsDetailWidget({
  accounts,
}: InvestmentsDetailWidgetProps) {
  // Filter investment accounts
  const investmentAccounts = useMemo(() => {
    return accounts.filter((acc) => acc.type === "investment");
  }, [accounts]);

  // Calculate total
  const totalInvestments = useMemo(() => {
    return investmentAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [investmentAccounts]);

  // Prepare data for pie chart
  const pieChartData = useMemo(() => {
    return investmentAccounts
      .map((account) => ({
        name: account.name || "Unknown",
        value: account.balance || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [investmentAccounts]);

  // Add percentage to data
  const pieChartDataWithPercentage = useMemo(() => {
    return pieChartData.map((item) => ({
      ...item,
      percentage: totalInvestments > 0 ? (item.value / totalInvestments) * 100 : 0,
    }));
  }, [pieChartData, totalInvestments]);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="border border-border rounded-lg p-4">
        <div className="text-xs text-muted-foreground mb-1">Total Investments</div>
        <div className="text-3xl font-bold text-foreground">{formatMoney(totalInvestments)}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {investmentAccounts.length} {investmentAccounts.length === 1 ? "account" : "accounts"}
        </div>
      </div>

      {/* Pie Chart */}
      {pieChartDataWithPercentage.length > 0 && (
        <ChartCard
          title="Investment Distribution"
          description="Breakdown of investments by account"
        >
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartDataWithPercentage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={120}
                  innerRadius={60}
                  fill={sentiment.positive}
                  dataKey="value"
                >
                  {pieChartDataWithPercentage.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Investment Accounts List */}
      {investmentAccounts.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Investment Accounts</h3>
            <Link
              href="/investments"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              View portfolio
            </Link>
          </div>
          <div className="space-y-2">
            {investmentAccounts
              .sort((a, b) => (b.balance || 0) - (a.balance || 0))
              .map((account, index) => {
                const percentage = totalInvestments > 0 ? ((account.balance || 0) / totalInvestments) * 100 : 0;
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {account.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground ml-4">
                      {formatMoney(account.balance || 0)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {investmentAccounts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No investment accounts found.</p>
          <p className="text-xs mt-1">
            <Link href="/accounts" className="underline hover:text-foreground">
              Add investment accounts
            </Link>{" "}
            to track your portfolio.
          </p>
        </div>
      )}
    </div>
  );
}

