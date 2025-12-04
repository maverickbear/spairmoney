"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, TrendingUp, Home, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BudgetRuleType, BudgetRuleProfile } from "@/src/domain/budgets/budget-rules.types";

interface BudgetRuleSelectorProps {
  selectedRule?: BudgetRuleType;
  recommendedRule?: BudgetRuleType;
  onSelect: (rule: BudgetRuleProfile) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  loading?: boolean;
}

export function BudgetRuleSelector({
  selectedRule,
  recommendedRule,
  onSelect,
  onCancel,
  showCancel = false,
  loading = false,
}: BudgetRuleSelectorProps) {
  const [rules, setRules] = useState<BudgetRuleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState<BudgetRuleType | null>(null);

  useEffect(() => {
    async function loadRules() {
      try {
        const response = await fetch("/api/v2/budgets/rules");
        if (response.ok) {
          const data = await response.json();
          setRules(data);
        }
      } catch (error) {
        console.error("Error loading budget rules:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRules();
  }, []);

  const getRuleIcon = (ruleId: BudgetRuleType) => {
    switch (ruleId) {
      case "50_30_20":
        return <Sparkles className="h-5 w-5" />;
      case "40_30_20_10":
        return <Home className="h-5 w-5" />;
      case "60_FIXED":
        return <Users className="h-5 w-5" />;
      case "PAY_YOURSELF_FIRST":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const formatPercentages = (rule: BudgetRuleProfile): string => {
    const parts: string[] = [];
    
    if (rule.id === "50_30_20") {
      parts.push(`${(rule.percentages.needs * 100).toFixed(0)}% Needs`);
      parts.push(`${(rule.percentages.lifestyle * 100).toFixed(0)}% Lifestyle`);
      parts.push(`${(rule.percentages.future * 100).toFixed(0)}% Future`);
    } else if (rule.id === "40_30_20_10") {
      parts.push(`${(rule.percentages.housing * 100).toFixed(0)}% Housing`);
      parts.push(`${(rule.percentages.other_needs * 100).toFixed(0)}% Other Needs`);
      parts.push(`${(rule.percentages.future * 100).toFixed(0)}% Future`);
      parts.push(`${(rule.percentages.lifestyle * 100).toFixed(0)}% Lifestyle`);
    } else if (rule.id === "60_FIXED") {
      parts.push(`${(rule.percentages.needs * 100).toFixed(0)}% Fixed Costs`);
      parts.push(`${(rule.percentages.future * 100).toFixed(0)}% Future`);
      parts.push(`${(rule.percentages.lifestyle * 100).toFixed(0)}% Lifestyle`);
    } else if (rule.id === "PAY_YOURSELF_FIRST") {
      parts.push(`${(rule.percentages.future * 100).toFixed(0)}% Future First`);
      parts.push(`${(rule.percentages.needs * 100).toFixed(0)}% Needs`);
      parts.push(`${(rule.percentages.lifestyle * 100).toFixed(0)}% Lifestyle`);
    }
    
    return parts.join(" • ");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-muted-foreground">Loading budget rules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {rules.map((rule) => {
          const isSelected = selectedRule === rule.id;
          const isRecommended = recommendedRule === rule.id;
          const isExpanded = expandedRule === rule.id;

          const handleHeaderClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!loading) {
              onSelect(rule);
            }
          };

          const handleExpandClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            setExpandedRule(isExpanded ? null : rule.id);
          };

          return (
            <Card
              key={rule.id}
              className={cn(
                "transition-all hover:border-primary/50",
                isSelected && "border-primary border-2 bg-primary/5"
              )}
            >
              <CardHeader 
                className="p-4 md:p-5 pb-0 cursor-pointer"
                onClick={handleHeaderClick}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={handleExpandClick}
                      className={cn(
                        "p-1 rounded-md transition-transform hover:bg-muted flex-shrink-0",
                        isExpanded && "rotate-180"
                      )}
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <div className={cn(
                      "p-2 rounded-lg",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {getRuleIcon(rule.id)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-sm">{rule.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {isRecommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {rule.recommendedFor}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {formatPercentages(rule)}
                      </CardDescription>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="p-1 rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <CardContent className="pt-0 px-4 md:px-5 pb-4 md:pb-5">
                  <p className="text-sm text-muted-foreground">
                    {rule.description}
                  </p>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      {showCancel && onCancel && (
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

