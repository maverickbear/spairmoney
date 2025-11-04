"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionForm } from "@/components/forms/transaction-form";
import { CsvImportDialog } from "@/components/forms/csv-import-dialog";
import { formatMoney } from "@/components/common/money";
import { Plus, Download, Upload, Search, Trash2, Edit, Repeat, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { getAccounts } from "@/lib/api/accounts";
import { getAllCategories } from "@/lib/api/categories";
import { exportTransactionsToCSV, downloadCSV } from "@/lib/csv/export";

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  accountId: string;
  categoryId?: string;
  subcategoryId?: string;
  description?: string;
  tags?: string;
  transferToId?: string;
  recurring?: boolean;
  account?: { id: string; name: string };
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  macroId: string;
  subcategories?: Array<{ id: string; name: string }>;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState("this-month");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    accountId: "all",
    categoryId: "all",
    type: "all",
    search: "",
    recurring: "all",
  });
  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<string>>(new Set());
  const [selectValue, setSelectValue] = useState<string>("");

  useEffect(() => {
    loadData();
    // Set default date range (this month)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFilters(prev => ({
      ...prev,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
    }));
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  function getDateRangeDates(range: string): { startDate: string; endDate: string } {
    const today = new Date();
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    let startDate: Date;
    let endDate: Date;

    switch (range) {
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
      case "last-month":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "this-month":
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

  function handleDateRangeChange(range: string) {
    setDateRange(range);
    const dates = getDateRangeDates(range);
    setFilters(prev => ({
      ...prev,
      startDate: dates.startDate,
      endDate: dates.endDate,
    }));
  }

  async function loadData() {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/categories/all").then((r) => r.json()),
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
      setActiveCategoryIds(new Set(defaultCategories));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function loadTransactions() {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.accountId && filters.accountId !== "all") params.append("accountId", filters.accountId);
      if (filters.categoryId && filters.categoryId !== "all") params.append("categoryId", filters.categoryId);
      if (filters.type && filters.type !== "all") params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);
      if (filters.recurring && filters.recurring !== "all") params.append("recurring", filters.recurring);

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }

  function handleExport() {
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

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your income and expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="text-xs md:text-sm">
            <Upload className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="text-xs md:text-sm">
            <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button size="sm" onClick={() => {
            setSelectedTransaction(null);
            setIsFormOpen(true);
          }} className="text-xs md:text-sm">
            <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-2 md:gap-4 grid-cols-2 md:grid-cols-5">
        <Select
          value={dateRange}
          onValueChange={handleDateRangeChange}
        >
          <SelectTrigger className="text-xs md:text-sm">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="past-30-days">Past 30 days</SelectItem>
            <SelectItem value="past-15-days">Past 15 days</SelectItem>
            <SelectItem value="past-7-days">Past 7 days</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.accountId}
          onValueChange={(value) => setFilters({ ...filters, accountId: value })}
        >
          <SelectTrigger className="text-xs md:text-sm">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters({ ...filters, type: value })}
        >
          <SelectTrigger className="text-xs md:text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.recurring}
          onValueChange={(value) => setFilters({ ...filters, recurring: value })}
        >
          <SelectTrigger className="text-xs md:text-sm">
            <SelectValue placeholder="Recurring" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="true">Recurring</SelectItem>
            <SelectItem value="false">Non-Recurring</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="text-xs md:text-sm col-span-2 md:col-span-1"
        />
        <Button variant="outline" size="sm" onClick={() => {
          setDateRange("this-month");
          const dates = getDateRangeDates("this-month");
          setFilters({
            startDate: dates.startDate,
            endDate: dates.endDate,
            accountId: "all",
            categoryId: "all",
            type: "all",
            search: "",
            recurring: "all",
          });
        }} className="col-span-2 md:col-span-1 text-xs md:text-sm">
          Clear
        </Button>
      </div>

      {/* Category Pills Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs md:text-sm font-medium text-muted-foreground">Filter by category:</span>
        <Button
          variant={filters.categoryId === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ ...filters, categoryId: "all" })}
          className="rounded-full"
        >
          All
        </Button>
        {categories
          .filter((category) => activeCategoryIds.has(category.id))
          .map((category) => (
            <Button
              key={category.id}
              variant={filters.categoryId === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, categoryId: category.id })}
              className="rounded-full"
            >
              {category.name}
            </Button>
          ))}
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
          <SelectTrigger className="h-9 w-9 rounded-full border-dashed p-0 [&>svg:last-child]:hidden flex items-center justify-center">
            <Plus className="h-4 w-4" />
            <SelectValue className="hidden" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => {
              const isActive = activeCategoryIds.has(category.id);
              return (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1">{category.name}</span>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs md:text-sm">Date</TableHead>
              <TableHead className="text-xs md:text-sm">Type</TableHead>
              <TableHead className="text-xs md:text-sm hidden md:table-cell">Account</TableHead>
              <TableHead className="text-xs md:text-sm hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-xs md:text-sm hidden lg:table-cell">Description</TableHead>
              <TableHead className="text-right text-xs md:text-sm">Amount</TableHead>
              <TableHead className="text-xs md:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-xs md:text-sm whitespace-nowrap">{format(new Date(tx.date), "MMM dd, yyyy")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className={`rounded px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs ${
                      tx.type === "income" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      tx.type === "expense" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}>
                      {tx.type}
                    </span>
                    {tx.recurring && (
                      <Repeat className="h-3 w-3 text-muted-foreground" title="Recurring transaction" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs md:text-sm hidden md:table-cell">{tx.account?.name}</TableCell>
                <TableCell className="text-xs md:text-sm hidden sm:table-cell">
                  {tx.category?.name}
                  {tx.subcategory && ` / ${tx.subcategory.name}`}
                </TableCell>
                <TableCell className="text-xs md:text-sm hidden lg:table-cell max-w-[150px] truncate">{tx.description || "-"}</TableCell>
                <TableCell className={`text-right font-medium text-xs md:text-sm ${
                  tx.type === "income" ? "text-green-600" :
                  tx.type === "expense" ? "text-red-600" : ""
                }`}>
                  {tx.type === "expense" ? "-" : ""}{formatMoney(tx.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1 md:space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-10 md:w-10"
                      onClick={() => {
                        setSelectedTransaction(tx);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-10 md:w-10"
                      onClick={() => handleDelete(tx.id)}
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transaction={selectedTransaction}
        onSuccess={loadTransactions}
      />

      <CsvImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={loadTransactions}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}

