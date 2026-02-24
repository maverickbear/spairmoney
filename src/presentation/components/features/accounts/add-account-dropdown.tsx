"use client";

import { useState, cloneElement, isValidElement } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/forms/account-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface AddAccountDropdownProps {
  onSuccess?: () => void;
  canWrite?: boolean;
  trigger?: React.ReactNode;
}

export function AddAccountDropdown({
  onSuccess,
  canWrite = true,
  trigger,
}: AddAccountDropdownProps) {
  const tAcc = useTranslations("accounts");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("account-created"));
    onSuccess?.();
    toast({
      title: tAcc("accountAdded"),
      description: tAcc("accountAddedDescription"),
      variant: "success",
    });
  };

  const defaultTrigger = (
    <Button size="medium" disabled={!canWrite} onClick={() => setOpen(true)}>
      <Plus className="h-4 w-4 mr-1.5" />
      {tAcc("addAccount")}
    </Button>
  );

  return (
    <>
      {trigger && isValidElement(trigger)
        ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : defaultTrigger}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex flex-col w-full sm:max-w-[32.2rem] !p-0 h-full"
        >
          <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border text-left">
            <SheetTitle>{tAcc("addAccount")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <AccountForm
              open={open}
              onOpenChange={setOpen}
              onSuccess={handleSuccess}
              variant="embedded"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

