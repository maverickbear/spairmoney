import { UpcomingTransactions } from "@/components/dashboard/upcoming-transactions";
import { BudgetExecutionChart } from "@/components/charts/budget-execution-chart";

interface TransactionsBudgetSectionProps {
  budgets: any[];
  upcomingTransactions: any[];
}

export function TransactionsBudgetSection({ 
  budgets, 
  upcomingTransactions 
}: TransactionsBudgetSectionProps) {
  console.log("🔍 [TransactionsBudgetSection] Budgets received:", {
    budgetsCount: budgets?.length || 0,
    budgets: budgets?.slice(0, 3).map((b: any) => ({
      id: b.id,
      category: b.category?.name,
      amount: b.amount,
      percentage: b.percentage,
    })),
  });

  const budgetExecutionData = budgets
    .filter((b) => b.category)
    .map((b) => ({
      category: b.category?.name || "Unknown",
      percentage: b.percentage || 0,
    }));

  return (
    <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
      <UpcomingTransactions transactions={upcomingTransactions} />
      <BudgetExecutionChart data={budgetExecutionData} />
    </div>
  );
}

