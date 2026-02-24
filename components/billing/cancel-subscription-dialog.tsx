"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CancelSubscriptionDialogProps) {
  const t = useTranslations("dialogs.cancelSubscription");
  const tToasts = useTranslations("toasts");
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleCancel() {
    try {
      setLoading(true);
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cancel",
          cancelImmediately,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: t("toastCancelled"),
          description: cancelImmediately ? t("toastCancelledImmediately") : t("toastCancelledAtEnd"),
          variant: "success",
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: tToasts("error"),
          description: data.error || t("failedToCancel"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: tToasts("error"),
        description: t("failedToCancelRetry"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={cancelImmediately ? "immediately" : "end"}
          onValueChange={(value) => setCancelImmediately(value === "immediately")}
          className="space-y-4 py-4 px-6"
        >
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="end" id="end" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="end" className="font-medium cursor-pointer">
                {t("cancelAtEnd")}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t("cancelAtEndDescription")}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="immediately" id="immediately" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="immediately" className="font-medium cursor-pointer">
                {t("cancelImmediately")}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t("cancelImmediatelyDescription")}
              </p>
            </div>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("keepSubscription")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("cancelling")}
              </>
            ) : (
              t("cancelButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

