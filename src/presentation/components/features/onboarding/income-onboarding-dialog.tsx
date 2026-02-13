"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { IncomeOnboardingForm } from "./income-onboarding-form";
import { BudgetRuleSelector } from "@/src/presentation/components/features/budgets/budget-rule-selector";
import { useToast } from "@/components/toast-provider";
import { BudgetRuleType } from "@/src/domain/budgets/budget-rules.types";

interface IncomeOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function IncomeOnboardingDialog({
  open,
  onOpenChange,
  onSuccess,
}: IncomeOnboardingDialogProps) {
  const { toast } = useToast();
  const [expectedAnnualIncome, setExpectedAnnualIncome] = useState<number | null>(null);
  const [selectedRule, setSelectedRule] = useState<BudgetRuleType | undefined>(undefined);
  const [recommendedRule, setRecommendedRule] = useState<BudgetRuleType | undefined>(undefined);
  const [step, setStep] = useState<"income" | "rule">("income");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("income");
      setExpectedAnnualIncome(null);
      setSelectedRule(undefined);
      setRecommendedRule(undefined);
    }
  }, [open]);

  useEffect(() => {
    if (expectedAnnualIncome != null && expectedAnnualIncome > 0 && step === "income") {
      async function getRecommendedRule() {
        try {
          const response = await fetch(
            `/api/v2/budgets/rules/suggest?expectedAnnualIncome=${expectedAnnualIncome}`
          );
          if (response.ok) {
            const data = await response.json();
            setRecommendedRule(data.rule.id);
          }
        } catch (error) {
          console.error("Error getting recommended rule:", error);
        }
      }
      getRecommendedRule();
    }
  }, [expectedAnnualIncome, step]);

  async function handleIncomeNext() {
    if (expectedAnnualIncome == null || expectedAnnualIncome <= 0) {
      toast({
        title: "Please enter your annual income",
        description:
          "Enter your expected annual household income to personalize your dashboard.",
        variant: "destructive",
      });
      return;
    }
    setStep("rule");
  }

  async function handleSubmit() {
    if (expectedAnnualIncome == null || expectedAnnualIncome <= 0) {
      toast({
        title: "Please enter your annual income",
        description:
          "Enter your expected annual household income to personalize your dashboard.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/v2/onboarding/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expectedAnnualIncome }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save income");
      }

      if (selectedRule) {
        const ruleResponse = await fetch("/api/v2/onboarding/budget-rule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ruleType: selectedRule }),
        });
        if (!ruleResponse.ok) {
          const error = await ruleResponse.json();
          throw new Error(error.error || "Failed to save budget rule");
        }
      }

      toast({
        title: "Income saved",
        description:
          "Your dashboard has been personalized based on your expected income and budget rule.",
        variant: "success",
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving income:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save income. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>
            {step === "income"
              ? "Annual Household Income"
              : "Choose Your Budget Rule"}
          </DialogTitle>
          <DialogDescription>
            {step === "income"
              ? "Used to tailor your budgets and insights. Not shared with anyone."
              : "Select a budget rule that fits your lifestyle. We'll automatically generate budgets based on your income."}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 px-6 pb-4">
          {step === "income" ? (
            <IncomeOnboardingForm
              hideCard
              showButtons={false}
              selectedExpectedAnnualIncome={expectedAnnualIncome}
              onExpectedAnnualIncomeChange={setExpectedAnnualIncome}
            />
          ) : (
            <BudgetRuleSelector
              selectedRule={selectedRule}
              recommendedRule={recommendedRule}
              onSelect={(rule) => setSelectedRule(rule.id)}
              loading={loading}
            />
          )}
        </div>
        <DialogFooter>
          <div className="flex gap-2 w-full sm:w-auto">
            {step === "rule" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("income")}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={step === "income" ? handleIncomeNext : handleSubmit}
              disabled={
                loading ||
                (step === "income" &&
                  (expectedAnnualIncome == null || expectedAnnualIncome <= 0)) ||
                (step === "rule" && !selectedRule)
              }
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : step === "income" ? (
                "Next"
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
