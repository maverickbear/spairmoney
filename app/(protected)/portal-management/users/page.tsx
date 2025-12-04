import { Suspense } from "react";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { redirect } from "next/navigation";
import { UsersPageClient } from "./users-client";

async function UsersContent({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/auth/login");
  }

  const adminService = makeAdminService();
  
  // Check if user is super_admin
  if (!(await adminService.isSuperAdmin(userId))) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const users = await adminService.getAllUsers();

  return <UsersPageClient users={users} filter={params?.filter} />;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  return (
    <Suspense fallback={<div className="w-full p-4 lg:p-8">Loading...</div>}>
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}

