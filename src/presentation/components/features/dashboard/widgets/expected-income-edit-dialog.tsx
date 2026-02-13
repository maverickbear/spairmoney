"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { DollarAmountInput } from "@/components/common/dollar-amount-input";
import { formatMoney } from "@/components/common/money";

interface MemberOption {
  id: string;
  memberId: string | null;
  name: string | null;
  email: string;
  isOwner?: boolean;
}

interface ExpectedIncomeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExpectedIncomeEditDialog({
  open,
  onOpenChange,
  onSuccess,
}: ExpectedIncomeEditDialogProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberIncomes, setMemberIncomes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalHouseholdIncome = useMemo(
    () => Object.values(memberIncomes).reduce((sum, amount) => sum + (amount || 0), 0),
    [memberIncomes]
  );

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open]);

  async function loadMembers() {
    if (!open) return;
    setLoading(true);
    try {
      const [membersRes, incomeRes] = await Promise.all([
        fetch("/api/v2/members", { cache: "no-store" }),
        fetch("/api/v2/onboarding/income"),
      ]);
      if (membersRes.ok) {
        const data = await membersRes.json();
        const list: MemberOption[] = data.members ?? [];
        setMembers(list);
        const initialIncomes: Record<string, number> = {};
        if (incomeRes.ok) {
          const incomeData = await incomeRes.json();
          const savedMemberIncomes = (incomeData.memberIncomes ?? {}) as Record<string, number>;
          list.forEach((m) => {
            const key = m.memberId ?? m.id;
            initialIncomes[key] = savedMemberIncomes[key] ?? 0;
          });
          if (Object.keys(savedMemberIncomes).length === 0 && (incomeData.expectedAnnualIncome ?? 0) > 0) {
            const currentTotal = incomeData.expectedAnnualIncome as number;
            if (list.length > 0) {
              const firstKey = list[0].memberId ?? list[0].id;
              initialIncomes[firstKey] = currentTotal;
            }
          }
        } else {
          list.forEach((m) => {
            const key = m.memberId ?? m.id;
            initialIncomes[key] = 0;
          });
        }
        setMemberIncomes(initialIncomes);
      }
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  }

  function setMemberIncome(memberKey: string, value: number | undefined) {
    setMemberIncomes((prev) => ({
      ...prev,
      [memberKey]: value ?? 0,
    }));
  }

  async function handleSave() {
    if (totalHouseholdIncome <= 0) {
      toast({
        title: "Enter household income",
        description: "Add the expected annual income for at least one member.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v2/onboarding/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedAnnualIncome: totalHouseholdIncome,
          memberIncomes: memberIncomes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast({
        title: "Income updated",
        description: "Household income has been saved.",
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Income</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Used to compare your spending with what you expect to earn this month. Enter each
            member&apos;s annual income; the total is used for the household.
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const key = member.memberId ?? member.id;
                const label = member.name || member.email || "Member";
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`income-${key}`} className="text-sm font-medium">
                      {label}
                    </Label>
                    <DollarAmountInput
                      id={`income-${key}`}
                      value={memberIncomes[key] || undefined}
                      onChange={(value) => setMemberIncome(key, value)}
                      placeholder="$ 0.00"
                      className="w-full"
                    />
                  </div>
                );
              })}
              {members.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">
                  No household members found. Add members in settings to enter their income.
                </p>
              )}
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-semibold">Total household income</Label>
                <div
                  className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium"
                  aria-readonly
                >
                  {formatMoney(totalHouseholdIncome)}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              loading ||
              totalHouseholdIncome <= 0 ||
              members.length === 0
            }
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
