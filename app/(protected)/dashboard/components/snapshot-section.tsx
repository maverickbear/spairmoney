"use client";

import { Suspense } from "react";
import { useMemo } from "react";
import { formatMoney } from "@/components/common/money";
import { WidgetExpandableCard } from "@/components/dashboard/widget-expandable-card";
import { convertToMonthlyPayment } from "@/lib/utils/debts";
import type { TransactionWithRelations } from "@/src/domain/transactions/transactions.types";
import type { GoalWithCalculations } from "@/src/domain/goals/goals.types";
import type { DebtWithCalculations } from "@/src/domain/debts/debts.types";
import type { BasePlannedPayment } from "@/src/domain/planned-payments/planned-payments.types";
import type { UserServiceSubscription } from "@/src/domain/subscriptions/subscriptions.types";
import type { FinancialHealthData } from "@/src/application/shared/financial-health";
import { AvailableThisMonthWidget } from "./widgets/available-this-month-widget";
import { SpareScoreWidget } from "./widgets/spare-score-widget";

// Helper function to convert recurring frequency to monthly amount
function convertRecurringToMonthly(
  amount: number,
  frequency?: string
): number {
  if (!frequency) return Math.abs(amount);
  const validFrequencies: Array<"monthly" | "biweekly" | "weekly" | "semimonthly" | "daily"> = [
    "monthly",
    "biweekly",
    "weekly",
    "semimonthly",
    "daily",
  ];
  if (validFrequencies.includes(frequency as typeof validFrequencies[number])) {
    return convertToMonthlyPayment(Math.abs(amount), frequency as typeof validFrequencies[number]);
  }
  return Math.abs(amount);
}

interface SnapshotSectionProps {
  selectedMonthTransactions: TransactionWithRelations[];
  recurringPayments: TransactionWithRelations[];
  subscriptions: UserServiceSubscription[];
  plannedPayments: BasePlannedPayment[];
  goals: GoalWithCalculations[];
  debts: DebtWithCalculations[];
  financialHealth: FinancialHealthData | null;
  chartTransactions: Array<{ month: string; income: number; expenses: number }>;
  selectedMonthDate: Date;
}

export function SnapshotSection({
  selectedMonthTransactions,
  recurringPayments,
  subscriptions,
  plannedPayments,
  goals,
  debts,
  financialHealth,
  chartTransactions,
  selectedMonthDate,
}: SnapshotSectionProps) {
  // Calculate current income from transactions
  const currentIncome = useMemo(() => {
    return selectedMonthTransactions
      .filter((t) => t && t.type === "income")
      .reduce((sum, t) => {
        const amount = Number(t.amount) || 0;
        return sum + Math.abs(amount);
      }, 0);
  }, [selectedMonthTransactions]);

  // Calculate total bills (recurring payments + subscriptions + planned payments)
  const totalBills = useMemo(() => {
    return (
      recurringPayments.reduce((sum: number, rp: TransactionWithRelations) => {
        const recurringFrequency = (rp as TransactionWithRelations & { recurringFrequency?: string }).recurringFrequency;
        const monthlyAmount = convertRecurringToMonthly(rp.amount || 0, recurringFrequency);
        return sum + monthlyAmount;
      }, 0) +
      subscriptions
        .filter((s: UserServiceSubscription) => s.isActive)
        .reduce((sum: number, sub: UserServiceSubscription) => {
          const monthlyAmount = convertToMonthlyPayment(sub.amount || 0, sub.billingFrequency);
          return sum + monthlyAmount;
        }, 0) +
      plannedPayments.reduce((sum: number, pp: BasePlannedPayment) => {
        return sum + (pp.amount || 0);
      }, 0)
    );
  }, [recurringPayments, subscriptions, plannedPayments]);

  // Calculate total goals contributions
  const totalGoalsContributions = useMemo(() => {
    return goals
      .filter((g: GoalWithCalculations) => !g.isCompleted && !g.isPaused && g.monthlyContribution)
      .reduce((sum: number, g: GoalWithCalculations) => sum + (g.monthlyContribution || 0), 0);
  }, [goals]);

  // Calculate total minimum debt payments
  const totalMinimumDebtPayments = useMemo(() => {
    return debts
      .filter((d: DebtWithCalculations) => !d.isPaidOff && !d.isPaused)
      .reduce((sum: number, debt: DebtWithCalculations) => {
        let monthlyPayment = debt.monthlyPayment || 0;
        if (debt.paymentAmount && debt.paymentFrequency) {
          monthlyPayment = convertToMonthlyPayment(
            debt.paymentAmount,
            debt.paymentFrequency
          );
        }
        if (debt.additionalContributions && debt.additionalContributionAmount) {
          monthlyPayment += debt.additionalContributionAmount;
        }
        return sum + monthlyPayment;
      }, 0);
  }, [debts]);

  // Calculate Available this month
  const availableThisMonth = currentIncome - totalBills - totalGoalsContributions - totalMinimumDebtPayments;

  // Get Spare Score
  const spareScore = financialHealth?.score ?? 0;
  
  // Check if user has no data (no transactions inputted)
  const hasNoData = financialHealth 
    ? (financialHealth.monthlyIncome === 0 && financialHealth.monthlyExpenses === 0 && spareScore === 0)
    : true;
  
  // Determine Spare Score classification
  const getSpareScoreLabel = (score: number, hasNoData: boolean): { text: string; variant: "default" | "positive" | "warning" | "negative" } => {
    if (hasNoData) return { text: "No data", variant: "default" };
    if (score >= 80) return { text: "Excellent", variant: "positive" };
    if (score >= 60) return { text: "Good", variant: "default" };
    if (score >= 40) return { text: "Fair", variant: "warning" };
    return { text: "Needs Work", variant: "negative" };
  };

  const scoreLabel = getSpareScoreLabel(spareScore, hasNoData);

  // Get message from financial health
  const focusArea = financialHealth?.message || "Track your spending to improve stability.";
  
  // Display value for Spare Score
  const spareScoreDisplay = hasNoData ? "—" : spareScore.toString();

  return (
    <section
      className="rounded-[var(--radius)] p-0 mt-3.5"
      aria-label="Snapshot"
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="m-0 text-2xl font-semibold text-foreground">
          Where I am now
        </h2>
        <div className="text-muted-foreground text-xs">Quick snapshot</div>
      </div>

      <div className="grid gap-3.5 grid-cols-1 md:grid-cols-2">
        <WidgetExpandableCard
          label="Available this month"
          value={formatMoney(availableThisMonth)}
          subtitle="After bills, goals, and minimum debt payments."
          pill={{ text: "Month" }}
          expandedContent={
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
              <AvailableThisMonthWidget
                selectedMonthTransactions={selectedMonthTransactions}
                recurringPayments={recurringPayments}
                subscriptions={subscriptions}
                plannedPayments={plannedPayments}
                goals={goals}
                debts={debts}
                chartTransactions={chartTransactions}
                selectedMonthDate={selectedMonthDate}
              />
            </Suspense>
          }
          title="Available This Month"
          description="Detailed breakdown of your available funds"
        />

        <WidgetExpandableCard
          label="Spare Score"
          value={spareScoreDisplay}
          subtitle={focusArea}
          pill={scoreLabel}
          expandedContent={
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
              <SpareScoreWidget financialHealth={financialHealth} />
            </Suspense>
          }
          title="Spare Score Details"
          description="Your financial health score and insights"
        />
      </div>
    </section>
  );
}

