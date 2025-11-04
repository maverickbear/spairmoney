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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/common/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { investmentTransactionSchema } from "@/lib/validations/investment";
import { formatMoney } from "@/components/common/money";
import { Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

type InvestmentTransactionFormData = {
  date: Date;
  accountId: string;
  securityId?: string;
  type: "buy" | "sell" | "dividend" | "interest" | "transfer_in" | "transfer_out";
  quantity?: number;
  price?: number;
  fees: number;
  notes?: string;
};

interface Transaction {
  id: string;
  date: string;
  accountId: string;
  account: { id: string; name: string };
  securityId: string | null;
  security: { id: string; symbol: string; name: string } | null;
  type: string;
  quantity: number | null;
  price: number | null;
  fees: number;
  notes: string | null;
}

interface Account {
  id: string;
  name: string;
}

interface Security {
  id: string;
  symbol: string;
  name: string;
}

export default function InvestmentTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [securities, setSecurities] = useState<Security[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<InvestmentTransactionFormData>({
    resolver: zodResolver(investmentTransactionSchema),
    defaultValues: {
      date: new Date(),
      type: "buy",
      fees: 0,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [txRes, accountsRes, securitiesRes] = await Promise.all([
        fetch("/api/investments/transactions"),
        fetch("/api/investments/accounts"),
        fetch("/api/investments/securities"),
      ]);

      if (!accountsRes.ok) {
        console.error("Error fetching accounts:", accountsRes.status, await accountsRes.text());
      }

      const [txData, accountsData, securitiesData] = await Promise.all([
        txRes.json(),
        accountsRes.json(),
        securitiesRes.json(),
      ]);

      console.log("Accounts loaded:", accountsData);
      console.log("Securities loaded:", securitiesData);

      setTransactions(txData);
      setAccounts(accountsData || []);
      setSecurities(securitiesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: InvestmentTransactionFormData) {
    try {
      // Convert "none" to undefined for securityId
      const submitData = {
        ...data,
        securityId: data.securityId === "none" ? undefined : data.securityId,
      };

      const url = editingTransaction
        ? `/api/investments/transactions/${editingTransaction.id}`
        : "/api/investments/transactions";
      const method = editingTransaction ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error("Failed to save transaction");
      }

      await loadData();
      setOpen(false);
      setEditingTransaction(null);
      form.reset();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const response = await fetch(`/api/investments/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      await loadData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction");
    }
  }

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    form.reset({
      date: new Date(transaction.date),
      accountId: transaction.accountId,
      securityId: transaction.securityId ? transaction.securityId : undefined,
      type: transaction.type as "buy" | "sell" | "dividend" | "interest" | "transfer_in" | "transfer_out",
      quantity: transaction.quantity !== null ? transaction.quantity : undefined,
      price: transaction.price !== null ? transaction.price : undefined,
      fees: transaction.fees ?? 0,
      notes: transaction.notes ? transaction.notes : undefined,
    });
    setOpen(true);
  }

  const transactionType = form.watch("type");
  const needsQuantityPrice = ["buy", "sell"].includes(transactionType);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Investment Transactions</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your investment transactions</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs md:text-sm">Date</TableHead>
              <TableHead className="text-xs md:text-sm hidden md:table-cell">Account</TableHead>
              <TableHead className="text-xs md:text-sm">Security</TableHead>
              <TableHead className="text-xs md:text-sm">Type</TableHead>
              <TableHead className="text-right text-xs md:text-sm hidden sm:table-cell">Quantity</TableHead>
              <TableHead className="text-right text-xs md:text-sm hidden lg:table-cell">Price</TableHead>
              <TableHead className="text-right text-xs md:text-sm hidden lg:table-cell">Fees</TableHead>
              <TableHead className="text-right text-xs md:text-sm">Total</TableHead>
              <TableHead className="text-xs md:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-xs md:text-sm whitespace-nowrap">{format(new Date(tx.date), "MMM dd, yyyy")}</TableCell>
                <TableCell className="text-xs md:text-sm hidden md:table-cell">{tx.account.name}</TableCell>
                <TableCell className="text-xs md:text-sm">{tx.security?.symbol || "-"}</TableCell>
                <TableCell className="capitalize text-xs md:text-sm">{tx.type}</TableCell>
                <TableCell className="text-right text-xs md:text-sm hidden sm:table-cell">
                  {tx.quantity ? tx.quantity.toFixed(4) : "-"}
                </TableCell>
                <TableCell className="text-right text-xs md:text-sm hidden lg:table-cell">
                  {tx.price ? formatMoney(tx.price) : "-"}
                </TableCell>
                <TableCell className="text-right text-xs md:text-sm hidden lg:table-cell">{formatMoney(tx.fees || 0)}</TableCell>
                <TableCell className="text-right font-medium text-xs md:text-sm">
                  {tx.quantity && tx.price
                    ? formatMoney(tx.quantity * tx.price + (tx.fees || 0))
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1 md:space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-10 md:w-10"
                      onClick={() => handleEdit(tx)}
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
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {editingTransaction
                ? "Update the investment transaction details"
                : "Add a new investment transaction"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Input
                  type="date"
                  {...form.register("date", {
                    valueAsDate: true,
                  })}
                  value={
                    (() => {
                      const dateValue = form.watch("date");
                      if (!dateValue) return "";
                      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
                      if (isNaN(date.getTime())) return "";
                      return format(date, "yyyy-MM-dd");
                    })()
                  }
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      form.setValue("date", newDate);
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Account</label>
                <Select
                  value={form.watch("accountId") || ""}
                  onValueChange={(value) => form.setValue("accountId", value)}
                  disabled={accounts.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={accounts.length === 0 ? "No accounts available" : "Select account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No investment accounts available. Please create one first.
                      </div>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {accounts.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You need to create an investment account first. Check the Investments page.
                  </p>
                )}
                {form.formState.errors.accountId && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.accountId.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value: string) => form.setValue("type", value as "buy" | "sell" | "dividend" | "interest" | "transfer_in" | "transfer_out")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="dividend">Dividend</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                    <SelectItem value="transfer_in">Transfer In</SelectItem>
                    <SelectItem value="transfer_out">Transfer Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {transactionType !== "dividend" && transactionType !== "interest" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Security</label>
                  <Select
                    value={form.watch("securityId") || "none"}
                    onValueChange={(value) =>
                      form.setValue("securityId", value === "none" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select security" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {securities.map((security) => (
                        <SelectItem key={security.id} value={security.id}>
                          {security.symbol} - {security.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {needsQuantityPrice && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantity</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.0000"
                      {...form.register("quantity", { 
                        valueAsNumber: true,
                        setValueAs: (value) => {
                          if (value === "" || value === null || value === undefined) return 0;
                          const num = parseFloat(value);
                          return isNaN(num) ? 0 : num;
                        }
                      })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price</label>
                    <MoneyInput
                      {...form.register("price", { valueAsNumber: true })}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Fees</label>
                <MoneyInput
                  {...form.register("fees", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Input {...form.register("notes")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

