"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { apiUrl, categoriesApiUrl } from "@/lib/utils/api-base-url";
import { logger } from "@/src/infrastructure/utils/logger";
import { usePagePerformance } from "@/hooks/use-page-performance";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dynamic from "next/dynamic";

// Lazy load heavy form components
const TransactionForm = dynamic(() => import("@/components/forms/transaction-form").then(m => ({ default: m.TransactionForm })), { ssr: false });
const CsvImportDialog = dynamic(() => import("@/components/forms/csv-import-dialog").then(m => ({ default: m.CsvImportDialog })), { ssr: false });
const CategorySelectionDialog = dynamic(() => import("@/components/transactions/category-selection-dialog").then(m => ({ default: m.CategorySelectionDialog })), { ssr: false });
const BlockedFeature = dynamic(() => import("@/components/common/blocked-feature").then(m => ({ default: m.BlockedFeature })), { ssr: false });
import { formatMoney } from "@/components/common/money";
import { Plus, Download, Upload, Search, Trash2, Edit, Repeat, Check, Loader2, X, ChevronLeft, ChevronRight, Filter, Calendar, Wallet, Tag, Type, XCircle, Receipt } from "lucide-react";
import { TransactionsMobileCard } from "@/src/presentation/components/features/transactions/transactions-mobile-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SimpleTabs,
  SimpleTabsList,
  SimpleTabsTrigger,
} from "@/components/ui/simple-tabs";
import { FixedTabsWrapper } from "@/components/common/fixed-tabs-wrapper";
import { Input } from "@/components/ui/input";
import { formatTransactionDate, formatShortDate, parseDateWithoutTimezone, parseDateInput, formatDateInput } from "@/src/infrastructure/utils/timestamp";
import { formatTransferLabel } from "@/src/presentation/utils/format-transfer-label";
import { format } from "date-fns";
import { exportTransactionsToCSV, downloadCSV } from "@/lib/csv/export";
import { useToast } from "@/components/toast-provider";
import type { Transaction } from "@/src/domain/transactions/transactions.types";
import type { Category } from "@/src/domain/categories/categories.types";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { useWriteGuard } from "@/hooks/use-write-guard";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { MobileAddBar } from "@/components/common/mobile-add-bar";
import { ImportStatusBanner } from "@/src/presentation/components/features/accounts/import-status-banner";

interface Account {
  id: string;
  name: string;
  type: string;
}

// Component for category menu item that may have subcategories
function CategoryMenuItem({
  category,
  onSelect,
  loadSubcategories,
  noSubcategoryLabel,
  loadingLabel,
}: {
  category: Category;
  onSelect: (categoryId: string, subcategoryId: string | null) => void;
  loadSubcategories: (categoryId: string) => Promise<Array<{ id: string; name: string }>>;
  noSubcategoryLabel: string;
  loadingLabel: string;
}) {
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    if (open && !hasChecked && !category.subcategories) {
      setLoading(true);
      setHasChecked(true);
      try {
        const subcats = await loadSubcategories(category.id);
        setSubcategories(subcats);
      } catch (error) {
        logger.error("Error loading subcategories:", error);
      } finally {
        setLoading(false);
      }
    } else if (category.subcategories) {
      setSubcategories(category.subcategories);
    }
  };

  const finalSubcategories = subcategories.length > 0 
    ? subcategories 
    : (category.subcategories || []);
  
  const hasSubcategories = finalSubcategories.length > 0;

  // Always show as submenu if we're loading or if we have subcategories
  // This ensures the menu structure is consistent
  if (hasSubcategories || loading || !hasChecked) {
    return (
      <DropdownMenuSub onOpenChange={handleOpenChange}>
        <DropdownMenuSubTrigger className="text-xs">
          {category.name}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {loading ? (
            <DropdownMenuItem disabled className="text-xs">
              {loadingLabel}
            </DropdownMenuItem>
          ) : hasSubcategories ? (
            <>
              <DropdownMenuItem
                onClick={() => onSelect(category.id, null)}
                className="text-xs"
              >
                {noSubcategoryLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {finalSubcategories.map((subcategory) => (
                <DropdownMenuItem
                  key={subcategory.id}
                  onClick={() => onSelect(category.id, subcategory.id)}
                  className="text-xs"
                >
                  {subcategory.name}
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <DropdownMenuItem
              onClick={() => onSelect(category.id, null)}
              className="text-xs"
            >
              {noSubcategoryLabel}
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // If we've checked and there are no subcategories, show as simple item
  return (
    <DropdownMenuItem
      onClick={() => onSelect(category.id, null)}
      className="text-xs"
    >
      {category.name}
    </DropdownMenuItem>
  );
}

export default function TransactionsPage() {
  const t = useTranslations("nav");
  const tTx = useTranslations("transactions");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const perf = usePagePerformance("Transactions");
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { openDialog: openDeleteDialog, ConfirmDialog: DeleteConfirmDialog } = useConfirmDialog();
  const { openDialog: openDeleteMultipleDialog, ConfirmDialog: DeleteMultipleConfirmDialog } = useConfirmDialog();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showImportUpgradeModal, setShowImportUpgradeModal] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionSummaryModal, setTransactionSummaryModal] = useState<Transaction | null>(null);
  const [transactionForCategory, setTransactionForCategory] = useState<Transaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [clearCategoryTrigger, setClearCategoryTrigger] = useState(0);
  const [categorySaveLoading, setCategorySaveLoading] = useState(false);
  const [dateRange, setDateRange] = useState<"all-dates" | "today" | "past-7-days" | "past-15-days" | "past-30-days" | "past-90-days" | "last-3-months" | "last-month" | "last-6-months" | "past-6-months" | "this-month" | "this-year" | "year-to-date" | "last-year" | "custom">("all-dates");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    accountId: "all",
    categoryId: "all",
    type: "expense", // Default to expense instead of "all"
    search: "",
    recurring: "all",
  });
  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<string>>(new Set());
  const [selectValue, setSelectValue] = useState<string>("");
  const { limits, checking: limitsLoading } = useSubscription();
  const { checkWriteAccess, canWrite } = useWriteGuard();

  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [updatingTypes, setUpdatingTypes] = useState(false);
  const [updatingCategories, setUpdatingCategories] = useState(false);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [suggestionsGenerated, setSuggestionsGenerated] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>("");
  const [editingDescriptionValue, setEditingDescriptionValue] = useState<string>("");
  const [updatingTransactionId, setUpdatingTransactionId] = useState<string | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadTransactionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dateInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const descriptionInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const pullToRefreshRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const currentPullDistance = useRef<number>(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const handleItemsPerPageChange = useCallback((value: string) => {
    const newItemsPerPage = Number(value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // Accumulated transactions for mobile
  const [loadingMore, setLoadingMore] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // OPTIMIZED: Cache mobile detection to avoid repeated window.innerWidth checks
  const [isMobile, setIsMobile] = useState(false);
  
  // Update mobile detection on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
    };
    
    // Check on mount
    checkMobile();
    
    // Listen for resize events (debounced)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);


  // Focus date input when editing starts
  useEffect(() => {
    if (editingDateId) {
      const input = dateInputRefs.current.get(editingDateId);
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [editingDateId]);

  // Focus description input when editing starts
  useEffect(() => {
    if (editingDescriptionId) {
      const input = descriptionInputRefs.current.get(editingDescriptionId);
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [editingDescriptionId]);

  // Load initial data - only run once on mount
  useEffect(() => {
    loadData();
  }, []);

  // Open add-transaction form when navigating from /transactions/new (redirects with ?open=new)
  useEffect(() => {
    if (searchParams.get("open") === "new") {
      setSelectedTransaction(null);
      setIsFormOpen(true);
      // Remove ?open=new from URL without full navigation
      const next = new URLSearchParams(searchParams.toString());
      next.delete("open");
      const q = next.toString();
      router.replace(q ? `${pathname ?? "/transactions"}?${q}` : (pathname ?? "/transactions"), { scroll: false });
    }
  }, [pathname, router, searchParams]);

  // Parse URL params when searchParams change
  useEffect(() => {
    // Read filters from URL if present
    const categoryIdFromUrl = searchParams.get("categoryId");
    const typeFromUrl = searchParams.get("type");
    const startDateFromUrl = searchParams.get("startDate");
    const endDateFromUrl = searchParams.get("endDate");
    
    // Determine date range preset if dates are provided
    let dateRangePreset: typeof dateRange = "all-dates";
    if (startDateFromUrl && endDateFromUrl) {
      // Check if it's a single month range
      const startDate = new Date(startDateFromUrl);
      const endDate = new Date(endDateFromUrl);
      const isStartOfMonth = startDate.getDate() === 1;
      const isEndOfMonth = endDate.getDate() === new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
      const isSameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
      
      if (isStartOfMonth && isEndOfMonth && isSameMonth) {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const urlMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        
        if (urlMonth.getTime() === currentMonth.getTime()) {
          dateRangePreset = "this-month";
        } else {
          dateRangePreset = "custom";
        }
      } else {
        dateRangePreset = "custom";
      }
    }
    
    setFilters(prev => ({
      ...prev,
      startDate: startDateFromUrl || "",
      endDate: endDateFromUrl || "",
      categoryId: categoryIdFromUrl || "all",
      type: typeFromUrl || "all",
    }));
    setDateRange(dateRangePreset);
    
    // Set custom date range if dates are provided
    if (startDateFromUrl && endDateFromUrl) {
      setCustomDateRange({
        startDate: startDateFromUrl,
        endDate: endDateFromUrl,
      });
    }
  }, [searchParams]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setAllTransactions([]); // Clear accumulated transactions when filters change
  }, [filters]);

  // Calculate totalPages using useMemo to avoid reference errors
  const totalPages = useMemo(() => {
    return Math.ceil(totalTransactions / itemsPerPage);
  }, [totalTransactions, itemsPerPage]);

  // Reset loadingMore when transactions are loaded
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
        setAllTransactions([]);
        // Trigger reload
        setTimeout(() => {
          loadTransactions().finally(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullDistance, loading, isRefreshing]);

  // Debounced transaction loading - consolidates all transaction fetching
  // This handles both filter changes and pagination changes
  useEffect(() => {
    // Clear any pending timeout
    if (loadTransactionsTimeoutRef.current) {
      clearTimeout(loadTransactionsTimeoutRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Activate search loading if there's a search term
    const hasSearch = !!filters.search;
    if (hasSearch) {
      setSearchLoading(true);
    } else {
      // Clear search loading if search is cleared
      setSearchLoading(false);
    }

    // Debounce the request (longer delay for search to reduce rapid requests)
    // No debounce for page changes, only for filter changes
    const delay = filters.search ? 500 : (Object.keys(filters).some(key => key !== 'search' && filters[key as keyof typeof filters] !== 'all' && filters[key as keyof typeof filters] !== '') ? 200 : 0);
    loadTransactionsTimeoutRef.current = setTimeout(() => {
      loadTransactions();
    }, delay);

    return () => {
      if (loadTransactionsTimeoutRef.current) {
        clearTimeout(loadTransactionsTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, itemsPerPage]); // loadTransactions is stable, no need to include in deps

  function getDateRangeDates(range: string): { startDate: string; endDate: string } | null {
    const today = new Date();
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    let startDate: Date;
    let endDate: Date;

    switch (range) {
      case "all-dates":
        return null; // No date filter
      case "today":
        startDate = new Date(now);
        endDate = new Date(now);
        break;
      case "past-7-days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        endDate = new Date(now);
        break;
      case "past-15-days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 14);
        endDate = new Date(now);
        break;
      case "past-30-days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        endDate = new Date(now);
        break;
      case "past-90-days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 89);
        endDate = new Date(now);
        break;
      case "last-3-months":
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "last-month":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "last-6-months":
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "past-6-months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        endDate = new Date(now);
        break;
      case "this-month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "this-year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      case "year-to-date":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(now);
        break;
      case "last-year":
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  function handleDateRangeChange(
    preset: "all-dates" | "today" | "past-7-days" | "past-15-days" | "past-30-days" | "past-90-days" | "last-3-months" | "last-month" | "last-6-months" | "past-6-months" | "this-month" | "this-year" | "year-to-date" | "last-year" | "custom",
    customRange?: DateRange
  ) {
    if (preset === "custom" && customRange) {
      setDateRange("custom");
      setCustomDateRange(customRange);
      setFilters(prev => ({
        ...prev,
        startDate: customRange.startDate,
        endDate: customRange.endDate,
      }));
    } else if (preset === "all-dates") {
      setDateRange("all-dates");
      setCustomDateRange(undefined);
      setFilters(prev => ({
        ...prev,
        startDate: "",
        endDate: "",
      }));
    } else {
      setDateRange(preset);
      setCustomDateRange(undefined);
      const dates = getDateRangeDates(preset);
      if (dates) {
        setFilters(prev => ({
          ...prev,
          startDate: dates.startDate,
          endDate: dates.endDate,
        }));
      } else {
        setFilters(prev => ({
          ...prev,
          startDate: "",
          endDate: "",
        }));
      }
    }
  }

  async function loadData() {
    try {
      // Load accounts and categories in parallel using API routes
      // OPTIMIZED: Skip investment balances calculation for Transactions page (not needed, saves ~1s)
      const [accountsResponse, categoriesResponse] = await Promise.all([
        fetch(apiUrl("/api/v2/accounts?includeHoldings=false")),
        fetch(categoriesApiUrl("/api/v2/categories?all=true", locale)),
      ]);
      
      if (!accountsResponse.ok || !categoriesResponse.ok) {
        throw new Error("Failed to fetch data");
      }
      
      const [accountsData, categoriesData] = await Promise.all([
        accountsResponse.json(),
        categoriesResponse.json(),
      ]);
      
      setAccounts(accountsData);
      setCategories(categoriesData);
      
      // Initialize active categories with default ones
      const defaultCategoryNames = [
        "Restaurants",
        "Coffee",
        "Groceries",
        "Gifts",
        "Donation",
        "Donations",
        "Vehicle",
      ];
      const defaultCategories = categoriesData
        .filter((cat: Category) => defaultCategoryNames.includes(cat.name))
        .map((cat: Category) => cat.id);
      
      // Add category from URL if present
      const categoryIdFromUrl = searchParams.get("categoryId");
      const activeCategories = new Set<string>(defaultCategories);
      if (categoryIdFromUrl) {
        activeCategories.add(categoryIdFromUrl);
      }
      
      setActiveCategoryIds(activeCategories);
    } catch (error) {
      logger.error("Error loading data:", error);
    }
  }

  async function loadTransactions(forceRefresh: boolean = false) {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.accountId && filters.accountId !== "all") params.append("accountId", filters.accountId);
      if (filters.categoryId && filters.categoryId !== "all") params.append("categoryId", filters.categoryId);
      if (filters.type && filters.type !== "all") params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);
      if (filters.recurring && filters.recurring !== "all") params.append("recurring", filters.recurring);

      // Add pagination parameters
      // For mobile infinite scroll, always use 10 items per page
      // OPTIMIZED: Use cached mobile detection state
      // IMPORTANT: Always use itemsPerPage when explicitly set by user (desktop pagination controls)
      // Only force 10 on mobile when using infinite scroll (mobile doesn't show pagination controls)
      // Check if we're actually on mobile by verifying window width at call time, not just state
      const isActuallyMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      const limit = isActuallyMobile ? 10 : itemsPerPage;
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      params.append("excludeIncomingTransferLegs", "true");

      // Use API v2 route to get transactions (descriptions are decrypted on server)
      // Add cache busting timestamp to force fresh data after deletions
      const queryString = params.toString();
      // OPTIMIZED: Add _forceRefresh parameter to bypass server-side unstable_cache
      // This forces getTransactions() to bypass cache by using search parameter trick
      const refreshParam = forceRefresh ? '&_forceRefresh=true' : '';
      const url = `/api/v2/transactions${queryString ? `?${queryString}` : ''}${queryString ? '&' : '?'}_t=${Date.now()}${refreshParam}`;
      
      const response = await fetch(url, {
        // Force fresh fetch - cache is invalidated server-side but browser may still cache
        cache: 'no-store',
        signal: abortController.signal,
      });

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        toast({
          title: tTx("tooManyRequests"),
          description: tTx("tooManyRequestsDescription", { seconds: retrySeconds }),
          variant: "destructive",
        });
        // Retry after the specified delay
        setTimeout(() => {
          if (!abortController.signal.aborted) {
            loadTransactions();
          }
        }, retrySeconds * 1000);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || tTx("failedToFetchTransactions"));
      }

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      const data = await response.json();
      
      // Handle both old format (array) and new format (object with transactions and total)
      let newTransactions: Transaction[] = [];
      if (Array.isArray(data)) {
        // Backward compatibility: if API returns array, use it directly
        newTransactions = data;
        setTotalTransactions(data.length);
      } else if (data.transactions && typeof data.total === 'number') {
        // New format with pagination
        newTransactions = data.transactions;
        setTotalTransactions(data.total);
      } else {
        logger.error("[TransactionsPage] Unexpected response format:", data);
        setTransactions([]);
        setTotalTransactions(0);
        return;
      }
      
      // OPTIMIZED: Handle pagination differently for mobile vs desktop
      // Mobile: accumulate transactions for infinite scroll
      // Desktop: always replace transactions (normal pagination)
      if (isMobile) {
        // Mobile infinite scroll: accumulate transactions
        if (currentPage === 1) {
          // First page: replace all (reset accumulated list)
          setTransactions(newTransactions);
          setAllTransactions(newTransactions);
        } else {
          // Subsequent pages: add to accumulated list for infinite scroll
          setTransactions(newTransactions);
          setAllTransactions(prev => {
            // Avoid duplicates by checking IDs
            const existingIds = new Set(prev.map(t => t.id));
            const uniqueNew = newTransactions.filter(t => !existingIds.has(t.id));
            return [...prev, ...uniqueNew];
          });
        }
      } else {
        // Desktop: always replace transactions (normal pagination)
        // Clear accumulated transactions to free memory
        setTransactions(newTransactions);
        // Only keep allTransactions if we're on page 1 (for consistency)
        if (currentPage === 1) {
          setAllTransactions(newTransactions);
        } else {
          // Clear accumulated transactions on desktop when navigating pages
          // This prevents memory buildup when user navigates between pages
          setAllTransactions([]);
        }
      }
      
      // Mark data as loaded for performance tracking
      perf.markDataLoaded();

      // Generate suggestions for existing transactions without category (only once per page load)
      // Defer this to avoid blocking initial page load
      if (!suggestionsGenerated) {
        const transactionsToCheck = Array.isArray(data) ? data : (data.transactions || []);
        const hasUncategorizedTransactions = transactionsToCheck.some((tx: Transaction) => !tx.categoryId && !tx.suggestedCategoryId);
        if (hasUncategorizedTransactions) {
          setSuggestionsGenerated(true);
          // Generate suggestions in the background after a delay to not block initial load
          // Use requestIdleCallback if available, otherwise setTimeout
          const generateSuggestions = () => {
            fetch(apiUrl("/api/v2/transactions/suggestions/generate"), { method: "POST" })
              .then(response => response.json())
              .then(result => {
                if (result.processed > 0) {
                  // Reload transactions to show the new suggestions after a delay
                  // Use a longer delay to avoid hitting rate limits
                  setTimeout(() => {
                    if (!abortControllerRef.current?.signal.aborted) {
                      loadTransactions();
                    }
                  }, 3000); // Increased delay to prevent rate limit issues
                }
              })
              .catch(error => {
                logger.error("Error generating suggestions:", error);
              });
          };
          
          // Use requestIdleCallback if available (browser API), otherwise setTimeout
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as any).requestIdleCallback(generateSuggestions, { timeout: 5000 });
          } else {
            setTimeout(generateSuggestions, 2000);
          }
        }
      }
    } catch (error) {
      // Don't log aborted requests as errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      logger.error("Error loading transactions:", error);
      toast({
        title: tTx("errorLoadingTransactions"),
        description: error instanceof Error ? error.message : tTx("unexpectedError"),
        variant: "destructive",
      });
    } finally {
      // Only set loading to false if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
        // Also clear search loading if there was a search
        if (filters.search) {
          setSearchLoading(false);
        }
      }
      // Clear the abort controller reference if this was the active request
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }

  function handleDelete(id: string) {
    // Check if user can perform write operations
    if (!checkWriteAccess()) {
      return;
    }
    openDeleteDialog(
      {
        title: tTx("deleteTransactionTitle"),
        description: tTx("deleteTransactionDescription"),
        variant: "destructive",
        confirmLabel: tCommon("delete"),
      },
      async () => {
        const transactionToDelete = transactions.find(t => t.id === id);
        if (!transactionToDelete) return;
        
        // Optimistic update: remove from UI immediately
        setTransactions(prev => prev.filter(t => t.id !== id));
        setDeletingId(id);

        try {
          // Hard delete directly
          const response = await fetch(apiUrl(`/api/v2/transactions/${id}`), {
            method: "DELETE",
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || tTx("failedToDeleteTransaction"));
          }

          // Show success toast
          toast({
            title: tToasts("transactionDeleted"),
            description: tToasts("saved"),
            variant: "success",
          });

          // Reload transactions
          await loadTransactions();
          router.refresh();
          
        } catch (error) {
          console.error("Error deleting transaction:", error);
          // Revert optimistic update on error
          setTransactions(prev => [...prev, transactionToDelete].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          toast({
            title: tToasts("error"),
            description: error instanceof Error ? error.message : tToasts("failedToDeleteTransaction"),
            variant: "destructive",
          });
        } finally {
          setDeletingId(null);
        }
      }
    );
  }

  function handleDeleteMultiple() {
    const idsToDelete = Array.from(selectedTransactionIds);
    if (idsToDelete.length === 0) return;

    const count = idsToDelete.length;
    openDeleteMultipleDialog(
      {
        title: tTx("deleteTransactionsTitle"),
        description: tTx("deleteTransactionsDescription", { count }),
        variant: "destructive",
        confirmLabel: tCommon("delete"),
      },
      async () => {
        const transactionsToDelete = transactions.filter(t => idsToDelete.includes(t.id));
        
        // Optimistic update: remove from UI immediately
        setTransactions(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        setDeletingMultiple(true);
        setSelectedTransactionIds(new Set());

        try {
          // Hard delete directly
          const response = await fetch(apiUrl("/api/v2/transactions/bulk"), {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids: idsToDelete }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || tToasts("failedToDeleteTransactions"));
          }

          // Show success toast
          toast({
            title: tToasts("transactionDeleted"),
            description: tToasts("transactionsDeleted", { count }),
            variant: "success",
          });

          // Reload transactions
          await loadTransactions();
          router.refresh();
          
        } catch (error) {
          console.error("Error deleting transactions:", error);
          // Revert optimistic update on error
          setTransactions(prev => {
            const restored = [...prev, ...transactionsToDelete];
            return restored.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
          toast({
            title: tToasts("error"),
            description: error instanceof Error ? error.message : tToasts("failedToDeleteTransactions"),
            variant: "destructive",
          });
        } finally {
          setDeletingMultiple(false);
        }
      }
    );
  }

  async function handleBulkUpdateType(newType: "expense" | "income" | "transfer") {
    if (!checkWriteAccess()) {
      return;
    }

    const idsToUpdate = Array.from(selectedTransactionIds);
    if (idsToUpdate.length === 0) return;

    const transactionsToUpdate = transactions.filter(t => idsToUpdate.includes(t.id));
    
    // Optimistic update: update type in UI immediately
    setTransactions(prev => prev.map(tx => 
      idsToUpdate.includes(tx.id) 
        ? { ...tx, type: newType }
        : tx
    ));
    setUpdatingTypes(true);

    try {
      const response = await fetch(apiUrl("/api/v2/transactions/bulk"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionIds: idsToUpdate, type: newType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tTx("failedToUpdateTransactionTypes"));
      }

      const result = await response.json();

      toast({
        title: tTx("transactionsUpdated"),
        description: tTx("transactionsUpdated"),
        variant: "success",
      });
      
      // Clear selection
      setSelectedTransactionIds(new Set());
      
      // Refresh router to update dashboard and other pages that depend on transactions
      router.refresh();
      
      // Reload transactions to ensure UI is in sync with database
      loadTransactions();
    } catch (error) {
      console.error("Error updating transaction types:", error);
      // Revert optimistic update on error
      setTransactions(prev => prev.map(tx => {
        const original = transactionsToUpdate.find(t => t.id === tx.id);
        return original ? original : tx;
      }));
      toast({
        title: tToasts("error"),
        description: error instanceof Error ? error.message : tTx("failedToUpdateTransactionTypes"),
        variant: "destructive",
      });
    } finally {
      setUpdatingTypes(false);
    }
  }

  async function loadSubcategoriesForBulk(categoryId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await fetch(categoriesApiUrl(`/api/v2/categories?categoryId=${categoryId}`, locale));
      if (response.ok) {
        const data = await response.json();
        return data || [];
      }
    } catch (error) {
      logger.error("Error loading subcategories:", error);
    }
    return [];
  }

  async function handleBulkUpdateCategory(categoryId: string | null, subcategoryId: string | null = null) {
    if (!checkWriteAccess()) {
      return;
    }

    const idsToUpdate = Array.from(selectedTransactionIds);
    if (idsToUpdate.length === 0) return;

    const transactionsToUpdate = transactions.filter(t => idsToUpdate.includes(t.id));
    
    // Find the category object to update UI
    const selectedCategory = categoryId ? categories.find(c => c.id === categoryId) : null;
    const selectedSubcategory = subcategoryId && selectedCategory 
      ? selectedCategory.subcategories?.find(s => s.id === subcategoryId) 
      : null;
    
    // Optimistic update: update category in UI immediately
    setTransactions(prev => prev.map(tx => 
      idsToUpdate.includes(tx.id) 
        ? { 
            ...tx, 
            categoryId: categoryId || undefined,
            subcategoryId: subcategoryId || undefined,
            category: selectedCategory || undefined,
            subcategory: selectedSubcategory || undefined,
          }
        : tx
    ));
    setUpdatingCategories(true);

    try {
      const response = await fetch(apiUrl("/api/v2/transactions/bulk"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          transactionIds: idsToUpdate, 
          categoryId: categoryId || null,
          subcategoryId: subcategoryId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tTx("failedToUpdateTransactionCategories"));
      }

      const result = await response.json();

      toast({
        title: tTx("categoriesUpdated"),
        description: tTx("categoriesUpdated"),
        variant: "success",
      });
      
      // Clear selection
      setSelectedTransactionIds(new Set());
      
      // Refresh router to update dashboard and other pages that depend on transactions
      router.refresh();
      
      // Reload transactions to ensure UI is in sync with database
      loadTransactions();
    } catch (error) {
      console.error("Error updating transaction categories:", error);
      // Revert optimistic update on error
      setTransactions(prev => prev.map(tx => {
        const original = transactionsToUpdate.find(t => t.id === tx.id);
        return original ? original : tx;
      }));
      toast({
        title: tToasts("error"),
        description: error instanceof Error ? error.message : tTx("failedToUpdateTransactionCategories"),
        variant: "destructive",
      });
    } finally {
      setUpdatingCategories(false);
    }
  }

  async function handleCategoryUpdate(categoryId: string | null, subcategoryId: string | null = null) {
    if (!transactionForCategory) return;

    const transactionToUpdate = transactionForCategory;
    setCategorySaveLoading(true);

    try {
      const updateData: { categoryId?: string | null; subcategoryId?: string | null } = {};
      updateData.categoryId = categoryId;
      updateData.subcategoryId = subcategoryId || null;

      const response = await fetch(apiUrl(`/api/v2/transactions/${transactionToUpdate.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tTx("failedToUpdateCategory"));
      }

      // Use PATCH response (includes category/subcategory) — no second request
      const updatedTransaction = await response.json();
      setTransactions(prev => prev.map(tx =>
        tx.id === transactionToUpdate.id
          ? {
              ...tx,
              categoryId: updatedTransaction.categoryId ?? undefined,
              subcategoryId: updatedTransaction.subcategoryId ?? undefined,
              category: updatedTransaction.category ?? null,
              subcategory: updatedTransaction.subcategory ?? null,
            }
          : tx
      ));

      toast({
        title: tTx("categoryUpdated"),
        description: tTx("categoryUpdatedDescription"),
        variant: "success",
      });

      setIsCategoryModalOpen(false);
      setTransactionForCategory(null);
      
      // Don't refresh router here to avoid triggering unnecessary reloads
      // The dashboard will update on next navigation or manual refresh
    } catch (error) {
      console.error("Error updating category:", error);
      
      // Revert optimistic update
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionToUpdate.id 
          ? transactionToUpdate
          : tx
      ));

      toast({
        title: tToasts("error"),
        description: error instanceof Error ? error.message : tTx("failedToUpdateCategory"),
        variant: "destructive",
      });
    } finally {
      setCategorySaveLoading(false);
    }
  }

  function handleExport() {
    // Check if user has access to CSV export
    // The database is the source of truth - if a feature is disabled in Supabase, it should be disabled here
    // Safety check: convert string "true" to boolean (defensive programming)
    const hasAccess = limits.hasCsvExport === true || String(limits.hasCsvExport) === "true";
    
    if (!hasAccess) {
      toast({
        title: tTx("csvExportNotAvailable"),
        description: tTx("csvExportNotAvailableDescription"),
        variant: "destructive",
      });
      return;
    }

    const csv = exportTransactionsToCSV(transactions);
    downloadCSV(csv, `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`);
  }

  function addCategoryToFilters(categoryId: string) {
    setActiveCategoryIds(prev => new Set([...prev, categoryId]));
  }

  function removeCategoryFromFilters(categoryId: string) {
    setActiveCategoryIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(categoryId);
      return newSet;
    });
    // If the removed category was selected, reset to "all"
    if (filters.categoryId === categoryId) {
      setFilters(prev => ({ ...prev, categoryId: "all" }));
    }
  }

  async function handleApplySuggestion(transactionId: string) {
    const transaction = transactions.find(tx => tx.id === transactionId);
    if (!transaction) return;

    setProcessingSuggestionId(transactionId);
    
    // Optimistic update immediately
    setTransactions(prev => prev.map(tx => 
      tx.id === transactionId 
        ? { 
            ...tx, 
            categoryId: tx.suggestedCategoryId || tx.categoryId,
            subcategoryId: tx.suggestedSubcategoryId || tx.subcategoryId,
            suggestedCategoryId: null,
            suggestedSubcategoryId: null,
            suggestedCategory: null,
            suggestedSubcategory: null,
            // Use suggested category as category until we fetch the real one
            category: tx.suggestedCategory || tx.category,
            subcategory: tx.suggestedSubcategory || tx.subcategory,
          }
        : tx
    ));

    try {
      const response = await fetch(apiUrl(`/api/v2/transactions/${transactionId}/suggestions/apply`), {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tTx("failedToApplySuggestion"));
      }

      // No need to fetch again - we already have the category data from suggestedCategory
      // The optimistic update already shows the correct category, so we're done

      toast({
        title: tTx("categoryApplied"),
        description: tTx("categoryAppliedDescription"),
        variant: "success",
      });
    } catch (error) {
      console.error("Error applying suggestion:", error);
      
      // Revert optimistic update on error
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId ? transaction : tx
      ));

      toast({
        title: tToasts("error"),
        description: error instanceof Error ? error.message : tTx("failedToApplySuggestion"),
        variant: "destructive",
      });
    } finally {
      setProcessingSuggestionId(null);
    }
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedTransactionIds(prev => {
        const newSet = new Set(prev);
        paginatedTransactions.forEach(tx => newSet.add(tx.id));
        return newSet;
      });
    } else {
      setSelectedTransactionIds(prev => {
        const newSet = new Set(prev);
        paginatedTransactions.forEach(tx => newSet.delete(tx.id));
        return newSet;
      });
    }
  }

  function handleSelectTransaction(transactionId: string, checked: boolean) {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(transactionId);
      } else {
        newSet.delete(transactionId);
      }
      return newSet;
    });
  }

  // Pagination calculations - now using server-side pagination
  // totalPages is calculated earlier to avoid reference errors
  
  // For desktop: use paginated transactions from server
  // For mobile: use accumulated transactions for infinite scroll
  const paginatedTransactions = transactions;
  const mobileTransactions = allTransactions.length > 0 ? allTransactions : transactions;
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);

  const allSelected = paginatedTransactions.length > 0 && paginatedTransactions.every(tx => selectedTransactionIds.has(tx.id));
  const someSelected = paginatedTransactions.some(tx => selectedTransactionIds.has(tx.id)) && !allSelected;

  // Adjust current page if it's out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Clear selection when transactions change (filters applied)
  useEffect(() => {
    // Only keep selected IDs that are still in the current transactions list
    setSelectedTransactionIds(prev => {
      const currentIds = new Set(transactions.map(tx => tx.id));
      const filtered = new Set([...prev].filter(id => currentIds.has(id)));
      return filtered;
    });
  }, [transactions]);


  // Update indeterminate state of select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  async function handleRejectSuggestion(transactionId: string) {
    const transaction = transactions.find(tx => tx.id === transactionId);
    if (!transaction) return;

    setProcessingSuggestionId(transactionId);
    
    // Optimistic update immediately
    setTransactions(prev => prev.map(tx => 
      tx.id === transactionId 
        ? { 
            ...tx, 
            suggestedCategoryId: null,
            suggestedSubcategoryId: null,
            suggestedCategory: null,
            suggestedSubcategory: null,
          }
        : tx
    ));

    try {
      const response = await fetch(apiUrl(`/api/v2/transactions/${transactionId}/suggestions/reject`), {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tTx("failedToRejectSuggestion"));
      }

      toast({
        title: tTx("suggestionRejected"),
        description: tTx("suggestionRejectedDescription"),
        variant: "success",
      });

      // Open category selection modal
      const updatedTransaction = transactions.find(tx => tx.id === transactionId);
      if (updatedTransaction) {
        setTransactionForCategory(updatedTransaction);
        setSelectedCategoryId(null);
        setSelectedSubcategoryId(null);
        setIsCategoryModalOpen(true);
      }
    } catch (error) {
      console.error("Error rejecting suggestion:", error);
      
      // Revert optimistic update on error
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId ? transaction : tx
      ));

      toast({
        title: tToasts("error"),
        description: error instanceof Error ? error.message : tTx("failedToRejectSuggestion"),
        variant: "destructive",
      });
    } finally {
      setProcessingSuggestionId(null);
    }
  }

  function handleStartEditingDate(transaction: Transaction) {
    if (!checkWriteAccess()) {
      return;
    }
    // Cancel any ongoing description editing
    if (editingDescriptionId) {
      handleCancelEditingDescription();
    }
    const dateStr = formatDateInput(transaction.date);
    setEditingDateId(transaction.id);
    setEditingDateValue(dateStr);
  }

  function handleStartEditingDescription(transaction: Transaction) {
    if (!checkWriteAccess()) {
      return;
    }
    // Cancel any ongoing date editing
    if (editingDateId) {
      handleCancelEditingDate();
    }
    setEditingDescriptionId(transaction.id);
    setEditingDescriptionValue(transaction.description || "");
  }

  function handleCancelEditingDate() {
    setEditingDateId(null);
    setEditingDateValue("");
  }

  function handleCancelEditingDescription() {
    setEditingDescriptionId(null);
    setEditingDescriptionValue("");
  }

  async function handleSaveDate(transactionId: string) {
    if (!editingDateValue) {
      handleCancelEditingDate();
      return;
    }

    const transaction = transactions.find(tx => tx.id === transactionId);
    if (!transaction) return;

    // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
    const newDate = parseDateInput(editingDateValue);
    if (isNaN(newDate.getTime())) {
      toast({
        title: tTx("invalidDate"),
        description: tTx("invalidDateDescription"),
        variant: "destructive",
      });
      return;
    }

    setUpdatingTransactionId(transactionId);

    // Convert Date to YYYY-MM-DD string format (same as form does)
    // This ensures we send date-only strings to the backend, avoiding timezone issues
    const dateString = formatDateInput(newDate);

    // Optimistic update
    setTransactions(prev => prev.map(tx => 
      tx.id === transactionId 
        ? { ...tx, date: newDate.toISOString() }
        : tx
    ));

    try {
      const response = await fetch(apiUrl(`/api/v2/transactions/${transactionId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: dateString }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tTx("failedToUpdateDate"));
      }

      toast({
        title: tTx("dateUpdated"),
        description: tTx("dateUpdatedDescription"),
        variant: "success",
      });

      setEditingDateId(null);
      setEditingDateValue("");
      
      // No need to reload - optimistic update already handled it
      // Only refresh router to update dashboard
      router.refresh();
    } catch (error) {
      console.error("Error updating date:", error);
      
      // Revert optimistic update
      if (transaction) {
        setTransactions(prev => prev.map(tx => 
          tx.id === transactionId ? transaction : tx
        ));
      }

      toast({
        title: tToasts("error"),
        description: error instanceof Error ? error.message : tTx("failedToUpdateDate"),
        variant: "destructive",
      });
    } finally {
      setUpdatingTransactionId(null);
    }
  }

  async function handleSaveDescription(transactionId: string) {
    const transaction = transactions.find(tx => tx.id === transactionId);
    if (!transaction) return;

    setUpdatingTransactionId(transactionId);

    // Optimistic update
    setTransactions(prev => prev.map(tx => 
      tx.id === transactionId 
        ? { ...tx, description: editingDescriptionValue }
        : tx
    ));

    try {
      const response = await fetch(apiUrl(`/api/v2/transactions/${transactionId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: editingDescriptionValue || null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tTx("failedToUpdateDescription"));
      }

      toast({
        title: tTx("descriptionUpdated"),
        description: tTx("descriptionUpdatedDescription"),
        variant: "success",
      });

      setEditingDescriptionId(null);
      setEditingDescriptionValue("");
      
      // No need to reload - optimistic update already handled it
      // Only refresh router to update dashboard
      router.refresh();
    } catch (error) {
      console.error("Error updating description:", error);
      
      // Revert optimistic update
      if (transaction) {
        setTransactions(prev => prev.map(tx => 
          tx.id === transactionId ? transaction : tx
        ));
      }

      toast({
        title: tToasts("error"),
        description: error instanceof Error ? error.message : tTx("failedToUpdateDescription"),
        variant: "destructive",
      });
    } finally {
      setUpdatingTransactionId(null);
    }
  }


  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateRange !== "all-dates" || customDateRange) count++;
    if (filters.accountId !== "all") count++;
    if (filters.type !== "all") count++;
    if (filters.search) count++;
    if (filters.categoryId !== "all") count++;
    if (filters.recurring !== "all") count++;
    return count;
  }, [dateRange, customDateRange, filters]);

  // Default to "expense" if type is "all" (for display purposes)
  const activeTab = filters.type === "all" ? "expense" : filters.type;
  
  return (
    <SimpleTabs 
      value={activeTab} 
      onValueChange={(value) => setFilters({ ...filters, type: value })}
      className="w-full"
    >
      <PageHeader title={t("items.transactions")} />

      <ImportStatusBanner />

      {/* Fixed Tabs - Desktop only */}
      <FixedTabsWrapper>
        <SimpleTabsList>
          <SimpleTabsTrigger value="expense">{tTx("expense")}</SimpleTabsTrigger>
          <SimpleTabsTrigger value="income">{tTx("income")}</SimpleTabsTrigger>
          <SimpleTabsTrigger value="transfer">{tTx("transfer")}</SimpleTabsTrigger>
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
              {tTx("expense")}
            </SimpleTabsTrigger>
            <SimpleTabsTrigger value="income" className="flex-shrink-0 whitespace-nowrap">
              {tTx("income")}
            </SimpleTabsTrigger>
            <SimpleTabsTrigger value="transfer" className="flex-shrink-0 whitespace-nowrap">
              {tTx("transfer")}
            </SimpleTabsTrigger>
          </SimpleTabsList>
        </div>
      </div>

      <div className="w-full p-4 lg:p-8">
        {/* Search + Action Buttons - same row */}
        <div className="flex items-center gap-2 justify-between mb-6 flex-wrap">
          <div className="relative flex-1 min-w-0 max-w-[220px] sm:max-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={tTx("searchPlaceholder")}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="h-9 pl-9 pr-9 text-sm"
            />
            {filters.search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setFilters({ ...filters, search: "" })}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                aria-label={tTx("clearSearch")}
              >
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {searchLoading && !filters.search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
          {selectedTransactionIds.size > 0 && (
            <>
              <Select
                onValueChange={(value) => {
                  if (value && ["expense", "income", "transfer"].includes(value)) {
                    handleBulkUpdateType(value as "expense" | "income" | "transfer");
                  }
                }}
                disabled={updatingTypes || updatingCategories}
              >
                <SelectTrigger className="h-9 w-auto min-w-[140px] text-xs">
                  <SelectValue placeholder={updatingTypes ? tTx("updating") : tTx("changeType", { count: selectedTransactionIds.size })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">{tTx("expense")}</SelectItem>
                  <SelectItem value="income">{tTx("income")}</SelectItem>
                  <SelectItem value="transfer">{tTx("transfer")}</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="medium"
                    disabled={updatingTypes || updatingCategories}
                    className="h-9 w-auto min-w-[160px] text-xs"
                  >
                    {updatingCategories ? tTx("updating") : tTx("setCategory", { count: selectedTransactionIds.size })}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-[400px] overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() => handleBulkUpdateCategory(null)}
                    className="text-xs"
                  >
                    {tTx("clearCategory")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.map((category) => {
                    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
                    
                    // If category has subcategories, show submenu
                    if (hasSubcategories && category.subcategories) {
                      return (
                        <DropdownMenuSub key={category.id}>
                          <DropdownMenuSubTrigger className="text-xs">
                            {category.name}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={() => handleBulkUpdateCategory(category.id, null)}
                              className="text-xs"
                            >
                              {tTx("noSubcategory")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {category.subcategories.map((subcategory) => (
                              <DropdownMenuItem
                                key={subcategory.id}
                                onClick={() => handleBulkUpdateCategory(category.id, subcategory.id)}
                                className="text-xs"
                              >
                                {subcategory.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      );
                    }
                    
                    // If no subcategories, check if we need to load them
                    return (
                      <CategoryMenuItem
                        key={category.id}
                        category={category}
                        onSelect={(categoryId, subcategoryId) => {
                          handleBulkUpdateCategory(categoryId, subcategoryId);
                        }}
                        loadSubcategories={loadSubcategoriesForBulk}
                        noSubcategoryLabel={tTx("noSubcategory")}
                        loadingLabel={tCommon("loading")}
                      />
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="destructive"
                size="medium"
                onClick={handleDeleteMultiple}
                disabled={deletingMultiple || updatingTypes || updatingCategories}
                className="text-xs md:text-sm"
              >
                {deletingMultiple ? (
                  <>
                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 md:mr-2 animate-spin" />
                    <span className="hidden md:inline">{tTx("deleting")}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                    <span className="hidden md:inline">{tTx("delete")} ({selectedTransactionIds.size})</span>
                    <span className="md:hidden">{tTx("delete")} {selectedTransactionIds.size}</span>
                  </>
                )}
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="medium" 
                className="text-xs md:text-sm"
              >
                <Download className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">{tTx("manualData")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{tTx("manualData")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Check if user has access to CSV import
                  const hasAccess = limits.hasCsvImport === true || String(limits.hasCsvImport) === "true";
                  if (!hasAccess) {
                    setShowImportUpgradeModal(true);
                    return;
                  }
                  setIsImportOpen(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                {tTx("importCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExport}
                disabled={transactions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {tTx("exportCsv")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline"
            size="medium"
            onClick={() => setIsFiltersModalOpen(true)} 
            className="text-xs md:text-sm"
          >
            <Filter className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
            <span className="hidden md:inline">{tTx("filters")}</span>
            {(filters.accountId !== "all" || filters.search || filters.recurring !== "all" || dateRange !== "all-dates" || customDateRange || filters.categoryId !== "all") && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                {tTx("active")}
              </Badge>
            )}
          </Button>
          {canWrite && (
            <Button 
              size="medium" 
              onClick={() => {
                if (!checkWriteAccess()) {
                  return;
                }
                setSelectedTransaction(null);
                setIsFormOpen(true);
              }} 
              className="hidden lg:inline-flex text-xs md:text-sm"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">{tTx("addTransaction")}</span>
            </Button>
          )}
          </div>
        </div>

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
                <span>{tTx("refreshing")}</span>
              </div>
            ) : pullDistance >= 60 ? (
              <div className="text-sm text-muted-foreground">{tTx("releaseToRefresh")}</div>
            ) : (
              <div className="text-sm text-muted-foreground">{tTx("pullToRefresh")}</div>
                    )}
                  </div>
        )}
        
        {loading && !searchLoading && currentPage === 1 && !isRefreshing ? (
          <div className="text-center py-8 text-muted-foreground">
            {tTx("loadingTransactions")}
          </div>
        ) : mobileTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {tTx("noTransactionsFound")}
          </div>
        ) : (
          <>
            {mobileTransactions.map((tx) => {
            return (
              <TransactionsMobileCard
                key={tx.id}
                transaction={tx}
                isSelected={selectedTransactionIds.has(tx.id)}
                onSelect={(checked) => handleSelectTransaction(tx.id, checked)}
                onEdit={() => setTransactionSummaryModal(tx)}
                onDelete={() => handleDelete(tx.id)}
                deleting={deletingId === tx.id}
                onCategoryClick={() => {
                  setTransactionForCategory(tx);
                  setSelectedCategoryId(tx.categoryId || null);
                  setSelectedSubcategoryId(tx.subcategoryId || null);
                  setIsCategoryModalOpen(true);
                }}
                onApplySuggestion={tx.suggestedCategoryId ? () => handleApplySuggestion(tx.id) : undefined}
                onRejectSuggestion={tx.suggestedCategoryId ? () => handleRejectSuggestion(tx.id) : undefined}
                processingSuggestion={processingSuggestionId === tx.id}
              />
            );
            })}
            {/* Load More button for mobile (show only when 11+ items) */}
            {isMobile && totalTransactions >= 11 && currentPage < totalPages && (
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
                      {tCommon("loading")}
                    </>
                  ) : (
                    tTx("loadMore")
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        </div>

        {/* Desktop/Tablet Table View */}
        <div className="hidden lg:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  ref={selectAllCheckboxRef}
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead className="text-xs md:text-sm">{tTx("tableDate")}</TableHead>
              <TableHead className="text-xs md:text-sm">{tTx("tableType")}</TableHead>
              <TableHead className="text-xs md:text-sm hidden md:table-cell">{tTx("tableAccount")}</TableHead>
              <TableHead className="text-xs md:text-sm hidden sm:table-cell">{tTx("tableCategory")}</TableHead>
              <TableHead className="text-xs md:text-sm hidden lg:table-cell">{tTx("tableDescription")}</TableHead>
              <TableHead className="text-right text-xs md:text-sm">{tTx("tableAmount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !searchLoading ? (
              <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {tTx("loadingTransactions")}
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {tTx("noTransactionsFound")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((tx) => {
                const isPending = false;
                const authorizedDate = null;
                const currencyCode = null;
                
                return (
              <TableRow
                key={tx.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setTransactionSummaryModal(tx)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedTransactionIds.has(tx.id)}
                    onCheckedChange={(checked) => handleSelectTransaction(tx.id, checked as boolean)}
                    className="h-4 w-4"
                  />
                </TableCell>
                <TableCell className="font-medium text-xs md:text-sm whitespace-nowrap">
                  {editingDateId === tx.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        ref={(el) => {
                          if (el) {
                            dateInputRefs.current.set(tx.id, el);
                          } else {
                            dateInputRefs.current.delete(tx.id);
                          }
                        }}
                        type="date"
                        value={editingDateValue}
                        onChange={(e) => setEditingDateValue(e.target.value)}
                        onBlur={() => {
                          if (editingDateId === tx.id) {
                            handleSaveDate(tx.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveDate(tx.id);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancelEditingDate();
                          }
                        }}
                        className="h-7 text-xs"
                        disabled={updatingTransactionId === tx.id}
                      />
                      {updatingTransactionId === tx.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  ) : (
                    <div 
                      className="flex flex-col gap-0.5 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartEditingDate(tx);
                      }}
                      title={tTx("clickToEditDate")}
                    >
                      <span>{formatTransactionDate(tx.date)}</span>
                      {authorizedDate && (
                        <span className="text-[10px] text-muted-foreground">
                          {tTx("authDateLabel")}: {formatShortDate(authorizedDate)}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className={`rounded-lg px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs ${
                      tx.type === "income" ? "bg-sentiment-positive/10 text-sentiment-positive" :
                      tx.type === "expense" ? "bg-sentiment-negative/10 text-sentiment-negative" :
                      tx.type === "transfer" ? "bg-white dark:bg-card border border-border text-muted-foreground" :
                      "bg-interactive-primary/10 text-interactive-primary"
                    }`}>
                      {tTx(tx.type as "expense" | "income" | "transfer")}
                    </span>
                    {tx.isRecurring && (
                      <span title={tTx("recurringTransaction")}>
                        <Repeat className="h-3 w-3 text-muted-foreground" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs md:text-sm hidden md:table-cell">
                  {tx.type === "transfer" && tx.transferToId && tx.account?.name && tx.toAccount?.name
                    ? `${tx.account.name} → ${tx.toAccount.name}`
                    : tx.account?.name}
                </TableCell>
                <TableCell 
                  className="text-xs md:text-sm hidden sm:table-cell"
                >
                  {tx.category?.name ? (
                    <span 
                      className="text-blue-600 dark:text-blue-400 underline decoration-dashed underline-offset-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransactionForCategory(tx);
                        setSelectedCategoryId(tx.categoryId || null);
                        setSelectedSubcategoryId(tx.subcategoryId || null);
                        setIsCategoryModalOpen(true);
                      }}
                    >
                      {tx.category.name}
                      {tx.subcategory && ` / ${tx.subcategory.name}`}
                    </span>
                  ) : tx.suggestedCategoryId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground italic">
                        {tx.suggestedCategory?.name || tTx("suggestedCategory")}
                        {tx.suggestedSubcategory && ` / ${tx.suggestedSubcategory.name}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-[8px] bg-white border border-border text-sentiment-negative hover:text-sentiment-negative hover:bg-sentiment-negative/10 dark:bg-white dark:hover:bg-sentiment-negative/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectSuggestion(tx.id);
                          }}
                          disabled={processingSuggestionId === tx.id}
                          title={tTx("rejectSuggestion")}
                        >
                          {processingSuggestionId === tx.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-[8px] bg-white border border-border text-sentiment-positive hover:text-sentiment-positive hover:bg-sentiment-positive/10 dark:bg-white dark:hover:bg-sentiment-positive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplySuggestion(tx.id);
                          }}
                          disabled={processingSuggestionId === tx.id}
                          title={tTx("applySuggestion")}
                        >
                          {processingSuggestionId === tx.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      size="medium"
                      className="text-blue-600 dark:text-blue-400 underline decoration-dashed underline-offset-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransactionForCategory(tx);
                        setSelectedCategoryId(tx.categoryId || null);
                        setSelectedSubcategoryId(tx.subcategoryId || null);
                        setIsCategoryModalOpen(true);
                      }}
                    >
                      {tTx("addCategory")}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-xs md:text-sm hidden lg:table-cell max-w-[150px]">
                  {editingDescriptionId === tx.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        ref={(el) => {
                          if (el) {
                            descriptionInputRefs.current.set(tx.id, el);
                          } else {
                            descriptionInputRefs.current.delete(tx.id);
                          }
                        }}
                        type="text"
                        value={editingDescriptionValue}
                        onChange={(e) => setEditingDescriptionValue(e.target.value)}
                        onBlur={() => {
                          if (editingDescriptionId === tx.id) {
                            handleSaveDescription(tx.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveDescription(tx.id);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancelEditingDescription();
                          }
                        }}
                        className="h-7 text-xs"
                        disabled={updatingTransactionId === tx.id}
                      />
                      {updatingTransactionId === tx.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  ) : (
                    <span 
                      className="truncate block cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartEditingDescription(tx);
                      }}
                      title={tTx("clickToEditDescription")}
                    >
                      {tx.type === "transfer" && tx.transferToId && tx.account?.name && tx.toAccount?.name
                        ? formatTransferLabel(tx.account.name, tx.toAccount.name)
                        : (tx.description || "-")}
                    </span>
                  )}
                </TableCell>
                <TableCell className={`text-right font-medium text-xs md:text-sm ${
                  tx.type === "income" ? "text-sentiment-positive" :
                  tx.type === "expense" ? "text-red-600 dark:text-red-400" :
                  tx.type === "transfer" ? "text-foreground" : ""
                }`}>
                  <div className="flex flex-col items-end gap-0.5">
                    <span>{tx.type === "expense" ? "-" : ""}{formatMoney(tx.amount)}</span>
                    {currencyCode && currencyCode !== "USD" && (
                      <span className="text-[10px] text-muted-foreground">
                        {currencyCode}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination Controls - Desktop only (show only when 11+ items) */}
        {totalTransactions >= 11 && (
          <div className="hidden lg:flex flex-col sm:flex-row items-center justify-between gap-4 px-2 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tTx("itemsPerPage")}</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
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
              {tTx("showingXToYOfZ", { start: startIndex + 1, end: Math.min(endIndex, totalTransactions), total: totalTransactions })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="medium"
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                setCurrentPage(newPage);
                // OPTIMIZED: Clear accumulated transactions on desktop when navigating pages
                if (!isMobile && newPage !== currentPage) {
                  setAllTransactions([]);
                }
              }}
              disabled={currentPage === 1 || loading}
              className="h-9"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">{tTx("previous")}</span>
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
                    onClick={() => {
                      setCurrentPage(pageNum);
                      // OPTIMIZED: Clear accumulated transactions on desktop when navigating pages
                      if (!isMobile && pageNum !== currentPage) {
                        setAllTransactions([]);
                      }
                    }}
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
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1);
                setCurrentPage(newPage);
                // OPTIMIZED: Clear accumulated transactions on desktop when navigating pages
                if (!isMobile && newPage !== currentPage) {
                  setAllTransactions([]);
                }
              }}
              disabled={currentPage === totalPages || loading}
              className="h-9"
            >
              <span className="hidden sm:inline mr-1">{tTx("next")}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        )}
      </div>


      {/* Transaction summary drawer: click row → summary with Edit / Delete */}
      <Sheet open={!!transactionSummaryModal} onOpenChange={(open) => !open && setTransactionSummaryModal(null)}>
        <SheetContent
          side="right"
          className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l"
        >
          <SheetHeader className="p-6 pb-4 border-b shrink-0">
            <SheetTitle className="text-xl">{tTx("transactionSummaryTitle")}</SheetTitle>
          </SheetHeader>
          {transactionSummaryModal && (
            <>
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">{tTx("summaryDate")}</span>
                      <span>{formatTransactionDate(transactionSummaryModal.date)}</span>
                      <span className="text-muted-foreground">{tTx("summaryType")}</span>
                      <span className="capitalize">{tTx(transactionSummaryModal.type as "expense" | "income" | "transfer")}</span>
                      <span className="text-muted-foreground">{tTx("summaryAccount")}</span>
                      <span>
                        {transactionSummaryModal.type === "transfer" && transactionSummaryModal.transferToId && transactionSummaryModal.account?.name && transactionSummaryModal.toAccount?.name
                          ? formatTransferLabel(transactionSummaryModal.account.name, transactionSummaryModal.toAccount.name)
                          : (transactionSummaryModal.account?.name ?? "—")}
                      </span>
                      <span className="text-muted-foreground">{tTx("summaryCategory")}</span>
                      <span>
                        {transactionSummaryModal.category?.name
                          ? [transactionSummaryModal.category.name, transactionSummaryModal.subcategory?.name].filter(Boolean).join(" / ")
                          : "—"}
                      </span>
                      <span className="text-muted-foreground">{tTx("summaryDescription")}</span>
                      <span className="break-words">
                        {transactionSummaryModal.type === "transfer" && transactionSummaryModal.transferToId ? "—" : (transactionSummaryModal.description || "—")}
                      </span>
                      <span className="text-muted-foreground">{tTx("summaryAmount")}</span>
                      <span className={`font-medium ${transactionSummaryModal.type === "income" ? "text-sentiment-positive" : transactionSummaryModal.type === "expense" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                        {transactionSummaryModal.type === "expense" ? "-" : ""}{formatMoney(transactionSummaryModal.amount)}
                      </span>
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-4 border-t flex flex-wrap justify-end gap-2 shrink-0 bg-background">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!checkWriteAccess()) return;
                      setSelectedTransaction(transactionSummaryModal);
                      setTransactionSummaryModal(null);
                      setIsFormOpen(true);
                    }}
                    disabled={!canWrite}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {tCommon("edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const id = transactionSummaryModal.id;
                      setTransactionSummaryModal(null);
                      handleDelete(id);
                    }}
                    disabled={deletingId === transactionSummaryModal.id}
                    className="gap-2"
                  >
                    {deletingId === transactionSummaryModal.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {tCommon("delete")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* CSV Import Upgrade drawer */}
      <Sheet open={showImportUpgradeModal} onOpenChange={setShowImportUpgradeModal}>
        <SheetContent
          side="right"
          className="sm:max-w-2xl w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l"
        >
          <SheetHeader className="p-6 pb-4 border-b shrink-0">
            <SheetTitle className="text-xl">{tTx("upgradeToCsvImport")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6">
                <BlockedFeature feature="hasCsvImport" featureName={tTx("csvImportFeatureName")} />
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <TransactionForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            // Clear selected transaction when form closes
            setSelectedTransaction(null);
          }
        }}
        transaction={selectedTransaction}
        onSuccess={async () => {
          // Close form and clear selection first
          setSelectedTransaction(null);
          
          // CRITICAL: Wait to ensure server cache invalidation has fully propagated
          // unstable_cache can take time to invalidate even after revalidateTag is called
          // Increased delay to ensure cache is properly invalidated before reloading
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Refresh router to update dashboard immediately
          // This ensures the dashboard shows the new transaction without waiting for realtime subscription
          router.refresh();
          
          // Reset to first page for fresh reload
          // Don't clear transactions yet - let loadTransactions replace them with fresh data
          setCurrentPage(1);
          
          // Reload transactions with force refresh AFTER router refresh
          // This ensures we get fresh data after cache invalidation
          // forceRefresh=true bypasses unstable_cache by using search parameter trick
          // Additional delay to ensure router.refresh has processed and cache is cleared
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadTransactions(true);
          
          // Clear accumulated transactions after successful reload
          // loadTransactions will set allTransactions correctly when currentPage === 1
        }}
      />

      <CsvImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={loadTransactions}
        accounts={accounts}
        categories={categories}
      />

      {/* Filters Drawer */}
      <Sheet open={isFiltersModalOpen} onOpenChange={setIsFiltersModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col gap-0 overflow-hidden bg-background border-l">
          <SheetHeader className="px-6 pt-6 pb-4 flex-shrink-0 text-left border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl font-semibold">{tTx("filters")}</SheetTitle>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-2 text-xs font-medium">
                      {activeFiltersCount} {tTx("active")}
                    </Badge>
                  )}
                </div>
                <SheetDescription className="mt-1.5 text-sm text-muted-foreground">
                  {tTx("filtersDescription")}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-6 py-4">
            {/* Date Range */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">{tTx("dateRangeLabel")}</label>
              </div>
              <DateRangePicker
                value={dateRange}
                dateRange={customDateRange}
                onValueChange={handleDateRangeChange}
              />
            </div>

            {/* Account */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">{tTx("accountLabel")}</label>
              </div>
              <Select
                value={filters.accountId}
                onValueChange={(value) => setFilters({ ...filters, accountId: value })}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder={tTx("selectAccount")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tTx("allAccounts")}</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">{tTx("typeLabel")}</label>
              </div>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder={tTx("selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tTx("allTypes")}</SelectItem>
                  <SelectItem value="expense">{tTx("expense")}</SelectItem>
                  <SelectItem value="income">{tTx("income")}</SelectItem>
                  <SelectItem value="transfer">{tTx("transfer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">{tTx("categoryLabel")}</label>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={filters.categoryId === "all" ? "default" : "outline"}
                    onClick={() => setFilters({ ...filters, categoryId: "all" })}
                    className="rounded-full h-9 px-4 text-xs font-medium transition-all hover:scale-105"
                    size="medium"
                  >
                    {tTx("all")}
                  </Button>
                  {categories
                    .filter((category) => activeCategoryIds.has(category.id))
                    .map((category) => (
                      <Button
                        key={category.id}
                        type="button"
                        variant={filters.categoryId === category.id ? "default" : "outline"}
                        onClick={() => setFilters({ ...filters, categoryId: category.id })}
                        className="rounded-full h-9 px-4 text-xs font-medium transition-all hover:scale-105"
                        size="medium"
                      >
                        {category.name}
                        {filters.categoryId === category.id && (
                          <Check className="h-3 w-3 ml-1.5" />
                        )}
                      </Button>
                    ))}
                </div>
                <Select
                  value={selectValue}
                  onValueChange={(value) => {
                    if (value) {
                      if (activeCategoryIds.has(value)) {
                        removeCategoryFromFilters(value);
                      } else {
                        addCategoryToFilters(value);
                      }
                      setSelectValue(""); // Reset after adding/removing
                    }
                  }}
                >
                  <SelectTrigger className="h-10 w-full border-dashed hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={tTx("addCategoryToFilter")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => {
                      const isActive = activeCategoryIds.has(category.id);
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2 w-full">
                            <span className="flex-1">{category.name}</span>
                            {isActive && (
                              <Check className="h-4 w-4 --sentiment-positive" />
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>
          </ScrollArea>

          <div className="px-6 pb-6 pt-4 border-t flex-shrink-0 bg-background flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDateRange("all-dates");
                setCustomDateRange(undefined);
                setFilters({
                  startDate: "",
                  endDate: "",
                  accountId: "all",
                  categoryId: "all",
                  type: "all",
                  search: "",
                  recurring: "all",
                });
                setActiveCategoryIds(new Set());
              }}
              className="flex-1 h-10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {tTx("clearAll")}
            </Button>
            <Button 
              onClick={() => setIsFiltersModalOpen(false)} 
              className="flex-1 h-10"
            >
              {tTx("applyFilters")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Category Selection Modal */}
      <CategorySelectionDialog
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        transaction={transactionForCategory}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onCategorySelect={(categoryId, subcategoryId) => {
          setSelectedCategoryId(categoryId);
          setSelectedSubcategoryId(subcategoryId);
        }}
        onClear={() => {
          setSelectedCategoryId(null);
          setSelectedSubcategoryId(null);
          setClearCategoryTrigger(prev => prev + 1);
        }}
        onSave={() => {
          handleCategoryUpdate(selectedCategoryId, selectedSubcategoryId);
        }}
        saving={categorySaveLoading}
        clearTrigger={clearCategoryTrigger}
      />
      {canWrite && (
        <MobileAddBar>
          <Button
            size="mobileAdd"
            onClick={() => {
              if (!checkWriteAccess()) return;
              setSelectedTransaction(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {tTx("addTransaction")}
          </Button>
        </MobileAddBar>
      )}
      {DeleteConfirmDialog}
      {DeleteMultipleConfirmDialog}


    </SimpleTabs>
  );
}

