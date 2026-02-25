"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "relative z-50 transition-all duration-300",
          scrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
        )}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            <Link
              href="/"
              className="flex items-center shrink-0"
              aria-label="Spair Money home"
              onClick={() => trackLandingClick({ section: "header", link_id: "nav_home", destination: "/" })}
            >
              <Logo variant="icon" color="auto" width={32} height={32} className="md:hidden" />
              <Logo variant="full" color="auto" width={140} height={32} className="hidden md:block" />
            </Link>

            <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <ul className="flex items-center gap-8">
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
            </div>

            <div className="flex items-center gap-3">
              <LocaleSwitcher variant="short" />
              {isConsumer ? (
                <>
                  <Button asChild variant="ghost" size="medium" className="hidden sm:inline-flex text-muted-foreground">
                    <Link href="/dashboard" onClick={() => trackLandingClick({ section: "header", link_id: "header_dashboard", destination: "/dashboard" })}>
                      {t("dashboard")}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="medium"
                    onClick={() => {
                      trackLandingClick({ section: "header", link_id: "header_logout" });
                      handleLogout();
                    }}
                  >
                    {t("logOut")}
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="medium" className="hidden sm:inline-flex">
                    <Link href="/auth/login" onClick={() => trackLandingClick({ section: "header", link_id: "header_sign_in", destination: "/auth/login" })}>
                      {t("signIn")}
                    </Link>
                  </Button>
                  <Button asChild size="medium" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-transform">
                    <Link href="/auth/signup" onClick={() => trackLandingClick({ section: "header", link_id: "header_start_trial", destination: "/auth/signup" })}>
                      {t("startTrial")}
                    </Link>
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-[280px] p-4 flex flex-col">
          <SheetTitle className="sr-only">Menu</SheetTitle>
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
            <li className="pt-4 border-t border-border">
              <div className="pb-4">
                <LocaleSwitcher variant="short" />
              </div>
            </li>
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
                <Button asChild size="medium" className="w-full bg-primary text-primary-foreground">
                  <Link
                    href="/auth/signup"
                    onClick={() => {
                      setMobileOpen(false);
                      trackLandingClick({ section: "header", link_id: "header_start_trial", destination: "/auth/signup" });
                    }}
                  >
                    {t("startTrial")}
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
