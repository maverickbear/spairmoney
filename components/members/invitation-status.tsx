"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InvitationStatusProps {
  status: "pending" | "active" | "declined";
  className?: string;
}

export function InvitationStatus({ status, className }: InvitationStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        };
      case "active":
        return {
          label: "Active",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        };
      case "declined":
        return {
          label: "Declined",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}



