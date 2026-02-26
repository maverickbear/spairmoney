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
import { Button } from "@/components/ui/button";
// Using API route instead of client-side API
import { AccountForm } from "@/components/forms/account-form";

interface AccountRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated?: () => void;
}

export function AccountRequiredDialog({
  open,
  onOpenChange,
  onAccountCreated,
}: AccountRequiredDialogProps) {
  const t = useTranslations("dialogs");
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);

  useEffect(() => {
    if (open) {
      checkAccounts();
    }
  }, [open]);

  async function checkAccounts() {
    setIsChecking(true);
    try {
      const response = await fetch("/api/v2/accounts?includeHoldings=false");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const accounts = await response.json();
      setHasAccount(accounts.length > 0);
    } catch (error) {
      console.error("Error checking accounts:", error);
      setHasAccount(false);
    } finally {
      setIsChecking(false);
    }
  }

  function handleCreateAccount() {
    setIsAccountFormOpen(true);
  }

  function handleAccountCreated() {
    setIsAccountFormOpen(false);
    checkAccounts();
    onAccountCreated?.();
  }

  // If there's no account, show the drawer
  if (open && hasAccount === false && !isChecking) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="right"
            className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l"
          >
            <SheetHeader className="p-6 pb-4 border-b shrink-0">
              <SheetTitle className="text-xl">{t("accountRequired.title")}</SheetTitle>
              <SheetDescription>
                {t("accountRequired.description")}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 flex-1" />
              <div className="p-4 border-t flex flex-wrap justify-end gap-2 shrink-0 bg-background">
                <Button variant="outline" size="medium" onClick={() => onOpenChange(false)}>
                  {t("cancel")}
                </Button>
                <Button size="medium" onClick={handleCreateAccount}>
                  {t("accountRequired.createAccount")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <AccountForm
          open={isAccountFormOpen}
          onOpenChange={setIsAccountFormOpen}
          onSuccess={handleAccountCreated}
        />
      </>
    );
  }

  // If checking or already has account, don't show anything
  return null;
}

