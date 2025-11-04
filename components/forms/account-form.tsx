"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema, AccountFormData } from "@/lib/validations/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/common/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";

interface Account {
  id: string;
  name: string;
  type: string;
  creditLimit?: number | null;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onSuccess?: () => void;
}

export function AccountForm({ open, onOpenChange, account, onSuccess }: AccountFormProps) {
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "checking",
      creditLimit: undefined,
    },
  });
  
  const accountType = form.watch("type");

  useEffect(() => {
    if (open) {
      if (account) {
        form.reset({
          name: account.name,
          type: account.type as "cash" | "checking" | "savings" | "credit" | "investment" | "other",
          creditLimit: account.creditLimit ?? undefined,
        });
      } else {
        form.reset({
          name: "",
          type: "checking",
          creditLimit: undefined,
        });
      }
    }
  }, [open, account, form]);

  async function onSubmit(data: AccountFormData) {
    try {
      const url = account ? `/api/accounts/${account.id}` : "/api/accounts";
      const method = account ? "PATCH" : "POST";

      // Prepare data: only include creditLimit if type is credit
      const payload: AccountFormData = {
        name: data.name,
        type: data.type,
        ...(data.type === "credit" && data.creditLimit !== undefined 
          ? { creditLimit: data.creditLimit } 
          : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to save account");
      }

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving account:", error);
      alert(error instanceof Error ? error.message : "Failed to save account");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Edit" : "Add"} Account</DialogTitle>
          <DialogDescription>
            {account ? "Update the account details" : "Create a new account"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input {...form.register("name")} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => {
                form.setValue("type", value as "checking" | "savings" | "credit" | "cash" | "investment" | "other");
                // Clear credit limit when changing away from credit type
                if (value !== "credit") {
                  form.setValue("creditLimit", undefined);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accountType === "credit" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Limit</label>
              <MoneyInput
                min="0"
                {...form.register("creditLimit", { 
                  valueAsNumber: true,
                  setValueAs: (value) => {
                    if (value === "" || value === null || value === undefined) {
                      return undefined;
                    }
                    const num = Number(value);
                    return isNaN(num) ? undefined : num;
                  }
                })}
              />
              {form.formState.errors.creditLimit && (
                <p className="text-sm text-red-500">{form.formState.errors.creditLimit.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

