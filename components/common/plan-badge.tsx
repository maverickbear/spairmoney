"use client";

import { Badge } from "@/components/ui/badge";

interface PlanBadgeProps {
  plan: "free" | "basic" | "premium";
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const variants = {
    free: "secondary",
    basic: "default",
    premium: "default",
  } as const;

  const labels = {
    free: "Free",
    basic: "Basic",
    premium: "Premium",
  };

  return (
    <Badge variant={variants[plan]} className={className}>
      {labels[plan]}
    </Badge>
  );
}

