"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useFormatDisplayDate } from "@/src/presentation/utils/format-date";

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string;
  created: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  description: string | null;
  period_start: number | null;
  period_end: number | null;
}

interface PaymentHistoryProps {
  className?: string;
  title?: string;
}

export function PaymentHistory({ className, title }: PaymentHistoryProps) {
  const t = useTranslations("billing");
  const formatDate = useFormatDisplayDate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const loadInvoices = useCallback(async () => {
    // Prevent duplicate loads
    if (hasLoaded || loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl("/api/stripe/invoices?page=1&limit=10"), {
        cache: "no-store",
      });
      
      if (!response.ok) {
        throw new Error(t("failedToFetchInvoices"));
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
      setHasLoaded(true);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError(err instanceof Error ? err.message : t("failedToLoadInvoices"));
    } finally {
      setLoading(false);
    }
  }, [hasLoaded, loading, t]);

  // Load invoices when component becomes visible (lazy loading)
  useEffect(() => {
    if (hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadInvoices();
          observer.disconnect();
        }
      },
      { rootMargin: "100px" } // Start loading 100px before it's visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, loadInvoices]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { labelKey: keyof typeof statusLabels; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { labelKey: "invoiceStatusPaid", variant: "default" },
      open: { labelKey: "invoiceStatusOpen", variant: "secondary" },
      void: { labelKey: "invoiceStatusVoid", variant: "outline" },
      uncollectible: { labelKey: "invoiceStatusUncollectible", variant: "destructive" },
    };
    const statusLabels = {
      invoiceStatusPaid: t("invoiceStatusPaid"),
      invoiceStatusOpen: t("invoiceStatusOpen"),
      invoiceStatusVoid: t("invoiceStatusVoid"),
      invoiceStatusUncollectible: t("invoiceStatusUncollectible"),
    };
    const statusInfo = statusMap[status] || { labelKey: "invoiceStatusPaid" as const, variant: "outline" as const };
    const label = statusMap[status] ? statusLabels[statusInfo.labelKey] : status;
    
    return (
      <Badge variant={statusInfo.variant} className="text-xs bg-sentiment-positive text-white hover:bg-sentiment-positive">
        {label}
      </Badge>
    );
  };

  return (
    <Card ref={cardRef} className={className}>
      <CardHeader>
        <CardTitle>{title ?? t("billingHistoryDefault")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : loading && invoices.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px] w-full">
            <div className="text-center text-muted-foreground">
              <p>{t("noBillingHistoryFound")}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(new Date(invoice.created * 1000), "longDate")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </div>
                  {invoice.invoice_pdf && (
                    <Button
                      variant="ghost"
                      size="medium"
                      onClick={() => {
                        window.open(invoice.invoice_pdf!, "_blank");
                      }}
                      className="h-8 w-8 p-0"
                      title={t("downloadInvoicePdf")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

