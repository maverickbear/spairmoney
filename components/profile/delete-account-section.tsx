"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteAccountDialog } from "./delete-account-dialog";

export function DeleteAccountSection() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="h-fit border-destructive/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-base sm:text-lg">Delete Account</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Once you delete your account, there is no going back. All your data including transactions, accounts, budgets, and goals will be permanently deleted immediately. This action cannot be undone.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={() => setDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
      <DeleteAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

