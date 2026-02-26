"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";

/**
 * Used in My Account to let the user request a password reset link by email.
 * Same flow as "Forgot password": they receive a link and set a new password there.
 */
export function RequestPasswordResetLink() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  async function handleSendLink() {
    try {
      setLoading(true);
      setSent(false);

      const response = await fetch("/api/auth/send-password-reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: tCommon("error"),
          description: result.error || t("failedToSendPasswordLink"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setSent(true);
      toast({
        title: t("checkEmailForPasswordLink"),
        description: t("passwordLinkSentDescription"),
        variant: "success",
      });
    } catch {
      toast({
        title: tCommon("error"),
        description: tAuth("unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="h-fit border-0">
      <CardContent className="p-0 md:p-0 space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("passwordResetLinkDescription")}
        </p>
        <Button
          type="button"
          variant="default"
          size="medium"
          onClick={handleSendLink}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("sendingLink")}
            </>
          ) : sent ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t("linkSent")}
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              {t("sendPasswordResetLink")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
