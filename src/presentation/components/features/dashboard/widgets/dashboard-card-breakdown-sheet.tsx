"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatMoney } from "@/components/common/money";
import type { DashboardWidgetsData } from "@/src/domain/dashboard/types";
import { Info } from "lucide-react";

export type DashboardBreakdownCardType = "available" | "income" | "savings" | "net-worth";

interface DashboardCardBreakdownSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardType: DashboardBreakdownCardType | null;
  data: DashboardWidgetsData | null;
}

function BreakdownRow({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-border last:border-0">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-base font-semibold tabular-nums shrink-0">{value}</span>
      </div>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  );
}

function WhatThisMeans({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 p-3 rounded-lg bg-muted/60 mt-4">
      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

export function DashboardCardBreakdownSheet({
  open,
  onOpenChange,
  cardType,
  data,
}: DashboardCardBreakdownSheetProps) {
  if (!cardType) return null;

  const title =
    cardType === "available"
      ? "Available"
      : cardType === "income"
        ? "Income"
        : cardType === "savings"
          ? "Savings"
          : "Net Worth";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col"
        aria-describedby={undefined}
      >
        <SheetHeader className="text-left pb-4 px-6 border-b border-border shrink-0">
          <SheetTitle>{title} breakdown</SheetTitle>
          <SheetDescription id={`${cardType}-breakdown-desc`}>
            Understand where these numbers come from and what they mean.
          </SheetDescription>
        </SheetHeader>

        <div className="pt-4 pb-6 px-6 flex-1 overflow-y-auto">
          {cardType === "available" && data?.accountStats && (
            <>
              <BreakdownRow
                label="Total available"
                value={formatMoney(data.accountStats.totalAvailable)}
                subtext="Sum of balances from your checking, savings, cash, and other liquid accounts."
              />
              {data.accountStats.availableCard != null && (
                <>
                  <BreakdownRow
                    label="Free to spend"
                    value={formatMoney(data.accountStats.availableCard.freeToSpend)}
                    subtext="Money left after reserved amounts and upcoming commitments."
                  />
                  <BreakdownRow
                    label="Projected end of month"
                    value={formatMoney(data.accountStats.availableCard.projectedEndOfMonth)}
                    subtext="Estimated balance at month end based on income and planned spending."
                  />
                </>
              )}
              <WhatThisMeans>
                <strong>Available</strong> is the total you can use from liquid accounts.{" "}
                <strong>Free to spend</strong> is what’s left after commitments.{" "}
                <strong>End of month</strong> helps you see if you’re on track before the next pay cycle.
              </WhatThisMeans>
            </>
          )}

          {cardType === "income" && data?.expectedIncomeOverview && (
            <>
              <BreakdownRow
                label="Actual income this month"
                value={formatMoney(data.expectedIncomeOverview.actualIncomeThisMonth)}
                subtext="Total income received so far this month (from linked accounts and added transactions)."
              />
              {data.expectedIncomeOverview.expectedMonthlyIncome > 0 && (
                <BreakdownRow
                  label="Expected monthly (after tax)"
                  value={`${formatMoney(data.expectedIncomeOverview.expectedMonthlyIncome)}/month`}
                  subtext="Your set expected monthly income, after tax when location is set."
                />
              )}
              {data.expectedIncomeOverview.nextPaycheckAmount != null &&
                data.expectedIncomeOverview.nextPaycheckDays != null && (
                  <BreakdownRow
                    label="Next paycheck"
                    value={`${formatMoney(data.expectedIncomeOverview.nextPaycheckAmount)} in ${data.expectedIncomeOverview.nextPaycheckDays} days`}
                    subtext="Next expected pay date and amount."
                  />
                )}
              {data.expectedIncomeOverview.spendingThisMonth != null &&
                data.expectedIncomeOverview.expectedMonthlyIncome > 0 &&
                data.expectedIncomeOverview.spendingAsPercentOfExpected != null && (
                  <BreakdownRow
                    label="Spending vs expected"
                    value={`${(data.expectedIncomeOverview.spendingAsPercentOfExpected ?? 0).toFixed(1)}% of expected income`}
                    subtext={`You’ve spent ${formatMoney(data.expectedIncomeOverview.spendingThisMonth)} this month.`}
                  />
                )}
              <WhatThisMeans>
                <strong>Actual income</strong> is what has hit your accounts this month.{" "}
                <strong>Expected monthly</strong> is the target you set to compare spending. Use &quot;Adjust&quot; on the card to change expected income or pay frequency.
              </WhatThisMeans>
            </>
          )}

          {cardType === "savings" && data?.accountStats && (
            <>
              <BreakdownRow
                label="Total savings"
                value={formatMoney(data.accountStats.totalSavings)}
                subtext="Sum of balances in your savings accounts."
              />
              {data.accountStats.savingsCard != null && (
                <>
                  <BreakdownRow
                    label="Saved this month"
                    value={formatMoney(data.accountStats.savingsCard.savedThisMonth)}
                    subtext="Income minus spending this month (positive = you saved)."
                  />
                  <BreakdownRow
                    label="Saving rate"
                    value={`${data.accountStats.savingsCard.savingPercentOfIncome}% of income`}
                    subtext={`Target: ${data.accountStats.savingsCard.savingTargetPercent}%.`}
                  />
                  <BreakdownRow
                    label="Emergency fund"
                    value={`${data.accountStats.savingsCard.emergencyFundMonths} months of expenses`}
                    subtext="How many months of expenses your current savings could cover."
                  />
                </>
              )}
              <WhatThisMeans>
                <strong>Total savings</strong> is the balance in savings accounts.{" "}
                <strong>Saved this month</strong> is income minus spending.{" "}
                <strong>Emergency fund</strong> shows how many months you could cover expenses with current savings.
              </WhatThisMeans>
            </>
          )}

          {cardType === "net-worth" && data?.netWorth != null && (
            <>
              <BreakdownRow
                label="Net worth"
                value={formatMoney(data.netWorth.netWorth)}
                subtext="Total assets minus total liabilities."
              />
              <BreakdownRow
                label="Total assets"
                value={formatMoney(data.netWorth.totalAssets)}
                subtext="Sum of all asset account balances (e.g. checking, savings, investments)."
              />
              <BreakdownRow
                label="Total debt (liabilities)"
                value={formatMoney(data.netWorth.totalLiabilities)}
                subtext="Sum of all liability balances (e.g. loans, credit cards)."
              />
              {data.netWorth.drivers?.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium text-foreground mb-2">Changes driving net worth</p>
                  <ul className="space-y-2">
                    {data.netWorth.drivers.map((d, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{d.label}</span>
                        <span className="tabular-nums">
                          {d.change >= 0 ? "+" : ""}{formatMoney(d.change)} ({d.changePercentage >= 0 ? "+" : ""}{d.changePercentage}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <WhatThisMeans>
                <strong>Net worth</strong> is assets minus debts. It’s a snapshot of your overall financial position. Assets include cash and investments; liabilities include loans and credit card debt.
              </WhatThisMeans>
            </>
          )}

          {cardType !== null &&
            ((cardType === "available" && !data?.accountStats) ||
              (cardType === "income" && !data?.expectedIncomeOverview) ||
              (cardType === "savings" && !data?.accountStats) ||
              (cardType === "net-worth" && !data?.netWorth)) && (
              <p className="text-sm text-muted-foreground py-4">No breakdown data available for this card.</p>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
