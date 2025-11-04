import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface MoneyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (props, ref) => {
    const { className, placeholder, value, onChange, onKeyDown, ...restProps } = props;
    // Always use "0.00" as placeholder for money fields
    const moneyPlaceholder = placeholder || "0.00";
    
    // Helper function to convert value to string
    const valueToString = (val: unknown): string => {
      if (val === undefined || val === null || val === "") {
        return "";
      } else if (typeof val === "number") {
        if (isNaN(val) || !isFinite(val)) {
          return "";
        }
        return val.toString();
    } else {
        return String(val);
      }
    };
    
    // Use internal state to track the string value during typing
    // This allows us to maintain partial input like "123." without react-hook-form converting to NaN
    // Initialize as empty string - only show value if explicitly provided and valid
    const [internalValue, setInternalValue] = React.useState<string>(() => {
      // Only initialize with value if it's explicitly provided and valid
      if (value === undefined || value === null || value === "") {
        return "";
    }
      // For numbers, only show if valid (not NaN, not 0 unless explicitly set)
      if (typeof value === "number") {
        if (isNaN(value) || !isFinite(value)) {
          return "";
        }
        return value.toString();
      }
      // For strings, show only if not empty
      const str = String(value);
      return str || "";
    });
    const inputRef = React.useRef<HTMLInputElement>(null);
    const isTypingRef = React.useRef<boolean>(false);
    
    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    
    // Sync external value to internal state when it changes from outside
    // Only sync when value is a valid number or valid string, not when it's NaN (which happens during typing)
    React.useEffect(() => {
      // Don't sync if user is currently typing (will be reset by handleChange)
      if (isTypingRef.current) {
        return;
      }
      
      // If value is NaN (happens during typing with valueAsNumber), don't sync
      if (typeof value === "number" && (isNaN(value) || !isFinite(value))) {
        return; // Keep current internal value
      }
      
      // If value is 0, treat as empty (don't show 0 as initial value)
      if (typeof value === "number" && value === 0) {
        setInternalValue("");
        return;
      }
      
      const newValue = valueToString(value);
      
      // Only update if different to avoid unnecessary re-renders
      setInternalValue(prev => prev !== newValue ? newValue : prev);
    }, [value]);
    
    // Handle value changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      isTypingRef.current = true;
      setInternalValue(newValue);
      
      // Call the original onChange (which will be from react-hook-form)
      if (onChange) {
        onChange(e);
      }
      
      // Reset typing flag after a delay to allow react-hook-form to process
      // Use a longer delay to ensure react-hook-form has time to update
      setTimeout(() => {
        isTypingRef.current = false;
      }, 300);
    };
    
    // Handle key down events - simplified to not block typing
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Call custom onKeyDown if provided
      if (onKeyDown) {
        onKeyDown(e);
      }
      
      // Allow all keys by default - validation happens on input
      // Only prevent if explicitly needed
      if (e.key === 'Enter' && e.ctrlKey) {
        // Allow Ctrl+Enter
        return;
      }
    };
    
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          CAD
        </span>
        <Input
          type="text"
          inputMode="decimal"
          placeholder={moneyPlaceholder}
          className={cn("pl-12", className)}
          ref={inputRef}
          {...restProps}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }
);

MoneyInput.displayName = "MoneyInput";

export { MoneyInput };

