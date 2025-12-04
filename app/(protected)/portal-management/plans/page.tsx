import { Suspense } from "react";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { redirect } from "next/navigation";
import { PlansPageClient } from "./plans-client";

async function PlansContent() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/auth/login");
  }

  const adminService = makeAdminService();
  
  // Check if user is super_admin
  if (!(await adminService.isSuperAdmin(userId))) {
    redirect("/dashboard");
  }

  const plans = await adminService.getAllPlans();

  return <PlansPageClient initialPlans={plans} />;
}

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="w-full p-4 lg:p-8">Loading...</div>}>
      <PlansContent />
    </Suspense>
  );
}

