"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatMoney } from "@/components/common/money";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Calendar } from "lucide-react";
import Link from "next/link";
import type { PlannedPayment } from "@/lib/api/planned-payments";

interface PlannedPaymentWidgetProps {
  upcomingTransactions: any[]; // Still accepts the old format for compatibility
}

export function PlannedPaymentWidget({
  upcomingTransactions,
}: PlannedPaymentWidgetProps) {
  // Sort transactions by date (earliest first)
  const sortedTransactions = useMemo(() => {
    return [...upcomingTransactions].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [upcomingTransactions]);

  const getDaysUntil = (date: string | Date) => {
    const dueDate = date instanceof Date ? date : new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return differenceInDays(dueDate, today);
  };

  const formatDateLabel = (date: string | Date) => {
    const dueDate = date instanceof Date ? date : new Date(date);
    const daysUntil = getDaysUntil(dueDate);

    if (isToday(dueDate)) {
      return "Today";
    } else if (isTomorrow(dueDate)) {
      return "Tomorrow";
    } else if (daysUntil <= 7) {
      // Return day name in English
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return dayNames[dueDate.getDay()];
    } else {
      return format(dueDate, "MM/dd");
    }
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return "text-red-600 dark:text-red-400";
    if (daysUntil === 0) return "text-orange-600 dark:text-orange-400";
    if (daysUntil <= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  const getCategoryName = (transaction: any) => {
    return (
      transaction.subcategory?.name ||
      transaction.category?.name ||
      transaction.description ||
      "Transaction"
    );
  };

  const getAccountName = (transaction: any) => {
    return transaction.account?.name || "Account not specified";
  };

  if (sortedTransactions.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Planned Payment</CardTitle>
          <CardDescription>List of future payments and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No future payments found
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate expenses and incomes
  const expenses = sortedTransactions.filter((t) => t.type === "expense");
  const incomes = sortedTransactions.filter((t) => t.type === "income");

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Planned Payment</CardTitle>
            <CardDescription>
              {sortedTransactions.length} {sortedTransactions.length === 1 ? "transaction" : "transactions"} in the coming days
            </CardDescription>
          </div>
          <Link
            href="/planned-payment"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Expenses Section */}
          {expenses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                Expenses ({expenses.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {expenses.map((transaction, index) => {
                  const daysUntil = getDaysUntil(transaction.date);
                  const amount = Math.abs(transaction.amount || 0);
                  const dateLabel = formatDateLabel(transaction.date);

                  return (
                    <div
                      key={transaction.id || index}
                      className={cn(
                        "flex items-start justify-between gap-3 p-3 rounded-lg border",
                        "bg-card hover:bg-accent/50 transition-colors"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-foreground truncate">
                            {getCategoryName(transaction)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className={cn("font-medium", getUrgencyColor(daysUntil))}>
                            {dateLabel}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="truncate">{getAccountName(transaction)}</span>
                        </div>
                        {transaction.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {transaction.description}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-semibold tabular-nums text-red-600 dark:text-red-400">
                          -{formatMoney(amount)}
                        </div>
                        {daysUntil >= 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {daysUntil === 0
                              ? "Today"
                              : daysUntil === 1
                              ? "1 day"
                              : `${daysUntil} days`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Incomes Section */}
          {incomes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                Incomes ({incomes.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {incomes.map((transaction, index) => {
                  const daysUntil = getDaysUntil(transaction.date);
                  const amount = Math.abs(transaction.amount || 0);
                  const dateLabel = formatDateLabel(transaction.date);

                  return (
                    <div
                      key={transaction.id || index}
                      className={cn(
                        "flex items-start justify-between gap-3 p-3 rounded-lg border",
                        "bg-card hover:bg-accent/50 transition-colors"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-foreground truncate">
                            {getCategoryName(transaction)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className={cn("font-medium", getUrgencyColor(daysUntil))}>
                            {dateLabel}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="truncate">{getAccountName(transaction)}</span>
                        </div>
                        {transaction.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {transaction.description}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-semibold tabular-nums text-green-600 dark:text-green-400">
                          +{formatMoney(amount)}
                        </div>
                        {daysUntil >= 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {daysUntil === 0
                              ? "Today"
                              : daysUntil === 1
                              ? "1 day"
                              : `${daysUntil} days`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

