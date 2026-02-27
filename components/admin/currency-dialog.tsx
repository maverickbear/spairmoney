"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCurrencySchema, type CreateCurrencyInput } from "@/src/domain/currency/currency.validations";
import type { CurrencyRow } from "@/src/infrastructure/database/repositories/currency.repository";

interface CurrencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: CurrencyRow | null;
  onSuccess: (currency: CurrencyRow) => void;
}

export function CurrencyDialog({
  open,
  onOpenChange,
  currency,
  onSuccess,
}: CurrencyDialogProps) {
  const isEdit = !!currency;

  const form = useForm<CreateCurrencyInput>({
    resolver: zodResolver(createCurrencySchema),
    defaultValues: {
      code: "",
      name: "",
      locale: "en-US",
      isActive: true,
      sortOrder: 999,
    },
  });

  useEffect(() => {
    if (currency) {
      form.reset({
        code: currency.code,
        name: currency.name,
        locale: currency.locale,
        isActive: currency.isActive,
        sortOrder: currency.sortOrder,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        locale: "en-US",
        isActive: true,
        sortOrder: 999,
      });
    }
  }, [currency, open, form]);

  async function onSubmit(data: CreateCurrencyInput) {
    try {
      const url = "/api/v2/admin/currencies";
      if (isEdit) {
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: data.code,
            name: data.name,
            locale: data.locale,
            isActive: data.isActive,
            sortOrder: data.sortOrder,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update currency");
        }
        const { currency: updated } = await res.json();
        onSuccess(updated);
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create currency");
        }
        const { currency: created } = await res.json();
        onSuccess(created);
      }
      onOpenChange(false);
    } catch (e) {
      form.setError("root", { message: e instanceof Error ? e.message : "Request failed" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Currency" : "Add Currency"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update name, locale, or visibility. Code cannot be changed."
              : "Add a new display currency. Code must be 3-letter ISO 4217 (e.g. EUR, GBP)."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code (ISO 4217)</Label>
            <Input
              id="code"
              {...form.register("code")}
              placeholder="e.g. EUR"
              maxLength={3}
              className="uppercase"
              disabled={isEdit}
            />
            {form.formState.errors.code && (
              <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g. Euro"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Input
              id="locale"
              {...form.register("locale")}
              placeholder="e.g. en-US, en-CA"
            />
            {form.formState.errors.locale && (
              <p className="text-xs text-destructive">{form.formState.errors.locale.message}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active (visible to users)</Label>
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(v) => form.setValue("isActive", v)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              {...form.register("sortOrder", { valueAsNumber: true })}
            />
            {form.formState.errors.sortOrder && (
              <p className="text-xs text-destructive">{form.formState.errors.sortOrder.message}</p>
            )}
          </div>
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
