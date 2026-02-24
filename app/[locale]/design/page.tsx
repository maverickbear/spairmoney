import { unstable_noStore } from "next/cache";
import { headers } from "next/headers";
import { DesignPageClient } from "./design-page-client";

export default async function DesignPage() {
  unstable_noStore();
  await headers();
  return <DesignPageClient />;
}
