"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/components/common/money";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp } from "lucide-react";

interface Holding {
  securityId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  bookValue: number;
  lastPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingPrices, setUpdatingPrices] = useState(false);

  useEffect(() => {
    loadHoldings();
  }, []);

  async function loadHoldings() {
    try {
      setLoading(true);
      const res = await fetch("/api/investments/holdings");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error loading holdings:", errorData);
        alert(`Failed to load holdings: ${errorData.error || "Unknown error"}`);
        return;
      }
      const data = await res.json();
      console.log("Holdings loaded:", data);
      setHoldings(data || []);
    } catch (error) {
      console.error("Error loading holdings:", error);
      alert("Failed to load holdings. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  async function updatePrices() {
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
      
      // Reload holdings to show updated prices
      await loadHoldings();
      
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Holdings</h1>
          <p className="text-sm md:text-base text-muted-foreground">Your investment portfolio</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={loadHoldings} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={updatePrices} 
            disabled={updatingPrices}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <TrendingUp className={`mr-2 h-4 w-4 ${updatingPrices ? "animate-spin" : ""}`} />
            {updatingPrices ? "Updating..." : "Update Prices"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs md:text-sm">Symbol</TableHead>
              <TableHead className="text-xs md:text-sm hidden md:table-cell">Name</TableHead>
              <TableHead className="text-right text-xs md:text-sm">Quantity</TableHead>
              <TableHead className="text-right text-xs md:text-sm hidden lg:table-cell">Avg Price</TableHead>
              <TableHead className="text-right text-xs md:text-sm">Book Value</TableHead>
              <TableHead className="text-right text-xs md:text-sm hidden lg:table-cell">Last Price</TableHead>
              <TableHead className="text-right text-xs md:text-sm">Market Value</TableHead>
              <TableHead className="text-right text-xs md:text-sm">Unrealized P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => (
              <TableRow key={holding.securityId}>
                <TableCell className="font-medium text-xs md:text-sm">{holding.symbol}</TableCell>
                <TableCell className="text-xs md:text-sm hidden md:table-cell">{holding.name}</TableCell>
                <TableCell className="text-right text-xs md:text-sm">{holding.quantity.toFixed(4)}</TableCell>
                <TableCell className="text-right text-xs md:text-sm hidden lg:table-cell">{formatMoney(holding.avgPrice)}</TableCell>
                <TableCell className="text-right text-xs md:text-sm">{formatMoney(holding.bookValue)}</TableCell>
                <TableCell className="text-right text-xs md:text-sm hidden lg:table-cell">{formatMoney(holding.lastPrice)}</TableCell>
                <TableCell className="text-right text-xs md:text-sm">{formatMoney(holding.marketValue)}</TableCell>
                <TableCell className={`text-right font-medium text-xs md:text-sm ${
                  holding.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {holding.unrealizedPnL >= 0 ? "+" : ""}{formatMoney(holding.unrealizedPnL)}
                </TableCell>
              </TableRow>
            ))}
            {holdings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  <div className="space-y-2">
                    <p className="font-medium">No holdings found</p>
                    <p className="text-sm">
                      To see holdings, you need to:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Create securities in the <a href="/investments/prices" className="text-primary underline">Prices</a> page</li>
                      <li>Create investment accounts in the <a href="/investments" className="text-primary underline">Investments</a> page</li>
                      <li>Add buy transactions with quantity and price in the <a href="/investments/transactions" className="text-primary underline">Transactions</a> page</li>
                    </ul>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

