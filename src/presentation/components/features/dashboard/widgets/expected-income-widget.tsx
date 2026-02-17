"use client";

import { useState } from "react";
import type { ExpectedIncomeOverview } from "@/src/domain/dashboard/types";
import { WidgetCard } from "./widget-card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/components/common/money";
import { ExpectedIncomeEditDialog } from "./expected-income-edit-dialog";
import { cn } from "@/lib/utils";

interface ExpectedIncomeWidgetProps {
  data: ExpectedIncomeOverview | null;
  onRefresh: () => void;
  className?: string;
}

export function ExpectedIncomeWidget({
  data,
  onRefresh,
  className,
}: ExpectedIncomeWidgetProps) {
  const [editOpen, setEditOpen] = useState(false);

  const handleEditSuccess = () => {
    onRefresh();
  };

  // When no overview data (e.g. old cache), show card with CTA to set expected income
  const hasExpectedIncome = data?.hasExpectedIncome ?? false;

  return (
    <>
      <WidgetCard
        title="Income"
        className={cn("min-h-0 h-auto", className)}
        headerAction={
          <Button
            variant="link"
            size="small"
            onClick={() => setEditOpen(true)}
            className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground"
            aria-label="Adjust income"
          >
            Adjust
          </Button>
        }
      >
        <div className="flex flex-col gap-2 min-w-0 overflow-hidden">
          {hasExpectedIncome && data ? (
            <>
              <div className="text-base sm:text-xl xl:text-2xl font-bold tabular-nums truncate" title={formatMoney(data.actualIncomeThisMonth)}>
                {formatMoney(data.actualIncomeThisMonth)}
              </div>
              {data.needsLocationForAfterTax ? (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Set country & state in Adjust to see after-tax expected income.
                </p>
              ) : data.expectedMonthlyIncome > 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground truncate" title={formatMoney(data.expectedMonthlyIncome)}>
                  Expected (after tax): {formatMoney(data.expectedMonthlyIncome)}/month
                </p>
              ) : null}
              {data.nextPaycheckDays != null && data.nextPaycheckAmount != null ? (
                <p className="text-xs sm:text-sm text-muted-foreground truncate" title={`Next: ${formatMoney(data.nextPaycheckAmount)} in ${data.nextPaycheckDays} days`}>
                  Next: {formatMoney(data.nextPaycheckAmount)} in {data.nextPaycheckDays} days
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Next: —
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3 py-1">
              <p className="text-sm text-muted-foreground">
                Set your expected monthly income to compare with spending.
              </p>
              <Button
                variant="default"
                size="small"
                onClick={() => setEditOpen(true)}
                className="w-fit"
              >
                Set income
              </Button>
            </div>
          )}
        </div>
      </WidgetCard>
      <ExpectedIncomeEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
