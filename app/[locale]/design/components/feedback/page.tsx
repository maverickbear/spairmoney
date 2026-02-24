import { unstable_noStore } from "next/cache";
import { headers } from "next/headers";
import { FeedbackPageClient } from "./feedback-page-client";

export default async function DesignFeedbackPage() {
  unstable_noStore();
  await headers();
  return <FeedbackPageClient />;
}
