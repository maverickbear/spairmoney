"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { DateRangePicker, type DateRangePreset, type DateRange } from "@/components/ui/date-range-picker";

export type ReportPeriod = 
  | "current-month"
  | "last-3-months"
  | "last-6-months"
  | "last-12-months"
  | "year-to-date"
  | "custom";

export interface ReportFiltersProps {
  period: ReportPeriod;
}

export function ReportFilters({ period }: ReportFiltersProps) {
  const t = useTranslations("reports");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const now = new Date();
  
  const getDateRange = (period: ReportPeriod): { startDate: Date; endDate: Date } => {
    switch (period) {
      case "current-month":
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
      case "last-3-months":
        return {
          startDate: startOfMonth(subMonths(now, 2)),
          endDate: endOfMonth(now),
        };
      case "last-6-months":
        return {
          startDate: startOfMonth(subMonths(now, 5)),
          endDate: endOfMonth(now),
        };
      case "last-12-months":
        return {
          startDate: startOfMonth(subMonths(now, 11)),
          endDate: endOfMonth(now),
        };
      case "year-to-date":
        return {
          startDate: startOfYear(now),
          endDate: endOfYear(now),
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
    }
  };

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPeriod === "last-12-months") {
      // Remove period param to use default
      params.delete("period");
    } else {
      params.set("period", newPeriod);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const dateRange = getDateRange(period);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t("period")}:</span>
        <Select value={period} onValueChange={(value) => handlePeriodChange(value as ReportPeriod)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">{t("currentMonth")}</SelectItem>
            <SelectItem value="last-3-months">{t("last3Months")}</SelectItem>
            <SelectItem value="last-6-months">{t("last6Months")}</SelectItem>
            <SelectItem value="last-12-months">{t("last12Months")}</SelectItem>
            <SelectItem value="year-to-date">{t("yearToDate")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">
        {format(dateRange.startDate, "MMM dd, yyyy")} - {format(dateRange.endDate, "MMM dd, yyyy")}
      </div>
    </div>
  );
}
