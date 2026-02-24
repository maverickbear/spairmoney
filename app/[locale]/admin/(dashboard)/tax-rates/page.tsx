import { Suspense } from "react";
import { unstable_noStore } from "next/cache";
import { Loader2 } from "lucide-react";
import { makeTaxRatesService } from "@/src/application/taxes/tax-rates.factory";
import { TaxRatesPageClient } from "./tax-rates-client";

async function TaxRatesContent() {
  unstable_noStore();
  const taxRatesService = makeTaxRatesService();
  const initialRates = await taxRatesService.getAll();
  return <TaxRatesPageClient initialRates={initialRates} />;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function TaxRatesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TaxRatesContent />
    </Suspense>
  );
}
