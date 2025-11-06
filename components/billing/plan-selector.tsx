"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plan } from "@/lib/validations/plan";
import { Check, Star } from "lucide-react";
import { useState } from "react";

interface PlanSelectorProps {
  plans: Plan[];
  currentPlanId?: string;
  onSelectPlan: (planId: string, interval: "month" | "year") => void;
  loading?: boolean;
  showComparison?: boolean;
}

export function PlanSelector({ plans, currentPlanId, onSelectPlan, loading, showComparison = false }: PlanSelectorProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const sortedPlans = [...plans].sort((a, b) => {
    const order = { free: 0, basic: 1, premium: 2 };
    return (order[a.name] || 0) - (order[b.name] || 0);
  });

  // Only show interval selector for paid plans
  const hasPaidPlans = sortedPlans.some(p => p.priceMonthly > 0);

  return (
    <div className="space-y-6">
      {hasPaidPlans && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-[12px] border p-1 bg-muted">
            <button
              type="button"
              onClick={() => setInterval("month")}
              className={`px-4 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                interval === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("year")}
              className={`px-4 py-2 rounded-[12px] text-sm font-medium transition-colors flex items-center gap-2 ${
                interval === "year"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px] px-1.5 py-0 h-4 font-semibold">
                10% OFF
              </Badge>
            </button>
          </div>
        </div>
      )}

      {showComparison ? (
        // Comparison table view
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Features</th>
                  {sortedPlans.map((plan) => (
                    <th key={plan.id} className="px-6 py-3 text-center text-sm font-semibold text-foreground">
                      {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-6 py-4 text-sm text-foreground">Price</td>
                  {sortedPlans.map((plan) => {
                    const monthlyPrice = plan.priceMonthly;
                    const yearlyPrice = plan.priceYearly;
                    const hasDiscount = interval === "year" && yearlyPrice > 0;
                    const discountedPrice = hasDiscount ? yearlyPrice * 0.9 : yearlyPrice;
                    const price = interval === "month" ? monthlyPrice : discountedPrice;
                    const originalYearlyPrice = interval === "year" && yearlyPrice > 0 ? yearlyPrice : null;
                    return (
                      <td key={plan.id} className="px-6 py-4 text-center text-sm">
                        {hasDiscount && originalYearlyPrice && (
                          <div className="mb-1">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs mb-1">
                              10% OFF
                            </Badge>
                            <div>
                              <span className="text-muted-foreground text-xs line-through mr-1">
                                ${originalYearlyPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                        <span className="text-2xl font-bold">
                          {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                        </span>
                        {price > 0 && (
                          <span className="text-muted-foreground text-xs block">
                            /{interval === "month" ? "month" : "year"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-foreground">Transactions</td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-center text-sm">
                      {plan.features.maxTransactions === -1 ? "Unlimited" : plan.features.maxTransactions}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-foreground">Accounts</td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-center text-sm">
                      {plan.features.maxAccounts === -1 ? "Unlimited" : plan.features.maxAccounts}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-foreground">Investments</td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {plan.features.hasInvestments ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-foreground">Advanced Reports</td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {plan.features.hasAdvancedReports ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-foreground">CSV Export</td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {plan.features.hasCsvExport ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-foreground">Debts Tracking</td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {plan.features.hasDebts ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-foreground">Goals Tracking</td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {plan.features.hasGoals ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4"></td>
                  {sortedPlans.map((plan) => {
                    const price = interval === "month" ? plan.priceMonthly : plan.priceYearly;
                    const isCurrent = plan.id === currentPlanId;
                    return (
                      <td key={plan.id} className="px-6 py-4">
                        <Button
                          className="w-full"
                          variant={plan.name === "premium" ? "default" : "outline"}
                          disabled={isCurrent || loading}
                          onClick={() => onSelectPlan(plan.id, interval)}
                        >
                          {isCurrent ? "Current Plan" : price === 0 ? "Get Started" : "Subscribe"}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Card view
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => {
            const monthlyPrice = plan.priceMonthly;
            const yearlyPrice = plan.priceYearly;
            const hasDiscount = interval === "year" && yearlyPrice > 0;
            const discountedPrice = hasDiscount ? yearlyPrice * 0.9 : yearlyPrice;
            const price = interval === "month" ? monthlyPrice : discountedPrice;
            const originalYearlyPrice = interval === "year" && yearlyPrice > 0 ? yearlyPrice : null;
            const isCurrent = plan.id === currentPlanId;
            const features = [
              `${plan.features.maxTransactions === -1 ? "Unlimited" : plan.features.maxTransactions} transactions/month`,
              `${plan.features.maxAccounts === -1 ? "Unlimited" : plan.features.maxAccounts} accounts`,
              plan.features.hasInvestments && "Investments",
              plan.features.hasAdvancedReports && "Advanced reports",
              plan.features.hasCsvExport && "CSV export",
              plan.features.hasDebts && "Debts tracking",
              plan.features.hasGoals && "Goals tracking",
            ].filter(Boolean);

            const isPopular = plan.name === "basic";
            const isPremium = plan.name === "premium";
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${isPopular ? "border-primary shadow-lg ring-2 ring-primary ring-offset-2" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-6">
                  <CardTitle className="flex items-center justify-between text-2xl">
                    <span>{plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} {plan.name === "basic" && "Plan"}</span>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {plan.name === "free" && "Perfect for getting started with your financial management"}
                    {plan.name === "basic" && "For personal use with essential features"}
                    {plan.name === "premium" && "For power users who need advanced features"}
                  </CardDescription>
                  <div className="mt-6">
                    {hasDiscount && originalYearlyPrice && (
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          10% OFF
                        </Badge>
                        <span className="text-sm text-muted-foreground line-through">
                          ${originalYearlyPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">
                        {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground text-lg">
                          /{interval === "month" ? "month" : "year"}
                        </span>
                      )}
                    </div>
                    {price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {interval === "month" 
                          ? "Per month" 
                          : hasDiscount 
                            ? `Save $${(originalYearlyPrice! - discountedPrice).toFixed(2)} per year` 
                            : "Billed annually"}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button
                    className="w-full h-12 text-base font-semibold"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrent || loading}
                    onClick={() => onSelectPlan(plan.id, interval)}
                  >
                    {isCurrent ? "Current Plan" : price === 0 ? "Get Started" : "Subscribe"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

