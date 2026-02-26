"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ContentPageLayout } from "@/components/common/content-page-layout";
import { contactFormSchema, ContactFormData } from "@/lib/validations/contact";
import { useToast } from "@/components/toast-provider";
import { Loader2, Mail } from "lucide-react";

export default function ContactPage() {
  const t = useTranslations("contactPage");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormData) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("toastErrorDefault"));
      }

      toast({
        title: t("toastSuccessTitle"),
        description: t("toastSuccessDescription"),
      });

      form.reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: t("toastErrorTitle"),
        description: error instanceof Error ? error.message : t("toastErrorDefault"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ContentPageLayout
      hero={{
        icon: <Mail className="h-8 w-8 --sentiment-positive" />,
        title: t("title"),
        subtitle: t("subtitle"),
      }}
    >
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder={t("namePlaceholder")}
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder={t("emailPlaceholder")}
                disabled={isSubmitting}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t("subjectLabel")}</Label>
              <Input
                id="subject"
                {...form.register("subject")}
                placeholder={t("subjectPlaceholder")}
                disabled={isSubmitting}
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("messageLabel")}</Label>
              <Textarea
                id="message"
                {...form.register("message")}
                placeholder={t("messagePlaceholder")}
                rows={6}
                disabled={isSubmitting}
              />
              {form.formState.errors.message && (
                <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("sending")}
                </>
              ) : (
                t("sendButton")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </ContentPageLayout>
  );
}
