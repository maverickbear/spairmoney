"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { usePagePerformance } from "@/hooks/use-page-performance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/page-header";
import Link from "next/link";
import { useToast } from "@/components/toast-provider";
import { contactFormSchema, ContactFormData } from "@/lib/validations/contact";
import { Loader2 } from "lucide-react";

export default function HelpSupportPage() {
  const t = useTranslations("nav");
  const tHelp = useTranslations("helpSupport");
  const perf = usePagePerformance("HelpSupport");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    perf.markComplete();
  }, [perf]);

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
      const response = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tHelp("failedToSubmit"));
      }

      toast({
        title: tHelp("messageSent"),
        description: tHelp("messageSentDescription"),
      });

      form.reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : tHelp("failedToSubmit"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div>
      <PageHeader
        title={t("helpSupport")}
      />

      <div className="w-full p-4 lg:p-8 space-y-6">
      {/* Frequently Asked Questions */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{tHelp("faqTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tHelp("faqDescription")}
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="add-transaction">
              <AccordionTrigger className="text-left">
                {tHelp("addTransactionQ")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {tHelp("addTransactionA")}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="create-budget">
              <AccordionTrigger className="text-left">
                {tHelp("createBudgetQ")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {tHelp("createBudgetA")}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="share-account">
              <AccordionTrigger className="text-left">
                {tHelp("shareAccountQ")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {tHelp("shareAccountA")}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="upgrade-plan">
              <AccordionTrigger className="text-left">
                {tHelp("upgradePlanQ")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {tHelp("upgradePlanA")}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancel-subscription">
              <AccordionTrigger className="text-left">
                {tHelp("cancelSubscriptionQ")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {tHelp("cancelSubscriptionA")}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data-security">
              <AccordionTrigger className="text-left">
                {tHelp("dataSecurityQ")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {tHelp("dataSecurityA")}{" "}
                  <Link 
                    href="/privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-foreground hover:underline"
                  >
                    {tHelp("privacyPolicyLink")}
                  </Link>
                  .
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="import-csv">
              <AccordionTrigger className="text-left">
                {tHelp("importCsvQ")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {tHelp("importCsvA")}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="export-data">
              <AccordionTrigger className="text-left">
                {tHelp("exportDataQ")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {tHelp("exportDataA")}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </div>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>{tHelp("contactTitle")}</CardTitle>
          <CardDescription>
            {tHelp("contactDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tHelp("name")}</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder={tHelp("namePlaceholder")}
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{tHelp("email")}</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder={tHelp("emailPlaceholder")}
                disabled={isSubmitting}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{tHelp("subject")}</Label>
              <Input
                id="subject"
                {...form.register("subject")}
                placeholder={tHelp("subjectPlaceholder")}
                disabled={isSubmitting}
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{tHelp("message")}</Label>
              <Textarea
                id="message"
                {...form.register("message")}
                placeholder={tHelp("messagePlaceholder")}
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
                  {tHelp("sending")}
                </>
              ) : (
                tHelp("sendMessage")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

