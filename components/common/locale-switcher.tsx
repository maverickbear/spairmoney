"use client";

import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES: {
  value: "en" | "pt" | "es";
  short: string;
  labelKey: "languageEnglish" | "languagePortuguese" | "languageSpanish";
}[] = [
  { value: "en", short: "EN", labelKey: "languageEnglish" },
  { value: "pt", short: "PT", labelKey: "languagePortuguese" },
  { value: "es", short: "ES", labelKey: "languageSpanish" },
];

interface LocaleSwitcherProps {
  className?: string;
  /** "short" = Languages icon + EN/PT/ES in header (dropdown shows full names); "full" = icon + full name */
  variant?: "short" | "full";
}

export function LocaleSwitcher({ className, variant = "full" }: LocaleSwitcherProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("common");
  const current = LOCALES.find((l) => l.value === locale);
  const triggerLabel =
    variant === "short"
      ? current?.short ?? locale.toUpperCase()
      : current
        ? t(current.labelKey)
        : locale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="small"
          className={cn("gap-2", className)}
          aria-label={t("language")}
        >
          <Languages className="h-4 w-4" />
          <span className={variant === "short" ? "font-medium text-base" : "hidden sm:inline"}>
            {triggerLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map(({ value, labelKey }) => (
          <DropdownMenuItem key={value} asChild>
            <Link
              href={pathname}
              locale={value}
              className={locale === value ? "bg-muted" : undefined}
            >
              {t(labelKey)}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
