"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  FolderTree,
  Users,
  Settings,
  Target,
  Calendar,
  Repeat,
  HelpCircle,
  MessageSquare,
  User,
  DollarSign,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    title: "Money Management",
    items: [
      { href: "/accounts", label: "Accounts", icon: Wallet },
      { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
      { href: "/planned-payment", label: "Planned Payments", icon: Calendar },
      { href: "/categories", label: "Categories", icon: FolderTree },
      { href: "/members", label: "Household", icon: Users },
    ],
  },
  {
    title: "Planning",
    items: [
      { href: "/planning/budgets", label: "Budgets", icon: Target },
      { href: "/planning/goals", label: "Goals", icon: PiggyBank },
      { href: "/debts", label: "Debts", icon: CreditCard },
      { href: "/investments", label: "Investments", icon: TrendingUp },
    ],
  },
  {
    title: "Account & Settings",
    items: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/settings", label: "My Account", icon: Settings },
      { href: "/billing", label: "Billing", icon: DollarSign },
      { href: "/help-support", label: "Help & Support", icon: HelpCircle },
      { href: "/feedback", label: "Feedback", icon: MessageSquare },
    ],
  },
];

interface PlanInfo {
  plan: {
    id: string;
    name: string;
    priceMonthly: number;
    priceYearly: number;
  } | null;
  subscription: {
    status: "active" | "trialing" | "cancelled" | "past_due";
    trialEndDate?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  } | null;
  interval: "month" | "year" | null;
}

interface MoreMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasSubscription?: boolean;
}

export function MoreMenuSheet({
  open,
  onOpenChange,
  hasSubscription = true,
}: MoreMenuSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && hasSubscription) {
      async function fetchPlanInfo() {
        setLoading(true);
        try {
          const response = await fetch("/api/billing/subscription?includeStripe=false&includeLimits=false");
          if (response.ok) {
            const data = await response.json();
            setPlanInfo({
              plan: data.plan,
              subscription: data.subscription,
              interval: data.interval,
            });
          }
        } catch (error) {
          console.error("Error fetching plan info:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchPlanInfo();
    } else {
      setPlanInfo(null);
    }
  }, [open, hasSubscription]);

  const isActive = (href: string) => {
    const basePath = href.split("?")[0];
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/" || pathname.startsWith("/dashboard");
    }
    return pathname === basePath || pathname === href || (basePath !== "/" && pathname.startsWith(basePath));
  };

  const handleItemClick = (href: string) => {
    onOpenChange(false);
    if (!hasSubscription) {
      router.push("/dashboard");
      return;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="max-h-[85vh] flex flex-col p-0"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 relative">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="space-y-4 px-6 overflow-y-auto flex-1 pb-6">
          {navCategories.map((category) => (
            <div key={category.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                {category.title}
              </h3>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={(e) => {
                        if (!hasSubscription) {
                          e.preventDefault();
                          router.push("/dashboard");
                        } else {
                          handleItemClick(item.href);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3",
                        "transition-all duration-200",
                        "hover:bg-muted/50 active:scale-[0.98]",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-colors flex-shrink-0",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium flex-1",
                          active && "text-primary"
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Footer with User Plan Info */}
          {planInfo && planInfo.plan && (
            <Card className="mt-4">
              <CardContent className="pt-4 pb-4 space-y-3">
            {/* Plan Name and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current Plan:</span>
                <span className="text-sm font-semibold text-foreground capitalize">
                  {planInfo.plan.name}
                </span>
              </div>
              {planInfo.subscription && (
                <Badge
                  variant={
                    planInfo.subscription.status === "active"
                      ? "default"
                      : planInfo.subscription.status === "trialing"
                      ? "secondary"
                      : planInfo.subscription.status === "past_due"
                      ? "destructive"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {planInfo.subscription.status === "trialing"
                    ? "Trial"
                    : planInfo.subscription.status === "active"
                    ? "Active"
                    : planInfo.subscription.status === "past_due"
                    ? "Past Due"
                    : "Cancelled"}
                </Badge>
              )}
            </div>

            {/* Price and Interval */}
            {planInfo.plan && planInfo.interval && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Billing:</span>
                <span className="font-medium text-foreground">
                  ${planInfo.interval === "month" 
                    ? planInfo.plan.priceMonthly.toFixed(2)
                    : (planInfo.plan.priceYearly / 12).toFixed(2)}
                  /month
                  {planInfo.interval === "year" && " (billed yearly)"}
                </span>
              </div>
            )}

            {/* Trial End Date or Renewal Date */}
            {planInfo.subscription && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {planInfo.subscription.status === "trialing"
                    ? "Trial ends:"
                    : planInfo.subscription.cancelAtPeriodEnd
                    ? "Ends on:"
                    : "Renews on:"}
                </span>
                <span className="font-medium text-foreground">
                  {planInfo.subscription.status === "trialing" &&
                  planInfo.subscription.trialEndDate
                    ? format(new Date(planInfo.subscription.trialEndDate), "MMM d, yyyy")
                    : planInfo.subscription.currentPeriodEnd
                    ? format(new Date(planInfo.subscription.currentPeriodEnd), "MMM d, yyyy")
                    : "—"}
                </span>
              </div>
            )}

            {/* Cancellation Notice */}
            {planInfo.subscription?.cancelAtPeriodEnd && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-2 text-xs text-yellow-800 dark:text-yellow-200">
                Subscription will be cancelled at period end
              </div>
            )}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

