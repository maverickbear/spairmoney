"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DollarAmountInput } from "@/components/common/dollar-amount-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

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

interface GoalTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  onConfirm: (amount: number, fromAccountId?: string) => Promise<void>;
  loading?: boolean;
}

export function GoalTopUpDialog({
  open,
  onOpenChange,
  goal,
  onConfirm,
  loading = false,
}: GoalTopUpDialogProps) {
  const t = useTranslations("planning");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  const needsFromAccount = Boolean(goal?.accountId);

  useEffect(() => {
    if (!open || !needsFromAccount) {
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
  }, [open, needsFromAccount]);

  const fromAccountOptions = needsFromAccount
    ? accounts.filter((a) => a.id !== goal?.accountId)
    : [];

  const handleSubmit = async () => {
    if (!goal || !amount || amount <= 0) {
      return;
    }
    if (needsFromAccount && !fromAccountId) {
      return;
    }
    await onConfirm(amount, needsFromAccount ? fromAccountId : undefined);
    setAmount(undefined);
    setFromAccountId("");
  };

  const handleClose = () => {
    if (!loading) {
      setAmount(undefined);
      setFromAccountId("");
      onOpenChange(false);
    }
  };

  const canSubmit =
    amount != null && amount > 0 && (!needsFromAccount || Boolean(fromAccountId));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addTopUp")}</DialogTitle>
          <DialogDescription>
            {t("addTopUpDescription", { name: goal?.name || t("thisGoal") })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-6">
          {needsFromAccount && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fromAccount")}</label>
              <Select
                value={fromAccountId}
                onValueChange={setFromAccountId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSourceAccount")} />
                </SelectTrigger>
                <SelectContent>
                  {fromAccountOptions.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("topUpTransferNote")}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("amount")}</label>
            <DollarAmountInput
              value={amount}
              onChange={setAmount}
              placeholder="$ 0.00"
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("adding")}
              </>
            ) : (
              t("addTopUpButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

