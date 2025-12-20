"use client";

import { useMemo } from "react";
import { formatMoney } from "@/components/common/money";
import { format, addDays } from "date-fns";
import type { UpcomingTransaction } from "@/src/domain/transactions/transactions.types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  Car,
  ShoppingCart,
  UtensilsCrossed,
  Coffee,
  Heart,
  Dumbbell,
  Gift,
  GraduationCap,
  Gamepad2,
  Shield,
  CreditCard,
  Shirt,
  Laptop,
  Music,
  BookOpen,
  Briefcase,
  PiggyBank,
  TrendingUp,
  Wallet,
  Receipt as ReceiptIcon,
  Tag,
  Wifi,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingPaymentsCardProps {
  upcomingTransactions: UpcomingTransaction[];
}

// Helper function to get category icon
function getCategoryIcon(categoryName: string | null | undefined) {
  if (!categoryName) return Tag;

  const normalized = categoryName.toLowerCase().trim();

  // Map category names to icons
  const iconMap: Record<string, any> = {
    // Housing
    "rent": Home,
    "rent / mortgage": Home,
    "utilities": Home,
    "home maintenance": Home,
    "home insurance": Home,

    // Transportation
    "vehicle": Car,
    "car payment": Car,
    "car": Car,
    "public transit": Car,

    // Food
    "groceries": ShoppingCart,
    "restaurants": UtensilsCrossed,
    "snacks & drinks": Coffee,

    // Health & Personal
    "medical": Heart,
    "healthcare": Heart,
    "personal care": Heart,
    "fitness": Dumbbell,

    // Family & Kids
    "baby essentials": Gift,
    "child/baby": Gift,
    "education": GraduationCap,
    "activities": Gamepad2,

    // Insurance
    "insurance payments": Shield,

    // Debts
    "loans": CreditCard,
    "credit cards": CreditCard,
    "other debts": CreditCard,

    // Shopping
    "clothing": Shirt,
    "electronics": Laptop,
    "home & lifestyle": Home,

    // Entertainment & Leisure
    "streaming": Music,
    "gaming": Gamepad2,
    "events": Music,
    "travel": Plane,

    // Education & Work
    "courses & certificates": GraduationCap,
    "books": BookOpen,
    "software & tools": Laptop,

    // Pets
    "pet care": Heart,

    // Gifts & Donations
    "gifts": Gift,
    "donations": Gift,

    // Business Expenses
    "home office": Briefcase,
    "software": Laptop,
    "professional services": Briefcase,
    "marketing": Briefcase,
    "office": Briefcase,

    // Subscriptions
    "subscriptions": Music,
    "internet": Wifi,

    // Savings
    "emergency fund": PiggyBank,
    "rrsp": PiggyBank,
    "fhsa": PiggyBank,
    "tfsa": PiggyBank,

    // Investments
    "stocks": TrendingUp,
    "crypto": TrendingUp,
    "investment income": TrendingUp,
    "rental income": TrendingUp,

    // Income
    "salary & wages": Wallet,
    "extra compensation": Wallet,
    "business income": Wallet,
    "benefits": Wallet,
    "gig work": Wallet,
    "sales": Wallet,
    "content creation": Wallet,
    "family support": Wallet,
    "reimbursements": Wallet,

    // Misc
    "bank fees": ReceiptIcon,
    "overdraft": CreditCard,
    "unexpected": Tag,
    "uncategorized": Tag,
    "other": Tag,
  };

  // Check exact match
  if (iconMap[normalized]) {
    return iconMap[normalized];
  }

  // Check partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }

  // Default icon
  return Tag;
}

// Helper function to get icon color based on category
function getIconColor(categoryName: string | null | undefined): string {
  if (!categoryName) return "text-muted-foreground";

  const normalized = categoryName.toLowerCase().trim();

  // Special colors for common categories
  const colorMap: Record<string, string> = {
    "rent": "text-amber-700",
    "rent / mortgage": "text-amber-700",
    "car payment": "text-red-600",
    "vehicle": "text-red-600",
    "internet": "text-gray-600",
    "utilities": "text-blue-600",
  };

  if (colorMap[normalized]) {
    return colorMap[normalized];
  }

  // Check partial match
  for (const [key, color] of Object.entries(colorMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return color;
    }
  }

  return "text-muted-foreground";
}

export function UpcomingPaymentsCard({
  upcomingTransactions,
}: UpcomingPaymentsCardProps) {
  // Filter expenses for next 30 days
  const next30DaysPayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30Days = addDays(today, 30);

    return upcomingTransactions
      .filter((t) => {
        if (t.type !== "expense") return false;
        const date = t.date instanceof Date ? t.date : new Date(t.date);
        return date >= today && date <= next30Days;
      })
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [upcomingTransactions]);

  // Calculate total
  const total = useMemo(() => {
    return next30DaysPayments.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  }, [next30DaysPayments]);

  // Get top 3 payments to display (maximum 3)
  const topPayments = useMemo(() => {
    return next30DaysPayments.slice(0, 3);
  }, [next30DaysPayments]);

  // Format date as "Due Jan 1", "Due Dec 29", etc.
  const formatDueDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return `Due ${format(dateObj, "MMM d")}`;
  };

  // Get payment display name
  const getPaymentName = (transaction: UpcomingTransaction): string => {
    return (
      transaction.description ||
      transaction.subcategory?.name ||
      transaction.category?.name ||
      "Payment"
    );
  };

  if (next30DaysPayments.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 bg-transparent">
        <div className="text-xs text-muted-foreground mb-2">Next 30 days</div>
        <div className="text-3xl font-bold text-foreground mb-1">{formatMoney(0)}</div>
        <div className="text-sm text-muted-foreground mb-6">0 scheduled payments</div>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No upcoming payments found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-transparent">
      {/* Header */}
      <div className="text-xs text-muted-foreground mb-2">Next 30 days</div>
      <div className="text-3xl font-bold text-foreground mb-1">{formatMoney(total)}</div>
      <div className="text-sm text-muted-foreground mb-6">
        {next30DaysPayments.length}{" "}
        {next30DaysPayments.length === 1 ? "scheduled payment" : "scheduled payments"}
      </div>

      {/* Payment List */}
      <div className="space-y-0 mb-6">
        {topPayments.map((payment, index) => {
          const CategoryIcon = getCategoryIcon(
            payment.category?.name || payment.subcategory?.name
          );
          const iconColor = getIconColor(
            payment.category?.name || payment.subcategory?.name
          );
          const paymentName = getPaymentName(payment);
          const dueDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
          const amount = Math.abs(payment.amount || 0);

          return (
            <div
              key={payment.id}
              className={cn(
                "flex items-center gap-3 py-3",
                index < topPayments.length - 1 && "border-b border-border"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <CategoryIcon className={cn("h-5 w-5", iconColor)} />
              </div>

              {/* Payment Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm">{paymentName}</div>
                <div className="text-xs text-muted-foreground">{formatDueDate(dueDate)}</div>
              </div>

              {/* Amount */}
              <div className="flex-shrink-0 font-semibold text-foreground text-sm">
                {formatMoney(amount)}
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Button */}
      <Link href="/planned-payment">
        <Button
          variant="outline"
          className="w-full border-border bg-transparent hover:bg-muted/50"
        >
          View all payments
        </Button>
      </Link>
    </div>
  );
}

