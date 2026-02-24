"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InvitationStatusProps {
  status: "pending" | "active" | "declined";
  className?: string;
}

export function InvitationStatus({ status, className }: InvitationStatusProps) {
  const t = useTranslations("members");
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          label: t("pending"),
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        };
      case "active":
        return {
          label: t("active"),
          variant: "default" as const,
          className: "bg-green-100 text-sentiment-positive dark:bg-green-900 dark:text-sentiment-positive",
        };
      case "declined":
        return {
          label: t("declined"),
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



