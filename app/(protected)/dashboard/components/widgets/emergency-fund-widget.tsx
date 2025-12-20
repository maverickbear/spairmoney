"use client";

import { useMemo } from "react";
import { formatMoney } from "@/components/common/money";
import type { AccountWithBalance } from "@/src/domain/accounts/accounts.types";
import type { FinancialHealthData } from "@/src/application/shared/financial-health";
import Link from "next/link";

interface EmergencyFundWidgetProps {
  financialHealth: FinancialHealthData | null;
  accounts: AccountWithBalance[];
}

// Simple gauge component
function GaugeChart({ value, max, label }: { value: number; max: number; label: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees
  const radius = 80;
  const circumference = Math.PI * radius;

  const getColor = () => {
    if (percentage >= 100) return "text-sentiment-positive";
    if (percentage >= 50) return "text-sentiment-warning";
    return "text-sentiment-negative";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24">
        {/* Background arc */}
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke={
              percentage >= 100
                ? "hsl(var(--sentiment-positive))"
                : percentage >= 50
                ? "hsl(var(--sentiment-warning))"
                : "hsl(var(--sentiment-negative))"
            }
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (percentage / 100) * circumference}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "100px 100px",
            }}
          />
        </svg>
        {/* Value text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getColor()}`}>
              {value.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmergencyFundWidget({
  financialHealth,
  accounts,
}: EmergencyFundWidgetProps) {
  const emergencyFundMonths = financialHealth?.emergencyFundMonths ?? 0;
  const recommendedMonths = 6;
  const targetMonths = 8;

  // Calculate emergency fund amount
  const emergencyFundAmount = useMemo(() => {
    const savingsAccounts = accounts.filter((acc) => acc.type === "savings");
    return savingsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [accounts]);

  // Calculate monthly expenses (from financial health or estimate)
  const monthlyExpenses = financialHealth?.monthlyExpenses || 0;
  const targetAmount = monthlyExpenses * recommendedMonths;
  const progressPercentage = targetAmount > 0 ? (emergencyFundAmount / targetAmount) * 100 : 0;

  const getStatusLabel = (months: number): { text: string; variant: "default" | "positive" | "warning" | "negative" } => {
    if (months >= targetMonths) return { text: "Excellent", variant: "positive" };
    if (months >= recommendedMonths) return { text: "Good", variant: "positive" };
    if (months >= recommendedMonths / 2) return { text: "Moderate", variant: "warning" };
    if (months > 0) return { text: "Low", variant: "warning" };
    return { text: "None", variant: "negative" };
  };

  const statusLabel = getStatusLabel(emergencyFundMonths);

  // Calculate how much more is needed
  const amountNeeded = Math.max(0, targetAmount - emergencyFundAmount);
  const monthsNeeded = monthlyExpenses > 0 ? amountNeeded / monthlyExpenses : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Current Coverage</div>
          <div className="text-2xl font-bold text-foreground">
            {emergencyFundMonths.toFixed(1)} months
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatMoney(emergencyFundAmount)} saved
          </div>
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Target Coverage</div>
          <div className="text-2xl font-bold text-foreground">
            {recommendedMonths}-{targetMonths} months
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatMoney(targetAmount)} target
          </div>
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Status</div>
          <div
            className={`text-2xl font-bold ${
              statusLabel.variant === "positive"
                ? "text-sentiment-positive"
                : statusLabel.variant === "warning"
                ? "text-sentiment-warning"
                : "text-sentiment-negative"
            }`}
          >
            {statusLabel.text}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {progressPercentage.toFixed(0)}% of target
          </div>
        </div>
      </div>

      {/* Gauge Chart */}
      <div className="border border-border rounded-lg p-6 flex flex-col items-center">
        <h3 className="text-lg font-semibold text-foreground mb-4">Emergency Fund Progress</h3>
        <GaugeChart
          value={emergencyFundMonths}
          max={targetMonths}
          label="months"
        />
        <div className="mt-6 w-full max-w-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>0 months</span>
            <span>{targetMonths} months</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                progressPercentage >= 100
                  ? "bg-sentiment-positive"
                  : progressPercentage >= 50
                  ? "bg-sentiment-warning"
                  : "bg-sentiment-negative"
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Insights</h3>
        <div className="space-y-3">
          {emergencyFundMonths >= targetMonths && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-sentiment-positive mt-1.5" />
              <div>
                <div className="text-sm font-medium text-foreground">Excellent Coverage</div>
                <div className="text-xs text-muted-foreground">
                  You have enough emergency fund to cover {emergencyFundMonths.toFixed(1)} months of expenses. Great job!
                </div>
              </div>
            </div>
          )}
          {emergencyFundMonths >= recommendedMonths && emergencyFundMonths < targetMonths && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-sentiment-positive mt-1.5" />
              <div>
                <div className="text-sm font-medium text-foreground">Good Coverage</div>
                <div className="text-xs text-muted-foreground">
                  You have {emergencyFundMonths.toFixed(1)} months of coverage. Consider building up to {targetMonths} months for extra security.
                </div>
              </div>
            </div>
          )}
          {emergencyFundMonths > 0 && emergencyFundMonths < recommendedMonths && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-sentiment-warning mt-1.5" />
              <div>
                <div className="text-sm font-medium text-foreground">Building Emergency Fund</div>
                <div className="text-xs text-muted-foreground">
                  You have {emergencyFundMonths.toFixed(1)} months of coverage. Aim for {recommendedMonths}-{targetMonths} months for better financial security.
                </div>
              </div>
            </div>
          )}
          {emergencyFundMonths === 0 && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-sentiment-negative mt-1.5" />
              <div>
                <div className="text-sm font-medium text-foreground">No Emergency Fund</div>
                <div className="text-xs text-muted-foreground">
                  Start building your emergency fund. Aim to save {recommendedMonths}-{targetMonths} months of expenses ({formatMoney(targetAmount)}).
                </div>
              </div>
            </div>
          )}
          {amountNeeded > 0 && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5" />
              <div>
                <div className="text-sm font-medium text-foreground">Amount Needed</div>
                <div className="text-xs text-muted-foreground">
                  You need {formatMoney(amountNeeded)} more to reach {recommendedMonths} months of coverage
                  {monthsNeeded > 0 && ` (approximately ${monthsNeeded.toFixed(1)} months of saving)`}.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Savings Accounts */}
      {accounts.filter((acc) => acc.type === "savings").length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Savings Accounts</h3>
            <Link
              href="/accounts"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Manage accounts
            </Link>
          </div>
          <div className="space-y-2">
            {accounts
              .filter((acc) => acc.type === "savings")
              .map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {account.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {account.type}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground ml-4">
                    {formatMoney(account.balance || 0)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

