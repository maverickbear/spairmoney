import { Suspense } from "react";
import { unstable_noStore } from "next/cache";
import { headers } from "next/headers";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { FeedbackPageClient } from "./feedback-client";

async function FeedbackContent() {
  unstable_noStore();
  await headers();
  const adminService = makeAdminService();
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
