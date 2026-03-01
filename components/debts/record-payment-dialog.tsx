"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { formatMoney } from "@/components/common/money";

interface Debt {
  id: string;
  name: string;
  currentBalance: number;
}

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
  onConfirm: (amount: number) => Promise<void>;
  loading?: boolean;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  debt,
  onConfirm,
  loading = false,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState<number | undefined>(undefined);

  const handleSubmit = async () => {
    if (!debt) return;

    if (amount == null || amount <= 0) {
      return;
    }

    await onConfirm(amount);
    setAmount(undefined);
  };

  const handleClose = () => {
    if (!loading) {
      setAmount(undefined);
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        } else {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {debt?.name || "this debt"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Amount</label>
            <DollarAmountInput
              value={amount}
              onChange={setAmount}
              disabled={loading}
            />
            {debt && (
              <p className="text-xs text-muted-foreground">
                Current balance: {formatMoney(debt.currentBalance)}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || amount == null || amount <= 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

