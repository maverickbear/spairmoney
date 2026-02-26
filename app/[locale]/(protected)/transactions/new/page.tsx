"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Redirects /transactions/new to /transactions?open=new so the main
 * transactions page opens the add-transaction form.
 */
export default function NewTransactionPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const base = pathname.replace(/\/new\/?$/, "") || "/transactions";
    router.replace(`${base}?open=new`);
  }, [pathname, router]);

  return null;
}
