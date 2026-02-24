import { redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { AdminSideNav } from "@/components/admin/admin-side-nav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  unstable_noStore();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/admin/login");
  }

  const adminService = makeAdminService();
  const canAccessPortal = await adminService.isSuperAdmin(userId);

  if (!canAccessPortal) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSideNav />
      <div className="ml-56 flex flex-1 flex-col min-w-0">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
