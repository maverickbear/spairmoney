"use client";

import { Suspense } from "react";
import { useMemo } from "react";
import { formatMoney } from "@/components/common/money";
import { WidgetExpandableCard } from "@/components/dashboard/widget-expandable-card";
import type { AccountWithBalance } from "@/src/domain/accounts/accounts.types";
import type { DebtWithCalculations } from "@/src/domain/debts/debts.types";
import { NetWorthDetailWidget } from "./widgets/net-worth-detail-widget";
import { InvestmentsDetailWidget } from "./widgets/investments-detail-widget";

interface WealthSectionProps {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  accounts: AccountWithBalance[];
  debts: DebtWithCalculations[];
  liabilities: AccountWithBalance[];
  chartTransactions?: Array<{ month: string; income: number; expenses: number }>;
}

export function WealthSection({
  netWorth,
  totalAssets,
  totalDebts,
  accounts,
  debts,
  liabilities,
  chartTransactions = [],
}: WealthSectionProps) {
  // Calculate investments (sum of investment accounts)
  const investments = useMemo(() => {
    return accounts
      .filter((acc) => acc.type === "investment")
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [accounts]);

  return (
    <section
      className="rounded-[var(--radius)] p-0 mt-3.5"
      aria-label="Wealth"
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="m-0 text-2xl font-semibold text-foreground">
          My financial foundation
        </h2>
        <div className="text-muted-foreground text-xs">High-level only</div>
      </div>

      <div className="grid gap-3.5 grid-cols-1 md:grid-cols-2">
        <WidgetExpandableCard
          label="Net worth"
          value={formatMoney(netWorth)}
          subtitle="Assets minus debts."
          pill={{ text: "Total" }}
          expandedContent={
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
              <NetWorthDetailWidget
                netWorth={netWorth}
                totalAssets={totalAssets}
                totalDebts={totalDebts}
                accounts={accounts}
                debts={debts}
                liabilities={liabilities}
                chartTransactions={chartTransactions}
              />
            </Suspense>
          }
          title="Net Worth Details"
          description="Detailed breakdown of your net worth"
        />

        <WidgetExpandableCard
          label="Investments"
          value={formatMoney(investments)}
          subtitle="Click to view portfolio details."
          pill={{ text: "Total" }}
          expandedContent={
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
              <InvestmentsDetailWidget accounts={accounts} />
            </Suspense>
          }
          title="Investment Portfolio"
          description="Detailed view of your investments"
        />
      </div>
    </section>
  );
}

