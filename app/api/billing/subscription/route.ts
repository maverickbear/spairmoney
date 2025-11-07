import { NextResponse } from "next/server";
import { getCurrentUserSubscription, checkPlanLimits } from "@/lib/api/plans";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch subscription once and reuse it
    const subscription = await getCurrentUserSubscription();
    // Pass subscription to checkPlanLimits to avoid duplicate fetch
    const { plan, limits } = await checkPlanLimits(authUser.id, subscription);

    return NextResponse.json({
      subscription,
      plan,
      limits,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

