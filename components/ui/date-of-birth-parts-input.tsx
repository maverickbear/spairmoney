"use client";

import * as React from "react";
import { parseDateInput } from "@/src/infrastructure/utils/timestamp";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const FULL_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear();

function parseValue(value: string): { year: string; month: string; day: string } {
  if (!value || !FULL_DATE_REGEX.test(value)) {
    return { year: "", month: "", day: "" };
  }
  const [year, month, day] = value.split("-");
  return { year: year ?? "", month: month ?? "", day: day ?? "" };
}

function buildDateString(year: string, month: string, day: string): string {
  const y = year.trim();
  const m = month.trim().padStart(2, "0");
  const d = day.trim().padStart(2, "0");
  if (y.length !== 4 || m.length !== 2 || d.length !== 2) return "";
  const candidate = `${y}-${m}-${d}`;
  try {
    const date = parseDateInput(candidate);
    if (isNaN(date.getTime())) return "";
    const monthNum = date.getMonth() + 1;
    const dayNum = date.getDate();
    if (Number(m) !== monthNum || Number(d) !== dayNum) return "";
    return candidate;
  } catch {
    return "";
  }
}

function isValidYear(year: string): boolean {
  if (year.length !== 4) return false;
  const n = Number(year);
  return !isNaN(n) && n >= MIN_YEAR && n <= MAX_YEAR;
}

function isValidMonth(month: string): boolean {
  if (month.length !== 2) return false;
  const n = Number(month);
  return !isNaN(n) && n >= 1 && n <= 12;
}

export interface DateOfBirthPartsInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "tiny" | "small" | "medium" | "large";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function DateOfBirthPartsInput({
  value,
  onChange,
  placeholder,
  size = "medium",
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: DateOfBirthPartsInputProps) {
  const parsed = React.useMemo(() => parseValue(value), [value]);
  const [year, setYear] = React.useState(parsed.year);
  const [month, setMonth] = React.useState(parsed.month);
  const [day, setDay] = React.useState(parsed.day);

  React.useEffect(() => {
    const next = parseValue(value);
    setYear(next.year);
    setMonth(next.month);
    setDay(next.day);
  }, [value]);

  const yearRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const dayRef = React.useRef<HTMLInputElement>(null);

  const emitIfValid = React.useCallback(
    (y: string, m: string, d: string) => {
      const built = buildDateString(y, m, d);
      if (built) onChange(built);
      else if (!y && !m && !d) onChange("");
    },
    [onChange]
  );

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYear(v);
    if (v.length === 4) {
      if (isValidYear(v)) monthRef.current?.focus();
      emitIfValid(v, month, day);
    } else {
      emitIfValid("", month, day);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMonth(v);
    if (v.length === 2) {
      if (isValidMonth(v)) dayRef.current?.focus();
      emitIfValid(year, v, day);
    } else {
      emitIfValid(year, "", day);
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    setDay(v);
    if (v.length === 2) {
      emitIfValid(year, month, v);
    } else {
      emitIfValid(year, month, "");
    }
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && year === "") monthRef.current?.focus();
  };

  const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && month === "") yearRef.current?.focus();
    else if (e.key === "Backspace" && month.length > 0) setMonth("");
  };

  const handleDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && day === "") monthRef.current?.focus();
    else if (e.key === "Backspace" && day.length > 0) setDay("");
  };

  const handleYearPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (FULL_DATE_REGEX.test(pasted)) {
      e.preventDefault();
      const [y, m, d] = pasted.split("-");
      setYear(y ?? "");
      setMonth(m ?? "");
      setDay(d ?? "");
      emitIfValid(y ?? "", m ?? "", d ?? "");
      dayRef.current?.focus();
    }
  };

  const inputClassName = cn("text-center tabular-nums");
  const containerClassName = cn("flex gap-2 w-full", className);

  return (
    <div
      className={containerClassName}
      role="group"
      aria-label={ariaLabel ?? placeholder}
    >
      <Input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="YYYY"
        aria-label="Year"
        maxLength={4}
        value={year}
        onChange={handleYearChange}
        onKeyDown={handleYearKeyDown}
        onPaste={handleYearPaste}
        disabled={disabled}
        size={size}
        className={inputClassName}
      />
      <Input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="MM"
        aria-label="Month"
        maxLength={2}
        value={month}
        onChange={handleMonthChange}
        onKeyDown={handleMonthKeyDown}
        disabled={disabled}
        size={size}
        className={inputClassName}
      />
      <Input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD"
        aria-label="Day"
        maxLength={2}
        value={day}
        onChange={handleDayChange}
        onKeyDown={handleDayKeyDown}
        disabled={disabled}
        size={size}
        className={inputClassName}
      />
    </div>
  );
}
