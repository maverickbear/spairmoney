"use client";

import { useState } from "react";
import { RecurringWidgetData } from "@/src/domain/dashboard/types";
import { WidgetCard } from "./widget-card";
import { WidgetEmptyState } from "./widget-empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight, ArrowUp, ArrowDown, ArrowLeftRight, CalendarClock, Check, SkipForward, X } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/components/common/money";
import { differenceInCalendarDays, isToday, isTomorrow, parse, format } from "date-fns";
import { useDashboardSnapshot } from "@/src/presentation/contexts/dashboard-snapshot-context";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";

interface RecurringWidgetProps {
  data: RecurringWidgetData | null;
  className?: string;
}

const PLANNED_PAYMENTS_EMPTY_DESCRIPTION =
  "A planned payment is a future expense or income you schedule—for example a bill, a transfer, or a one-off payment—so you can see what's coming up.";

export function RecurringWidget({ data, className }: RecurringWidgetProps) {
  const { refresh } = useDashboardSnapshot();
  const { toast } = useToast();
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!data) return null;

  if (data.items.length === 0) {
    return (
      <WidgetCard title="Planned Payments" className={className}>
        <WidgetEmptyState
          title="No planned payments"
          description={PLANNED_PAYMENTS_EMPTY_DESCRIPTION}
          icon={CalendarClock}
        />
      </WidgetCard>
    );
  }

  const SeeAllLink = () => (
    <Link 
      href="/planned-payment" 
      className="flex items-center text-sm font-medium hover:underline"
    >
      See all <ChevronRight className="ml-1 h-4 w-4" />
    </Link>
  );

  // Use server totals when present; otherwise derive from visible items (e.g. cached snapshot without totals)
  let totalIncome = data.totalPlannedIncomeThisMonth ?? 0;
  let totalExpense = data.totalPlannedExpenseThisMonth ?? 0;
  if (totalIncome === 0 && totalExpense === 0 && data.items.length > 0) {
    totalIncome = data.items
      .filter((i) => i.type === "income")
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    totalExpense = data.items
      .filter((i) => i.type === "expense")
      .reduce((sum, i) => sum + (i.amount || 0), 0);
  }

  return (
    <WidgetCard
      title="Planned Payments"
      headerAction={<SeeAllLink />} 
      className={className}
    >
      <div className="flex flex-col h-full space-y-6">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
              <ArrowUp className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
              {formatMoney(totalIncome)}
            </span>
            <span className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-muted-foreground">
              <ArrowDown className="h-5 w-5 shrink-0 text-red-500" aria-hidden />
              {formatMoney(totalExpense)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(), "MMMM yyyy")}
          </span>
        </div>

        <div className="space-y-4">
        {data.items.map((item) => {
          const dueLabel = formatFriendlyDueDate(item.nextDate);
          const isDueTomorrow = dueLabel === "Tomorrow";
          return (
            <Link
              key={item.id}
              href="/planned-payment"
              className="flex items-center justify-between rounded-lg transition-colors hover:bg-muted/50 -mx-2 px-2 py-1"
            >
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <TransactionTypeIcon type={item.type} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {item.type === "income" ? "Income" : item.type === "expense" ? "Expense" : "Transfer"}
                  </TooltipContent>
                </Tooltip>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{item.name}</span>
                  <span className={`text-xs ${isDueTomorrow ? "text-red-500 font-medium" : "text-slate-400"}`}>
                    {dueLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-black dark:text-foreground">
                  {formatMoney(item.amount)}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-emerald-600"
                      disabled={markingPaidId === item.id || skippingId === item.id || cancellingId === item.id}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (markingPaidId || skippingId || cancellingId) return;
                        setMarkingPaidId(item.id);
                        try {
                          const res = await fetch(`/api/v2/planned-payments/${item.id}/mark-paid`, { method: "POST" });
                          if (!res.ok) {
                            const body = await res.json();
                            throw new Error(body.error || "Failed to mark as paid");
                          }
                          await refresh(true);
                          toast({
                            title: "Marked as paid",
                            description: "Transaction was created.",
                            variant: "success",
                          });
                        } catch (err) {
                          toast({
                            title: "Error",
                            description: err instanceof Error ? err.message : "Failed to mark as paid",
                            variant: "destructive",
                          });
                        } finally {
                          setMarkingPaidId(null);
                        }
                      }}
                      aria-label="Mark as paid"
                    >
                      {markingPaidId === item.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    title="Mark as paid"
                  >
                    Creates a transaction with this payment&apos;s date, amount and account, and marks the planned payment as paid.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-amber-600"
                      disabled={markingPaidId === item.id || skippingId === item.id || cancellingId === item.id}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (markingPaidId || skippingId || cancellingId) return;
                        setSkippingId(item.id);
                        try {
                          const res = await fetch(`/api/v2/planned-payments/${item.id}/skip`, { method: "POST" });
                          if (!res.ok) {
                            const body = await res.json();
                            throw new Error(body.error || "Failed to skip");
                          }
                          await refresh(true);
                          toast({
                            title: "Skipped",
                            description: "Payment skipped. No transaction was created.",
                            variant: "success",
                          });
                        } catch (err) {
                          toast({
                            title: "Error",
                            description: err instanceof Error ? err.message : "Failed to skip",
                            variant: "destructive",
                          });
                        } finally {
                          setSkippingId(null);
                        }
                      }}
                      aria-label="Skip"
                    >
                      {skippingId === item.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <SkipForward className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    title="Skip"
                  >
                    Marks this occurrence as skipped. No transaction is created. Use when you&apos;re not paying this time (e.g. skipping a month).
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={markingPaidId === item.id || skippingId === item.id || cancellingId === item.id}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (markingPaidId || skippingId || cancellingId) return;
                        setCancellingId(item.id);
                        try {
                          const res = await fetch(`/api/v2/planned-payments/${item.id}/cancel`, { method: "POST" });
                          if (!res.ok) {
                            const body = await res.json();
                            throw new Error(body.error || "Failed to cancel");
                          }
                          await refresh(true);
                          toast({
                            title: "Cancelled",
                            description: "Payment has been cancelled.",
                            variant: "success",
                          });
                        } catch (err) {
                          toast({
                            title: "Error",
                            description: err instanceof Error ? err.message : "Failed to cancel",
                            variant: "destructive",
                          });
                        } finally {
                          setCancellingId(null);
                        }
                      }}
                      aria-label="Cancel"
                    >
                      {cancellingId === item.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    title="Cancel"
                  >
                    Cancels the planned payment. No transaction is created. Use when the payment should no longer exist (e.g. subscription ended).
                  </TooltipContent>
                </Tooltip>
              </div>
            </Link>
          );
        })}
        </div>
      </div>
    </WidgetCard>
  );
}

/**
 * Parse date string that may be YYYY-MM-DD or "d MMM" / "dd MMM" (e.g. "25 Feb", "28 Feb").
 * Returns a Date at noon to avoid timezone issues, or null if unparseable.
 */
function parseDueDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();
  // YYYY-MM-DD (from API)
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const due = new Date(s.slice(0, 10) + "T12:00:00");
    return isNaN(due.getTime()) ? null : due;
  }
  // "d MMM" or "dd MMM" (e.g. "25 Feb", "28 Feb" – from cache or old API)
  const year = new Date().getFullYear();
  try {
    const due = parse(s + " " + year, "d MMM yyyy", new Date());
    due.setHours(12, 0, 0, 0);
    return isNaN(due.getTime()) ? null : due;
  } catch {
    return null;
  }
}

/**
 * Format a date string (YYYY-MM-DD or "dd MMM") as user-friendly relative text.
 */
function formatFriendlyDueDate(dateStr: string): string {
  const due = parseDueDate(dateStr);
  if (!due) return dateStr;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  due.setHours(12, 0, 0, 0);
  const days = differenceInCalendarDays(due, today);
  if (days < 0) return "Overdue";
  if (isToday(due)) return "Today";
  if (isTomorrow(due)) return "Tomorrow";
  if (days >= 2 && days <= 6) return `In ${days} days`;
  if (days >= 7 && days <= 13) return "Next week";
  if (days >= 14 && days <= 20) return "In 2 weeks";
  if (days >= 21 && days <= 27) return "In 3 weeks";
  if (days >= 28 && days <= 60) return "In 1 month";
  // Fallback: "28 Feb"
  const d = due.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[due.getMonth()]}`;
}

function TransactionTypeIcon({ type }: { type: "income" | "expense" | "transfer" }) {
  if (type === "income") return <ArrowUp className="h-5 w-5 text-emerald-500" />;
  if (type === "expense") return <ArrowDown className="h-5 w-5 text-red-500" />;
  return <ArrowLeftRight className="h-5 w-5 text-slate-500" />; // transfer
}
