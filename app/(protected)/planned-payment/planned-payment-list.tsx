"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/components/common/money";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar, Check, X, SkipForward, ArrowRight } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { PlannedPayment } from "@/lib/api/planned-payments";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SimpleTabs,
  SimpleTabsList,
  SimpleTabsTrigger,
  SimpleTabsContent,
} from "@/components/ui/simple-tabs";

interface PlannedPaymentListProps {
  plannedPayments: PlannedPayment[];
}

export function PlannedPaymentList({ plannedPayments }: PlannedPaymentListProps) {
  const { toast } = useToast();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [payments, setPayments] = useState<PlannedPayment[]>(plannedPayments);
  const [activeTab, setActiveTab] = useState<"expense" | "income" | "transfer">("expense");

  // Sort payments by date (earliest first)
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [payments]);

  // Filter payments by type
  const filteredPayments = useMemo(() => {
    return sortedPayments.filter((p) => p.type === activeTab);
  }, [sortedPayments, activeTab]);

  const handleMarkAsPaid = async (payment: PlannedPayment) => {
    if (processingIds.has(payment.id)) return;
    
    setProcessingIds((prev) => new Set(prev).add(payment.id));
    try {
      const response = await fetch(`/api/planned-payments/${payment.id}/mark-paid`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark payment as paid");
      }
      
      // Remove from list (it's now paid)
      setPayments((prev) => prev.filter((p) => p.id !== payment.id));
      toast({
        title: "Payment marked as paid",
        description: "Transaction has been created successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark payment as paid",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(payment.id);
        return newSet;
      });
    }
  };

  const handleSkip = async (payment: PlannedPayment) => {
    if (processingIds.has(payment.id)) return;
    
    setProcessingIds((prev) => new Set(prev).add(payment.id));
    try {
      const response = await fetch(`/api/planned-payments/${payment.id}/skip`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to skip payment");
      }
      
      // Remove from list (it's now skipped)
      setPayments((prev) => prev.filter((p) => p.id !== payment.id));
      toast({
        title: "Payment skipped",
        description: "This payment has been skipped.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to skip payment",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(payment.id);
        return newSet;
      });
    }
  };

  const handleCancel = async (payment: PlannedPayment) => {
    if (processingIds.has(payment.id)) return;
    
    setProcessingIds((prev) => new Set(prev).add(payment.id));
    try {
      const response = await fetch(`/api/planned-payments/${payment.id}/cancel`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel payment");
      }
      
      // Remove from list (it's now cancelled)
      setPayments((prev) => prev.filter((p) => p.id !== payment.id));
      toast({
        title: "Payment cancelled",
        description: "This payment has been cancelled.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel payment",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(payment.id);
        return newSet;
      });
    }
  };

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
      return format(dueDate, "MM/dd/yyyy");
    }
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return "text-red-600 dark:text-red-400";
    if (daysUntil === 0) return "text-orange-600 dark:text-orange-400";
    if (daysUntil <= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  const getCategoryName = (payment: PlannedPayment) => {
    return (
      payment.subcategory?.name ||
      payment.category?.name ||
      payment.description ||
      "Payment"
    );
  };

  const getAccountName = (payment: PlannedPayment) => {
    return payment.account?.name || "Account not specified";
  };

  const getToAccountName = (payment: PlannedPayment) => {
    return payment.toAccount?.name || "-";
  };

  // Count payments by type
  const expenseCount = sortedPayments.filter((p) => p.type === "expense").length;
  const incomeCount = sortedPayments.filter((p) => p.type === "income").length;
  const transferCount = sortedPayments.filter((p) => p.type === "transfer").length;

  // Set default tab to first available tab with items on initial load
  useEffect(() => {
    if (sortedPayments.length > 0) {
      const currentTabCount = 
        activeTab === "expense" ? expenseCount :
        activeTab === "income" ? incomeCount :
        transferCount;
      
      // Only switch if current tab is empty and there are items in other tabs
      if (currentTabCount === 0) {
        if (expenseCount > 0) {
          setActiveTab("expense");
        } else if (incomeCount > 0) {
          setActiveTab("income");
        } else if (transferCount > 0) {
          setActiveTab("transfer");
        }
      }
    }
  }, [sortedPayments.length, expenseCount, incomeCount, transferCount, activeTab]);

  if (sortedPayments.length === 0) {
    return (
      <div className="rounded-[12px] border p-12">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            No future payments found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SimpleTabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <SimpleTabsList>
          <SimpleTabsTrigger value="expense">
            Expense {expenseCount > 0 && `(${expenseCount})`}
          </SimpleTabsTrigger>
          <SimpleTabsTrigger value="income">
            Income {incomeCount > 0 && `(${incomeCount})`}
          </SimpleTabsTrigger>
          <SimpleTabsTrigger value="transfer">
            Transfer {transferCount > 0 && `(${transferCount})`}
          </SimpleTabsTrigger>
        </SimpleTabsList>

        <SimpleTabsContent value="expense" className="mt-4">
          {filteredPayments.length === 0 ? (
            <div className="rounded-[12px] border p-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  No future expenses found
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Date</TableHead>
                    <TableHead className="text-xs md:text-sm">Description</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Account</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Source</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Amount</TableHead>
                    <TableHead className="text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment, index) => {
                    const daysUntil = getDaysUntil(payment.date);
                    const amount = Math.abs(payment.amount || 0);
                    const dateLabel = formatDateLabel(payment.date);
                    const isProcessing = processingIds.has(payment.id);

                    return (
                      <TableRow key={payment.id || index} className="hover:bg-muted/50">
                        <TableCell className="text-xs md:text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={cn("font-medium", getUrgencyColor(daysUntil))}>
                              {dateLabel}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 md:hidden">
                            {daysUntil >= 0
                              ? daysUntil === 0
                                ? "Today"
                                : daysUntil === 1
                                ? "1 day"
                                : `${daysUntil} days`
                              : "Overdue"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div className="font-medium">{getCategoryName(payment)}</div>
                          {payment.description && (
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                              {payment.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell">
                          {payment.subcategory?.name || payment.category?.name || "-"}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden lg:table-cell">
                          {getAccountName(payment)}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden lg:table-cell">
                          {payment.source === "debt" && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Debt
                            </span>
                          )}
                          {payment.source === "recurring" && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Recurring
                            </span>
                          )}
                          {payment.source === "subscription" && (
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Subscription
                            </span>
                          )}
                          {payment.source === "manual" && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              Manual
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs md:text-sm">
                          <div className="font-bold tabular-nums text-red-600 dark:text-red-400">
                            -{formatMoney(amount)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 hidden md:block">
                            {daysUntil >= 0
                              ? daysUntil === 0
                                ? "Today"
                                : daysUntil === 1
                                ? "1 day"
                                : `${daysUntil} days`
                              : "Overdue"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(payment)}
                                disabled={isProcessing}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSkip(payment)}
                                disabled={isProcessing}
                              >
                                <SkipForward className="h-4 w-4 mr-2" />
                                Skip
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancel(payment)}
                                disabled={isProcessing}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </SimpleTabsContent>

        <SimpleTabsContent value="income" className="mt-4">
          {filteredPayments.length === 0 ? (
            <div className="rounded-[12px] border p-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  No future income found
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Date</TableHead>
                    <TableHead className="text-xs md:text-sm">Description</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Account</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Source</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Amount</TableHead>
                    <TableHead className="text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment, index) => {
                    const daysUntil = getDaysUntil(payment.date);
                    const amount = Math.abs(payment.amount || 0);
                    const dateLabel = formatDateLabel(payment.date);
                    const isProcessing = processingIds.has(payment.id);

                    return (
                      <TableRow key={payment.id || index} className="hover:bg-muted/50">
                        <TableCell className="text-xs md:text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={cn("font-medium", getUrgencyColor(daysUntil))}>
                              {dateLabel}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 md:hidden">
                            {daysUntil >= 0
                              ? daysUntil === 0
                                ? "Today"
                                : daysUntil === 1
                                ? "1 day"
                                : `${daysUntil} days`
                              : "Overdue"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div className="font-medium">{getCategoryName(payment)}</div>
                          {payment.description && (
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                              {payment.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell">
                          {payment.subcategory?.name || payment.category?.name || "-"}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden lg:table-cell">
                          {getAccountName(payment)}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden lg:table-cell">
                          {payment.source === "recurring" && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Recurring
                            </span>
                          )}
                          {payment.source === "subscription" && (
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Subscription
                            </span>
                          )}
                          {payment.source === "manual" && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              Manual
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs md:text-sm">
                          <div className="font-bold tabular-nums text-green-600 dark:text-green-400">
                            +{formatMoney(amount)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 hidden md:block">
                            {daysUntil >= 0
                              ? daysUntil === 0
                                ? "Today"
                                : daysUntil === 1
                                ? "1 day"
                                : `${daysUntil} days`
                              : "Overdue"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(payment)}
                                disabled={isProcessing}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSkip(payment)}
                                disabled={isProcessing}
                              >
                                <SkipForward className="h-4 w-4 mr-2" />
                                Skip
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancel(payment)}
                                disabled={isProcessing}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </SimpleTabsContent>

        <SimpleTabsContent value="transfer" className="mt-4">
          {filteredPayments.length === 0 ? (
            <div className="rounded-[12px] border p-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  No future transfers found
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Date</TableHead>
                    <TableHead className="text-xs md:text-sm">Description</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">From Account</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">To Account</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Source</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Amount</TableHead>
                    <TableHead className="text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment, index) => {
                    const daysUntil = getDaysUntil(payment.date);
                    const amount = Math.abs(payment.amount || 0);
                    const dateLabel = formatDateLabel(payment.date);
                    const isProcessing = processingIds.has(payment.id);

                    return (
                      <TableRow key={payment.id || index} className="hover:bg-muted/50">
                        <TableCell className="text-xs md:text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={cn("font-medium", getUrgencyColor(daysUntil))}>
                              {dateLabel}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 md:hidden">
                            {daysUntil >= 0
                              ? daysUntil === 0
                                ? "Today"
                                : daysUntil === 1
                                ? "1 day"
                                : `${daysUntil} days`
                              : "Overdue"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div className="font-medium">{getCategoryName(payment)}</div>
                          {payment.description && (
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                              {payment.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell">
                          {getAccountName(payment)}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            {getToAccountName(payment)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden lg:table-cell">
                          {payment.source === "recurring" && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Recurring
                            </span>
                          )}
                          {payment.source === "subscription" && (
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Subscription
                            </span>
                          )}
                          {payment.source === "manual" && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              Manual
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs md:text-sm">
                          <div className="font-bold tabular-nums">
                            {formatMoney(amount)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 hidden md:block">
                            {daysUntil >= 0
                              ? daysUntil === 0
                                ? "Today"
                                : daysUntil === 1
                                ? "1 day"
                                : `${daysUntil} days`
                              : "Overdue"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(payment)}
                                disabled={isProcessing}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSkip(payment)}
                                disabled={isProcessing}
                              >
                                <SkipForward className="h-4 w-4 mr-2" />
                                Skip
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancel(payment)}
                                disabled={isProcessing}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </SimpleTabsContent>
      </SimpleTabs>
    </div>
  );
}

