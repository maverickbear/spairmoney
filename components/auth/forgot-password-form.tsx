"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/src/domain/auth/auth.validations";
import { apiUrl } from "@/lib/utils/api-base-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || t("failedToSendResetEmail"));
        setLoading(false);
        return;
      }

      // Always show success message (to prevent email enumeration)
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error("Error requesting password reset:", error);
      setError(t("unexpectedError"));
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>{t("checkYourEmailTitle")}</AlertTitle>
          <AlertDescription>
            {t("checkYourEmailDescription")}
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-foreground hover:underline font-medium transition-colors"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="you@example.com"
              disabled={loading}
              size="medium"
              className="pl-10"
              required
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          size="medium"
          className="w-full text-base font-medium" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("sendingResetLink")}
            </>
          ) : (
            t("sendResetLink")
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}

