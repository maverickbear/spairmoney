"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCALES: { value: "en" | "pt" | "es"; labelKey: "languageEnglish" | "languagePortuguese" | "languageSpanish" }[] = [
  { value: "en", labelKey: "languageEnglish" },
  { value: "pt", labelKey: "languagePortuguese" },
  { value: "es", labelKey: "languageSpanish" },
];

export type LocaleOption = "en" | "pt" | "es";

export interface LanguageSettingProps {
  /** Controlled: when provided, parent owns state and Save button is not rendered */
  value?: LocaleOption;
  onChange?: (locale: LocaleOption) => void;
}

export function LanguageSetting({ value: controlledValue, onChange }: LanguageSettingProps) {
  const locale = useLocale() as LocaleOption;
  const [internalLocale, setInternalLocale] = useState<LocaleOption>(locale);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");
  const tSettings = useTranslations("settings");

  const isControlled = controlledValue !== undefined && onChange !== undefined;
  const selectedLocale = isControlled ? controlledValue : internalLocale;
  const setSelectedLocale = isControlled ? onChange : setInternalLocale;

  useEffect(() => {
    if (!isControlled) setInternalLocale(locale);
  }, [locale, isControlled]);

  useEffect(() => {
    if (isControlled) return;
    setInternalLocale(locale);
  }, [locale, isControlled]);

  function handleSave() {
    if (selectedLocale === locale) return;
    router.replace(pathname, { locale: selectedLocale });
  }

  const hasChanges = selectedLocale !== locale;

  return (
    <div className="space-y-2">
      <Label htmlFor="language">{tSettings("language")}</Label>
      <Select value={selectedLocale} onValueChange={(v) => setSelectedLocale(v as LocaleOption)} name="language">
        <SelectTrigger id="language" size="medium">
          <SelectValue placeholder={tSettings("language")} />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map(({ value, labelKey }) => (
            <SelectItem key={value} value={value}>
              {t(labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {tSettings("languageDescription")}
      </p>
      {!isControlled && (
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          {tSettings("saveChanges")}
        </Button>
      )}
    </div>
  );
}
