import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
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

    const user = await getCurrentUser();
    const subscription = await getCurrentUserSubscription();
    const { plan } = await checkPlanLimits(authUser.id);

    return NextResponse.json({
      user,
      plan: plan ? { name: plan.name } : null,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

