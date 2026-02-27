"use client";

import { useState } from "react";
import { usePagePerformance } from "@/hooks/use-page-performance";
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ProfileModule } from "../profile/profile-module";
import { DisplayCurrencySetting } from "@/src/presentation/components/features/settings/display-currency-setting";
import { LanguageSetting, type LocaleOption } from "@/src/presentation/components/features/settings/language-setting";
import { RequestPasswordResetLink } from "@/components/profile/request-password-reset-link";
import { DeleteAccountSection } from "@/components/profile/delete-account-section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { useToast } from "@/components/toast-provider";
import { apiUrl } from "@/lib/utils/api-base-url";
import { setDisplayCurrency } from "@/src/presentation/stores/currency-store";
import { Save, Loader2 } from "lucide-react";

export default function MyAccountPage() {
  const tNav = useTranslations("nav");
  const tSettings = useTranslations("settings");
  const tCommon = useTranslations("common");
  const perf = usePagePerformance("Settings - My Account");
  const locale = useLocale() as LocaleOption;
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedLocale, setSelectedLocale] = useState<LocaleOption>(locale);
  const [displayCurrency, setDisplayCurrencyState] = useState<string>("");
  const [initialCurrency, setInitialCurrency] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedLocale(locale);
  }, [locale]);

  useEffect(() => {
    const timer = setTimeout(() => {
      perf.markComplete();
    }, 100);
    return () => clearTimeout(timer);
  }, [perf]);

  function handleCurrencyInitialLoad(currency: string) {
    setDisplayCurrencyState(currency);
    setInitialCurrency((prev) => (prev === "" ? currency : prev));
  }

  const currencyChanged = initialCurrency !== "" && displayCurrency !== initialCurrency;
  const languageChanged = selectedLocale !== locale;
  const hasChanges = languageChanged || currencyChanged;

  async function handleSaveCurrencyAndLanguage() {
    if (!hasChanges) return;
    setSaving(true);
    try {
      if (currencyChanged && displayCurrency) {
        const res = await fetch(apiUrl("/api/v2/household/settings"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayCurrency }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast({
            title: tSettings("displayCurrencyUpdateFailed"),
            description: err?.error ?? res.statusText,
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        const supportedCurrencies = await fetch(apiUrl("/api/v2/household/settings")).then((r) => (r.ok ? r.json() : null));
        const option = supportedCurrencies?.supportedCurrencies?.find((c: { code: string }) => c.code === displayCurrency);
        setDisplayCurrency(displayCurrency, option?.locale ?? "en");
        setInitialCurrency(displayCurrency);
        toast({
          title: tSettings("displayCurrencyUpdated"),
          description: tSettings("displayCurrencyUpdatedDescription"),
        });
      }
      if (languageChanged) {
        router.replace(pathname, { locale: selectedLocale });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={tNav("items.myAccount")}
      />

      <div className="w-full p-4 lg:p-8 flex justify-center">
        <div className="space-y-6 w-full max-w-2xl">
          <ProfileModule />

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{tSettings("currencyAndLanguage")}</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <LanguageSetting value={selectedLocale} onChange={setSelectedLocale} />
              <DisplayCurrencySetting
                deferSave
                value={displayCurrency || undefined}
                onValueChange={setDisplayCurrencyState}
                onInitialLoad={handleCurrencyInitialLoad}
              />
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button
                  type="button"
                  size="medium"
                  disabled={saving || !hasChanges}
                  onClick={handleSaveCurrencyAndLanguage}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tCommon("saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {tSettings("saveChanges")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{tSettings("changePassword")}</h2>
            </CardHeader>
            <CardContent>
              <RequestPasswordResetLink />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{tSettings("deleteAccount")}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {tSettings("deleteAccountDescription")}
              </p>
              <DeleteAccountSection />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
