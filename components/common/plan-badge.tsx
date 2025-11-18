"use client";

import { Badge } from "@/components/ui/badge";

interface PlanBadgeProps {
  plan: "essential" | "pro";
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const variants = {
    essential: "default",
    pro: "default",
  } as const;

  const labels = {
    essential: "Essential",
    pro: "Pro",
  };

  return (
    <Badge variant={variants[plan]} className={className}>
      {labels[plan]}
    </Badge>
  );
}

