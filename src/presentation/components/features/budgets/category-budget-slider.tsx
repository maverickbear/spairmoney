"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/components/common/money";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/components/toast-provider";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  subcategories?: Array<{
    id: string;
    name: string;
  }>;
}

interface Budget {
  id: string;
  amount: number;
  categoryId?: string | null;
  subcategoryId?: string | null;
}

interface CategoryBudgetSliderProps {
  category: Category;
  budget: Budget | null;
  subcategoryBudgets: Budget[];
  period: Date;
  onBudgetChange?: () => void;
  maxAmount?: number;
  step?: number;
}

export function CategoryBudgetSlider({
  category,
  budget,
  subcategoryBudgets,
  period,
  onBudgetChange,
  maxAmount = 10000,
  step = 50,
}: CategoryBudgetSliderProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState(budget?.amount || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localValue, setLocalValue] = useState(budget?.amount || 0);
  const [subcategoryValues, setSubcategoryValues] = useState<Map<string, number>>(new Map());
  const [lastProcessedValue, setLastProcessedValue] = useState<number | null>(null);

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  // Initialize subcategory values from budgets
  useEffect(() => {
    if (hasSubcategories) {
      const initialValues = new Map<string, number>();
      category.subcategories?.forEach((subcat) => {
        const subcatBudget = subcategoryBudgets.find((b) => b.subcategoryId === subcat.id);
        initialValues.set(subcat.id, subcatBudget?.amount || 0);
      });
      setSubcategoryValues(initialValues);
    }
  }, [category.subcategories, subcategoryBudgets, hasSubcategories]);

  // Debounce the value to avoid too many API calls
  const debouncedValue = useDebounce(localValue, 500);

  // Update local value when budget changes externally (only when budget prop changes, not during user interaction)
  useEffect(() => {
    const budgetAmount = budget?.amount || 0;
    
    // Don't update during active updates to avoid conflicts
    if (isUpdating) {
      return;
    }
    
    // Don't sync if we just processed this value (to avoid loops)
    if (lastProcessedValue !== null && lastProcessedValue === budgetAmount) {
      return;
    }
    
    // Don't sync if we're in the middle of saving a different value
    // This prevents resetting the slider while saving
    // If lastProcessedValue is set and different from budgetAmount, we're saving
    if (lastProcessedValue !== null && lastProcessedValue !== budgetAmount) {
      return;
    }
    
    // Sync when budget prop changes (from parent reload)
    // Only sync if the budget amount is different from current local value
    // This prevents resetting the slider while the user is interacting with it
    if (budgetAmount !== localValue) {
      // Sync if the difference is significant (more than just rounding)
      // This prevents unnecessary updates from API responses
      const difference = Math.abs(budgetAmount - localValue);
      if (difference > 0.01) {
        setValue(budgetAmount);
        setLocalValue(budgetAmount);
        setLastProcessedValue(budgetAmount);
      }
    }
  }, [budget?.amount, budget?.id, isUpdating, localValue, lastProcessedValue]);

  // Handle budget create/update when debounced value changes
  useEffect(() => {
    const currentBudgetAmount = budget?.amount || 0;
    
    // Skip if we already processed this value
    if (lastProcessedValue === debouncedValue) {
      return;
    }
    
    // Skip if the debounced value matches the current budget amount (no change needed)
    if (debouncedValue === currentBudgetAmount) {
      setLastProcessedValue(debouncedValue);
      return;
    }
    
    // Skip if we're currently updating to avoid race conditions
    if (isUpdating) {
      return;
    }

    const updateBudget = async () => {
      setLastProcessedValue(debouncedValue);
      setIsUpdating(true);
      try {
        // Always update or create budget, even if value is 0
        // This keeps the budget in the database and avoids deletion/recreation issues
        if (budget?.id) {
          // Update existing budget
          const response = await fetch(`/api/v2/budgets/${budget.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: debouncedValue }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Failed to update budget" }));
            throw new Error(error.error || "Failed to update budget");
          }
        } else {
          // Create new budget
          const periodStart = new Date(period.getFullYear(), period.getMonth(), 1);
          const response = await fetch("/api/v2/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              period: periodStart.toISOString(),
              categoryId: category.id,
              amount: debouncedValue,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Failed to create budget" }));
            // If budget already exists (409), reload data to get the existing budget
            // The next slider movement will update the existing budget
            if (response.status === 409) {
              // Budget already exists, reload data to get the existing budget
              if (onBudgetChange) {
                await onBudgetChange();
              }
              // Reset local value to current budget amount to prevent retry
              setLocalValue(budget?.amount || 0);
              setLastProcessedValue(budget?.amount || null);
              return;
            }
            throw new Error(errorData.error || "Failed to create budget");
          }
        }

        // If category has subcategories and budget was just created (not updated), distribute budget
        // Only distribute if there are no existing subcategory budgets and amount > 0
        if (hasSubcategories && debouncedValue > 0 && !budget?.id) {
          const hasExistingSubcategoryBudgets = subcategoryBudgets.length > 0;
          if (!hasExistingSubcategoryBudgets) {
            await distributeBudgetToSubcategories(debouncedValue);
          }
        }

        // Update the displayed value
        setValue(debouncedValue);
        setLocalValue(debouncedValue);
        setLastProcessedValue(debouncedValue);
        
        // Set updating to false before any reload
        setIsUpdating(false);
        
        // Only reload if we created a new budget (to get the budget ID)
        // For updates, we don't need to reload - the state is already updated
        // This prevents the slider from freezing during user interaction
        if (!budget?.id && debouncedValue > 0) {
          // New budget was created, reload to get the budget ID
          if (onBudgetChange) {
            await onBudgetChange();
          }
        }
      } catch (error) {
        console.error("Error updating budget:", error);
        // Revert to previous value on error
        setLocalValue(budget?.amount || 0);
        setLastProcessedValue(budget?.amount || null);
        
        // If it's a 409 error (already exists), reload data to get the existing budget
        if (error instanceof Error && error.message.includes("already exists")) {
          setIsUpdating(false);
          if (onBudgetChange) {
            await onBudgetChange();
          }
          return;
        }
        
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update budget",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    };

    updateBudget();
  }, [debouncedValue, budget, category.id, period, onBudgetChange, toast, value, hasSubcategories, subcategoryBudgets, isUpdating, lastProcessedValue]);

  // Distribute budget to subcategories
  const distributeBudgetToSubcategories = async (totalAmount: number) => {
    if (!hasSubcategories || !category.subcategories) return;

    const subcategoryCount = category.subcategories.length;
    const amountPerSubcategory = Math.floor(totalAmount / subcategoryCount);
    const remainder = totalAmount % subcategoryCount;

    const periodStart = new Date(period.getFullYear(), period.getMonth(), 1);

    // Create/update budgets for each subcategory
    for (let i = 0; i < category.subcategories.length; i++) {
      const subcat = category.subcategories[i];
      const subcatAmount = amountPerSubcategory + (i < remainder ? 1 : 0);
      
      const existingBudget = subcategoryBudgets.find((b) => b.subcategoryId === subcat.id);

      try {
        if (existingBudget) {
          // Update existing budget
          await fetch(`/api/v2/budgets/${existingBudget.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: subcatAmount }),
          });
        } else if (subcatAmount > 0) {
          // Create new budget
          await fetch("/api/v2/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              period: periodStart.toISOString(),
              categoryId: category.id,
              subcategoryId: subcat.id,
              amount: subcatAmount,
            }),
          });
        }
      } catch (error) {
        console.error(`Error creating/updating budget for subcategory ${subcat.id}:`, error);
      }
    }
  };

  const handleSliderChange = useCallback((newValue: number[]) => {
    const newAmount = newValue[0];
    // Update local value immediately for responsive UI
    setLocalValue(newAmount);
    setValue(newAmount);
  }, []);

  const handleSubcategorySliderChange = useCallback(async (subcategoryId: string, newValue: number[]) => {
    const newAmount = newValue[0];
    setSubcategoryValues((prev) => {
      const next = new Map(prev);
      next.set(subcategoryId, newAmount);
      return next;
    });

    // Debounce subcategory updates
    setTimeout(async () => {
      const existingBudget = subcategoryBudgets.find((b) => b.subcategoryId === subcategoryId);
      const periodStart = new Date(period.getFullYear(), period.getMonth(), 1);

      try {
        if (newAmount === 0) {
          // Delete budget if amount is 0
          if (existingBudget?.id) {
            await fetch(`/api/v2/budgets/${existingBudget.id}`, {
              method: "DELETE",
            });
          }
        } else if (existingBudget) {
          // Update existing budget
          await fetch(`/api/v2/budgets/${existingBudget.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: newAmount }),
          });
        } else {
          // Create new budget
          await fetch("/api/v2/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              period: periodStart.toISOString(),
              categoryId: category.id,
              subcategoryId: subcategoryId,
              amount: newAmount,
            }),
          });
        }

        if (onBudgetChange) {
          onBudgetChange();
        }
      } catch (error) {
        console.error(`Error updating subcategory budget:`, error);
        toast({
          title: "Error",
          description: "Failed to update subcategory budget",
          variant: "destructive",
        });
      }
    }, 500);
  }, [subcategoryBudgets, period, category.id, onBudgetChange, toast]);

  const totalSubcategoryBudget = Array.from(subcategoryValues.values()).reduce((sum, val) => sum + val, 0);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1">
                <h3 className="font-medium text-sm">{category.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatMoney(localValue)}
                  {hasSubcategories && totalSubcategoryBudget > 0 && (
                    <span className="ml-2">
                      ({formatMoney(totalSubcategoryBudget)} in subcategories)
                    </span>
                  )}
                </p>
              </div>
              {hasSubcategories && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {isUpdating && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <Slider
              value={[localValue]}
              onValueChange={handleSliderChange}
              min={0}
              max={maxAmount}
              step={step}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatMoney(0)}</span>
              <span>{formatMoney(maxAmount)}</span>
            </div>
          </div>

          {/* Subcategories */}
          {hasSubcategories && isExpanded && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground">Subcategories</h4>
              {category.subcategories?.map((subcat) => {
                const subcatBudget = subcategoryBudgets.find((b) => b.subcategoryId === subcat.id);
                const subcatValue = subcategoryValues.get(subcat.id) || subcatBudget?.amount || 0;
                
                return (
                  <div key={subcat.id} className="space-y-2 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium">{subcat.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatMoney(subcatValue)}
                        </p>
                      </div>
                    </div>
                    <Slider
                      value={[subcatValue]}
                      onValueChange={(val) => handleSubcategorySliderChange(subcat.id, val)}
                      min={0}
                      max={Math.max(localValue, maxAmount)}
                      step={step}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatMoney(0)}</span>
                      <span>{formatMoney(Math.max(localValue, maxAmount))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
