"use client";

import { ReactNode, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PAGE_HEADER_HEIGHT_PX = 64;

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  const t = useTranslations("nav");

  // Set CSS variables once on mount for banner positioning (no ResizeObserver to avoid reflow on sidebar toggle)
  useEffect(() => {
    document.documentElement.style.setProperty("--header-height", `${PAGE_HEADER_HEIGHT_PX}px`);
    document.documentElement.style.setProperty("--page-header-height", `${PAGE_HEADER_HEIGHT_PX}px`);
    return () => {
      document.documentElement.style.removeProperty("--header-height");
      document.documentElement.style.removeProperty("--page-header-height");
    };
  }, []);

  return (
    <div
      id="page-header"
      className={cn(
        "z-30 h-16 min-h-16 bg-card border-b border-border",
        "hidden lg:flex lg:items-center",
        "box-border overflow-hidden",
        className
      )}
      style={{ "--header-height": `${PAGE_HEADER_HEIGHT_PX}px`, "--page-header-height": `${PAGE_HEADER_HEIGHT_PX}px` } as React.CSSProperties}
    >
      <div className="w-full px-4 lg:px-8 h-full flex items-center min-h-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full min-h-0">
            <div className="flex flex-col gap-1">
              {/* Title uses content.primary (text-foreground) to emphasise primary content */}
              <h1 className="text-lg md:text-xl font-semibold text-foreground">{title}</h1>
              {/* Description uses content.secondary (text-muted-foreground) for body text */}
              {description && (
                <p className="text-sm md:text-base text-muted-foreground">{description}</p>
              )}
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              {children}
              <Button asChild size="tiny" className="shrink-0 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                <Link href="/feedback">
                  <span className="md:hidden">{t("feedback")}</span>
                  <span className="hidden md:inline">{t("giveFeedback")}</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
    </div>
  );
}

