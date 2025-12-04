"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DollarAmountInput } from "@/components/common/dollar-amount-input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { ExpectedIncomeRange } from "@/src/domain/onboarding/onboarding.types";

// Convert numeric value to ExpectedIncomeRange
function convertToIncomeRange(value: number): ExpectedIncomeRange {
  if (value < 50000) return "0-50k";
  if (value < 100000) return "50k-100k";
  if (value < 150000) return "100k-150k";
  if (value < 250000) return "150k-250k";
  return "250k+";
}

const INCOME_RANGES: Array<{ value: NonNullable<ExpectedIncomeRange>; label: string }> = [
  { value: "0-50k", label: "$0 - $50,000" },
  { value: "50k-100k", label: "$50,000 - $100,000" },
  { value: "100k-150k", label: "$100,000 - $150,000" },
  { value: "150k-250k", label: "$150,000 - $250,000" },
  { value: "250k+", label: "$250,000+" },
];

interface IncomeOnboardingFormProps {
  onSuccess?: () => void;
  hideCard?: boolean;
  showButtons?: boolean;
  onSkip?: () => void;
  onSubmit?: () => void;
  selectedIncome?: ExpectedIncomeRange | null;
  selectedCustomIncome?: number | null;
  onIncomeChange?: (income: ExpectedIncomeRange) => void;
  onCustomIncomeChange?: (amount: number | null) => void;
}

export function IncomeOnboardingForm({ 
  onSuccess, 
  hideCard = false, 
  showButtons = true,
  onSkip,
  onSubmit,
  selectedIncome: controlledSelectedIncome,
  selectedCustomIncome: controlledCustomIncome,
  onIncomeChange,
  onCustomIncomeChange
}: IncomeOnboardingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [internalSelectedIncome, setInternalSelectedIncome] = useState<ExpectedIncomeRange>(null);
  const [loading, setLoading] = useState(false);
  const [internalCustomIncome, setInternalCustomIncome] = useState<number | undefined>(undefined);
  const [useCustom, setUseCustom] = useState(false);
  const customIncomeInputRef = useRef<HTMLInputElement>(null);

  // Use controlled or internal state
  const selectedIncome = controlledSelectedIncome !== undefined ? controlledSelectedIncome : internalSelectedIncome;
  const customIncome = controlledCustomIncome !== undefined ? controlledCustomIncome : internalCustomIncome;

  // Update when selectedIncome changes externally
  useEffect(() => {
    if (controlledSelectedIncome !== undefined && !useCustom) {
      if (onCustomIncomeChange) {
        onCustomIncomeChange(null);
      } else {
        setInternalCustomIncome(undefined);
      }
    }
  }, [controlledSelectedIncome, useCustom, onCustomIncomeChange]);

  // Focus the input when custom option is selected
  useEffect(() => {
    if (useCustom && customIncomeInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        customIncomeInputRef.current?.focus();
      }, 100);
    }
  }, [useCustom]);
  
  function handleIncomeChange(value: string) {
    if (value === "custom") {
      setUseCustom(true);
      return;
    }
    
    setUseCustom(false);
    if (onCustomIncomeChange) {
      onCustomIncomeChange(null);
    } else {
      setInternalCustomIncome(undefined);
    }
    const incomeValue = value as ExpectedIncomeRange;
    if (onIncomeChange) {
      onIncomeChange(incomeValue);
    } else {
      setInternalSelectedIncome(incomeValue);
    }
  }

  function handleCustomIncomeChange(value: number | undefined) {
    if (onCustomIncomeChange) {
      onCustomIncomeChange(value ?? null);
    } else {
      setInternalCustomIncome(value);
    }
    // Convert custom value to nearest range only if we have a valid value
    if (value !== undefined && value > 0) {
      const incomeRange = convertToIncomeRange(value);
      if (onIncomeChange) {
        onIncomeChange(incomeRange);
      } else {
        setInternalSelectedIncome(incomeRange);
      }
    }
  }

  async function handleSubmit() {
    if (useCustom && (!customIncome || customIncome <= 0)) {
      toast({
        title: "Please enter your annual household income",
        description: "Enter your expected annual household income to personalize your dashboard.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedIncome && !useCustom) {
      toast({
        title: "Please select an income range",
        description: "Select your expected annual household income to personalize your dashboard.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const requestBody: { incomeRange: ExpectedIncomeRange; incomeAmount?: number | null } = {
        incomeRange: selectedIncome,
      };
      
      // Include custom amount if user provided one
      if (useCustom && customIncome && customIncome > 0) {
        requestBody.incomeAmount = customIncome;
      }

      const response = await fetch("/api/v2/onboarding/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save income");
      }

      toast({
        title: "Income saved",
        description: "Your dashboard has been personalized based on your expected income.",
        variant: "success",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error saving income:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save income. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard");
    }
  }

  const incomeRangeDisplay = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INCOME_RANGES.map((range) => {
          const isSelected = !useCustom && selectedIncome === range.value;
          return (
            <Card
              key={range.value}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                isSelected && "border-primary border-2 bg-primary/5"
              )}
              onClick={() => handleIncomeChange(range.value)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium">{range.label}</span>
                {isSelected && (
                  <div className="p-1 rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            useCustom && "border-primary border-2 bg-primary/5"
          )}
          onClick={() => handleIncomeChange("custom")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">Custom amount</span>
            {useCustom && (
              <div className="p-1 rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {useCustom && (
        <div className="pt-2">
          <Label htmlFor="custom-income" className="text-sm text-muted-foreground mb-1 block">
            Enter your annual household income
          </Label>
          <DollarAmountInput
            ref={customIncomeInputRef}
            id="custom-income"
            value={customIncome || undefined}
            onChange={handleCustomIncomeChange}
            placeholder="$ 0.00"
            className="w-full"
          />
        </div>
      )}
    </div>
  );

  const buttons = showButtons && (
    <div className="flex gap-3 pt-4">
      <Button
        onClick={onSubmit || handleSubmit}
        disabled={loading || (!selectedIncome && !(useCustom && customIncome && customIncome > 0))}
        className="flex-1"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Continue"
        )}
      </Button>
      <Button
        onClick={onSkip || handleSkip}
        variant="outline"
        disabled={loading}
      >
        Skip
      </Button>
    </div>
  );

  const content = (
    <div className={`space-y-6 ${hideCard ? 'px-0' : ''}`}>
      {incomeRangeDisplay}
      {buttons}
    </div>
  );

  if (hideCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual Household Income</CardTitle>
        <CardDescription>
          Used to tailor your budgets and insights. Not shared with anyone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

