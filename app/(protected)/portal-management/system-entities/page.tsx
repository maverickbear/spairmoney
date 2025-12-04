import { Suspense } from "react";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { redirect } from "next/navigation";
import { SystemEntitiesPageClient } from "./system-entities-client";

async function SystemEntitiesContent() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/auth/login");
  }

  const adminService = makeAdminService();
  
  // Check if user is super_admin
  if (!(await adminService.isSuperAdmin(userId))) {
    redirect("/dashboard");
  }

  // Fetch all system entities in parallel
  const [groups, categories, subcategories] = await Promise.all([
    adminService.getAllSystemGroups(),
    adminService.getAllSystemCategories(),
    adminService.getAllSystemSubcategories(),
  ]);

  return (
    <SystemEntitiesPageClient
      initialGroups={groups}
      initialCategories={categories}
      initialSubcategories={subcategories}
    />
  );
}

export default function SystemEntitiesPage() {
  return (
    <Suspense fallback={<div className="w-full p-4 lg:p-8">Loading...</div>}>
      <SystemEntitiesContent />
    </Suspense>
  );
}

