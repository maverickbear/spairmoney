"use client";

import { ChartCard } from "./chart-card";
import { formatMoney } from "@/components/common/money";

interface CategoryExpense {
  name: string;
  value: number;
}

interface CategoryExpensesChartProps {
  data: CategoryExpense[];
  totalIncome?: number;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#6366f1", // indigo
];

export function CategoryExpensesChart({ data, totalIncome = 0 }: CategoryExpensesChartProps) {
  // Sort data by value descending and limit to top 10
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10);
  
  // Calculate total expenses for bar visualization
  const totalExpenses = sortedData.reduce((sum, item) => sum + item.value, 0);

  // Prepare data with percentages based on total income
  const chartData = sortedData.map((item) => ({
    ...item,
    percentage: totalIncome > 0 ? (item.value / totalIncome) * 100 : 0,
    // Also keep percentage relative to expenses for bar visualization
    expensePercentage: totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0,
  }));

  return (
    <ChartCard title="Top 10 expenses" description="Top 10 expenses by category">
      <div className="space-y-1">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium truncate">{item.name}</span>
            </div>
              <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex-1 min-w-[100px] max-w-[150px]">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(item.expensePercentage, 100)}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
              <div className="text-right min-w-[70px]">
                <div className="text-sm font-semibold">{formatMoney(item.value)}</div>
                <div className="text-xs text-muted-foreground cursor-help relative group/tooltip inline-block">
                  {item.percentage.toFixed(1)}%
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg">
                    % of total monthly income
                    <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

