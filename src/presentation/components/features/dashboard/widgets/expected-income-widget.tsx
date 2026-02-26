"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  /** When set, the whole card is clickable to open a breakdown (e.g. from dashboard) */
  onCardClick?: () => void;
}

export function ExpectedIncomeWidget({
  data,
  onRefresh,
  className,
  onCardClick,
}: ExpectedIncomeWidgetProps) {
  const t = useTranslations("dashboard");
  const [editOpen, setEditOpen] = useState(false);

  const handleEditSuccess = () => {
    onRefresh();
  };

  // When no overview data (e.g. old cache), show card with CTA to set expected income
  const hasExpectedIncome = data?.hasExpectedIncome ?? false;

  return (
    <>
      <WidgetCard
        title={t("income")}
        className={cn("min-h-0 h-auto", className)}
        onClick={onCardClick}
        headerAction={
          <Button
            variant="link"
            size="small"
            onClick={() => setEditOpen(true)}
            className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground"
            aria-label={t("adjustIncome")}
          >
            {t("adjust")}
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
                  {t("setCountryStateForAfterTax")}
                </p>
              ) : data.expectedMonthlyIncome > 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground truncate" title={formatMoney(data.expectedMonthlyIncome)}>
                  {t("expectedPerMonth")} <span className="font-semibold text-foreground">{formatMoney(data.expectedMonthlyIncome)}</span>{t("perMonth")}
                </p>
              ) : null}
              {data.nextPaycheckDays != null && data.nextPaycheckAmount != null ? (
                <p className="text-xs sm:text-sm text-muted-foreground truncate" title={t("nextPaycheckInDays", { amount: formatMoney(data.nextPaycheckAmount), days: data.nextPaycheckDays })}>
                  {t("nextPaycheckInDays", { amount: formatMoney(data.nextPaycheckAmount), days: data.nextPaycheckDays })}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("nextPaycheckLabel")} <span className="font-semibold text-foreground">—</span>
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3 py-1">
              <p className="text-sm text-muted-foreground">
                {t("setExpectedIncomeDescription")}
              </p>
              <Button
                variant="default"
                size="small"
                onClick={() => setEditOpen(true)}
                className="w-fit"
              >
                {t("setIncome")}
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
