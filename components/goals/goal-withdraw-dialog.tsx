"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatMoney } from "@/components/common/money";

interface Goal {
  id: string;
  name: string;
  currentBalance: number;
  accountId?: string | null;
}

interface AccountOption {
  id: string;
  name: string;
  type: string;
}

interface GoalWithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  onConfirm: (amount: number, toAccountId?: string) => Promise<void>;
  loading?: boolean;
}

export function GoalWithdrawDialog({
  open,
  onOpenChange,
  goal,
  onConfirm,
  loading = false,
}: GoalWithdrawDialogProps) {
  const t = useTranslations("planning");
  const [amount, setAmount] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  const needsToAccount = Boolean(goal?.accountId);

  useEffect(() => {
    if (!open || !needsToAccount) {
      setAccounts([]);
      return;
    }
    let cancelled = false;
    fetch("/api/v2/accounts?includeHoldings=false")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: AccountOption[]) => {
        if (!cancelled) setAccounts(list);
      })
      .catch(() => {
        if (!cancelled) setAccounts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, needsToAccount]);

  const toAccountOptions = needsToAccount
    ? accounts.filter((a) => a.id !== goal?.accountId)
    : [];

  const handleSubmit = async () => {
    if (!goal) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }
    if (needsToAccount && !toAccountId) {
      return;
    }

    await onConfirm(amountNum, needsToAccount ? toAccountId : undefined);
    setAmount("");
    setToAccountId("");
  };

  const handleClose = () => {
    if (!loading) {
      setAmount("");
      setToAccountId("");
      onOpenChange(false);
    }
  };

  const canSubmit =
    amount.trim() !== "" &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    (!needsToAccount || Boolean(toAccountId));

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l"
      >
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-xl">{t("withdrawFromGoal")}</SheetTitle>
          <SheetDescription>
            {t("withdrawDescription", { name: goal?.name || t("thisGoal") })}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {needsToAccount && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("toAccount")}</label>
                  <Select
                    value={toAccountId}
                    onValueChange={setToAccountId}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectDestinationAccount")} />
                    </SelectTrigger>
                    <SelectContent>
                      {toAccountOptions.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("withdrawTransferNote")}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("amount")}</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                />
                {goal && (
                  <p className="text-xs text-muted-foreground">
                    {t("currentBalanceLabel")}: {formatMoney(goal.currentBalance)}
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex flex-wrap justify-end gap-2 shrink-0 bg-background">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("withdrawing")}
                </>
              ) : (
                t("withdraw")
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

