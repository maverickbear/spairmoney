"use client";

import { useState, useEffect } from "react";
import { Holding } from "@/lib/api/investments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/components/common/money";
import Link from "next/link";
import { TrendingUp, Wallet, PieChart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { investmentTransactionSchema, investmentAccountSchema } from "@/lib/validations/investment";
import type { InvestmentTransactionFormData, InvestmentAccountFormData } from "@/lib/validations/investment";
import { format } from "date-fns";

interface Account {
  id: string;
  name: string;
}

interface Security {
  id: string;
  symbol: string;
  name: string;
}

export default function InvestmentsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [securities, setSecurities] = useState<Security[]>([]);
  const [open, setOpen] = useState(false);
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<InvestmentTransactionFormData>({
    resolver: zodResolver(investmentTransactionSchema),
    defaultValues: {
      date: new Date(),
      type: "buy",
      fees: 0,
    },
  });

  const accountForm = useForm<InvestmentAccountFormData>({
    resolver: zodResolver(investmentAccountSchema),
    defaultValues: {
      name: "",
      type: "brokerage",
      accountId: null,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [holdingsRes, accountsRes, securitiesRes] = await Promise.all([
        fetch("/api/investments/holdings"),
        fetch("/api/investments/accounts"),
        fetch("/api/investments/securities"),
      ]);

      if (!accountsRes.ok) {
        console.error("Error fetching accounts:", accountsRes.status, await accountsRes.text());
      }

      const [holdingsData, accountsData, securitiesData] = await Promise.all([
        holdingsRes.json().catch(() => []),
        accountsRes.json().catch(() => []),
        securitiesRes.json().catch(() => []),
      ]);

      const portfolioValueData = Array.isArray(holdingsData)
        ? holdingsData.reduce((sum: number, holding: Holding) => sum + holding.marketValue, 0)
        : 0;

      console.log("Accounts loaded:", accountsData);
      console.log("Securities loaded:", securitiesData);

      setHoldings(holdingsData || []);
      setPortfolioValue(portfolioValueData);
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

      const response = await fetch("/api/investments/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save transaction");
      }

      await loadData();
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving transaction:", error);
      const message = error instanceof Error ? error.message : "Failed to save transaction";
      alert(message);
    }
  }

  async function handleCreateAccount(data: InvestmentAccountFormData) {
    try {
      const response = await fetch("/api/investments/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create account");
      }

      await loadData();
      setOpenAccountDialog(false);
      accountForm.reset();
    } catch (error) {
      console.error("Error creating investment account:", error);
      const message = error instanceof Error ? error.message : "Failed to create investment account";
      alert(message);
    }
  }

  const totalBookValue = holdings.reduce((sum, h) => sum + h.bookValue, 0);
  const totalUnrealizedPnL = holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const transactionType = form.watch("type");
  const needsQuantityPrice = ["buy", "sell"].includes(transactionType);

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Investments</h1>
          <p className="text-sm md:text-base text-muted-foreground">Portfolio overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpenAccountDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{formatMoney(portfolioValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Book Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{formatMoney(totalBookValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Unrealized P&L</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg md:text-2xl font-bold ${totalUnrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalUnrealizedPnL >= 0 ? "+" : ""}{formatMoney(totalUnrealizedPnL)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBookValue > 0 ? ((totalUnrealizedPnL / totalBookValue) * 100).toFixed(2) : "0.00"}% return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/investments/simple">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Simple View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Simple investment tracking by account</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/investments/transactions">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage investment transactions</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/investments/holdings">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View portfolio holdings</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/investments/prices">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Price Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Update security prices</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            form.reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Add Investment Transaction</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Add a new investment transaction to your portfolio
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
                {form.formState.errors.date && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.date.message}</p>
                )}
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
                    You need to create an investment account first. Please run the seed script or create one manually.
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
                    {form.formState.errors.quantity && (
                      <p className="text-xs text-red-500 mt-1">{form.formState.errors.quantity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price</label>
                    <MoneyInput
                      {...form.register("price", { valueAsNumber: true })}
                    />
                    {form.formState.errors.price && (
                      <p className="text-xs text-red-500 mt-1">{form.formState.errors.price.message}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Fees</label>
                <MoneyInput
                  {...form.register("fees", { valueAsNumber: true })}
                />
                {form.formState.errors.fees && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.fees.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Input {...form.register("notes")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setOpen(false);
                form.reset();
              }}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Investment Account Dialog */}
      <Dialog 
        open={openAccountDialog} 
        onOpenChange={(isOpen) => {
          setOpenAccountDialog(isOpen);
          if (!isOpen) {
            accountForm.reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Create Investment Account</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Create a new investment account for your portfolio
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={accountForm.handleSubmit(handleCreateAccount)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  {...accountForm.register("name")}
                  placeholder="e.g., TFSA Investment"
                />
                {accountForm.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">{accountForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={accountForm.watch("type")}
                  onValueChange={(value) => accountForm.setValue("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tax_free">Tax Free (TFSA)</SelectItem>
                    <SelectItem value="retirement">Retirement (RRSP)</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="brokerage">Brokerage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {accountForm.formState.errors.type && (
                  <p className="text-xs text-red-500 mt-1">{accountForm.formState.errors.type.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setOpenAccountDialog(false);
                accountForm.reset();
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

