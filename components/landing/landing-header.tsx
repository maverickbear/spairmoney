"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu, ArrowRight } from "lucide-react";
import { useAuthSafe } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { LocaleSwitcher } from "@/components/common/locale-switcher";
import { apiUrl } from "@/lib/utils/api-base-url";
import { trackLandingClick } from "@/lib/analytics/landing-events";

const NAV_LINK_KEYS = [
  { key: "home" as const, href: "/" },
  { key: "features" as const, href: "/#features" },
  { key: "pricing" as const, href: "/#pricing" },
  { key: "blog" as const, href: "/blog" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("landing");
  const { isAuthenticated, role } = useAuthSafe();
  const router = useRouter();
  // Show Dashboard/Logout only for Consumer users (in users table). Portal admins (super_admin) use /admin only.
  const isConsumer = isAuthenticated && role !== "super_admin";

  const handleLogout = async () => {
    try {
      await fetch(apiUrl("/api/v2/auth/sign-out"), { method: "POST" });
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
      window.location.href = "/";
    } catch {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      window.location.href = "/";
    }
  };

  return (
    <>
      <header className="fixed top-4 left-4 right-4 z-50 sm:left-6 sm:right-6 lg:left-8 lg:right-8">
        <nav
          className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-full bg-white/80 px-4 py-2.5 shadow-lg backdrop-blur-md sm:px-6"
          aria-label={t("aria.mainNav")}
        >
          <div className="flex shrink-0 items-center lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-foreground hover:bg-black/5"
              onClick={() => setMobileOpen(true)}
              aria-label={t("aria.openMenu")}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <Link
            href="/"
            className="flex shrink-0 items-center lg:min-w-0"
            aria-label={t("aria.spairHome")}
            onClick={() => trackLandingClick({ section: "header", link_id: "nav_home", destination: "/" })}
          >
            <Logo variant="full" color="auto" width={120} height={28} />
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {NAV_LINK_KEYS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setMobileOpen(false);
                    trackLandingClick({ section: "header", link_id: `nav_${item.key}`, destination: item.href });
                  }}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LocaleSwitcher variant="short" />
            {isConsumer ? (
              <>
                <Button asChild variant="ghost" size="medium" className="hidden text-muted-foreground hover:text-foreground lg:inline-flex">
                  <Link href="/dashboard" onClick={() => trackLandingClick({ section: "header", link_id: "header_dashboard", destination: "/dashboard" })}>
                    {t("dashboard")}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="medium"
                  className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
                  onClick={() => {
                    trackLandingClick({ section: "header", link_id: "header_logout" });
                    handleLogout();
                  }}
                >
                  {t("logOut")}
                </Button>
              </>
            ) : (
              <Button asChild size="medium" className="hidden shrink-0 rounded-full bg-foreground px-4 font-medium text-background hover:bg-foreground/90 lg:inline-flex">
                <Link
                  href="/auth/login"
                  onClick={() => trackLandingClick({ section: "header", link_id: "header_sign_in", destination: "/auth/login" })}
                >
                  {t("signIn")}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </nav>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-4 flex flex-col">
          <SheetTitle className="sr-only">{t("aria.menu")}</SheetTitle>
          <ul className="flex flex-col gap-4 pt-8 flex-1">
            {NAV_LINK_KEYS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="text-base font-medium text-foreground"
                  onClick={() => {
                    setMobileOpen(false);
                    trackLandingClick({ section: "header", link_id: `nav_${item.key}`, destination: item.href });
                  }}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
          <footer className="pt-4 mt-auto border-t border-border flex flex-col gap-2">
            {isConsumer ? (
              <>
                <Button asChild variant="outline" size="medium" className="w-full">
                  <Link
                    href="/dashboard"
                    onClick={() => {
                      setMobileOpen(false);
                      trackLandingClick({ section: "header", link_id: "header_dashboard", destination: "/dashboard" });
                    }}
                  >
                    {t("dashboard")}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="medium"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    trackLandingClick({ section: "header", link_id: "header_logout" });
                    handleLogout();
                  }}
                >
                  {t("logOut")}
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="medium" className="w-full">
                  <Link
                    href="/auth/login"
                    onClick={() => {
                      setMobileOpen(false);
                      trackLandingClick({ section: "header", link_id: "header_sign_in", destination: "/auth/login" });
                    }}
                  >
                    {t("signIn")}
                  </Link>
                </Button>
              </>
            )}
          </footer>
        </SheetContent>
      </Sheet>
    </>
  );
}
