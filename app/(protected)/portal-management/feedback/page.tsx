import { Suspense } from "react";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { redirect } from "next/navigation";
import { FeedbackPageClient } from "./feedback-client";

async function FeedbackContent() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/auth/login");
  }

  const adminService = makeAdminService();
  
  // Check if user is super_admin
  if (!(await adminService.isSuperAdmin(userId))) {
    redirect("/dashboard");
  }

  const result = await adminService.getFeedbacks();

  return <FeedbackPageClient feedbacks={result.feedbacks} metrics={result.metrics} />;
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="w-full p-4 lg:p-8">Loading...</div>}>
      <FeedbackContent />
    </Suspense>
  );
}

