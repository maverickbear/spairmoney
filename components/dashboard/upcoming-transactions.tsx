"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/components/common/money";
import { format } from "date-fns";
import { Calendar, ArrowUpRight, ArrowDownRight, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingTransaction {
  id: string;
  date: Date;
  type: string;
  amount: number;
  description?: string;
  account?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  subcategory?: { id: string; name: string } | null;
  originalDate: Date;
}

interface UpcomingTransactionsProps {
  transactions: UpcomingTransaction[];
}

// Generate a unique key for each transaction occurrence
const getTransactionKey = (tx: UpcomingTransaction) => {
  return `${tx.id}-${tx.date.toISOString()}`;
};

// Storage key for paid transactions
const STORAGE_KEY = "upcoming-transactions-paid";

export function UpcomingTransactions({ transactions }: UpcomingTransactionsProps) {
  const [paidTransactions, setPaidTransactions] = useState<Set<string>>(new Set());

  // Load paid transactions from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const paidSet = new Set<string>(JSON.parse(stored));
          setPaidTransactions(paidSet);
        }
      } catch (error) {
        console.error("Error loading paid transactions:", error);
      }
    }
  }, []);

  // Save paid transactions to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(paidTransactions)));
      } catch (error) {
        console.error("Error saving paid transactions:", error);
      }
    }
  }, [paidTransactions]);

  const togglePaid = (tx: UpcomingTransaction) => {
    const key = getTransactionKey(tx);
    setPaidTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isPaid = (tx: UpcomingTransaction) => {
    return paidTransactions.has(getTransactionKey(tx));
  };
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Upcoming Transactions
          </CardTitle>
          <CardDescription>Recurring transactions scheduled for the next month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming transactions found.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case "expense":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      case "transfer":
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-green-600";
      case "expense":
        return "text-red-600";
      case "transfer":
        return "text-blue-600";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Transactions
        </CardTitle>
        <CardDescription>Recurring transactions scheduled for the next month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((tx) => {
            const paid = isPaid(tx);
            return (
              <div
                key={getTransactionKey(tx)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-[12px] border bg-card transition-all",
                  paid
                    ? "opacity-60 border-muted"
                    : "hover:bg-accent/50"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "font-medium text-sm truncate",
                          paid && "line-through"
                        )}
                      >
                        {tx.description || tx.category?.name || "Transaction"}
                      </p>
                      {tx.subcategory && (
                        <span className="text-xs text-muted-foreground">
                          ({tx.subcategory.name})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {format(tx.date, "MMM dd, yyyy")}
                      </p>
                      {tx.account && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground truncate">
                            {tx.account.name}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      getTypeColor(tx.type),
                      paid && "line-through"
                    )}
                  >
                    {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                    {formatMoney(tx.amount)}
                  </p>
                  <Button
                    variant={paid ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => togglePaid(tx)}
                    className={cn(
                      "h-8 px-3 text-xs",
                      paid && "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    {paid ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Paid
                      </>
                    ) : (
                      "Paid"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

