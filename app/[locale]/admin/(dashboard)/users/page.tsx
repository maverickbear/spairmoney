import { Suspense } from "react";
import { unstable_noStore } from "next/cache";
import { headers } from "next/headers";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { UsersPageClient } from "./users-client";

async function UsersContent({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  unstable_noStore();
  await headers();
  const adminService = makeAdminService();
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
