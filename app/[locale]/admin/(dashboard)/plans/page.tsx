import { unstable_noStore } from "next/cache";
import { headers } from "next/headers";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { PlansPageClient } from "./plans-client";

export default async function PlansPage() {
  unstable_noStore();
  await headers();
  const adminService = makeAdminService();
  const plans = await adminService.getAllPlans();
  return <PlansPageClient initialPlans={plans} />;
}
