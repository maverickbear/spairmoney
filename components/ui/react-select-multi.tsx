"use client";

import React from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
import { cn } from "@/lib/utils";

export interface ReactSelectOption {
  value: string;
  label: string;
}

interface ReactSelectMultiProps {
  options: ReactSelectOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
}

const customStyles: StylesConfig<ReactSelectOption, true> = {
  control: (base, state) => ({
    ...base,
    minHeight: "40px",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
    boxShadow: state.isFocused ? "0 0 0 2px hsl(var(--ring))" : "none",
    "&:hover": {
      borderColor: "hsl(var(--ring))",
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--secondary))",
    borderRadius: "calc(var(--radius) - 2px)",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "hsl(var(--secondary-foreground))",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "hsl(var(--secondary-foreground))",
    borderRadius: "0 calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0",
    "&:hover": {
      backgroundColor: "hsl(var(--destructive))",
      color: "hsl(var(--destructive-foreground))",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "calc(var(--radius) - 2px)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
      ? "hsl(var(--accent))"
      : "transparent",
    color: state.isSelected
      ? "hsl(var(--primary-foreground))"
      : "hsl(var(--foreground))",
    "&:active": {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
};

export function ReactSelectMulti({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  isDisabled = false,
  className,
}: ReactSelectMultiProps) {
  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => value.includes(option.value));
  }, [options, value]);

  const handleChange = (newValue: MultiValue<ReactSelectOption>) => {
    const selectedValues = newValue ? newValue.map((option) => option.value) : [];
    onChange(selectedValues);
  };

  return (
    <div className={cn("w-full", className)}>
      <Select<ReactSelectOption, true>
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        styles={customStyles}
        classNamePrefix="react-select"
        classNames={{
          control: () => "!border-input !bg-background",
          menu: () => "!bg-popover",
          option: () => "!cursor-pointer",
        }}
      />
    </div>
  );
}

