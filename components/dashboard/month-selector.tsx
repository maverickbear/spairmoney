"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MonthSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Get selected month from URL or use current month
  const monthParam = searchParams.get("month");
  const selectedMonth = monthParam 
    ? (() => {
        // Parse YYYY-MM-DD format and create date in local timezone (same as dashboard)
        const [year, month, day] = monthParam.split('-').map(Number);
        return startOfMonth(new Date(year, month - 1, day));
      })()
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
    router.push(`${pathname}?${params.toString()}`);
  };
  
  const goToCurrentMonth = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => navigateMonth("prev")}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <p className="text-base font-medium min-w-[140px] text-center">
        {format(selectedMonth, "MMMM yyyy")}
      </p>
      
      <Button
        variant="outline"
        onClick={() => navigateMonth("next")}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {!isCurrentMonth && (
        <Button
          variant="ghost"
          onClick={goToCurrentMonth}
          className="h-8 text-xs"
        >
          Today
        </Button>
      )}
    </div>
  );
}

