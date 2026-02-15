"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { DashboardLayout } from "./dashboard-layout";
import { TotalBudgetsWidget } from "./widgets/total-budgets-widget";
import { SpendingWidget } from "./widgets/spending-widget";
import { RecentTransactionsWidget } from "./widgets/recent-transactions-widget";
import { GoalsProgressWidget } from "./widgets/goals-progress-widget";
import { RecurringWidget } from "./widgets/recurring-widget";
import { SubscriptionsWidget } from "./widgets/subscriptions-widget";
import { AddTransactionWidget } from "./widgets/add-transaction-widget";
import { ExpectedIncomeWidget } from "./widgets/expected-income-widget";
import { WidgetCard } from "./widgets/widget-card";
import { formatMoney } from "@/components/common/money";
import { SpareScoreDetailsDialog } from "./widgets/spare-score-details-dialog";
import { SpareScoreFullWidthWidget } from "./widgets/spare-score-full-width-widget";
import { RefreshCcw } from "lucide-react";
import { useDashboardSnapshot } from "@/src/presentation/contexts/dashboard-snapshot-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HouseholdMemberOption {
  id: string;
  memberId: string | null;
  name: string | null;
  email: string;
  isOwner?: boolean;
}

interface DashboardWidgetsClientProps {
  initialDate?: Date;
}

/**
 * Dashboard widgets driven by a single aggregated source (GET /api/dashboard).
 * Data comes from DashboardSnapshotProvider: snapshot from storage → version check → conditional refetch.
 * No independent data fetching; Refresh button forces version check and refetch only if version changed.
 */
export function DashboardWidgetsClient({ initialDate }: DashboardWidgetsClientProps) {
  const {
    data,
    loading,
    error,
    refresh,
    selectedMemberId,
    setSelectedMemberId,
  } = useDashboardSnapshot();
  const [showSpareScoreDetails, setShowSpareScoreDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [members, setMembers] = useState<HouseholdMemberOption[]>([]);

  useEffect(() => {
    fetch("/api/v2/members", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { members: [] }))
      .then((body: { members?: HouseholdMemberOption[] }) => setMembers(body.members ?? []))
      .catch(() => setMembers([]));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-4 lg:p-8">
        <div className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Error loading dashboard: {error}</p>
          <Button onClick={handleRefresh} variant="default">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const selectedMember = selectedMemberId
    ? members.find((m) => (m.memberId ?? m.id) === selectedMemberId)
    : null;
  const selectedDisplayName = selectedMemberId === null
    ? "Family"
    : (selectedMember?.name || selectedMember?.email || "Member");

  return (
    <div className="w-full p-4 sm:p-5 xl:p-6 min-w-0 overflow-hidden">
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 mb-4 xl:mb-6 min-w-0">
        <h1 className="text-lg sm:text-xl xl:text-2xl font-bold tracking-normal min-w-0 flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
          <Select
            value={selectedMemberId ?? "everyone"}
            onValueChange={(value) => setSelectedMemberId(value === "everyone" ? null : value)}
          >
            <SelectTrigger
              className="inline-flex w-auto max-w-[50%] xs:max-w-none border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 py-0 pr-0 pl-0 h-auto font-bold text-lg sm:text-xl xl:text-2xl tracking-normal text-primary-text hover:text-primary cursor-pointer rounded-sm [&>svg]:hidden [&>span]:flex-none truncate"
              size="medium"
              aria-label="Change whose finances to view"
            >
              <span className="text-primary-text font-bold truncate" title={selectedDisplayName}>{selectedDisplayName}&apos;s </span>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="everyone">Family</SelectItem>
              {members.map((m) => {
                const value = m.memberId ?? m.id;
                const label = m.name || m.email || "Member";
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <span className="text-foreground">finances at a glance</span>
        </h1>
        <Button variant="outline" size="small" onClick={handleRefresh} disabled={loading || isRefreshing} className="gap-2 shrink-0 self-start xs:self-center">
          <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <DashboardLayout>
        {/* Stats Section: 2 cols until xl, then 4 - avoids cramping on 1024px (768px content) */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6 mb-4 xl:mb-6 [&>*]:min-w-0">
           <WidgetCard title="Available" className="min-h-0 h-auto">
              {(() => {
                const available = data.accountStats?.totalAvailable ??
                  (data.accountStats?.totalChecking ?? 0);
                const card = data.accountStats?.availableCard;
                return (
                  <div className="flex flex-col gap-2 min-w-0 overflow-hidden">
                    <div className="text-base sm:text-xl xl:text-2xl font-bold tabular-nums truncate" title={formatMoney(available)}>
                      {formatMoney(available)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate" title={card?.freeToSpend != null ? formatMoney(card.freeToSpend) : undefined}>
                      Free: {card?.freeToSpend != null ? formatMoney(card.freeToSpend) : "—"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate" title={card?.projectedEndOfMonth != null ? formatMoney(card.projectedEndOfMonth) : undefined}>
                      End of month: {card?.projectedEndOfMonth != null ? formatMoney(card.projectedEndOfMonth) : "—"}
                    </p>
                  </div>
                );
              })()}
           </WidgetCard>
           <ExpectedIncomeWidget
             data={data.expectedIncomeOverview ?? null}
             onRefresh={handleRefresh}
             className="min-h-0 h-auto"
           />
           <WidgetCard title="Savings" className="min-h-0 h-auto">
              {(() => {
                const savings = data.accountStats?.totalSavings ?? 0;
                const card = data.accountStats?.savingsCard;
                return (
                  <div className="flex flex-col gap-2 min-w-0 overflow-hidden">
                    <div className="text-base sm:text-xl xl:text-2xl font-bold tabular-nums truncate" title={formatMoney(savings)}>
                      {formatMoney(savings)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {card?.savingPercentOfIncome != null
                        ? `Saved ${card.savingPercentOfIncome}% this month`
                        : "—"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {card?.emergencyFundMonths != null
                        ? `Emergency fund: ${card.emergencyFundMonths} months`
                        : "Emergency fund: —"}
                    </p>
                  </div>
                );
              })()}
           </WidgetCard>
           <WidgetCard title="Net Worth" className="min-h-0 h-auto">
              {(() => {
                const nw = data.netWorth;
                const hasData = nw != null;
                const netWorth = nw?.netWorth ?? 0;
                const assets = nw?.totalAssets ?? 0;
                const liabilities = nw?.totalLiabilities ?? 0;
                const netWorthStr = formatMoney(netWorth);
                return (
                  <div className="flex flex-col gap-2 min-w-0 overflow-hidden">
                    <div className="text-base sm:text-xl xl:text-2xl font-bold tabular-nums truncate" title={netWorthStr}>
                      {netWorthStr}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate" title={hasData ? formatMoney(assets) : undefined}>
                      Assets: {hasData ? formatMoney(assets) : "—"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate" title={hasData ? formatMoney(liabilities) : undefined}>
                      Debt: {hasData ? formatMoney(liabilities) : "—"}
                    </p>
                  </div>
                );
              })()}
           </WidgetCard>
        </div>

        {/* Spare Score + Quick Transaction - single col until xl so 1024px has full width */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6 mb-4 xl:mb-6 [&>*]:min-w-0">
          <SpareScoreFullWidthWidget
            data={data.spareScore}
            onOpenDetails={() => setShowSpareScoreDetails(true)}
          />
          <AddTransactionWidget onTransactionAdded={handleRefresh} />
        </div>

        <SpareScoreDetailsDialog
          open={showSpareScoreDetails}
          onOpenChange={setShowSpareScoreDetails}
          data={data.spareScore?.details}
        />

        {/* Top Section: Total Budgets + Spending */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6 mb-4 xl:mb-6 [&>*]:min-w-0">
           <TotalBudgetsWidget data={data.totalBudgets} className="h-full" />
           <SpendingWidget data={data.spending} className="h-full" />
        </div>

        {/* Existing Grid for remaining widgets */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6 auto-rows-fr [&>*]:min-w-0">
           <GoalsProgressWidget data={data.goalsProgress} className="min-h-0 h-auto" />
           <RecentTransactionsWidget data={data.recentTransactions} className="h-full" />
           
           <RecurringWidget data={data.recurring} className="h-full" />
           <SubscriptionsWidget data={data.subscriptions} className="h-full" />
        </div>
      </DashboardLayout>
    </div>
  );
}
