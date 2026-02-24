"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteAccountDialog } from "./delete-account-dialog";

export function DeleteAccountSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const t = useTranslations("settings");

  return (
    <>
      <Card className="h-fit border-0">
        <CardContent className="pt-0 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t("deleteAccountWarning")}
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={() => setDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            {t("deleteAccountButton")}
          </Button>
        </CardContent>
      </Card>
      <DeleteAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

