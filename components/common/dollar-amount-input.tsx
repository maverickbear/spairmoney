"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/components/common/money";
import { getDisplayCurrencyLocale } from "@/src/presentation/stores/currency-store";

export interface DollarAmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "size"> {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  size?: "tiny" | "small" | "medium" | "large";
  /** When false, the currency symbol is not shown as prefix (e.g. when the label already indicates the field is monetary). Default true. */
  showCurrencyPrefix?: boolean;
}

/**
 * Formats a number to display with locale-appropriate grouping and 2 decimal places.
 */
function formatDisplayValue(value: number | string | undefined | null, locale: string): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : Number(value);

  if (isNaN(numValue) || !isFinite(numValue)) {
    return "";
  }

  return numValue.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats only the integer part with locale-appropriate grouping (for real-time formatting while typing).
 * Value must be in canonical form (e.g. "1234" or "12.34" with "." as decimal). Uses locale decimal separator in output.
 */
function formatIntegerPart(value: string, locale: string): string {
  if (!value || value === "" || value === ".") {
    return "";
  }

  const isNegative = value.startsWith("-");
  const valueWithoutSign = isNegative ? value.slice(1) : value;

  const parts = valueWithoutSign.split(".");
  const integerPart = parts[0] || "";
  const decimalPart = parts[1] || "";

  if (integerPart === "" || integerPart === "-") {
    return value;
  }

  const integerNum = parseInt(integerPart, 10);
  if (isNaN(integerNum)) {
    return value;
  }

  const formattedInteger = integerNum.toLocaleString(locale);
  const sign = isNegative ? "-" : "";
  const { decimalSep } = getLocaleSeparators(locale);

  if (decimalPart !== "") {
    return `${sign}${formattedInteger}${decimalSep}${decimalPart}`;
  }

  return `${sign}${formattedInteger}`;
}

/**
 * Returns the group (thousands) and decimal separator for the locale.
 * Used to parse user input correctly in locales where "." is thousands (e.g. pt-BR) and "," is decimal.
 */
function getLocaleSeparators(locale: string): { groupSep: string; decimalSep: string } {
  const parts = new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).formatToParts(1234.5);
  let groupSep = ",";
  let decimalSep = ".";
  for (const p of parts) {
    if (p.type === "group") groupSep = p.value;
    if (p.type === "decimal") decimalSep = p.value;
  }
  return { groupSep, decimalSep };
}

/**
 * Normalizes locale-formatted input to a canonical "1234.56" form (no group separators, "." as decimal).
 * Prevents treating locale thousands separator (e.g. "." in pt-BR) as decimal and limiting to 2 digits.
 */
function normalizeToCanonical(value: string, locale: string): string {
  const trimmed = value.replace(/\s/g, "").trim();
  if (!trimmed) return "";
  const { groupSep, decimalSep } = getLocaleSeparators(locale);
  const withoutGroup = trimmed.split(groupSep).join("");
  const canonical = withoutGroup.replace(decimalSep, ".");
  return canonical;
}

/**
 * Parses a formatted numeric string (no currency prefix) back to a number.
 */
function parseInputValue(value: string, locale: string): number | undefined {
  const canonical = normalizeToCanonical(value, locale);

  if (canonical === "" || canonical === ".") {
    return undefined;
  }

  const parsed = parseFloat(canonical);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Amount input that shows the currency symbol as a visual prefix only.
 * The input value contains only the numeric part, so the symbol does not limit or consume character space.
 */
export const DollarAmountInput = React.forwardRef<HTMLInputElement, DollarAmountInputProps>(
  ({ value, onChange, onBlur, className, placeholder, showCurrencyPrefix = true, ...props }, ref) => {
    const locale = getDisplayCurrencyLocale();
    const prefix = React.useMemo(() => getCurrencySymbol().replace(/\s+$/, "") + " ", []);

    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      const formatted = formatDisplayValue(value, locale);
      if (formatted !== "") {
        return formatted;
      }
      if (value === 0 || value === "0") {
        return formatDisplayValue(0, locale);
      }
      return "";
    });
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
      if (!isFocused) {
        const formatted = formatDisplayValue(value, locale);
        if (formatted !== "") {
          setDisplayValue(formatted);
        } else if (value === 0 || value === "0") {
          setDisplayValue(formatDisplayValue(0, locale));
        } else {
          setDisplayValue("");
        }
      }
    }, [value, isFocused, locale]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (!displayValue || displayValue.trim() === "") {
        setDisplayValue("");
      }
      props.onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cursorPosition = e.target.selectionStart ?? 0;

      const canonical = normalizeToCanonical(inputValue, locale);
      const validPattern = /^-?\d*\.?\d*$/;

      if (!validPattern.test(canonical)) {
        return;
      }

      const parsed = canonical === "" || canonical === "." ? undefined : parseFloat(canonical);
      const isZero = canonical === "0" || canonical === "-0" || parsed === 0;

      if (canonical !== "") {
        const parts = canonical.split(".");
        const hasDecimal = parts.length === 2;
        const integerPart = parts[0] || "";
        const decimalPart = parts[1] || "";

        if (hasDecimal && decimalPart !== "") {
          const limitedDecimalPart = decimalPart.slice(0, 2);
          const valueToFormat = `${integerPart}.${limitedDecimalPart}`;
          const formatted = formatIntegerPart(valueToFormat, locale);
          setDisplayValue(formatted);
          const parsedNum = parseFloat(valueToFormat);
          if (!isNaN(parsedNum) && isFinite(parsedNum)) {
            onChange?.(parsedNum);
          }
          setCursorInFormatted(formatted, cursorPosition, inputValue.length, locale);
          return;
        }

        // User typed "." with no decimal digits yet (e.g. "10.") — show as-is, no auto ".00"
        if (hasDecimal && decimalPart === "" && integerPart !== "" && integerPart !== "-") {
          const { decimalSep } = getLocaleSeparators(locale);
          const formatted = formatIntegerPart(integerPart, locale) + decimalSep;
          setDisplayValue(formatted);
          const parsedNum = parseFloat(integerPart);
          if (!isNaN(parsedNum) && isFinite(parsedNum)) {
            onChange?.(parsedNum);
          }
          setCursorInFormatted(formatted, cursorPosition, inputValue.length, locale);
          return;
        }

        const formatted = formatIntegerPart(canonical, locale);
        setDisplayValue(formatted);
        if (isZero) {
          onChange?.(0);
        } else if (parsed !== undefined && !isNaN(parsed) && isFinite(parsed)) {
          onChange?.(parsed);
        }
        setCursorInFormatted(formatted, cursorPosition, inputValue.length, locale);
      } else {
        setDisplayValue("");
        onChange?.(undefined);
      }
    };

    function setCursorInFormatted(
      formatted: string,
      cursorPosition: number,
      inputValueLength: number,
      loc: string
    ) {
      setTimeout(() => {
        if (!inputRef.current) return;
        const { groupSep, decimalSep } = getLocaleSeparators(loc);
        const content = formatted.split(groupSep).join("").replace(/\s/g, "");
        const contentBeforeCursor = content.slice(0, Math.min(cursorPosition, content.length));
        const digitCountBeforeCursor = contentBeforeCursor.replace(/[^\d]/g, "").length;
        const hasDecimalBeforeCursor = contentBeforeCursor.includes(decimalSep);

        let newCursorPos = 0;
        let digitCount = 0;
        let foundPosition = false;

        for (let i = 0; i < formatted.length; i++) {
          const char = formatted[i];
          if (/\d/.test(char)) {
            digitCount++;
            if (digitCount > digitCountBeforeCursor) {
              newCursorPos = i;
              foundPosition = true;
              break;
            }
            newCursorPos = i + 1;
          } else if (char === decimalSep) {
            if (hasDecimalBeforeCursor && digitCount === digitCountBeforeCursor) {
              newCursorPos = i;
              foundPosition = true;
              break;
            }
            newCursorPos = i + 1;
          } else if (char === groupSep || char === " ") {
            newCursorPos = i + 1;
          }
        }

        if (cursorPosition >= inputValueLength || !foundPosition) {
          newCursorPos = formatted.length;
        }
        const pos = Math.min(Math.max(0, newCursorPos), formatted.length);
        inputRef.current.setSelectionRange(pos, pos);
      }, 0);
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const parsed = parseInputValue(displayValue, locale);
      const canonical = normalizeToCanonical(displayValue, locale);
      const numericPart = canonical;
      const isZeroValue =
        parsed === 0 ||
        numericPart === "0" ||
        numericPart === "0." ||
        numericPart === "0.0" ||
        numericPart === "0.00";

      if (parsed !== undefined || isZeroValue) {
        const valueToFormat = parsed !== undefined ? parsed : 0;
        const formatted = formatDisplayValue(valueToFormat, locale);
        setDisplayValue(formatted);
        onChange?.(valueToFormat);
      } else {
        setDisplayValue("");
        onChange?.(undefined);
      }
      onBlur?.(e);
    };

    const inputElement = (
      <Input
        ref={(node) => {
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }
        }}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          showCurrencyPrefix && "border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-1 pr-3 min-w-0"
        )}
        {...props}
      />
    );

    if (!showCurrencyPrefix) {
      return <div className={cn(className)}>{inputElement}</div>;
    }

    return (
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-md border border-input bg-background ring-offset-background transition-colors hover:border-ring active:border-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "text-base",
          className
        )}
      >
        <span
          className="flex shrink-0 pl-3 text-muted-foreground"
          aria-hidden
        >
          {prefix}
        </span>
        {inputElement}
      </div>
    );
  }
);

DollarAmountInput.displayName = "DollarAmountInput";
