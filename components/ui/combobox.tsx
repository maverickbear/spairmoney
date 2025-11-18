"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxItem {
  id: string;
  name: string;
  [key: string]: any;
}

export interface ComboboxGroup {
  id: string;
  name: string;
  items: ComboboxItem[];
}

export interface ComboboxProps {
  items?: ComboboxItem[];
  groups?: ComboboxGroup[];
  value?: string | null;
  onChange?: (value: string | null, item: ComboboxItem | null) => void;
  onSearchChange?: (searchTerm: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
  allowCustomValue?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  renderItem?: (item: ComboboxItem) => React.ReactNode;
  renderGroupHeader?: (group: ComboboxGroup) => React.ReactNode;
  onCreateNew?: () => void;
  createNewLabel?: string;
}

const sizeClasses = {
  small: {
    button: "px-3 py-1.5 text-sm",
    input: "px-3 py-1.5 text-sm",
    item: "px-3 py-2 text-sm",
    icon: "w-4 h-4",
  },
  medium: {
    button: "px-4 py-2.5 text-sm",
    input: "px-4 py-2 text-sm",
    item: "px-4 py-2.5 text-sm",
    icon: "w-4 h-4",
  },
  large: {
    button: "px-4 py-3 text-base",
    input: "px-4 py-2.5 text-base",
    item: "px-4 py-3 text-base",
    icon: "w-5 h-5",
  },
};

export function Combobox({
  items = [],
  groups,
  value,
  onChange,
  onSearchChange,
  placeholder = "Select or type...",
  searchPlaceholder = "Search or type...",
  emptyMessage = "No items found.",
  noResultsMessage = "No matches found.",
  allowCustomValue = true,
  size = "medium",
  className,
  disabled = false,
  showClearButton = true,
  renderItem,
  renderGroupHeader,
  onCreateNew,
  createNewLabel = "Create New",
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeConfig = sizeClasses[size];

  // Get selected item
  const selectedItem = React.useMemo(() => {
    if (!value) return null;
    
    // Search in items
    if (items.length > 0) {
      return items.find((item) => item.id === value) || null;
    }
    
    // Search in groups
    if (groups) {
      for (const group of groups) {
        const item = group.items.find((item) => item.id === value);
        if (item) return item;
      }
    }
    
    return null;
  }, [value, items, groups]);

  // Filter items/groups based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return { items, groups };
    }

    const searchLower = searchTerm.toLowerCase();

    if (groups) {
      const filteredGroups: ComboboxGroup[] = groups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.name.toLowerCase().includes(searchLower) ||
              group.name.toLowerCase().includes(searchLower)
          ),
        }))
        .filter((group) => group.items.length > 0);

      return { items: [], groups: filteredGroups };
    }

    const filteredItems = items.filter((item) =>
      item.name.toLowerCase().includes(searchLower)
    );

    return { items: filteredItems, groups: undefined };
  }, [searchTerm, items, groups]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Sync search term with selected value when opening
  useEffect(() => {
    if (isOpen && selectedItem) {
      setSearchTerm(selectedItem.name);
    } else if (isOpen && !selectedItem && value) {
      setSearchTerm(value);
    } else if (isOpen && !selectedItem && !value) {
      setSearchTerm("");
    }
  }, [isOpen, selectedItem, value]);

  const handleSelect = (item: ComboboxItem) => {
    onChange?.(item.id, item);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange?.(null, null);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    onSearchChange?.(newSearchTerm);

    // If allowing custom values, update the value as user types
    if (allowCustomValue) {
      // Check if it matches an existing item
      const matchesItem = items.some(
        (item) => item.name.toLowerCase() === newSearchTerm.toLowerCase()
      );
      
      if (groups) {
        const matchesGroupItem = groups.some((group) =>
          group.items.some(
            (item) => item.name.toLowerCase() === newSearchTerm.toLowerCase()
          )
        );
        if (!matchesGroupItem && newSearchTerm) {
          onChange?.(newSearchTerm, null);
        }
      } else if (!matchesItem && newSearchTerm) {
        onChange?.(newSearchTerm, null);
      }
    }
  };

  const displayValue = selectedItem?.name || value || "";

  return (
    <div className={cn("relative", className)} ref={comboboxRef}>
      {/* Combobox Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between bg-background border border-input rounded-lg text-left transition-all",
          "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeConfig.button
        )}
      >
        <span
          className={cn(
            "truncate flex-1",
            displayValue ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showClearButton && displayValue && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-muted rounded transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear();
                }
              }}
            >
              <X className={cn("text-muted-foreground", sizeConfig.icon)} />
            </div>
          )}
          <ChevronDown
            className={cn(
              "text-muted-foreground transition-transform",
              sizeConfig.icon,
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-2 bg-popover border border-input rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-border bg-muted/50">
            <div className="relative">
              <Search
                className={cn(
                  "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10 pointer-events-none",
                  sizeConfig.icon
                )}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
                className={cn(
                  "w-full pr-4 border border-input rounded-md bg-background",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  size === "small" ? "pl-10" : size === "medium" ? "pl-11" : "pl-12",
                  sizeConfig.input
                )}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="max-h-64 overflow-y-auto">
            {(() => {
              const hasGroups = filteredData.groups && filteredData.groups.length > 0;
              const hasItems = filteredData.items && filteredData.items.length > 0;
              const hasResults = hasGroups || hasItems;

              if (!hasResults && !searchTerm.trim()) {
                return (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </div>
                );
              }

              if (!hasResults && searchTerm.trim()) {
                return (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {noResultsMessage}
                    {allowCustomValue && searchTerm && (
                      <div className="mt-2 text-xs">
                        Press Enter to use "{searchTerm}"
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div>
                  {/* Render Groups */}
                  {hasGroups &&
                    filteredData.groups!.map((group) => (
                      <div key={group.id}>
                        {renderGroupHeader ? (
                          renderGroupHeader(group)
                        ) : (
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted/30">
                            {group.name}
                          </div>
                        )}
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className={cn(
                              "w-full flex items-center justify-between text-left hover:bg-muted transition-colors",
                              sizeConfig.item,
                              value === item.id && "bg-accent"
                            )}
                          >
                            {renderItem ? (
                              renderItem(item)
                            ) : (
                              <span className="font-medium text-foreground">
                                {item.name}
                              </span>
                            )}
                            {value === item.id && (
                              <Check
                                className={cn(
                                  "text-primary flex-shrink-0 ml-2",
                                  sizeConfig.icon
                                )}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}

                  {/* Render Items (no groups) */}
                  {!hasGroups &&
                    hasItems &&
                    filteredData.items!.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "w-full flex items-center justify-between text-left hover:bg-muted transition-colors",
                          sizeConfig.item,
                          value === item.id && "bg-accent"
                        )}
                      >
                        {renderItem ? (
                          renderItem(item)
                        ) : (
                          <span className="font-medium text-foreground">
                            {item.name}
                          </span>
                        )}
                        {value === item.id && (
                          <Check
                            className={cn(
                              "text-primary flex-shrink-0 ml-2",
                              sizeConfig.icon
                            )}
                          />
                        )}
                      </button>
                    ))}

                  {/* Create New Button */}
                  {onCreateNew && (
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNew();
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 text-left hover:bg-muted transition-colors",
                        sizeConfig.item
                      )}
                    >
                      <Plus className={sizeConfig.icon} />
                      <span>{createNewLabel}</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

