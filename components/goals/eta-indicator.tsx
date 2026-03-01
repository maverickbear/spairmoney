"use client";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/components/common/money";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ETAIndicatorProps {
  monthsToGoal: number | null;
  incomeBasis: number;
  className?: string;
}

export function ETAIndicator({
  monthsToGoal,
  incomeBasis,
  className,
}: ETAIndicatorProps) {
  if (monthsToGoal === null) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No ETA available
      </div>
    );
  }

  if (monthsToGoal === 0) {
    return (
      <div className={cn("text-sm font-semibold text-sentiment-positive", className)}>
        Goal reached!
      </div>
    );
  }

  const years = Math.floor(monthsToGoal / 12);
  const months = Math.round(monthsToGoal % 12);

  let displayText = "";
  if (years > 0 && months > 0) {
    displayText = `${years} year${years > 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""}`;
  } else if (years > 0) {
    displayText = `${years} year${years > 1 ? "s" : ""}`;
  } else {
    displayText = `${months} month${months !== 1 ? "s" : ""}`;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1 cursor-help", className)}>
            <span className="text-sm font-medium">ETA: {displayText}</span>
            <Info className="h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Based on your last 3 months average income ({formatMoney(incomeBasis)})
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

