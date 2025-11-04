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
import { securityPriceSchema } from "@/lib/validations/investment";
import { securitySchema, type SecurityFormData } from "@/lib/validations/security";
import { formatMoney } from "@/components/common/money";
import { Plus, RefreshCw, TrendingUp } from "lucide-react";
import { format } from "date-fns";

type SecurityPriceFormData = {
  securityId: string;
  date: Date;
  price: number;
};

interface Price {
  id: string;
  date: string;
  price: number;
  security: {
    id: string;
    symbol: string;
    name: string;
  };
}

interface Security {
  id: string;
  symbol: string;
  name: string;
}

export default function PricesPage() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [securities, setSecurities] = useState<Security[]>([]);
  const [open, setOpen] = useState(false);
  const [openSecurityDialog, setOpenSecurityDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingPrices, setUpdatingPrices] = useState(false);

  const form = useForm<SecurityPriceFormData>({
    resolver: zodResolver(securityPriceSchema),
    defaultValues: {
      date: new Date(),
      price: 0,
    },
  });

  const securityForm = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      symbol: "",
      name: "",
      class: "stock",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [pricesRes, securitiesRes] = await Promise.all([
        fetch("/api/investments/prices"),
        fetch("/api/investments/securities"),
      ]);

      const [pricesData, securitiesData] = await Promise.all([
        pricesRes.json(),
        securitiesRes.json(),
      ]);

      setPrices(pricesData);
      setSecurities(securitiesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: SecurityPriceFormData) {
    try {
      const response = await fetch("/api/investments/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create price");
      }

      await loadData();
      setOpen(false);
      form.reset({
        date: new Date(),
        price: 0,
      });
    } catch (error) {
      console.error("Error saving price:", error);
      const message = error instanceof Error ? error.message : "Failed to save price";
      alert(message);
    }
  }

  async function updateAllPrices() {
    try {
      setUpdatingPrices(true);
      const response = await fetch("/api/investments/prices/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update prices");
      }

      const result = await response.json();
      
      // Reload prices
      await loadData();
      
      if (result.errors && result.errors.length > 0) {
        console.warn(`Some prices failed to update:`, result.errors);
        // Show success message even if some failed
        if (result.updated > 0) {
          alert(`Updated ${result.updated} prices. ${result.errors.length} symbol(s) failed: ${result.errors.slice(0, 3).join(", ")}${result.errors.length > 3 ? "..." : ""}`);
        } else {
          alert(`Failed to update prices. Errors: ${result.errors.join(", ")}`);
        }
      } else {
        if (result.updated > 0) {
          alert(`Successfully updated ${result.updated} price(s)!`);
        } else {
          alert("No prices to update.");
        }
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      const message = error instanceof Error ? error.message : "Failed to update prices";
      alert(message);
    } finally {
      setUpdatingPrices(false);
    }
  }

  async function handleCreateSecurity(data: SecurityFormData) {
    try {
      const response = await fetch("/api/investments/securities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create security");
      }

      await loadData();
      setOpenSecurityDialog(false);
      securityForm.reset();
    } catch (error) {
      console.error("Error creating security:", error);
      const message = error instanceof Error ? error.message : "Failed to create security";
      alert(message);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // Group prices by security
  const pricesBySecurity = prices.reduce((acc, price) => {
    const symbol = price.security.symbol;
    if (!acc[symbol]) {
      acc[symbol] = [];
    }
    acc[symbol].push(price);
    return acc;
  }, {} as Record<string, Price[]>);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Security Prices</h1>
          <p className="text-sm md:text-base text-muted-foreground">Update security prices manually</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={updateAllPrices} 
            disabled={updatingPrices}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <TrendingUp className={`mr-2 h-4 w-4 ${updatingPrices ? "animate-spin" : ""}`} />
            {updatingPrices ? "Updating..." : "Update All Prices"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpenSecurityDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Security
          </Button>
          <Button size="sm" onClick={() => setOpen(true)} disabled={securities.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add Price
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(pricesBySecurity).map(([symbol, securityPrices]) => (
          <div key={symbol} className="rounded-md border overflow-x-auto">
            <div className="px-4 py-2 border-b bg-muted">
              <h3 className="font-semibold text-sm md:text-base">{symbol}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Date</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityPrices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell className="text-xs md:text-sm">
                      {format(new Date(price.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs md:text-sm">
                      {formatMoney(price.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}

        {Object.keys(pricesBySecurity).length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No prices found. Add a price to get started.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Add Price Update</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Record a new price for a security
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Security</label>
              <Select
                value={form.watch("securityId") || ""}
                onValueChange={(value) => form.setValue("securityId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select security" />
                </SelectTrigger>
                <SelectContent>
                  {securities.map((security) => (
                    <SelectItem key={security.id} value={security.id}>
                      {security.symbol} - {security.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                value={
                  form.watch("date")
                    ? format(form.watch("date") as Date, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => form.setValue("date", new Date(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Price</label>
              <MoneyInput
                {...form.register("price", { valueAsNumber: true })}
              />
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

      {/* Create Security Dialog */}
      <Dialog 
        open={openSecurityDialog} 
        onOpenChange={(isOpen) => {
          setOpenSecurityDialog(isOpen);
          if (!isOpen) {
            securityForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Create Security</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Create a new security (stock, ETF, crypto, etc.)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={securityForm.handleSubmit(handleCreateSecurity)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Symbol</label>
              <Input
                {...securityForm.register("symbol")}
                placeholder="e.g., AAPL, BTC, SPY"
                className="uppercase"
                onChange={(e) => {
                  securityForm.setValue("symbol", e.target.value.toUpperCase());
                }}
              />
              {securityForm.formState.errors.symbol && (
                <p className="text-xs text-red-500 mt-1">
                  {securityForm.formState.errors.symbol.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                {...securityForm.register("name")}
                placeholder="e.g., Apple Inc., Bitcoin, S&P 500 ETF"
              />
              {securityForm.formState.errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {securityForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <select
                {...securityForm.register("class")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="crypto">Crypto</option>
                <option value="bond">Bond</option>
                <option value="reit">REIT</option>
              </select>
              {securityForm.formState.errors.class && (
                <p className="text-xs text-red-500 mt-1">
                  {securityForm.formState.errors.class.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenSecurityDialog(false);
                  securityForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Security</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

