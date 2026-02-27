"use client";

import { useState } from "react";
import { CurrenciesTable } from "@/components/admin/currencies-table";
import type { CurrencyRow } from "@/src/infrastructure/database/repositories/currency.repository";

interface CurrenciesPageClientProps {
  initialCurrencies: CurrencyRow[];
}

export function CurrenciesPageClient({ initialCurrencies }: CurrenciesPageClientProps) {
  const [currencies, setCurrencies] = useState<CurrencyRow[]>(initialCurrencies);

  async function handleToggleActive(code: string, isActive: boolean) {
    const prev = currencies;
    setCurrencies((p) => p.map((c) => (c.code === code ? { ...c, isActive } : c)));
    try {
      const res = await fetch("/api/v2/admin/currencies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCurrencies(prev);
        throw new Error(data?.error ?? "Failed to update currency");
      }
    } catch (e) {
      setCurrencies(prev);
      throw e;
    }
  }

  return (
    <div className="w-full p-4 lg:p-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Display Currencies</h2>
        <p className="text-sm text-muted-foreground">
          All currencies are pre-registered. Toggle active to make a currency available in app Settings.
        </p>
      </div>
      <CurrenciesTable
        currencies={currencies}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
