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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { DollarAmountInput } from "@/components/common/dollar-amount-input";
import { formatMoney } from "@/components/common/money";

// Country / state-province options for tax calculation
const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "District of Columbia" },
];
const CANADIAN_PROVINCES = [
  { value: "AB", label: "Alberta" }, { value: "BC", label: "British Columbia" }, { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" }, { value: "NL", label: "Newfoundland and Labrador" }, { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" }, { value: "NU", label: "Nunavut" }, { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" }, { value: "QC", label: "Quebec" }, { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

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
  const [country, setCountry] = useState<"US" | "CA">("US");
  const [stateOrProvince, setStateOrProvince] = useState<string | null>(null);
  const [monthlyAfterTax, setMonthlyAfterTax] = useState<number | null>(null);
  const [loadingAfterTax, setLoadingAfterTax] = useState(false);
  const [taxDetail, setTaxDetail] = useState<{
    federalBrackets: Array<{ min: number; max: number | null; rate: number }>;
    stateOrProvincialRate: number;
  } | null>(null);

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
      const [membersRes, incomeRes, locationRes] = await Promise.all([
        fetch("/api/v2/members", { cache: "no-store" }),
        fetch("/api/v2/onboarding/income"),
        fetch("/api/v2/onboarding/location"),
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
      if (locationRes.ok) {
        const loc = await locationRes.json();
        if (loc.country) {
          setCountry(loc.country === "CA" ? "CA" : "US");
          setStateOrProvince(loc.stateOrProvince || null);
        }
      }
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch monthly after-tax and tax brackets when income and location are set
  useEffect(() => {
    if (!open || totalHouseholdIncome <= 0 || !stateOrProvince) {
      setMonthlyAfterTax(null);
      setTaxDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingAfterTax(true);
    setMonthlyAfterTax(null);
    setTaxDetail(null);
    fetch("/api/v2/taxes/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country,
        stateOrProvince,
        annualIncome: totalHouseholdIncome,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to calculate"))))
      .then(
        (result: {
          afterTaxIncome?: number;
          federalBrackets?: Array<{ min: number; max: number | null; rate: number }>;
          stateOrProvincialRate?: number;
        }) => {
          if (cancelled) return;
          if (result?.afterTaxIncome != null) {
            setMonthlyAfterTax(Math.round((result.afterTaxIncome / 12) * 100) / 100);
          }
          if (
            result?.federalBrackets?.length &&
            result.stateOrProvincialRate != null
          ) {
            setTaxDetail({
              federalBrackets: result.federalBrackets,
              stateOrProvincialRate: result.stateOrProvincialRate,
            });
          } else if (result?.federalBrackets?.length) {
            setTaxDetail({
              federalBrackets: result.federalBrackets,
              stateOrProvincialRate: 0,
            });
          }
        }
      )
      .catch(() => {
        if (!cancelled) {
          setMonthlyAfterTax(null);
          setTaxDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAfterTax(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, totalHouseholdIncome, country, stateOrProvince]);

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

      if (country && stateOrProvince) {
        const locRes = await fetch("/api/v2/onboarding/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country, stateOrProvince }),
        });
        if (!locRes.ok) {
          const err = await locRes.json();
          throw new Error(err.error || "Failed to save location");
        }
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
        <div className="px-6 pt-4 pb-4 space-y-4">
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
              {/* Location for tax calculation */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Country</Label>
                <p className="text-xs text-muted-foreground">
                  Select your country and state/province so we can calculate monthly after-tax income.
                </p>
                <Tabs
                  value={country}
                  onValueChange={(v) => {
                    setCountry(v as "US" | "CA");
                    setStateOrProvince(null);
                  }}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="US" className="w-full">United States</TabsTrigger>
                    <TabsTrigger value="CA" className="w-full">Canada</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {country === "US" ? "State" : "Province / Territory"}
                  </Label>
                  <Select
                    value={stateOrProvince ?? ""}
                    onValueChange={(v) => setStateOrProvince(v || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Select ${country === "US" ? "state" : "province"}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(country === "US" ? US_STATES : CANADIAN_PROVINCES).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {members.map((member) => {
                const key = member.memberId ?? member.id;
                const label = member.name || member.email || "Member";
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`income-${key}`} className="text-sm font-medium">
                      {label}
                    </Label>
                    <p className="text-xs text-muted-foreground">Annual Income Before Tax</p>
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
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-muted-foreground">Annual (gross)</span>
                    <span className="font-medium tabular-nums">
                      {formatMoney(totalHouseholdIncome)}
                    </span>
                  </div>
                  {(stateOrProvince && totalHouseholdIncome > 0) && (
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Monthly after tax</span>
                      {loadingAfterTax ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : monthlyAfterTax != null ? (
                        <span className="font-medium tabular-nums">
                          {formatMoney(monthlyAfterTax)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {taxDetail && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-semibold">Tax brackets used</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Federal</p>
                      <ul className="mt-1 space-y-0.5 pl-3 list-disc text-muted-foreground">
                        {taxDetail.federalBrackets.map((b, i) => (
                          <li key={i}>
                            {b.max != null
                              ? `${formatMoney(b.min)} – ${formatMoney(b.max)}: ${(b.rate * 100).toFixed(1)}%`
                              : `Over ${formatMoney(b.min)}: ${(b.rate * 100).toFixed(1)}%`}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">
                        {country === "CA" ? "Provincial" : "State"}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {(taxDetail.stateOrProvincialRate * 100).toFixed(2)}% applied to annual income
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
