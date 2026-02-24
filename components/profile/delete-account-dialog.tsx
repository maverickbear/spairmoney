"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/toast-provider";
import { supabase } from "@/lib/supabase";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const t = useTranslations("dialogs.deleteAccount");
  const tDialogs = useTranslations("dialogs");
  const tCommon = useTranslations("common");
  const [confirmationText, setConfirmationText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const confirmationWord = t("confirmationWord");

  async function handleDelete() {
    if (confirmationText !== confirmationWord) {
      setError(t("errorTypeToConfirm", { text: confirmationWord }));
      return;
    }
    if (!confirmed) {
      setError(t("errorConfirmCheckbox"));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/v2/profile/delete-account", { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || t("failedToDelete"));
      }

      if (result.success) {
        toast({
          title: t("toastSuccess"),
          description: t("toastSuccessDescription"),
          variant: "success",
        });
        onOpenChange(false);
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("failedToDelete");
      setError(errorMessage);
      toast({
        title: tCommon("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setConfirmationText("");
      setConfirmed(false);
      setError(null);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>{t("title")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 px-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("warningTitle")}</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>{t("bullet1")}</strong></li>
                <li><strong>{t("bullet2")}</strong></li>
                <li><strong>{t("bullet3")}</strong></li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">
              {t("typeToConfirm", { text: confirmationWord })}
            </Label>
            <Input
              id="delete-confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                setError(null);
              }}
              size="medium"
              disabled={loading}
              className="font-mono"
              placeholder={confirmationWord}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm-deletion"
              checked={confirmed}
              onCheckedChange={(checked) => {
                setConfirmed(checked === true);
                setError(null);
              }}
              disabled={loading}
            />
            <label
              htmlFor="confirm-deletion"
              className="text-sm leading-relaxed cursor-pointer"
            >
              {t("checkboxLabel")}
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {tDialogs("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmationText !== confirmationWord || !confirmed}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("deleting")}
              </>
            ) : (
              t("deleteButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

