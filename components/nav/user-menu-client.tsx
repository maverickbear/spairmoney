"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { Moon, Sun, LogOut, MessageSquare, HelpCircle, Shield, FileText as FileTextIcon, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthSafe } from "@/contexts/auth-context";
import { useSubscriptionSafe } from "@/contexts/subscription-context";
import { getInitials, isValidAvatarUrl } from "@/lib/utils/avatar";
import { logger } from "@/src/infrastructure/utils/logger";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrialWidget, calculateTrialDaysRemaining, calculateTrialProgress } from "@/components/billing/trial-widget";

interface UserMenuClientProps {
  isCollapsed: boolean;
}

/**
 * UserMenuClient
 * 
 * Client island component that consumes AuthContext and SubscriptionContext
 * Handles user menu, trial widget, theme toggle, and logout
 * 
 * Architecture: Presentation Layer - only consumes state, no business logic
 */
const LOCALE_OPTIONS: { value: "en" | "pt" | "es"; labelKey: "languageEnglish" | "languagePortuguese" | "languageSpanish" }[] = [
  { value: "en", labelKey: "languageEnglish" },
  { value: "pt", labelKey: "languagePortuguese" },
  { value: "es", labelKey: "languageSpanish" },
];

export function UserMenuClient({ isCollapsed }: UserMenuClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { theme, setTheme } = useTheme();
  const { user, role, checking: checkingAuth, refetch: refetchAuth } = useAuthSafe();
  const { subscription, plan, checking: checkingSubscription } = useSubscriptionSafe();
  
  const log = logger.withPrefix("USER-MENU");
  
  // Track if component is mounted to prevent hydration mismatches
  const [mounted, setMounted] = useState(false);
  
  // Only set mounted to true after hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const loading = checkingAuth || checkingSubscription;
  const isSuperAdmin = role === "super_admin";
  const isTrialing = subscription?.status === "trialing";
  
  // Track avatar image loading state to prevent glitches
  const [avatarImageError, setAvatarImageError] = useState(false);
  const avatarUrl = useMemo(() => user?.avatarUrl, [user?.avatarUrl]);

  // Track dropdown open state to show border/shadow only when open
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Reset error state when avatar URL changes
  useEffect(() => {
    setAvatarImageError(false);
  }, [avatarUrl]);

  // Listen for profile updates to refresh AuthContext
  // This is presentation logic (listening to events), not business logic
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      // Profile was updated - refresh auth context to get latest user data
      refetchAuth();
    };
    
    window.addEventListener("profile-saved", handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener("profile-saved", handleProfileUpdate as EventListener);
    };
  }, [refetchAuth]);

  // Handle logout - presentation logic only (calls API route)
  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch(apiUrl("/api/v2/auth/sign-out"), {
        method: "POST",
      });

      // Always redirect to landing page (even if there's an error)
      router.push("/");
      window.location.href = "/";
      
      if (!response.ok) {
        const error = await response.json();
        log.error("Failed to sign out:", error.error || "Unknown error");
      }
    } catch (error) {
      log.error("Error signing out:", error);
      // Still redirect to landing page even if there's an error
      router.push("/");
      window.location.href = "/";
    }
  }, [router, log]);

  return (
    <>
      {/* Trial Widget - Show if user is in trial */}
      {!loading && isTrialing && !isCollapsed && subscription && (
        <TrialWidget
          daysRemaining={calculateTrialDaysRemaining(subscription.trialEndDate ? (typeof subscription.trialEndDate === 'string' ? subscription.trialEndDate : subscription.trialEndDate.toISOString()) : null)}
          progress={calculateTrialProgress((subscription as any).trialStartDate ? (typeof (subscription as any).trialStartDate === 'string' ? (subscription as any).trialStartDate : (subscription as any).trialStartDate.toISOString()) : null, subscription.trialEndDate ? (typeof subscription.trialEndDate === 'string' ? subscription.trialEndDate : subscription.trialEndDate.toISOString()) : null)}
          trialStartDate={(subscription as any).trialStartDate ? (typeof (subscription as any).trialStartDate === 'string' ? (subscription as any).trialStartDate : (subscription as any).trialStartDate.toISOString()) : null}
          trialEndDate={subscription.trialEndDate ? (typeof subscription.trialEndDate === 'string' ? subscription.trialEndDate : subscription.trialEndDate.toISOString()) : null}
          planName={plan?.name ?? null}
        />
      )}

      {/* User Menu */}
      <div className="p-3">
        {!mounted || loading ? (
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "space-x-3 px-3 py-2"
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            {!isCollapsed && (
              <div className="flex-1 space-y-1">
                <div className="h-3 w-20 bg-muted rounded-lg animate-pulse" />
                <div className="h-2 w-16 bg-muted rounded-lg animate-pulse" />
              </div>
            )}
          </div>
        ) : (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="medium"
                className={`w-full h-auto p-2 hover:bg-secondary ${
                  menuOpen ? "border border-border shadow" : "border-0 shadow-none"
                } ${isCollapsed ? "justify-center" : "justify-start"}`}
              >
                <div
                  className={`flex items-center w-full ${
                    isCollapsed ? "justify-center" : "space-x-3"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {user && isValidAvatarUrl(user.avatarUrl) && !avatarImageError ? (
                      <img
                        src={user.avatarUrl!}
                        alt={user.name || "User"}
                        className="h-10 w-10 rounded-full object-cover border"
                        loading="eager"
                        decoding="async"
                        onError={() => {
                          setAvatarImageError(true);
                        }}
                        onLoad={() => {
                          setAvatarImageError(false);
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold border">
                        {getInitials(user?.name)}
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium truncate">
                        {user?.name || (
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        )}
                      </div>
                      {user?.email && (
                        <div className="mt-0.5 text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild className="mb-1">
                <Link href="/feedback" prefetch={true} className="cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{tNav("feedback")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="mb-1">
                <Link href="/help-support" prefetch={true} className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>{tNav("helpSupport")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="mb-1">
                <Link href="/privacy-policy" prefetch={true} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>{tNav("privacyPolicy")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="mb-1">
                <Link href="/terms-of-service" prefetch={true} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  <span>{tNav("termsOfService")}</span>
                </Link>
              </DropdownMenuItem>
              {process.env.NODE_ENV !== "production" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
                    <Languages className="h-4 w-4" />
                    <span>{t("language")}</span>
                  </DropdownMenuLabel>
                  {LOCALE_OPTIONS.map(({ value, labelKey }) => (
                    <DropdownMenuItem key={value} asChild className="mb-1">
                      <Link
                        href={pathname}
                        locale={value}
                        className={locale === value ? "bg-muted" : undefined}
                      >
                        {t(labelKey)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="mb-1"
                  >
                    <div className="relative mr-2 h-4 w-4">
                      <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </div>
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{tAuth("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  );
}

