"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WidgetExpandableCardProps {
  label: string;
  value: string | React.ReactNode;
  subtitle?: string;
  pill?: {
    text: string;
    variant?: "default" | "positive" | "warning" | "negative";
  };
  visual?: React.ReactNode;
  expandedContent: React.ReactNode;
  title: string;
  description?: string;
  variant?: "card" | "flow";
  className?: string;
  modalWidth?: string;
}

export function WidgetExpandableCard({
  label,
  value,
  subtitle,
  pill,
  visual,
  expandedContent,
  title,
  description,
  variant = "card",
  className,
  modalWidth,
}: WidgetExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Simple card component since dashboard components were removed
  const SimpleCard = ({ label, value, subtitle, pill, visual }: {
    label: string;
    value: string | React.ReactNode;
    subtitle?: string;
    pill?: { text: string; variant?: "default" | "positive" | "warning" | "negative" };
    visual?: React.ReactNode;
  }) => (
    <div className="bg-card rounded-lg border border-border p-4">
      {label && <div className="text-sm text-muted-foreground mb-1">{label}</div>}
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
      {pill && (
        <div className={cn(
          "inline-block px-2 py-1 rounded text-xs mt-2",
          pill.variant === "positive" && "bg-green-100 text-sentiment-positive dark:bg-green-900 dark:text-sentiment-positive",
          pill.variant === "warning" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          pill.variant === "negative" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          !pill.variant && "bg-muted text-muted-foreground"
        )}>
          {pill.text}
        </div>
      )}
      {visual && <div className="mt-2">{visual}</div>}
    </div>
  );

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={cn("cursor-pointer transition-opacity hover:opacity-80", className)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-label={`View details for ${label}`}
      >
        <SimpleCard
          label={label}
          value={value}
          subtitle={subtitle}
          pill={pill}
          visual={visual}
        />
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className={cn(
            "w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l",
            modalWidth === "60%" ? "sm:max-w-[60%]" : !modalWidth ? "sm:max-w-2xl" : "sm:max-w-[600px]"
          )}
        >
          <SheetHeader className="p-6 pb-4 border-b shrink-0">
            <SheetTitle className="text-xl">{title}</SheetTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </SheetHeader>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {expandedContent}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

