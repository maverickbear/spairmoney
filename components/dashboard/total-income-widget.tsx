"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { formatMoney } from "@/components/common/money";
import { cn } from "@/lib/utils";

interface TotalIncomeWidgetProps {
  transactions: any[];
}

export function TotalIncomeWidget({ transactions }: TotalIncomeWidgetProps) {
  // Debug: Log transactions received
  console.log("🔍 [TotalIncomeWidget] Received transactions:", {
    totalCount: transactions.length,
    transactionTypes: [...new Set(transactions.map(t => t?.type).filter(Boolean))],
    incomeCount: transactions.filter((t) => t && t.type === "income").length,
    sampleTransactions: transactions.slice(0, 5).map(t => ({
      id: t?.id,
      type: t?.type,
      amount: t?.amount,
      amountType: typeof t?.amount,
    })),
  });

  // Calculate total income from all income transactions
  // Note: transactions are already filtered by type="income" in the query, but we filter again for safety
  const incomeTransactions = transactions.filter((t) => t && t.type === "income");
  
  const totalIncome = incomeTransactions.reduce((sum, t) => {
    let amount = 0;
    if (t.amount != null) {
      const parsed = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount);
      amount = isNaN(parsed) ? 0 : parsed;
    }
    const newSum = sum + amount;
    console.log("🔍 [TotalIncomeWidget] Calculating income:", {
      id: t.id,
      type: t.type,
      amount: t.amount,
      parsedAmount: amount,
      currentSum: sum,
      newSum: newSum,
    });
    return newSum;
  }, 0);

  const incomeCount = incomeTransactions.length;

  console.log("🔍 [TotalIncomeWidget] Final calculation:", {
    totalIncome,
    incomeCount,
    transactionsReceived: transactions.length,
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-500" />
          Total Income
        </CardTitle>
        <CardDescription>
          Sum of all income transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Amount */}
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-3xl font-bold",
              totalIncome > 0 
                ? "text-green-600 dark:text-green-400" 
                : "text-muted-foreground"
            )}>
              {formatMoney(totalIncome)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {incomeCount} {incomeCount === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

