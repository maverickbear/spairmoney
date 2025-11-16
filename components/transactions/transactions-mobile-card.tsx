"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/components/common/money";
import { formatTransactionDate, formatShortDate } from "@/lib/utils/timestamp";
import { Loader2, Repeat, Clock, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/api/transactions-client";

interface TransactionsMobileCardProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  onCategoryClick: () => void;
  onApplySuggestion?: () => void;
  onRejectSuggestion?: () => void;
  processingSuggestion?: boolean;
}

// Helper function to get initial from description
function getInitial(description: string | null | undefined): string {
  if (!description) return "T";
  const words = description.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return description[0].toUpperCase();
}

// Helper function to get color for avatar based on description
function getAvatarColor(description: string | null | undefined): string {
  if (!description) return "bg-gray-500";
  const colors = [
    "bg-green-500", "bg-blue-500", "bg-purple-500", "bg-pink-500",
    "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-indigo-500",
    "bg-teal-500", "bg-cyan-500"
  ];
  const hash = description.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function TransactionsMobileCard({
  transaction,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  deleting,
  onCategoryClick,
  onApplySuggestion,
  onRejectSuggestion,
  processingSuggestion,
}: TransactionsMobileCardProps) {
  const [logoError, setLogoError] = useState(false);
  const plaidMeta = transaction.plaidMetadata as any;
  const subcategory = transaction.subcategory as { id: string; name: string; logo?: string | null } | null | undefined;
  const logoUrl = (subcategory as any)?.logo;
  const description = transaction.description || "Transaction";
  const displayName = transaction.description || transaction.category?.name || "Transaction";
  const date = formatTransactionDate(transaction.date);
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent border-0 border-b border-border rounded-none shadow-none"
      onClick={onEdit}
    >
      <CardContent className="px-0 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar/Logo */}
          <div className="flex-shrink-0">
            {logoUrl && !logoError ? (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                getAvatarColor(description)
              )}>
                {getInitial(description)}
            </div>
                )}
            </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{displayName}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{date}</p>
          </div>

          {/* Amount */}
          <div className="flex-shrink-0">
                <span className={cn(
              "text-base font-medium",
              isIncome ? "text-green-600 dark:text-green-400" : 
              isExpense ? "text-red-600 dark:text-red-400" : 
              "text-foreground"
                )}>
              {formatMoney(transaction.amount)}
                  </span>
          </div>
            </div>

        {/* Category actions - shown on long press or swipe */}
        {transaction.suggestedCategoryId && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-muted-foreground italic flex-1">
              Suggested: {transaction.suggestedCategory?.name || "category"}
              </span>
            <div className="flex items-center gap-1">
                  {onRejectSuggestion && (
                    <Button
                      variant="outline"
                      size="icon"
                  className="h-8 w-8 rounded-[8px] border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectSuggestion();
                      }}
                      disabled={processingSuggestion}
                    >
                      {processingSuggestion ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                    <X className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  {onApplySuggestion && (
                    <Button
                      variant="outline"
                      size="icon"
                  className="h-8 w-8 rounded-[8px] border-green-300 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplySuggestion();
                      }}
                      disabled={processingSuggestion}
                    >
                      {processingSuggestion ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                    <Check className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

