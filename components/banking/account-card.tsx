"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Loader2, Star } from "lucide-react";
import { formatMoney } from "@/components/common/money";
import { cn } from "@/lib/utils";
import { getInitials, isValidAvatarUrl } from "@/lib/utils/avatar";

interface AccountOwnerInfo {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface AccountCardProps {
  account: {
    id: string;
    name: string;
    type: string;
    balance: number;
    creditLimit?: number | null;
    householdName?: string | null;
    owners?: AccountOwnerInfo[];
    ownerName?: string | null;
    ownerAvatarUrl?: string | null;
    institutionName?: string | null;
    institutionLogo?: string | null;
    isDefault?: boolean;
  };
  onEdit?: (accountId: string) => void;
  onSetDefault?: (accountId: string) => void;
  onDelete?: (accountId: string) => void;
  deletingId?: string | null;
  canDelete?: boolean;
  canEdit?: boolean;
}

export function AccountCard({
  account,
  onEdit,
  onSetDefault,
  onDelete,
  deletingId,
  canDelete = true,
  canEdit = true,
}: AccountCardProps) {
  const t = useTranslations("accounts");
  const isCreditCard = account.type === "credit" && account.creditLimit;
  const available = isCreditCard 
    ? (account.creditLimit! + account.balance) 
    : null;

  return (
    <Card className="transition-all flex flex-col">
      <CardHeader className="pb-3 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold truncate">{account.name}</CardTitle>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {onSetDefault && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(account.id);
                }}
                title={account.isDefault ? t("defaultAccount") : t("setAsDefault")}
                className={cn(
                  account.isDefault ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"
                )}
                disabled={account.isDefault}
              >
                <Star className={cn("h-3.5 w-3.5", account.isDefault && "fill-current")} />
              </Button>
            )}
            {onEdit && canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(account.id);
                }}
                title={t("editAccount")}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(account.id);
                }}
                disabled={deletingId === account.id}
                title={t("deleteAccount")}
              >
                {deletingId === account.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="capitalize text-sm px-1.5 py-0.5">
            {account.type}
          </Badge>
          {account.householdName && (
            <div className="flex items-center">
              <div className="flex items-center -space-x-2 flex-shrink-0">
                {(account.owners && account.owners.length > 0
                  ? account.owners
                  : [
                      {
                        id: "",
                        name: account.ownerName ?? account.householdName,
                        avatarUrl: account.ownerAvatarUrl ?? null,
                      },
                    ]
                ).map((owner, idx) => (
                  <div key={owner.id || `owner-${idx}`} className="relative flex-shrink-0">
                    {isValidAvatarUrl(owner.avatarUrl) ? (
                      <>
                        <Image
                          src={owner.avatarUrl!}
                          alt={owner.name || "Owner"}
                          width={32}
                          height={32}
                          unoptimized
                          className="h-8 w-8 rounded-full object-cover border-2 border-background"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = "none";
                            const fallback = img.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground hidden items-center justify-center text-sm font-semibold border-2 border-background absolute top-0 left-0">
                          {getInitials(owner.name)}
                        </div>
                      </>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border-2 border-background">
                        {getInitials(owner.name)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex-1 p-4 pt-0">
        <div className="space-y-2">
          {isCreditCard ? (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-sm text-muted-foreground mb-0.5">Balance</div>
                <div className={cn(
                  "text-sm font-bold",
                  account.balance >= 0 
                    ? "text-sentiment-positive" 
                    : "text-red-600 dark:text-red-400"
                )}>
                  {formatMoney(account.balance)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-0.5">Credit Limit</div>
                <div className="text-sm font-semibold">
                  {formatMoney(account.creditLimit!)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-0.5">Available</div>
                <div className={cn(
                  "text-sm font-semibold",
                  available !== null && available >= 0
                    ? "text-sentiment-positive"
                    : "text-red-600 dark:text-red-400"
                )}>
                  {available !== null ? formatMoney(available) : "-"}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm text-muted-foreground mb-0.5">Balance</div>
              <div className={cn(
                "text-lg font-bold",
                account.balance >= 0 
                  ? "text-sentiment-positive" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {formatMoney(account.balance)}
              </div>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
}

