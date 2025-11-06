import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/components/common/money";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardsProps {
  selectedMonthTransactions: any[];
  lastMonthTransactions: any[];
  savings: number;
}

export function SummaryCards({ 
  selectedMonthTransactions, 
  lastMonthTransactions, 
  savings 
}: SummaryCardsProps) {

  const currentIncome = selectedMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentExpenses = selectedMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const momChange = lastMonthExpenses > 0
    ? ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
    : 0;

  return (
    <div className="grid gap-6 md:gap-8 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal">Monthly Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-500" />
            <div className="text-lg md:text-xl font-semibold text-foreground">{formatMoney(currentIncome)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal">Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-500" />
            <div className="text-lg md:text-xl font-semibold text-foreground">{formatMoney(currentExpenses)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal">Savings/Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-xl font-semibold text-foreground">{formatMoney(savings)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal">Month-over-Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {momChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            )}
            <div className="text-lg md:text-xl font-semibold text-foreground">
              {momChange >= 0 ? "+" : ""}{momChange.toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

