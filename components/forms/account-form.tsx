"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { accountSchema, AccountFormData } from "@/src/domain/accounts/accounts.validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast-provider";
import { LimitWarning } from "@/components/billing/limit-warning";
import { Loader2 } from "lucide-react";
import { DollarAmountInput } from "@/components/common/dollar-amount-input";
import { useAuthSafe } from "@/contexts/auth-context";

interface Account {
  id: string;
  name: string;
  type: string;
  creditLimit?: number | null;
  initialBalance?: number | null;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
  ownerIds?: string[];
  dueDayOfMonth?: number | null;
  /** Optional; some API shapes use userId instead of ownerIds for single-owner */
  userId?: string;
  /** Optional; some API shapes use accountType instead of type */
  accountType?: string;
}

interface MemberResponse {
  status?: string;
  memberId?: string;
  name?: string;
  email: string;
  isOwner?: boolean;
}

interface Household {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
}

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onSuccess?: () => void;
  initialAccountLimit?: { current: number; limit: number } | null;
  /** When "embedded", only form content is rendered (no Dialog). Use inside Sheet/drawer. */
  variant?: "dialog" | "embedded";
}

const VALID_ACCOUNT_TYPES = ["cash", "checking", "savings", "credit", "investment", "other"] as const;

function normalizeTypeForDefaults(t: unknown): (typeof VALID_ACCOUNT_TYPES)[number] {
  const s = typeof t === "string" ? t.trim().toLowerCase() : "";
  if ((VALID_ACCOUNT_TYPES as readonly string[]).includes(s)) return s as (typeof VALID_ACCOUNT_TYPES)[number];
  if (s?.includes("credit")) return "credit";
  return "checking";
}

export function AccountForm({ open, onOpenChange, account, onSuccess, initialAccountLimit, variant = "dialog" }: AccountFormProps) {
  const { toast } = useToast();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [primaryOwnerId, setPrimaryOwnerId] = useState<string | null>(null);
  const [loadingHouseholds, setLoadingHouseholds] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "member" | "super_admin" | null>(null);
  const [accountLimit, setAccountLimit] = useState<{ current: number; limit: number } | null>(null);
  const [loadingLimit, setLoadingLimit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo((): AccountFormData => {
    if (account) {
      const typeValue = normalizeTypeForDefaults(account.type ?? account.accountType);
      const ownerIds = account.ownerIds?.length ? account.ownerIds : account.userId ? [account.userId] : [];
      return {
        name: account.name ?? "",
        type: typeValue,
        creditLimit: account.creditLimit != null ? Number(account.creditLimit) : undefined,
        initialBalance: account.initialBalance != null ? Number(account.initialBalance) : undefined,
        ownerIds,
        dueDayOfMonth: account.dueDayOfMonth != null ? Number(account.dueDayOfMonth) : undefined,
      };
    }
    return {
      name: "",
      type: "checking",
      creditLimit: undefined,
      initialBalance: undefined,
      ownerIds: [],
      dueDayOfMonth: undefined,
    };
  }, [account]);

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues,
  });
  
  const accountType = form.watch("type");

  // Use initialAccountLimit if available, otherwise use accountLimit state
  const currentAccountLimit = initialAccountLimit !== undefined ? initialAccountLimit : accountLimit;
  
  // Check if limit is reached
  const isLimitReached = currentAccountLimit && currentAccountLimit.limit !== -1 && currentAccountLimit.current >= currentAccountLimit.limit;

  // Load current user ID and households when form opens
  // Role comes from AuthContext (handled in separate useEffect)
  useEffect(() => {
    if (open) {
      loadHouseholds();
      // Use initial limit if provided, otherwise load it
      if (initialAccountLimit !== undefined) {
        setAccountLimit(initialAccountLimit);
      } else {
        // Load limit immediately when modal opens
        loadAccountLimit();
      }
    } else {
      // Reset limit when modal closes
      setAccountLimit(null);
    }
  }, [open, initialAccountLimit]);

  // Use AuthContext for user and role
  const { role, user } = useAuthSafe();
  const currentUserId = user?.id;
  
  // Update userRole state when role from Context changes
  useEffect(() => {
    if (role) {
      setUserRole(role);
    } else {
      // Default to admin if no role found (user is owner)
      setUserRole("admin");
    }
  }, [role]);

  async function loadHouseholds() {
    try {
      setLoadingHouseholds(true);
      const response = await fetch("/api/v2/members");
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      const { members } = await response.json();
      
      // Transform household members into households format
      const membersList = (members ?? []) as MemberResponse[];
      const householdsList: Household[] = membersList
        .filter((member) => member.status === "active" && member.memberId) // Only include active members with memberId
        .map((member) => ({
          id: member.memberId!,
          name: member.name || member.email,
          email: member.email,
          isOwner: member.isOwner || false,
        }));
      
      // Remove duplicates by id to ensure unique households
      const uniqueHouseholds: Household[] = Array.from(
        new Map(householdsList.map((h: Household) => [h.id, h])).values()
      );
      setHouseholds(uniqueHouseholds);
    } catch (error) {
      console.error("Error loading households:", error);
    } finally {
      setLoadingHouseholds(false);
    }
  }

  async function loadAccountLimit() {
    try {
      setLoadingLimit(true);
      const { getBillingLimitsAction } = await import("@/lib/actions/billing");
      const limits = await getBillingLimitsAction();
      if (limits?.accountLimit) {
        setAccountLimit({
          current: limits.accountLimit.current,
          limit: limits.accountLimit.limit,
        });
      }
    } catch (error) {
      console.error("Error loading account limit:", error);
    } finally {
      setLoadingLimit(false);
    }
  }

  // Reset form when drawer opens: load account data for Edit, or defaults for Add.
  // Do not wait for currentUserId for account fields (name, type, etc.) so Edit shows all data immediately.
  const normalizeType = useCallback((t: unknown): (typeof VALID_ACCOUNT_TYPES)[number] => {
    const s = typeof t === "string" ? t.trim().toLowerCase() : "";
    if ((VALID_ACCOUNT_TYPES as readonly string[]).includes(s)) return s as (typeof VALID_ACCOUNT_TYPES)[number];
    if (s?.includes("credit")) return "credit";
    return "checking";
  }, []);

  useEffect(() => {
    if (!open) return;

    if (account) {
      const ownerIds = account.ownerIds?.length ? account.ownerIds : account.userId ? [account.userId] : [];
      setSelectedOwnerIds(ownerIds);
      setPrimaryOwnerId(currentUserId ?? ownerIds[0] ?? null);
      const typeValue = normalizeType(account.type ?? account.accountType);
      const creditLimitVal = account.creditLimit != null ? Number(account.creditLimit) : undefined;
      const initialBalanceVal = account.initialBalance != null ? Number(account.initialBalance) : undefined;
      const dueDayVal = account.dueDayOfMonth != null ? Number(account.dueDayOfMonth) : undefined;
      form.reset({
        name: account.name ?? "",
        type: typeValue,
        creditLimit: creditLimitVal,
        initialBalance: initialBalanceVal,
        ownerIds,
        dueDayOfMonth: dueDayVal,
      });
      // Force Select to show type (Radix can miss first reset when drawer opens)
      form.setValue("type", typeValue);
      if (typeValue === "credit") {
        form.setValue("creditLimit", creditLimitVal ?? undefined);
        form.setValue("dueDayOfMonth", dueDayVal ?? undefined);
      }
      if (["checking", "savings", "cash"].includes(typeValue)) {
        form.setValue("initialBalance", initialBalanceVal ?? undefined);
      }
    } else {
      setSelectedOwnerIds([]);
      setPrimaryOwnerId(currentUserId ?? null);
      form.reset({
        name: "",
        type: "checking",
        creditLimit: undefined,
        initialBalance: undefined,
        ownerIds: [],
        dueDayOfMonth: undefined,
      });
    }
  }, [open, account, form, currentUserId, normalizeType]);

  function handleOwnerToggle(ownerId: string, checked: boolean) {
    // Current user ID is always included, so we only manage additional household IDs
    const newOwnerIds = checked
      ? [...selectedOwnerIds, ownerId]
      : selectedOwnerIds.filter(id => id !== ownerId);
    
    setSelectedOwnerIds(newOwnerIds);
    form.setValue("ownerIds", newOwnerIds);
  }

  async function onSubmit(data: AccountFormData) {
    try {
      setIsSubmitting(true);
      if (!currentUserId) {
        toast({
          title: "Error",
          description: "Unable to identify current user",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check limit before creating (only for new accounts)
      if (!account && currentAccountLimit) {
        if (currentAccountLimit.limit !== -1 && currentAccountLimit.current >= currentAccountLimit.limit) {
          toast({
            title: "Limit Reached",
            description: `You've reached your account limit (${currentAccountLimit.limit}).`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      let finalOwnerIds: string[] = [currentUserId];
      if ((userRole === "member" || userRole === "admin") && selectedOwnerIds.length > 0) {
        finalOwnerIds = [currentUserId, ...selectedOwnerIds];
      }

      const url = account ? `/api/v2/accounts/${account.id}` : "/api/v2/accounts";
      const method = account ? "PATCH" : "POST";

      const isLinkingToAnotherMember = !account && primaryOwnerId != null && primaryOwnerId !== currentUserId;

      const payload: AccountFormData = {
        name: data.name,
        type: data.type,
        ownerIds: isLinkingToAnotherMember ? [] : finalOwnerIds,
        ...(isLinkingToAnotherMember && primaryOwnerId ? { ownerUserId: primaryOwnerId } : {}),
      };

      if (data.type === "credit") {
        payload.creditLimit = data.creditLimit ?? null;
        payload.dueDayOfMonth = data.dueDayOfMonth ?? null;
      }

      if (data.type === "checking" || data.type === "savings" || data.type === "cash") {
        payload.initialBalance = account
          ? (data.initialBalance !== undefined ? data.initialBalance : (account.initialBalance ?? 0))
          : (data.initialBalance ?? 0);
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Failed to save account";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const text = await res.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            // If all else fails, use status text
            errorMessage = res.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      // Close modal and reset form after successful request
      onOpenChange(false);
      form.reset();

      // Dispatch custom event to notify other components (e.g., OnboardingWidget)
      if (!account) {
        // Only dispatch for new accounts, not updates
        window.dispatchEvent(new CustomEvent("account-created"));
      }

      // Reload accounts after successful save
      onSuccess?.();

      toast({
        title: account ? "Account updated" : "Account created",
        description: account ? "Your account has been updated successfully." : "Your account has been created successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save account",
        variant: "destructive",
      });
      // Reload limit after error
      loadAccountLimit();
    } finally {
      setIsSubmitting(false);
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Show limit warning for new accounts - show immediately if limit reached */}
          {!account && currentAccountLimit && currentAccountLimit.limit !== -1 && (
            <LimitWarning
              current={currentAccountLimit.current}
              limit={currentAccountLimit.limit}
              type="accounts"
            />
          )}
          
          {/* Show loading state only if limit is not yet loaded and not provided */}
          {!account && !currentAccountLimit && loadingLimit && (
            <div className="text-sm text-muted-foreground">Checking limit...</div>
          )}
          
          {/* Hide form fields if limit is reached for new accounts */}
          {(!account && isLimitReached) ? null : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name</label>
                  <Input {...form.register("name")} size="medium" required />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={form.watch("type") ?? "checking"}
                    onValueChange={(value) => {
                      form.setValue("type", value as "checking" | "savings" | "credit" | "cash" | "investment" | "other");
                      // Clear credit limit when changing away from credit type
                      if (value !== "credit") {
                        form.setValue("creditLimit", undefined);
                      }
                      // Clear initial balance when changing away from checking/savings/cash
                      if (value !== "checking" && value !== "savings" && value !== "cash") {
                        form.setValue("initialBalance", undefined);
                      }
                    }}
                    required
                  >
                    <SelectTrigger size="medium">
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
              </div>

              {!account && (userRole === "admin" || userRole === "super_admin") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Account owner</label>
                  <p className="text-xs text-muted-foreground">
                    Link this account to a household member. It will appear under their name on the dashboard.
                  </p>
                  {loadingHouseholds ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : (
                    <Select
                      value={primaryOwnerId ?? currentUserId ?? ""}
                      onValueChange={(value) => setPrimaryOwnerId(value || null)}
                    >
                      <SelectTrigger size="medium">
                        <SelectValue placeholder="Me" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={currentUserId ?? ""}>Me</SelectItem>
                        {households
                          .filter((h) => h.id !== currentUserId)
                          .map((h) => (
                            <SelectItem key={h.id} value={h.id}>
                              {h.name || h.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {accountType === "credit" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Credit Limit</label>
                    <DollarAmountInput
                      value={form.watch("creditLimit") || undefined}
                      onChange={(value) => form.setValue("creditLimit", value ?? undefined, { shouldValidate: true })}
                      placeholder="$ 0.00"
                      size="medium"
                      required
                    />
                    {form.formState.errors.creditLimit && (
                      <p className="text-sm text-destructive">{form.formState.errors.creditLimit.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Due Day of Month</label>
                    <p className="text-xs text-muted-foreground mb-1">
                      Day of the month when your credit card bill is due (1-31). This is used to automatically track your credit card debt.
                    </p>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={form.watch("dueDayOfMonth") ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                        form.setValue("dueDayOfMonth", value !== undefined && !isNaN(value) ? value : undefined, { shouldValidate: true });
                      }}
                      placeholder="e.g., 10"
                      size="medium"
                    />
                    {form.formState.errors.dueDayOfMonth && (
                      <p className="text-sm text-destructive">{form.formState.errors.dueDayOfMonth.message}</p>
                    )}
                  </div>
                </>
              )}

              {(accountType === "checking" || accountType === "savings" || accountType === "cash") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Initial Balance</label>
                  <DollarAmountInput
                    value={form.watch("initialBalance") ?? undefined}
                    onChange={(value) => form.setValue("initialBalance", value !== undefined ? value : undefined, { shouldValidate: true })}
                    placeholder="$ 0.00"
                    size="medium"
                  />
                  {form.formState.errors.initialBalance && (
                    <p className="text-sm text-destructive">{form.formState.errors.initialBalance.message}</p>
                  )}
                </div>
              )}

              {(userRole === "member" || userRole === "admin") && (primaryOwnerId === currentUserId || primaryOwnerId == null) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Account Owners</label>
                  <p className="text-xs text-muted-foreground">
                    You are automatically included as an owner. Select additional households to share this account with.
                  </p>
                  {loadingHouseholds ? (
                    <p className="text-sm text-muted-foreground">Loading households...</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {households.filter((household) => household.id !== currentUserId).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          You haven&apos;t invited any member yet.{" "}
                          <Link href="/members" className="text-foreground hover:underline font-medium">
                            Invite
                          </Link>{" "}
                          now
                        </p>
                      ) : (
                        households
                          .filter((household) => household.id !== currentUserId) // Filter out current user
                          .map((household) => (
                            <div key={household.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`owner-${household.id}`}
                                checked={selectedOwnerIds.includes(household.id)}
                                onCheckedChange={(checked) => handleOwnerToggle(household.id, checked as boolean)}
                              />
                              <label
                                htmlFor={`owner-${household.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {household.name}
                              </label>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                  {form.formState.errors.ownerIds && (
                    <p className="text-sm text-destructive">{form.formState.errors.ownerIds.message}</p>
                  )}
                </div>
              )}
            </>
          )}

          </div>

          <DialogFooter className="justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="medium" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              {(!account && isLimitReached) ? null : (
                <Button type="submit" size="medium" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
  );

  if (variant === "embedded") {
    return formContent;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-h-[90vh] flex flex-col !p-0 !gap-0">
        <DialogHeader>
          <DialogTitle>{account ? "Edit" : "Add"} Account</DialogTitle>
          <DialogDescription>
            {account ? "Update the account details" : "Create a new account"}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

