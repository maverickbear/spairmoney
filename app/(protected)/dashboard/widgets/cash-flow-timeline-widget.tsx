"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { startOfMonth, endOfMonth, eachMonthOfInterval, eachDayOfInterval, subMonths } from "date-fns";
import { IncomeExpensesChart } from "@/components/charts/income-expenses-chart";
import { calculateTotalIncome, calculateTotalExpenses } from "../utils/transaction-helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PeriodOption = "1M" | "3M" | "6M" | "12M";

interface CashFlowTimelineWidgetProps {
  chartTransactions: any[];
  selectedMonthDate?: Date;
}

export function CashFlowTimelineWidget({
  chartTransactions,
  selectedMonthDate,
}: CashFlowTimelineWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("6M");
  
  // Use selected month or current month
  const monthDate = selectedMonthDate || new Date();
  
  // Calculate date range based on selected period
  const { chartStart, chartEnd } = useMemo(() => {
    const end = endOfMonth(monthDate);
    let start: Date;
    
    switch (selectedPeriod) {
      case "1M":
        start = startOfMonth(monthDate);
        break;
      case "3M":
        start = startOfMonth(subMonths(monthDate, 2));
        break;
      case "6M":
        start = startOfMonth(subMonths(monthDate, 5));
        break;
      case "12M":
        start = startOfMonth(subMonths(monthDate, 11));
        break;
      default:
        start = startOfMonth(subMonths(monthDate, 5));
    }
    
    return { chartStart: start, chartEnd: end };
  }, [monthDate, selectedPeriod]);

  // Helper function to parse date from Supabase format
  const parseTransactionDate = (dateStr: string | Date): Date => {
    if (dateStr instanceof Date) {
      return dateStr;
    }
    // Handle both "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS" formats
    const normalized = dateStr.replace(' ', 'T').split('.')[0]; // Remove milliseconds if present
    return new Date(normalized);
  };

  // Get today's date (without time) to filter out future transactions
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Filter transactions to only include those with date <= today
  // Exclude future transactions as they haven't happened yet
  const pastChartTransactions = useMemo(() => {
    return chartTransactions.filter((t) => {
      if (!t.date) return false;
      try {
        const txDate = parseTransactionDate(t.date);
        txDate.setHours(0, 0, 0, 0);
        return txDate <= today;
      } catch (error) {
        return false; // Exclude if date parsing fails
      }
    });
  }, [chartTransactions, today]);

  // Prepare data for the bar chart - by days for 1M, by months for other periods
  const chartData = useMemo(() => {
    if (selectedPeriod === "1M") {
      // For 1M period, group by days
      const days = eachDayOfInterval({ start: chartStart, end: chartEnd });
      
      return days.map((day) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayTransactions = pastChartTransactions.filter((t) => {
          const txDate = parseTransactionDate(t.date);
          return txDate >= dayStart && txDate <= dayEnd;
        });

        // Use centralized calculation functions to ensure consistency
        // These functions exclude transfers and validate transactions
        const income = calculateTotalIncome(dayTransactions);
        const expenses = calculateTotalExpenses(dayTransactions);

        return {
          month: format(day, "dd/MM"),
          income,
          expenses,
        };
      });
    } else {
      // For other periods, group by months
  const months = eachMonthOfInterval({ start: chartStart, end: chartEnd });
  
    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = pastChartTransactions.filter((t) => {
        const txDate = parseTransactionDate(t.date);
        return txDate >= monthStart && txDate <= monthEnd;
      });

      // Use centralized calculation functions to ensure consistency
      // These functions exclude transfers and validate transactions
      const income = calculateTotalIncome(monthTransactions);
      const expenses = calculateTotalExpenses(monthTransactions);

      return {
        month: format(month, "MMM"),
        income,
        expenses,
      };
    });
    }
  }, [pastChartTransactions, chartStart, chartEnd, selectedPeriod]);

  // Period Selector Component
  const periodSelector = (
    <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodOption)}>
      <SelectTrigger size="small" className="w-fit h-7 text-xs px-2.5">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1M">1M</SelectItem>
        <SelectItem value="3M">3M</SelectItem>
        <SelectItem value="6M">6M</SelectItem>
        <SelectItem value="12M">12M</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="h-full">
      <IncomeExpensesChart data={chartData} headerActions={periodSelector} />
    </div>
  );
}

