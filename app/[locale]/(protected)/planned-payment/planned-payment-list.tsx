"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/components/common/money";
import {
  differenceInDays,
  isToday,
  isTomorrow,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  addDays,
  subMonths,
} from "date-fns";
import { useFormatDisplayDate } from "@/src/presentation/utils/format-date";
import { cn } from "@/lib/utils";
import { Check, X, SkipForward, ArrowRight, ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { BasePlannedPayment as PlannedPayment } from "@/src/domain/planned-payments/planned-payments.types";
import { PLANNED_HORIZON_DAYS } from "@/src/domain/planned-payments/planned-payments.types";
import { Loader2 } from "lucide-react";
import { TransactionForm } from "@/components/forms/transaction-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { FixedTabsWrapper } from "@/components/common/fixed-tabs-wrapper";
import { MobileAddBar } from "@/components/common/mobile-add-bar";
import { PageHeader } from "@/components/common/page-header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export type DateRangePreset = "all_time" | "today" | "this_week" | "this_month" | "next_month" | "next_90_days";

function getDateRangeForPreset(preset: DateRangePreset): { startDate: Date; endDate: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "all_time": {
      const start = subMonths(today, 24);
      start.setHours(0, 0, 0, 0);
      const end = addDays(today, PLANNED_HORIZON_DAYS);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "today": {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { startDate: today, endDate: end };
    }
    case "this_week": {
      const start = startOfWeek(today, { weekStartsOn: 0 });
      const end = endOfWeek(today, { weekStartsOn: 0 });
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "this_month": {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "next_month": {
      const next = addMonths(today, 1);
      const start = startOfMonth(next);
      const end = endOfMonth(next);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "next_90_days": {
      const end = addDays(today, PLANNED_HORIZON_DAYS);
      end.setHours(23, 59, 59, 999);
      return { startDate: today, endDate: end };
    }
    default:
      return getDateRangeForPreset("all_time");
  }
}

function getDateRangeOptions(tPlanned: (key: string) => string): { value: DateRangePreset; label: string }[] {
  return [
    { value: "all_time", label: tPlanned("allTime") },
    { value: "today", label: tPlanned("today") },
    { value: "this_week", label: tPlanned("thisWeek") },
    { value: "this_month", label: tPlanned("thisMonth") },
    { value: "next_month", label: tPlanned("nextMonth") },
    { value: "next_90_days", label: tPlanned("next90Days") },
  ];
}

export function PlannedPaymentList() {
  const t = useTranslations("nav");
  const tPlanned = useTranslations("plannedPayments");
  const formatDate = useFormatDisplayDate();
  const { toast } = useToast();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payments, setPayments] = useState<PlannedPayment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [activeTab, setActiveTab] = useState<"expense" | "income" | "transfer">("expense");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("all_time");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PlannedPayment | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [allPayments, setAllPayments] = useState<PlannedPayment[]>([]); // Accumulated payments for mobile
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Counts by type (for tab badges)
  const [expenseCount, setExpenseCount] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);
  const [transferCount, setTransferCount] = useState(0);
  
  const dateRangeOptions = getDateRangeOptions(tPlanned);
  const pullToRefreshRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const currentPullDistance = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate totalPages
  const totalPages = useMemo(() => {
    return Math.ceil(totalPayments / itemsPerPage);
  }, [totalPayments, itemsPerPage]);

  // Sort payments by date (earliest first)
  // Since API already filters by type, we can use payments directly
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [payments]);
  
  // For mobile: use accumulated payments for infinite scroll
  const mobilePayments = useMemo(() => {
    const paymentsToUse = allPayments.length > 0 ? allPayments : payments;
    return [...paymentsToUse].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [allPayments, payments]);

  // Since API already filters by type, use sortedPayments directly for each tab
  const expensePayments = useMemo(() => {
    return sortedPayments;
  }, [sortedPayments]);

  const incomePayments = useMemo(() => {
    return sortedPayments;
  }, [sortedPayments]);

  const transferPayments = useMemo(() => {
    return sortedPayments;
  }, [sortedPayments]);

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);

  // Update mobile detection on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const syncPlannedPayments = useCallback(async () => {
    try {
      // Sync planned payments from all sources (debts, goals, recurring)
      const response = await fetch(apiUrl("/api/v2/planned-payments/sync"), {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to sync planned payments");
      }
      
      const data = await response.json();
      console.log("[PlannedPaymentList] Sync completed:", data);
    } catch (error) {
      // Don't show error to user, just log it
      // Sync is optional and shouldn't block the page from loading
      console.error("Error syncing planned payments:", error);
    }
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRangeForPreset(dateRangePreset);
      
      // Single optimized call to get all counts at once
      const response = await fetch(
        `/api/planned-payments/counts?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&status=scheduled`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch counts");
      }
      
      const data = await response.json();
      setExpenseCount(data.expense || 0);
      setIncomeCount(data.income || 0);
      setTransferCount(data.transfer || 0);
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  }, [dateRangePreset]);

  const loadPlannedPayments = useCallback(async () => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      
      const { startDate, endDate } = getDateRangeForPreset(dateRangePreset);
      
      const params = new URLSearchParams();
      params.append("startDate", startDate.toISOString().split('T')[0]);
      params.append("endDate", endDate.toISOString().split('T')[0]);
      params.append("status", "scheduled");
      params.append("type", activeTab);
      
      // Add pagination parameters
      const limit = isMobile ? 10 : itemsPerPage;
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      
      // Use v2 API
      const url = `/api/v2/planned-payments?${params.toString()}&_t=${Date.now()}`;
      
      const response = await fetch(url, {
        cache: 'no-store',
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to fetch planned payments");
      }

      if (abortController.signal.aborted) {
        return;
      }

      const data = await response.json();
      
      const newPayments: PlannedPayment[] = data.plannedPayments || [];
      const total = data.total || 0;
      
      setTotalPayments(total);
      
      // For mobile infinite scroll: accumulate payments
      // For desktop: replace payments (normal pagination)
      if (currentPage === 1) {
        setPayments(newPayments);
        setAllPayments(newPayments);
      } else {
        setPayments(newPayments);
        setAllPayments(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newPayments.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error("Error loading planned payments:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : tPlanned("errorLoadingPayments"),
        variant: "destructive",
      });
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [activeTab, currentPage, itemsPerPage, isMobile, dateRangePreset, toast]);

  // Sync planned payments on mount (only once per session)
  useEffect(() => {
    const hasSynced = sessionStorage.getItem("planned-payments-synced");
    if (!hasSynced) {
      syncPlannedPayments();
      sessionStorage.setItem("planned-payments-synced", "true");
    }
  }, [syncPlannedPayments]);

  // Load initial data and counts
  useEffect(() => {
    loadCounts();
    loadPlannedPayments();
  }, [loadCounts, loadPlannedPayments]);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setAllPayments([]);
    loadPlannedPayments();
    // Note: We don't reload counts when tab changes because counts are totals for all types
  }, [activeTab, loadPlannedPayments]);

  // Reset to page 1 when date range changes; loadCounts/loadPlannedPayments will re-run via their deps
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setCurrentPage(1);
    setAllPayments([]);
  }, [dateRangePreset]);

  // Reset loadingMore when payments are loaded
  useEffect(() => {
    if (!loading) {
      setLoadingMore(false);
    }
  }, [loading]);

  // Handle Load More button click for mobile
  const handleLoadMore = () => {
    if (!isMobile) return;
    if (loading || loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  };

  // Load payments when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadPlannedPayments();
    }
  }, [currentPage, loadPlannedPayments]);

  // Pull to refresh for mobile
  useEffect(() => {
    const container = pullToRefreshRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;
      
      touchCurrentY.current = e.touches[0].clientY;
      const distance = touchCurrentY.current - touchStartY.current;
      
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        const pullDistance = Math.min(distance, 100);
        currentPullDistance.current = pullDistance;
        setPullDistance(pullDistance);
      } else {
        isPulling.current = false;
        currentPullDistance.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (currentPullDistance.current >= 60 && !loading && !isRefreshing) {
        setIsRefreshing(true);
        setCurrentPage(1);
        setAllPayments([]);
        setTimeout(() => {
          Promise.all([loadCounts(), loadPlannedPayments()]).finally(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            currentPullDistance.current = 0;
          });
        }, 100);
      } else {
        setPullDistance(0);
        currentPullDistance.current = 0;
      }
      isPulling.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, loading, isRefreshing, loadCounts, loadPlannedPayments]);

  const handleMarkAsPaid = async (payment: PlannedPayment) => {
    if (processingIds.has(payment.id)) return;
    
    setProcessingIds((prev) => new Set(prev).add(payment.id));
    try {
      const response = await fetch(apiUrl(`/api/v2/planned-payments/${payment.id}/mark-paid`), {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark payment as paid");
      }
      
      // Reload payments to reflect changes
      setCurrentPage(1);
      setAllPayments([]);
      await Promise.all([loadCounts(), loadPlannedPayments()]);
      toast({
        title: tPlanned("paymentMarkedAsPaid"),
        description: tPlanned("transactionCreated"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : tPlanned("failedToMarkPaid"),
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
      const response = await fetch(apiUrl(`/api/v2/planned-payments/${payment.id}/skip`), {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to skip payment");
      }
      
      // Reload payments to reflect changes
      setCurrentPage(1);
      setAllPayments([]);
      await Promise.all([loadCounts(), loadPlannedPayments()]);
      toast({
        title: tPlanned("paymentSkipped"),
        description: tPlanned("paymentSkippedDescription"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : tPlanned("failedToSkip"),
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
      const response = await fetch(apiUrl(`/api/v2/planned-payments/${payment.id}/cancel`), {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel payment");
      }

      setPayments((prev) => prev.filter((p) => p.id !== payment.id));
      setAllPayments((prev) => prev.filter((p) => p.id !== payment.id));
      setTotalPayments((prev) => Math.max(0, prev - 1));
      await loadCounts();
      toast({
        title: tPlanned("paymentCancelled"),
        description: tPlanned("paymentCancelledDescription"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : tPlanned("failedToCancel"),
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

  // Current list of payment IDs for the active tab (desktop: current page; mobile: all loaded)
  const currentListPayments = isMobile ? mobilePayments : sortedPayments;
  const currentListIds = useMemo(
    () => new Set(currentListPayments.map((p) => p.id)),
    [currentListPayments]
  );
  const allCurrentSelected =
    currentListIds.size > 0 && currentListPayments.every((p) => selectedIds.has(p.id));
  const someCurrentSelected = currentListPayments.some((p) => selectedIds.has(p.id));

  useEffect(() => {
    const indeterminate = someCurrentSelected && !allCurrentSelected;
    document.querySelectorAll<HTMLInputElement>("[data-planned-payment-select-all]").forEach((el) => {
      el.indeterminate = indeterminate;
    });
  }, [someCurrentSelected, allCurrentSelected]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, dateRangePreset]);

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentListPayments.forEach((p) => next.add(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentListPayments.forEach((p) => next.delete(p.id));
        return next;
      });
    }
  };

  const handleToggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        tPlanned("deleteConfirm", { count: ids.length })
      )
    ) {
      return;
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(apiUrl(`/api/v2/planned-payments/${id}`), { method: "DELETE" })
        )
      );
      const idsSet = new Set(ids);
      setSelectedIds(new Set());
      setPayments((prev) => prev.filter((p) => !idsSet.has(p.id)));
      setAllPayments((prev) => prev.filter((p) => !idsSet.has(p.id)));
      setTotalPayments((prev) => Math.max(0, prev - ids.length));
      toast({
        title: tPlanned("plannedPaymentsDeletedTitle"),
        description: tPlanned("plannedPaymentsDeleted", { count: ids.length }),
      });
      await loadCounts();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : tPlanned("failedToDeletePayments"),
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, [selectedIds, loadCounts, tPlanned]);

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

    if (daysUntil < 0) return tPlanned("overdue");
    if (isToday(dueDate)) return tPlanned("todayLabel");
    if (isTomorrow(dueDate)) return tPlanned("tomorrow");
    if (daysUntil >= 2 && daysUntil <= 6) return tPlanned("inDays", { count: daysUntil });
    if (daysUntil >= 7 && daysUntil <= 13) return tPlanned("nextWeek");
    if (daysUntil >= 14 && daysUntil <= 20) return tPlanned("in2Weeks");
    if (daysUntil >= 21 && daysUntil <= 27) return tPlanned("in3Weeks");
    if (daysUntil >= 28 && daysUntil <= 59) return tPlanned("nextMonthLabel");
    if (daysUntil >= 60) {
      const months = Math.round(daysUntil / 30);
      return tPlanned("inMonths", { count: months });
    }
    return formatDate(dueDate, "shortDate");
  };

  /** Formatted date for support text (locale-aware) */
  const formatDateSupport = (date: string | Date) => {
    const dueDate = date instanceof Date ? date : new Date(date);
    return formatDate(dueDate, "shortDate");
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
      tPlanned("payment")
    );
  };

  const getAccountName = (payment: PlannedPayment) => {
    return payment.account?.name || tPlanned("accountNotSpecified");
  };

  const getToAccountName = (payment: PlannedPayment) => {
    return payment.toAccount?.name || "-";
  };


  // Set default tab to first available tab with items on initial load only
  useEffect(() => {
    if (!loading && expenseCount === 0 && incomeCount === 0 && transferCount === 0) {
      return; // Don't change tab if no payments at all
    }
    if (!loading && activeTab === "expense" && expenseCount === 0) {
      // Only set initial tab if expense is empty and we're still on the default tab
      if (incomeCount > 0) {
        setActiveTab("income");
      } else if (transferCount > 0) {
        setActiveTab("transfer");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, expenseCount, incomeCount, transferCount]);

  return (
    <SimpleTabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full pb-32 lg:pb-0">
      <PageHeader
        title={t("items.plannedPayments")}
      />

      {/* Fixed Tabs - Desktop only */}
      <FixedTabsWrapper>
        <SimpleTabsList>
          <SimpleTabsTrigger value="expense">
            {tPlanned("expense")} {expenseCount > 0 && `(${expenseCount})`}
          </SimpleTabsTrigger>
          <SimpleTabsTrigger value="income">
            {tPlanned("income")} {incomeCount > 0 && `(${incomeCount})`}
          </SimpleTabsTrigger>
          <SimpleTabsTrigger value="transfer">
            {tPlanned("transfer")} {transferCount > 0 && `(${transferCount})`}
          </SimpleTabsTrigger>
        </SimpleTabsList>
      </FixedTabsWrapper>

      {/* Mobile/Tablet Tabs - Sticky at top */}
      <div 
        className="lg:hidden sticky top-0 z-40 bg-card dark:bg-transparent border-b"
      >
        <div 
          className="overflow-x-auto scrollbar-hide" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            touchAction: 'pan-x',
          }}
        >
          <SimpleTabsList className="min-w-max px-4" style={{ scrollSnapAlign: 'start' }}>
            <SimpleTabsTrigger value="expense" className="flex-shrink-0 whitespace-nowrap">
              {tPlanned("expense")} {expenseCount > 0 && `(${expenseCount})`}
            </SimpleTabsTrigger>
            <SimpleTabsTrigger value="income" className="flex-shrink-0 whitespace-nowrap">
              {tPlanned("income")} {incomeCount > 0 && `(${incomeCount})`}
            </SimpleTabsTrigger>
            <SimpleTabsTrigger value="transfer" className="flex-shrink-0 whitespace-nowrap">
              {tPlanned("transfer")} {transferCount > 0 && `(${transferCount})`}
            </SimpleTabsTrigger>
          </SimpleTabsList>
        </div>
      </div>

      {/* Date range filter - right after Tabs */}
      <div className="w-full px-4 lg:px-8 pt-3 pb-2 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">{tPlanned("period")}</span>
          <Select
            value={dateRangePreset}
            onValueChange={(value) => setDateRangePreset(value as DateRangePreset)}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection bar: show when at least one item is selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3 border-b bg-card shadow-sm">
          <span className="text-sm text-muted-foreground">
            {tPlanned("selectedCount", { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="medium"
              onClick={() => setSelectedIds(new Set())}
            >
              {tPlanned("clearSelection")}
            </Button>
            <Button
              variant="destructive"
              size="medium"
              onClick={() => handleDeleteSelected()}
              disabled={Array.from(selectedIds).some((id) => processingIds.has(id))}
            >
              {Array.from(selectedIds).some((id) => processingIds.has(id)) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {tPlanned("deleteSelected")}
            </Button>
          </div>
        </div>
      )}

      <div className="w-full p-4 lg:p-8">
        {/* Mobile Card View */}
        <div className="lg:hidden" ref={pullToRefreshRef}>
          {/* Pull to refresh indicator */}
          {pullDistance > 0 && (
            <div 
              className="flex items-center justify-center py-4 transition-opacity"
              style={{ 
                opacity: Math.min(pullDistance / 60, 1),
                transform: `translateY(${Math.min(pullDistance, 60)}px)`
              }}
            >
              {isRefreshing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{tPlanned("refreshing")}</span>
                </div>
              ) : pullDistance >= 60 ? (
                <div className="text-sm text-muted-foreground">{tPlanned("releaseToRefresh")}</div>
              ) : (
                <div className="text-sm text-muted-foreground">{tPlanned("pullToRefresh")}</div>
              )}
            </div>
          )}
          
          {loading && currentPage === 1 && !isRefreshing ? (
            <div className="text-center py-8 text-muted-foreground">
              {tPlanned("loadingPayments")}
            </div>
          ) : mobilePayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tPlanned("noPaymentsFound", { type: tPlanned(activeTab) })}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <Checkbox
                  data-planned-payment-select-all
                  checked={allCurrentSelected}
                  onCheckedChange={handleToggleSelectAll}
                  aria-label="Select all"
                />
                <span className="text-sm text-muted-foreground">{tPlanned("selectAll")}</span>
              </div>
              {mobilePayments.map((payment, index) => {
                  const daysUntil = getDaysUntil(payment.date);
                  const amount = Math.abs(payment.amount || 0);
                  const dateLabel = formatDateLabel(payment.date);
                  const isProcessing = processingIds.has(payment.id);
                  const isSelected = selectedIds.has(payment.id);
                  
                  return (
                    <div
                      key={payment.id || index}
                      className={cn(
                        "mb-4 p-4 border rounded-lg flex gap-3",
                        isSelected && "bg-muted/50 border-primary/30"
                      )}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleSelectOne(payment.id, !!checked)}
                          aria-label={`Select ${getCategoryName(payment)}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className={cn("font-medium text-sm", getUrgencyColor(daysUntil))}>
                            {dateLabel}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateSupport(payment.date)}
                          </div>
                        </div>
                        <div className={cn("font-bold text-sm", 
                          payment.type === "expense" ? "text-red-600 dark:text-red-400" :
                          payment.type === "income" ? "text-sentiment-positive" :
                          ""
                        )}>
                          {payment.type === "expense" ? "-" : payment.type === "income" ? "+" : ""}
                          {formatMoney(amount)}
                        </div>
                      </div>
                      <div className="text-sm font-medium mb-1">{getCategoryName(payment)}</div>
                      {payment.description && (
                        <div className="text-xs text-muted-foreground mb-2 truncate">
                          {payment.description}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {getAccountName(payment)}
                        </div>
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
                              onClick={() => {
                                setEditingPayment(payment);
                                setIsFormOpen(true);
                              }}
                              disabled={isProcessing || payment.status !== "scheduled"}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              {tPlanned("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMarkAsPaid(payment)}
                              disabled={isProcessing || payment.status !== "scheduled"}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              {tPlanned("markAsPaid")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSkip(payment)}
                              disabled={isProcessing || payment.status !== "scheduled"}
                            >
                              <SkipForward className="h-4 w-4 mr-2" />
                              {tPlanned("skip")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancel(payment)}
                              disabled={isProcessing}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              {tPlanned("cancel")}
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      </div>
                    </div>
                  );
                })}
              {/* Load More button for mobile (show only when 11+ items) */}
              {isMobile && totalPayments >= 11 && currentPage < totalPages && (
                <div className="flex items-center justify-center py-6">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading || loadingMore}
                    variant="outline"
                    className="w-full max-w-xs"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {tPlanned("loading")}
                      </>
                    ) : (
                      tPlanned("loadMore")
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop/Tablet Table View */}
        <div className="hidden lg:block">
        <SimpleTabsContent value="expense">
          {loading && currentPage === 1 ? (
            <div className="rounded-lg p-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {tPlanned("loadingPayments")}
                </p>
              </div>
            </div>
          ) : expensePayments.length === 0 ? (
            <div className="rounded-lg p-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {tPlanned("noFutureExpenses")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pr-0">
                      <Checkbox
                        data-planned-payment-select-all
                        checked={allCurrentSelected}
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("date")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("description")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">{tPlanned("category")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">{tPlanned("account")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">{tPlanned("source")}</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">{tPlanned("amount")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensePayments.map((payment, index) => {
                    const daysUntil = getDaysUntil(payment.date);
                    const amount = Math.abs(payment.amount || 0);
                    const dateLabel = formatDateLabel(payment.date);
                    const isProcessing = processingIds.has(payment.id);
                    const isSelected = selectedIds.has(payment.id);

                    return (
                      <TableRow key={payment.id || index} className={cn("hover:bg-muted/50", isSelected && "bg-muted/50")}>
                        <TableCell className="w-10 pr-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleToggleSelectOne(payment.id, !!checked)}
                            aria-label={`Select ${getCategoryName(payment)}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div>
                            <div className={cn("font-medium", getUrgencyColor(daysUntil))}>
                              {dateLabel}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatDateSupport(payment.date)}
                            </div>
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
                            <span className="text-xs px-2 py-1 rounded bg-interactive-primary/10 text-interactive-primary">
                              {tPlanned("debt")}
                            </span>
                          )}
                          {payment.source === "recurring" && (
                            <span className="text-xs px-2 py-1 rounded bg-interactive-primary/10 text-interactive-primary">
                              {tPlanned("recurring")}
                            </span>
                          )}
                          {payment.source === "subscription" && (
                            <span className="text-xs px-2 py-1 rounded bg-sentiment-positive/10 text-sentiment-positive">
                              {tPlanned("subscription")}
                            </span>
                          )}
                          {payment.source === "manual" && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              {tPlanned("manual")}
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
                                ? tPlanned("todayLabel")
                                : daysUntil === 1
                                ? tPlanned("oneDay")
                                : tPlanned("daysCount", { count: daysUntil })
                              : tPlanned("overdue")}
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
                                onClick={() => {
                                  setEditingPayment(payment);
                                  setIsFormOpen(true);
                                }}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                {tPlanned("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(payment)}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {tPlanned("markAsPaid")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSkip(payment)}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <SkipForward className="h-4 w-4 mr-2" />
                                {tPlanned("skip")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancel(payment)}
                                disabled={isProcessing}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                {tPlanned("cancel")}
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

        <SimpleTabsContent value="income">
          {incomePayments.length === 0 ? (
            <div className="rounded-lg p-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {tPlanned("noFutureIncome")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pr-0">
                      <Checkbox
                        data-planned-payment-select-all
                        checked={allCurrentSelected}
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("date")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("description")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">{tPlanned("category")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">{tPlanned("account")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">{tPlanned("source")}</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">{tPlanned("amount")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomePayments.map((payment, index) => {
                    const daysUntil = getDaysUntil(payment.date);
                    const amount = Math.abs(payment.amount || 0);
                    const dateLabel = formatDateLabel(payment.date);
                    const isProcessing = processingIds.has(payment.id);
                    const isSelected = selectedIds.has(payment.id);

                    return (
                      <TableRow key={payment.id || index} className={cn("hover:bg-muted/50", isSelected && "bg-muted/50")}>
                        <TableCell className="w-10 pr-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleToggleSelectOne(payment.id, !!checked)}
                            aria-label={`Select ${getCategoryName(payment)}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div>
                            <div className={cn("font-medium", getUrgencyColor(daysUntil))}>
                              {dateLabel}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatDateSupport(payment.date)}
                            </div>
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
                            <span className="text-xs px-2 py-1 rounded bg-interactive-primary/10 text-interactive-primary">
                              {tPlanned("recurring")}
                            </span>
                          )}
                          {payment.source === "subscription" && (
                            <span className="text-xs px-2 py-1 rounded bg-sentiment-positive/10 text-sentiment-positive">
                              {tPlanned("subscription")}
                            </span>
                          )}
                          {payment.source === "manual" && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              {tPlanned("manual")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs md:text-sm">
                          <div className="font-bold tabular-nums text-sentiment-positive">
                            +{formatMoney(amount)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 hidden md:block">
                            {daysUntil >= 0
                              ? daysUntil === 0
                                ? tPlanned("todayLabel")
                                : daysUntil === 1
                                ? tPlanned("oneDay")
                                : tPlanned("daysCount", { count: daysUntil })
                              : tPlanned("overdue")}
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
                                onClick={() => {
                                  setEditingPayment(payment);
                                  setIsFormOpen(true);
                                }}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                {tPlanned("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(payment)}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {tPlanned("markAsPaid")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSkip(payment)}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <SkipForward className="h-4 w-4 mr-2" />
                                {tPlanned("skip")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancel(payment)}
                                disabled={isProcessing}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                {tPlanned("cancel")}
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

      <SimpleTabsContent value="transfer">
        {transferPayments.length === 0 ? (
            <div className="rounded-lg p-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {tPlanned("noFutureTransfers")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pr-0">
                      <Checkbox
                        data-planned-payment-select-all
                        checked={allCurrentSelected}
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("date")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("description")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">{tPlanned("fromAccount")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">{tPlanned("toAccount")}</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">{tPlanned("source")}</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">{tPlanned("amount")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{tPlanned("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferPayments.map((payment, index) => {
                    const daysUntil = getDaysUntil(payment.date);
                    const amount = Math.abs(payment.amount || 0);
                    const dateLabel = formatDateLabel(payment.date);
                    const isProcessing = processingIds.has(payment.id);
                    const isSelected = selectedIds.has(payment.id);

                    return (
                      <TableRow key={payment.id || index} className={cn("hover:bg-muted/50", isSelected && "bg-muted/50")}>
                        <TableCell className="w-10 pr-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleToggleSelectOne(payment.id, !!checked)}
                            aria-label={`Select ${getCategoryName(payment)}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div>
                            <div className={cn("font-medium", getUrgencyColor(daysUntil))}>
                              {dateLabel}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatDateSupport(payment.date)}
                            </div>
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
                            <span className="text-xs px-2 py-1 rounded bg-interactive-primary/10 text-interactive-primary">
                              {tPlanned("recurring")}
                            </span>
                          )}
                          {payment.source === "subscription" && (
                            <span className="text-xs px-2 py-1 rounded bg-sentiment-positive/10 text-sentiment-positive">
                              {tPlanned("subscription")}
                            </span>
                          )}
                          {payment.source === "manual" && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              {tPlanned("manual")}
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
                                ? tPlanned("todayLabel")
                                : daysUntil === 1
                                ? tPlanned("oneDay")
                                : tPlanned("daysCount", { count: daysUntil })
                              : tPlanned("overdue")}
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
                                onClick={() => {
                                  setEditingPayment(payment);
                                  setIsFormOpen(true);
                                }}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                {tPlanned("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(payment)}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {tPlanned("markAsPaid")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSkip(payment)}
                                disabled={isProcessing || payment.status !== "scheduled"}
                              >
                                <SkipForward className="h-4 w-4 mr-2" />
                                {tPlanned("skip")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancel(payment)}
                                disabled={isProcessing}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                {tPlanned("cancel")}
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
        </div>

        {/* Pagination Controls - Desktop only (show only when 11+ items) */}
        {totalPayments >= 11 && (
          <div className="hidden lg:flex flex-col sm:flex-row items-center justify-between gap-4 px-2 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{tPlanned("itemsPerPage")}</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {tPlanned("showingPayments", {
                  from: ((currentPage - 1) * itemsPerPage) + 1,
                  to: Math.min(currentPage * itemsPerPage, totalPayments),
                  total: totalPayments,
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="medium"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="h-9"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">{tPlanned("previous")}</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="medium"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className="h-9 w-9"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="medium"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="h-9"
              >
                <span className="hidden sm:inline mr-1">{tPlanned("next")}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Form for creating or editing planned payments */}
      <TransactionForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPayment(null);
        }}
        plannedPayment={editingPayment}
        onSuccess={() => {
          setEditingPayment(null);
          loadCounts();
          loadPlannedPayments();
        }}
        defaultType={activeTab}
      />

      {/* Mobile Add bar - fixed above bottom nav */}
      <MobileAddBar>
        <Button
          size="medium"
          className="w-full max-w-sm"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {tPlanned("addPlannedPayment")}
        </Button>
      </MobileAddBar>
    </SimpleTabs>
  );
}

