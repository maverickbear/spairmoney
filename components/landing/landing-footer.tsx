"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/navigation";

const FOOTER_LINKS = [
  { key: "features" as const, href: "#features" },
  { key: "pricing" as const, href: "#pricing" },
  { key: "faq" as const, href: "#faq" },
  { key: "contact" as const, href: "/contact" },
  { key: "privacy" as const, href: "/privacy-policy" },
  { key: "terms" as const, href: "/terms-of-service" },
  { key: "help" as const, href: "/faq" },
];

export function LandingFooter() {
  const t = useTranslations("landing.footer");
  const [year, setYear] = useState(2025);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="border-t border-neutral-800 bg-black py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-white">
            Spair Money — {t("tagline")}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {FOOTER_LINKS.map(({ key, href }) => (
              <Fragment key={key}>
                {href.startsWith("#") ? (
                  <Link
                    href={href}
                    className="text-sm text-white hover:underline transition-colors"
                  >
                    {t(key)}
                  </Link>
                ) : (
                  <I18nLink
                    href={href}
                    className="text-sm text-white hover:underline transition-colors"
                  >
                    {t(key)}
                  </I18nLink>
                )}
              </Fragment>
            ))}
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white">© {year} Spair Money. {t("allRightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
}
