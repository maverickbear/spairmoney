"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/navigation";
import { trackLandingClick } from "@/lib/analytics/landing-events";
import Image from "next/image";
import { SocialLinks } from "@/components/common/social-links";

type FooterLinkKey =
  | "features"
  | "pricing"
  | "faq"
  | "contact"
  | "privacy"
  | "terms"
  | "help"
  | "aboutUs"
  | "careers";

const FOOTER_CATEGORIES: {
  categoryLabelKey: "categoryProduct" | "categoryCompany" | "categoryLegal" | "categorySupport";
  links: { key: FooterLinkKey; href: string }[];
}[] = [
  {
    categoryLabelKey: "categoryProduct",
    links: [
      { key: "features", href: "#features" },
      { key: "pricing", href: "#pricing" },
      { key: "faq", href: "/faq" },
    ],
  },
  {
    categoryLabelKey: "categoryCompany",
    links: [
      { key: "aboutUs", href: "/about" },
      { key: "careers", href: "/careers" },
      { key: "contact", href: "/contact" },
    ],
  },
  {
    categoryLabelKey: "categoryLegal",
    links: [
      { key: "privacy", href: "/privacy-policy" },
      { key: "terms", href: "/terms-of-service" },
    ],
  },
  {
    categoryLabelKey: "categorySupport",
    links: [{ key: "help", href: "/faq" }],
  },
];

function FooterLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  const className =
    "text-sm text-white hover:underline transition-colors";
  if (href.startsWith("#")) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {label}
      </Link>
    );
  }
  return (
    <I18nLink href={href} className={className} onClick={onClick}>
      {label}
    </I18nLink>
  );
}

export function LandingFooter() {
  const t = useTranslations("landing.footer");
  const tLanding = useTranslations("landing");
  const [year, setYear] = useState(2025);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="border-t border-neutral-800 bg-black py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <I18nLink
              href="/"
              className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded w-fit"
              onClick={() =>
                trackLandingClick({
                  section: "footer",
                  link_id: "footer_logo",
                  destination: "/",
                })
              }
            >
              <Image
                src="/assets/logos/logo-white-font.png"
                alt="Spair Money"
                width={140}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </I18nLink>
            <p className="text-sm text-white">{t("tagline")}</p>
          </div>
          <nav
            className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6"
            aria-label={tLanding("aria.footerNav")}
          >
            {FOOTER_CATEGORIES.map(({ categoryLabelKey, links }) => (
              <div key={categoryLabelKey} className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  {t(categoryLabelKey)}
                </p>
                <ul className="flex flex-col gap-2">
                  {links.map(({ key: linkKey, href }) => (
                    <li key={linkKey}>
                      <FooterLink
                        href={href}
                        label={t(linkKey)}
                        onClick={() =>
                          trackLandingClick({
                            section: "footer",
                            link_id: `footer_${linkKey}`,
                            destination: href,
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white">
            © {year} Spair Money. {t("allRightsReserved")}
          </p>
          <SocialLinks variant="landing" />
        </div>
      </div>
    </footer>
  );
}
