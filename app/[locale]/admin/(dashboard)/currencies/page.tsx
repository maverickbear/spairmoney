import { Suspense } from "react";
import { unstable_noStore } from "next/cache";
import { headers } from "next/headers";
import { CurrencyRepository } from "@/src/infrastructure/database/repositories/currency.repository";
import { CurrenciesPageClient } from "./currencies-client";

async function CurrenciesContent() {
  unstable_noStore();
  await headers();
  const repo = new CurrencyRepository();
  const currencies = await repo.listAllForAdmin();
  return <CurrenciesPageClient initialCurrencies={currencies} />;
}

export default function CurrenciesPage() {
  return (
    <Suspense fallback={<div className="w-full p-4 lg:p-8">Loading...</div>}>
      <CurrenciesContent />
    </Suspense>
  );
}
