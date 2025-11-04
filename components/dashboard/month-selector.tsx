"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MonthSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get selected month from URL or use current month
  const monthParam = searchParams.get("month");
  const selectedMonth = monthParam 
    ? startOfMonth(new Date(monthParam))
    : startOfMonth(new Date());
  
  const currentMonth = startOfMonth(new Date());
  const isCurrentMonth = selectedMonth.getTime() === currentMonth.getTime();
  
  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = direction === "next" 
      ? addMonths(selectedMonth, 1)
      : subMonths(selectedMonth, 1);
    
    // Format as YYYY-MM-DD for the first day of the month
    const monthString = format(newMonth, "yyyy-MM-dd");
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthString);
    router.push(`/?${params.toString()}`);
  };
  
  const goToCurrentMonth = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    router.push(`/?${params.toString()}`);
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateMonth("prev")}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="text-right min-w-[140px]">
        <p className="text-sm font-medium text-muted-foreground">Current Month</p>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="text-lg md:text-xl font-semibold">
            {format(selectedMonth, "MMMM yyyy")}
          </p>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateMonth("next")}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          onClick={goToCurrentMonth}
          className="h-8 text-xs"
        >
          Today
        </Button>
      )}
    </div>
  );
}

