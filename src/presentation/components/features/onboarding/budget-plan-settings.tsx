"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { BudgetRuleSelector } from "@/src/presentation/components/features/budgets/budget-rule-selector";
import { BudgetRuleType, BudgetRuleProfile } from "@/src/domain/budgets/budget-rules.types";

export function BudgetPlanSettings() {
  const { toast } = useToast();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [selectedBudgetRule, setSelectedBudgetRule] = useState<BudgetRuleType | undefined>(undefined);
  const [initialBudgetRule, setInitialBudgetRule] = useState<BudgetRuleType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentBudgetRule();
  }, []);

  async function loadCurrentBudgetRule() {
    try {
      setLoading(true);
      const response = await fetch("/api/v2/onboarding/budget-rule");
      if (response.ok) {
        const data = await response.json();
        if (data.budgetRule) {
          setSelectedBudgetRule(data.budgetRule);
          setInitialBudgetRule(data.budgetRule);
        }
      }
    } catch (error) {
      console.error("Error loading current budget rule:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedBudgetRule) {
      toast({
        title: t("pleaseSelectBudgetPlan"),
        description: t("pleaseSelectBudgetPlanDescription"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/v2/onboarding/budget-rule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ruleType: selectedBudgetRule }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("failedToSaveBudgetRule"));
      }

      setInitialBudgetRule(selectedBudgetRule);
      toast({
        title: t("budgetPlanUpdated"),
        description: t("budgetPlanUpdatedDescription"),
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving budget rule:", error);
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("failedToSaveBudgetPlan"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-0">
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0">
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("expensesRuleLabel")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("expensesRuleDescription")}
            </p>
          </div>
          <BudgetRuleSelector
            selectedRule={selectedBudgetRule}
            onSelect={(rule: BudgetRuleProfile) => setSelectedBudgetRule(rule.id)}
            loading={loading}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saving || !selectedBudgetRule || selectedBudgetRule === initialBudgetRule}
            size="medium"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("saveChanges")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

