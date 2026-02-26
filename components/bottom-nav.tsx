"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";
import { AddTransactionSheet } from "@/components/bottom-nav/add-transaction-sheet";
import { MoreMenuSheet } from "@/components/bottom-nav/more-menu-sheet";
import { baseNavSections } from "@/src/presentation/config/navigation.config";
import type { BottomNavItem } from "@/src/presentation/config/navigation.config";
import { LayoutDashboard, Receipt, Target } from "lucide-react";

interface BottomNavProps {
  /** True when user can use the app (trial or active subscription). Used to enable Add button. */
  hasAccess?: boolean;
}

export function BottomNav({ hasAccess = true }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Always render BottomNav on responsive so the user always sees the menu.
  // SubscriptionGuard handles blocking access when needed; links/actions can be disabled via hasSubscription.

  const isActive = (href: string) => {
    const basePath = href.split("?")[0];
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/" || pathname.startsWith("/dashboard");
    }
    return pathname === basePath || pathname === href || (basePath !== "/" && pathname.startsWith(basePath));
  };

  // Allow all nav links to work so the user can navigate (e.g. to Billing to subscribe).
  const handleLinkClick = () => {};

  // Build bottom nav items from centralized config
  // Bottom nav has a specific structure with action buttons
  const navItems: BottomNavItem[] = [
    {
      href: "/dashboard",
      label: t("items.dashboard"),
      icon: LayoutDashboard,
      type: "link",
    },
    {
      href: "/transactions",
      label: t("items.transactions"),
      icon: Receipt,
      type: "link",
    },
    {
      href: "#",
      label: t("add"),
      icon: Plus,
      type: "button",
      onClick: () => setIsAddSheetOpen(true),
    },
    {
      href: "/planning/budgets",
      label: t("items.budgets"),
      icon: Target,
      type: "link",
    },
    {
      href: "#",
      label: t("more"),
      icon: MoreHorizontal,
      type: "button",
      onClick: () => setIsMoreSheetOpen(true),
    },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card lg:hidden"
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.type === "link" ? isActive(item.href) : false;
            const isAddButton = item.label === "Add";

            if (item.type === "button") {
              if (isAddButton) {
                return (
                  <div
                    key={item.label}
                    className="flex flex-1 flex-col items-center justify-center gap-1 flex-basis-0 min-h-[44px] py-2"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={item.onClick}
                      disabled={!hasAccess}
                      className={cn(
                        "rounded-full h-10 w-10 bg-primary text-primary-foreground",
                        "hover:bg-primary/90 active:scale-95",
                        "transition-all duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                      aria-label="Add transaction"
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </div>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 flex-basis-0 min-h-[44px] py-2",
                    "text-xs font-medium transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={item.label}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] leading-tight">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={handleLinkClick}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 flex-basis-0 min-h-[44px] py-2",
                  "text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "text-primary-nav"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active && "text-primary-nav"
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-[10px] leading-tight transition-colors",
                    active && "text-primary-nav"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AddTransactionSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
      />

      <MoreMenuSheet
        open={isMoreSheetOpen}
        onOpenChange={setIsMoreSheetOpen}
        hasAccess={hasAccess}
      />
    </>
  );
}
