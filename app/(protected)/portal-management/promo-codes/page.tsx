import { Suspense } from "react";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { makeSubscriptionsService } from "@/src/application/subscriptions/subscriptions.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { redirect } from "next/navigation";
import { PromoCodesPageClient } from "./promo-codes-client";

async function PromoCodesContent() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/auth/login");
  }

  const adminService = makeAdminService();
  
  // Check if user is super_admin
  if (!(await adminService.isSuperAdmin(userId))) {
    redirect("/dashboard");
  }

  // Fetch data in parallel
  const [promoCodes, plans] = await Promise.all([
    adminService.getAllPromoCodes(),
    makeSubscriptionsService().getPlans(),
  ]);

  const availablePlans = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
  }));

  return <PromoCodesPageClient initialPromoCodes={promoCodes} availablePlans={availablePlans} />;
}

export default function PromoCodesPage() {
  return (
    <Suspense fallback={<div className="w-full p-4 lg:p-8">Loading...</div>}>
      <PromoCodesContent />
    </Suspense>
  );
}

