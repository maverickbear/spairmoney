"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SocialLinks } from "@/components/common/social-links";

export function SimpleFooter() {
  const [currentYear, setCurrentYear] = useState(2024);
  const t = useTranslations("landing.footer");
  
  useEffect(() => {
    // Only access Date on client side after mount
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-border bg-muted/50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Spair Money. {t("allRightsReserved")}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("aboutUs")}
            </Link>
            <Link
              href="/careers"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("careers")}
            </Link>
            <Link
              href="/blog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("blog")}
            </Link>
            <Link
              href="/faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("faq")}
            </Link>
            <Link
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("termsOfService")}
            </Link>
            <Link
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("privacyPolicy")}
            </Link>
            <SocialLinks variant="default" />
          </div>
        </div>
      </div>
    </footer>
  );
}

