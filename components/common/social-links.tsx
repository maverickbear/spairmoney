"use client";

import { useEffect, useState } from "react";
import { SiX, SiLinkedin, SiFacebook, SiInstagram } from "react-icons/si";
import type { IconType } from "react-icons";
import { apiUrl } from "@/lib/utils/api-base-url";

export interface SocialLinksConfig {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}

const SOCIAL_ICONS: {
  key: keyof SocialLinksConfig;
  Icon: IconType;
  label: string;
}[] = [
  { key: "twitter", Icon: SiX, label: "X" },
  { key: "linkedin", Icon: SiLinkedin, label: "LinkedIn" },
  { key: "facebook", Icon: SiFacebook, label: "Facebook" },
  { key: "instagram", Icon: SiInstagram, label: "Instagram" },
];

function isSocialLinksConfig(
  value: unknown
): value is SocialLinksConfig {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    (o.twitter === undefined || typeof o.twitter === "string") &&
    (o.linkedin === undefined || typeof o.linkedin === "string") &&
    (o.facebook === undefined || typeof o.facebook === "string") &&
    (o.instagram === undefined || typeof o.instagram === "string")
  );
}

export type SocialLinksVariant = "landing" | "default";

interface SocialLinksProps {
  variant?: SocialLinksVariant;
  className?: string;
}

/**
 * Renders social media icon links from Admin → SEO Settings → Social Media Links.
 * Fetches public SEO settings and shows only links that are configured.
 */
export function SocialLinks({
  variant = "default",
  className = "",
}: SocialLinksProps) {
  const [links, setLinks] = useState<SocialLinksConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLinks() {
      try {
        const res = await fetch(apiUrl("/api/seo-settings/public"));
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const seoSettings = data?.seoSettings ?? data;
        const org = seoSettings?.organization;
        const raw = org?.socialLinks;
        if (isSocialLinksConfig(raw)) {
          const hasAny = SOCIAL_ICONS.some(
            (s) => raw[s.key] && String(raw[s.key]).trim()
          );
          if (hasAny && !cancelled) setLinks(raw);
        }
      } catch {
        // Non-critical; do not surface errors
      }
    }
    fetchLinks();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!links) return null;

  const isLanding = variant === "landing";
  const linkClass = isLanding
    ? "text-white hover:text-white/90 transition-colors"
    : "text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div
      className={`flex items-center gap-4 ${className}`}
      aria-label="Social media"
    >
      {SOCIAL_ICONS.map(({ key, Icon, label }) => {
        const href = links[key];
        const url = typeof href === "string" ? href.trim() : "";
        if (!url) return null;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            aria-label={label}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
