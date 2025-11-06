import { NextResponse } from "next/server";
import { getPlans, getCurrentUserSubscription } from "@/lib/api/plans";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const plans = await getPlans();

    // Get current user's plan
    let currentPlanId: string | undefined;
    try {
      const supabase = await createServerClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const subscription = await getCurrentUserSubscription();
        currentPlanId = subscription?.planId;
      }
    } catch (error) {
      // User not authenticated, that's OK
      console.log("User not authenticated");
    }

    return NextResponse.json({
      plans,
      currentPlanId,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

