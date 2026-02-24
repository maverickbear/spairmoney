"use client";

import { useLocale } from "next-intl";
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

const LOCALES: { value: string; label: string; short: string }[] = [
  { value: "en", label: "English", short: "EN" },
  { value: "pt", label: "Português", short: "PT" },
  { value: "es", label: "Español", short: "ES" },
];

interface LocaleSwitcherProps {
  className?: string;
  /** "short" = show only EN, PT, ES (e.g. landing); "full" = show icon + full name */
  variant?: "short" | "full";
}

export function LocaleSwitcher({ className, variant = "full" }: LocaleSwitcherProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const locale = useLocale();
  const pathname = usePathname();
  const current = LOCALES.find((l) => l.value === locale);
  const triggerLabel = variant === "short" ? (current?.short ?? locale.toUpperCase()) : (current?.label ?? locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="small"
          className={cn("gap-2", className)}
          aria-label="Language"
        >
          {variant === "full" && <Languages className="h-4 w-4" />}
          <span className={variant === "short" ? "font-medium" : "hidden sm:inline"}>
            {triggerLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map(({ value, label, short }) => (
          <DropdownMenuItem key={value} asChild>
            <Link
              href={pathname}
              locale={value as "en" | "pt" | "es"}
              className={locale === value ? "bg-muted" : undefined}
            >
              {variant === "short" ? short : label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
