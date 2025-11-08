"use client";

import { IncomeExpensesChart } from "@/components/charts/income-expenses-chart";

// Fake data
const fakeMonthlyData = [
  { month: "Jul", income: 4200, expenses: 3200 },
  { month: "Aug", income: 4500, expenses: 3400 },
  { month: "Sep", income: 4800, expenses: 3600 },
  { month: "Oct", income: 5000, expenses: 3800 },
  { month: "Nov", income: 5200, expenses: 3750 },
  { month: "Dec", income: 5500, expenses: 4000 },
];

export function ChartDemo() {
  return (
    <div className="w-full h-[500px] flex items-center justify-center p-6" style={{ pointerEvents: "none" }}>
      <div className="w-full max-w-4xl">
        <IncomeExpensesChart data={fakeMonthlyData} />
      </div>
    </div>
  );
}

