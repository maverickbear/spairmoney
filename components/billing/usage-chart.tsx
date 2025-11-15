"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanFeatures } from "@/lib/validations/plan";
import { LimitCheckResult } from "@/lib/api/limits";

interface UsageChartProps {
  limits?: PlanFeatures;
  transactionLimit?: LimitCheckResult;
  accountLimit?: LimitCheckResult;
}

export function UsageChart({ limits, transactionLimit, accountLimit }: UsageChartProps) {
  // Default values when data is loading
  const defaultTransactionLimit: LimitCheckResult = { allowed: true, limit: 0, current: 0 };
  const defaultAccountLimit: LimitCheckResult = { allowed: true, limit: 0, current: 0 };
  
  const txLimit = transactionLimit || defaultTransactionLimit;
  const accLimit = accountLimit || defaultAccountLimit;

  // Calculate individual usage percentages
  const getTransactionUsagePercentage = () => {
    if (txLimit.limit === -1) return 0;
    if (txLimit.limit === 0) return 0;
    return Math.min((txLimit.current / txLimit.limit) * 100, 100);
  };

  const getAccountUsagePercentage = () => {
    if (accLimit.limit === -1) return 0;
    if (accLimit.limit === 0) return 0;
    return Math.min((accLimit.current / accLimit.limit) * 100, 100);
  };

  const transactionUsagePercentage = getTransactionUsagePercentage();
  const accountUsagePercentage = getAccountUsagePercentage();

  const formatLimit = (limit: number) => {
    if (limit === -1) return "Unlimited";
    return limit.toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pl-6 pr-6 pb-6 pt-0">
        {/* Transactions Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Transactions (this month)</span>
            <span className="text-muted-foreground">
              {txLimit.current.toLocaleString()} / {formatLimit(txLimit.limit)}
            </span>
          </div>
          
          {txLimit.limit !== -1 && (
            <div className="w-full h-4 bg-muted rounded-lg overflow-hidden relative">
              <div 
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${Math.min(transactionUsagePercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Accounts Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Accounts</span>
            <span className="text-muted-foreground">
              {accLimit.current.toLocaleString()} / {formatLimit(accLimit.limit)}
            </span>
          </div>
          
          {accLimit.limit !== -1 && (
            <div className="w-full h-4 bg-muted rounded-lg overflow-hidden relative">
              <div 
                className="bg-pink-500 h-full transition-all"
                style={{ width: `${Math.min(accountUsagePercentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

