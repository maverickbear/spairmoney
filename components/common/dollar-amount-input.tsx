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

  if (decimalPart !== "") {
    return `${sign}${formattedInteger}.${decimalPart}`;
  }

  return `${sign}${formattedInteger}`;
}

/**
 * Parses a formatted string back to a number.
 * Strips the currency prefix, then removes locale grouping (commas or periods) and parses.
 */
function parseInputValue(value: string, prefix: string): number | undefined {
  const withoutPrefix = value.startsWith(prefix) ? value.slice(prefix.length) : value;
  const cleaned = withoutPrefix.replace(/,/g, "").replace(/\s/g, "").trim();

  if (cleaned === "" || cleaned === ".") {
    return undefined;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Amount input that uses the app's display currency symbol and locale for formatting.
 */
export const DollarAmountInput = React.forwardRef<HTMLInputElement, DollarAmountInputProps>(
  ({ value, onChange, onBlur, className, placeholder, ...props }, ref) => {
    const locale = getDisplayCurrencyLocale();
    const prefix = React.useMemo(() => getCurrencySymbol().replace(/\s+$/, "") + " ", []);
    const prefixLen = prefix.length;

    const defaultPlaceholder = `${prefix}0.00`;
    const resolvedPlaceholder = placeholder ?? defaultPlaceholder;

    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      const formatted = formatDisplayValue(value, locale);
      if (formatted !== "") {
        return `${prefix}${formatted}`;
      } else if (value === 0 || value === "0") {
        return `${prefix}${formatDisplayValue(0, locale)}`;
      }
      return "";
    });
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    // Update display value when value prop changes (only when not focused)
    React.useEffect(() => {
      if (!isFocused) {
        const formatted = formatDisplayValue(value, locale);
        if (formatted !== "") {
          setDisplayValue(`${prefix}${formatted}`);
        } else if (value === 0 || value === "0") {
          setDisplayValue(`${prefix}${formatDisplayValue(0, locale)}`);
        } else {
          setDisplayValue("");
        }
      }
    }, [value, isFocused, locale, prefix]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (!displayValue || displayValue === "" || displayValue.trim() === "") {
        setDisplayValue(prefix);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(prefixLen, prefixLen);
          }
        }, 0);
      }
      props.onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cursorPosition = e.target.selectionStart || 0;

      // Always ensure currency prefix is present when user is typing
      if (!inputValue.startsWith(prefix)) {
        if (inputValue === "" || inputValue.trim() === "") {
          setDisplayValue(prefix);
          onChange?.(undefined);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(prefixLen, prefixLen);
            }
          }, 0);
          return;
        }
        const cleaned = inputValue.replace(/,/g, "").trim();
        if (cleaned === "" || cleaned === ".") {
          setDisplayValue(prefix);
          onChange?.(undefined);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(prefixLen, prefixLen);
            }
          }, 0);
          return;
        }
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          const formatted = formatDisplayValue(parsed, locale);
          setDisplayValue(`${prefix}${formatted}`);
          onChange?.(parsed);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange((prefix + formatted).length, (prefix + formatted).length);
            }
          }, 0);
        } else {
          setDisplayValue(`${prefix}${cleaned}`);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange((prefix + cleaned).length, (prefix + cleaned).length);
            }
          }, 0);
        }
        return;
      }

      const valueWithoutPrefix = inputValue.slice(prefixLen);
      const cleaned = valueWithoutPrefix.replace(/,/g, "").trim();
      
      // Allow digits, single decimal point, and optional negative sign
      const validPattern = /^-?\d*\.?\d*$/;

      if (!validPattern.test(cleaned)) {
        return; // Don't update if invalid
      }

      // Parse the cleaned value
      const parsed = parseInputValue(inputValue, prefix);
      
      // Explicitly handle "0" case - parseFloat("0") returns 0, which is valid
      const isZero = cleaned === "0" || cleaned === "-0" || parsed === 0;

      // Format in real-time: format integer part with commas while typing
      if (cleaned !== "") {
        // Handle decimal point: add '.00' automatically, but replace with user input if they type
        const parts = cleaned.split(".");
        const hasDecimal = parts.length === 2;
        const integerPart = parts[0] || "";
        const decimalPart = parts[1] || "";
        
        // Check if user just typed '.' (has decimal point but no decimal digits yet)
        if (hasDecimal && decimalPart === "" && integerPart !== "" && integerPart !== "-") {
          const valueWithCents = `${integerPart}.00`;
          const formatted = formatIntegerPart(valueWithCents, locale);
          setDisplayValue(`${prefix}${formatted}`);
          
          setTimeout(() => {
            if (inputRef.current) {
              const decimalPos = formatted.indexOf(".");
              if (decimalPos !== -1) {
                inputRef.current.setSelectionRange(prefixLen + decimalPos + 3, prefixLen + decimalPos + 3);
              }
            }
          }, 0);
          
          const parsedWithCents = parseFloat(valueWithCents);
          if (!isNaN(parsedWithCents) && isFinite(parsedWithCents)) {
            onChange?.(parsedWithCents);
          }
          return;
        }
        
        if (hasDecimal && decimalPart !== "") {
          const limitedDecimalPart = decimalPart.slice(0, 2);
          const valueToFormat = `${integerPart}.${limitedDecimalPart}`;
          const formatted = formatIntegerPart(valueToFormat, locale);
          setDisplayValue(`${prefix}${formatted}`);
          
          // Calculate cursor position
          const cursorInCleaned = Math.max(0, cursorPosition - prefixLen);
          const cleanedBeforeCursor = cleaned.slice(0, Math.min(cursorInCleaned, cleaned.length));
          const digitCountBeforeCursor = cleanedBeforeCursor.replace(/[^\d]/g, "").length;
          const hasDecimalBeforeCursor = cleanedBeforeCursor.includes(".");
          
          // Find position in formatted string
          let newCursorPos = prefixLen;
          let digitCount = 0;
          let foundPosition = false;
          
          for (let i = 0; i < formatted.length; i++) {
            const char = formatted[i];
            if (/\d/.test(char)) {
              digitCount++;
              if (digitCount > digitCountBeforeCursor) {
                newCursorPos = prefixLen + i;
                foundPosition = true;
                break;
              }
              newCursorPos = prefixLen + i + 1;
            } else if (char === ".") {
              if (hasDecimalBeforeCursor && digitCount === digitCountBeforeCursor) {
                newCursorPos = prefixLen + i;
                foundPosition = true;
                break;
              }
              newCursorPos = prefixLen + i + 1;
            } else if (char === "," || char === " ") {
              newCursorPos = prefixLen + i + 1;
            }
          }
          
          if (cursorPosition >= inputValue.length || !foundPosition) {
            newCursorPos = prefixLen + formatted.length;
          }
          
          setTimeout(() => {
            if (inputRef.current) {
              const pos = Math.min(Math.max(prefixLen, newCursorPos), prefixLen + formatted.length);
              inputRef.current.setSelectionRange(pos, pos);
            }
          }, 0);
          
          const parsed = parseFloat(valueToFormat);
          if (!isNaN(parsed) && isFinite(parsed)) {
            onChange?.(parsed);
          }
          return;
        }
        
        // Format the integer part with commas in real-time
        const formatted = formatIntegerPart(cleaned, locale);
        setDisplayValue(`${prefix}${formatted}`);
        
        const cursorInCleaned = Math.max(0, cursorPosition - prefixLen);
        const cleanedBeforeCursor = cleaned.slice(0, Math.min(cursorInCleaned, cleaned.length));
        const digitCountBeforeCursor = cleanedBeforeCursor.replace(/[^\d]/g, "").length;
        const hasDecimalBeforeCursor = cleanedBeforeCursor.includes(".");
        
        let newCursorPos = prefixLen;
        let digitCount = 0;
        let foundPosition = false;
        
        for (let i = 0; i < formatted.length; i++) {
          const char = formatted[i];
          if (/\d/.test(char)) {
            digitCount++;
            if (digitCount > digitCountBeforeCursor) {
              newCursorPos = prefixLen + i;
              foundPosition = true;
              break;
            }
            newCursorPos = prefixLen + i + 1;
          } else if (char === ".") {
            if (hasDecimalBeforeCursor && digitCount === digitCountBeforeCursor) {
              newCursorPos = prefixLen + i;
              foundPosition = true;
              break;
            }
            newCursorPos = prefixLen + i + 1;
          } else if (char === "," || char === " ") {
            newCursorPos = prefixLen + i + 1;
          }
        }
        
        if (cursorPosition >= inputValue.length || !foundPosition) {
          newCursorPos = prefixLen + formatted.length;
        }
        
        setTimeout(() => {
          if (inputRef.current) {
            const pos = Math.min(Math.max(prefixLen, newCursorPos), prefixLen + formatted.length);
            inputRef.current.setSelectionRange(pos, pos);
          }
        }, 0);
        
        if (isZero) {
          onChange?.(0);
        } else if (parsed !== undefined && !isNaN(parsed) && isFinite(parsed)) {
          onChange?.(parsed);
        }
      } else {
        setDisplayValue(prefix);
        onChange?.(undefined);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const parsed = parseInputValue(displayValue, prefix);
      const numericPart = displayValue.startsWith(prefix) ? displayValue.slice(prefixLen).replace(/,/g, "").replace(/\s/g, "").trim() : "";
      const isZeroValue = parsed === 0 || numericPart === "0" || numericPart === "0." || numericPart === "0.0" || numericPart === "0.00";
      
      if (parsed !== undefined || isZeroValue) {
        const valueToFormat = parsed !== undefined ? parsed : 0;
        const formatted = formatDisplayValue(valueToFormat, locale);
        setDisplayValue(`${prefix}${formatted}`);
        onChange?.(valueToFormat);
      } else {
        setDisplayValue("");
        onChange?.(undefined);
      }
      onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;

      // Prevent deleting currency prefix
      if (cursorPosition <= prefixLen && selectionEnd <= prefixLen) {
        if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(prefixLen, prefixLen);
            }
          }, 0);
          return;
        }
      }

      if (e.key === "ArrowLeft" && cursorPosition <= prefixLen) {
        e.preventDefault();
        input.setSelectionRange(prefixLen, prefixLen);
        return;
      }

      if (e.key === "Home") {
        e.preventDefault();
        input.setSelectionRange(prefixLen, prefixLen);
        return;
      }
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const selectionStart = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;

      // If selection includes currency prefix, adjust it
      if (selectionStart < prefixLen || selectionEnd < prefixLen) {
        const newStart = Math.max(prefixLen, selectionStart);
        const newEnd = Math.max(prefixLen, selectionEnd);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(newStart, newEnd);
          }
        }, 0);
      }
    };

    return (
      <Input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        placeholder={resolvedPlaceholder}
        className={cn(className)}
        {...props}
      />
    );
  }
);

DollarAmountInput.displayName = "DollarAmountInput";

