"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Account {
  id: string;
  name: string;
  type: string;
}

interface DeleteAccountWithTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  accountToDelete: string | null;
  transferToAccountId: string;
  onTransferToAccountIdChange: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAccountWithTransferDialog({
  open,
  onOpenChange,
  accounts,
  accountToDelete,
  transferToAccountId,
  onTransferToAccountIdChange,
  onConfirm,
  onCancel,
}: DeleteAccountWithTransferDialogProps) {
  const availableAccounts = accounts.filter(
    (account) => account.id !== accountToDelete
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l"
      >
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-xl">Delete Account</SheetTitle>
          <SheetDescription>
            This account has associated transactions. Please select a destination
            account to transfer all transactions to before deleting.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Transfer transactions to:
                </label>
                <Select
                  value={transferToAccountId}
                  onValueChange={onTransferToAccountIdChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableAccounts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    You need at least one other account to transfer transactions to.
                    Please create another account first.
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex flex-wrap justify-end gap-2 shrink-0 bg-background">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
              disabled={
                !transferToAccountId || availableAccounts.length === 0
              }
            >
              Delete and Transfer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

