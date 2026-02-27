"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { setDisplayCurrency } from "@/src/presentation/stores/currency-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast-provider";

interface HouseholdSettingsResponse {
  displayCurrency: string;
  supportedCurrencies?: { code: string; name: string; locale: string; sortOrder: number }[];
}

export interface DisplayCurrencySettingProps {
  /** When true, value/onValueChange are controlled and no PATCH is done on change (parent saves). */
  deferSave?: boolean;
  value?: string;
  onValueChange?: (code: string) => void;
  /** Called when initial fetch completes so parent can set initial value. */
  onInitialLoad?: (currency: string) => void;
}

export function DisplayCurrencySetting({ deferSave, value: controlledValue, onValueChange, onInitialLoad }: DisplayCurrencySettingProps = {}) {
  const t = useTranslations("settings");
  const { toast } = useToast();
  const [displayCurrency, setDisplayCurrencyState] = useState<string>("CAD");
  const [supportedCurrencies, setSupportedCurrencies] = useState<
    { code: string; name: string; locale: string }[]
  >([
    { code: "CAD", name: "Canadian Dollar", locale: "en-CA" },
    { code: "USD", name: "US Dollar", locale: "en-US" },
  ]);
  const [loading, setLoading] = useState(true);

  const isControlled = deferSave && onValueChange !== undefined;
  const currentCurrency = isControlled ? (controlledValue ?? displayCurrency) : displayCurrency;
  const setCurrentCurrency = isControlled ? onValueChange! : setDisplayCurrencyState;

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/v2/household/settings"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HouseholdSettingsResponse | null) => {
        if (cancelled) return;
        if (data?.displayCurrency) {
          setDisplayCurrencyState(data.displayCurrency);
          onInitialLoad?.(data.displayCurrency);
        }
        if (data?.supportedCurrencies?.length) {
          setSupportedCurrencies(
            data.supportedCurrencies.map((c) => ({ code: c.code, name: c.name, locale: c.locale }))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onInitialLoad]);

  async function handleChange(code: string) {
    if (isControlled) {
      setCurrentCurrency(code);
      return;
    }
    const previous = displayCurrency;
    const previousOption = supportedCurrencies.find((c) => c.code === previous);
    const newOption = supportedCurrencies.find((c) => c.code === code);
    const locale = newOption?.locale ?? "en";

    setDisplayCurrencyState(code);
    setDisplayCurrency(code, locale);

    const res = await fetch(apiUrl("/api/v2/household/settings"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayCurrency: code }),
    });

    if (!res.ok) {
      setDisplayCurrencyState(previous);
      setDisplayCurrency(previous, previousOption?.locale);
      const err = await res.json().catch(() => ({}));
      toast({
        title: t("displayCurrencyUpdateFailed"),
        description: err?.error ?? res.statusText,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("displayCurrencyUpdated"),
      description: t("displayCurrencyUpdatedDescription"),
    });
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{t("displayCurrency")}</Label>
        <div className="h-9 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="display-currency">{t("displayCurrency")}</Label>
      <Select
        value={currentCurrency}
        onValueChange={handleChange}
        name="display-currency"
      >
        <SelectTrigger id="display-currency" size="medium">
          <SelectValue placeholder={t("displayCurrency")} />
        </SelectTrigger>
        <SelectContent>
          {supportedCurrencies.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name} ({c.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {t("displayCurrencyDescription")}
      </p>
    </div>
  );
}
