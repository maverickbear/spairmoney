"use client";

import { useState, useEffect } from "react";
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit contact form");
      }

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });

      form.reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit contact form",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div>
      <PageHeader
        title="Help & Support"
      />

      <div className="w-full p-4 lg:p-8 space-y-6">
      {/* Frequently Asked Questions */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground mt-1">
            Find answers to the most common questions about Spair Money
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="add-transaction">
              <AccordionTrigger className="text-left">
                How do I add a transaction?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Navigate to the Transactions page and click the "Add Transaction" button. 
                  Fill in the details including amount, category, date, and description, then save.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="create-budget">
              <AccordionTrigger className="text-left">
                How do I create a budget?
              </AccordionTrigger>
              <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Go to the Budgets page and click "Create Budget". Select a category, 
              set your monthly limit, and choose the time period. You can track your 
              spending against the budget throughout the month.
            </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="share-account">
              <AccordionTrigger className="text-left">
                Can I share my account with family members?
              </AccordionTrigger>
              <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Yes! With paid plans, you can invite household members to 
              share access to your financial data. Go to Settings &gt; Members to invite 
              family members.
            </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="upgrade-plan">
              <AccordionTrigger className="text-left">
                How do I upgrade my plan?
              </AccordionTrigger>
              <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Visit Settings &gt; Billing to view your current plan and upgrade options. 
              You can upgrade at any time, and the new plan will be effective immediately.
            </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancel-subscription">
              <AccordionTrigger className="text-left">
                How do I cancel my subscription?
              </AccordionTrigger>
              <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Go to Settings &gt; Billing and click "Manage Subscription". You can cancel 
              your subscription at any time. You'll continue to have access until the end 
              of your current billing period.
            </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data-security">
              <AccordionTrigger className="text-left">
                Is my financial data secure?
              </AccordionTrigger>
              <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Absolutely. We use bank-level encryption to protect your data. All information 
              is stored securely and we never share your financial data with third parties. 
              See our{" "}
              <Link 
                href="/privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-foreground hover:underline"
              >
                Privacy Policy
              </Link>
              {" "}for more details.
            </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="import-csv">
              <AccordionTrigger className="text-left">
                How do I import transactions from CSV?
              </AccordionTrigger>
              <AccordionContent>
            <p className="text-sm text-muted-foreground">
              On the Transactions page, click "Import" and select your CSV file. Make sure 
              your CSV includes columns for date, amount, description, and category. Our 
              system will guide you through mapping the columns.
            </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="export-data">
              <AccordionTrigger className="text-left">
                Can I export my data?
              </AccordionTrigger>
              <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Yes, you can export your transactions, budgets, and other data at any time. 
              Go to Reports and use the export feature to download your data in CSV format.
            </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </div>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>
            Still need help? Send us a message and we'll respond within 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Your name"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                {...form.register("subject")}
                placeholder="What can we help you with?"
                disabled={isSubmitting}
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                {...form.register("message")}
                placeholder="Please describe your question or issue..."
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
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

