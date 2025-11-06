"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanFeatures } from "@/lib/validations/plan";
import { LimitCheckResult } from "@/lib/api/limits";

interface UsageLimitsProps {
  limits: PlanFeatures;
  transactionLimit: LimitCheckResult;
  accountLimit: LimitCheckResult;
}

export function UsageLimits({ limits, transactionLimit, accountLimit }: UsageLimitsProps) {
  const getProgress = (limit: LimitCheckResult) => {
    if (limit.limit === -1) return 0; // Unlimited
    return Math.min((limit.current / limit.limit) * 100, 100);
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return "Unlimited";
    return limit.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Limits</CardTitle>
        <CardDescription>Your current plan usage this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Transactions</span>
            <span>
              {transactionLimit.current} / {formatLimit(transactionLimit.limit)}
            </span>
          </div>
          {transactionLimit.limit !== -1 && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${getProgress(transactionLimit)}%` }}
              />
            </div>
          )}
          {transactionLimit.message && (
            <p className="text-sm text-muted-foreground">{transactionLimit.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Accounts</span>
            <span>
              {accountLimit.current} / {formatLimit(accountLimit.limit)}
            </span>
          </div>
          {accountLimit.limit !== -1 && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${getProgress(accountLimit)}%` }}
              />
            </div>
          )}
          {accountLimit.message && (
            <p className="text-sm text-muted-foreground">{accountLimit.message}</p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Investments</span>
            <span>{limits.hasInvestments ? "Enabled" : "Disabled"}</span>
          </div>
          <div className="flex justify-between">
            <span>Advanced Reports</span>
            <span>{limits.hasAdvancedReports ? "Enabled" : "Disabled"}</span>
          </div>
          <div className="flex justify-between">
            <span>CSV Export</span>
            <span>{limits.hasCsvExport ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

