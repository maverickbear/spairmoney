import { Suspense } from "react";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { redirect } from "next/navigation";
import { ContactFormsPageClient } from "./contact-forms-client";

async function ContactFormsContent() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/auth/login");
  }

  const adminService = makeAdminService();
  
  // Check if user is super_admin
  if (!(await adminService.isSuperAdmin(userId))) {
    redirect("/dashboard");
  }

  const result = await adminService.getContactForms();

  return <ContactFormsPageClient contactForms={result.contactForms} />;
}

export default function ContactFormsPage() {
  return (
    <Suspense fallback={<div className="w-full p-4 lg:p-8">Loading...</div>}>
      <ContactFormsContent />
    </Suspense>
  );
}

