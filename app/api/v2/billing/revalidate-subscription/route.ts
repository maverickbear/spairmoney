import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { clearSubscriptionRequestCache } from "@/src/application/subscriptions/get-dashboard-subscription";
import { invalidateUserCaches } from "@/src/infrastructure/utils/cache-utils";

/**
 * POST /api/v2/billing/revalidate-subscription
 *
 * Invalidates subscription (and related) caches for the current user.
 * Call this after checkout success so the next full page load gets fresh subscription data
 * and the pricing dialog does not reappear.
 */
export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    clearSubscriptionRequestCache(userId);
    await invalidateUserCaches(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REVALIDATE-SUBSCRIPTION] Error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate subscription cache" },
      { status: 500 }
    );
  }
}
