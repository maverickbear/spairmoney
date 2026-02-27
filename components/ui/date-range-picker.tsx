"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useFormatDisplayDate } from "@/src/presentation/utils/format-date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDateInput } from "@/src/infrastructure/utils/timestamp";

export type DateRangePreset = 
  | "all-dates"
  | "today"
  | "past-7-days"
  | "past-15-days"
  | "past-30-days"
  | "past-90-days"
  | "last-3-months"
  | "last-month"
  | "last-6-months"
  | "past-6-months"
  | "this-month"
  | "this-year"
  | "year-to-date"
  | "last-year"
  | "custom";

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRangePreset | "custom";
  dateRange?: DateRange;
  onValueChange: (preset: DateRangePreset | "custom", range?: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  dateRange,
  onValueChange,
  className,
}: DateRangePickerProps) {
  const t = useTranslations("common.dateRange");
  const formatDate = useFormatDisplayDate();
  const [startDateValue, setStartDateValue] = React.useState(
    dateRange ? formatDateInput(new Date(dateRange.startDate)) : ""
  );
  const [endDateValue, setEndDateValue] = React.useState(
    dateRange ? formatDateInput(new Date(dateRange.endDate)) : ""
  );

  // Update custom dates when dateRange prop changes
  React.useEffect(() => {
    if (value === "custom" && dateRange) {
      setStartDateValue(formatDateInput(new Date(dateRange.startDate)));
      setEndDateValue(formatDateInput(new Date(dateRange.endDate)));
    }
  }, [dateRange, value]);

  const getDisplayText = () => {
    if (value === "custom" && dateRange) {
      try {
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return `${formatDate(start, "short")} - ${formatDate(end, "shortDate")}`;
      } catch {
        return t("customRange");
      }
    }

    const presetKeys: Record<DateRangePreset, string> = {
      "all-dates": "allDates",
      today: "today",
      "past-7-days": "past7Days",
      "past-15-days": "past15Days",
      "past-30-days": "past30Days",
      "past-90-days": "past90Days",
      "last-3-months": "last3Months",
      "last-month": "lastMonth",
      "last-6-months": "last6Months",
      "past-6-months": "past6Months",
      "this-month": "thisMonth",
      "this-year": "thisYear",
      "year-to-date": "yearToDate",
      "last-year": "lastYear",
      custom: "customRange",
    };

    const key = presetKeys[value as DateRangePreset];
    return key ? t(key) : t("selectDateRange");
  };

  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      // Change to custom mode
      onValueChange("custom");
    } else {
      onValueChange(preset as DateRangePreset);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDateValue(value);
    
    if (value && endDateValue) {
      const startDate = value;
      const endDate = endDateValue;
      
      // Validate that start date is before end date
      if (startDate <= endDate) {
        const dateRange: DateRange = {
          startDate,
          endDate,
        };
        onValueChange("custom", dateRange);
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDateValue(value);
    
    if (startDateValue && value) {
      const startDate = startDateValue;
      const endDate = value;
      
      // Validate that start date is before end date
      if (startDate <= endDate) {
        const dateRange: DateRange = {
          startDate,
          endDate,
        };
        onValueChange("custom", dateRange);
      }
    }
  };


  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select 
        value={value} 
        onValueChange={handlePresetChange}
      >
        <SelectTrigger 
          className="h-9 w-auto min-w-[140px] text-xs"
        >
          <SelectValue>{getDisplayText()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-dates">{t("allDates")}</SelectItem>
          <SelectItem value="today">{t("today")}</SelectItem>
          <SelectItem value="past-7-days">{t("past7Days")}</SelectItem>
          <SelectItem value="past-15-days">{t("past15Days")}</SelectItem>
          <SelectItem value="past-30-days">{t("past30Days")}</SelectItem>
          <SelectItem value="past-90-days">{t("past90Days")}</SelectItem>
          <SelectItem value="last-3-months">{t("last3Months")}</SelectItem>
          <SelectItem value="last-month">{t("lastMonth")}</SelectItem>
          <SelectItem value="last-6-months">{t("last6Months")}</SelectItem>
          <SelectItem value="past-6-months">{t("past6Months")}</SelectItem>
          <SelectItem value="this-month">{t("thisMonth")}</SelectItem>
          <SelectItem value="this-year">{t("thisYear")}</SelectItem>
          <SelectItem value="year-to-date">{t("yearToDate")}</SelectItem>
          <SelectItem value="last-year">{t("lastYear")}</SelectItem>
          <SelectItem value="custom">{t("customRange")}</SelectItem>
        </SelectContent>
      </Select>

      {value === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDateValue}
            onChange={handleStartDateChange}
            placeholder={t("startDate")}
            className="h-9 text-xs"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            value={endDateValue}
            onChange={handleEndDateChange}
            placeholder={t("endDate")}
            className="h-9 text-xs"
            min={startDateValue || undefined}
          />
        </div>
      )}
    </div>
  );
}

