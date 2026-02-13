"use client";

import { useState } from "react";
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
          title: "Error",
          description: result.error || "Failed to send the link",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setSent(true);
      toast({
        title: "Check your email",
        description: "We sent you a link to change your password. Open the link and set a new password.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="h-fit border-0">
      <CardContent className="pt-0 space-y-4">
        <p className="text-sm text-muted-foreground">
          We will send a secure link to your email. Open the link and set your new password there—no need to enter your current password.
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
              Sending...
            </>
          ) : sent ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Link sent
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send me a link to change my password
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
