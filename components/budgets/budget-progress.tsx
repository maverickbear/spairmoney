"use client";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/components/common/money";

interface BudgetProgressProps {
  budget: number;
  actual: number;
  percentage: number;
  status: "ok" | "warning" | "over";
  className?: string;
}

export function BudgetProgress({
  budget,
  actual,
  percentage,
  status,
  className,
}: BudgetProgressProps) {
  const getStatusColor = () => {
    if (status === "over") return "bg-destructive";
    if (status === "warning") return "bg-yellow-500";
    return "bg-green-500";
  };

  const clampedPercentage = Math.min(percentage, 100);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {formatMoney(actual)} / {formatMoney(budget)}
        </span>
        <span
          className={cn(
            "font-semibold",
            status === "over" && "text-destructive",
            status === "warning" && "text-yellow-500",
            status === "ok" && "text-green-500"
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            getStatusColor()
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}

