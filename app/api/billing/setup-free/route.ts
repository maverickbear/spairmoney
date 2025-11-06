import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    console.log("[SETUP-FREE] Starting free plan setup");
    
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      console.error("[SETUP-FREE] User not authenticated:", authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[SETUP-FREE] User authenticated:", authUser.id);

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("Subscription")
      .select("id, planId, status")
      .eq("userId", authUser.id)
      .eq("status", "active")
      .single();

    if (existingSubscription) {
      console.log("[SETUP-FREE] User already has active subscription:", existingSubscription);
      return NextResponse.json(
        { error: "User already has an active subscription" },
        { status: 400 }
      );
    }

    // Ensure free plan exists
    const { data: existingPlan } = await supabase
      .from("Plan")
      .select("id")
      .eq("id", "free")
      .single();

    if (!existingPlan) {
      console.log("[SETUP-FREE] Free plan not found, creating it");
      // Create free plan if it doesn't exist
      const { error: planError } = await supabase
        .from("Plan")
        .insert({
          id: "free",
          name: "free",
          priceMonthly: 0.00,
          priceYearly: 0.00,
          features: {
            maxTransactions: 50,
            maxAccounts: 2,
            hasInvestments: false,
            hasAdvancedReports: false,
            hasCsvExport: false,
            hasDebts: true,
            hasGoals: true,
          },
        });

      if (planError) {
        console.error("[SETUP-FREE] Error creating free plan:", planError);
        return NextResponse.json(
          { error: "Failed to create free plan" },
          { status: 500 }
        );
      }
      console.log("[SETUP-FREE] Free plan created successfully");
    }

    // Create free subscription for user
    const subscriptionId = `${authUser.id}-free`;
    const { data: newSubscription, error: subscriptionError } = await supabase
      .from("Subscription")
      .insert({
        id: subscriptionId,
        userId: authUser.id,
        planId: "free",
        status: "active",
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error("[SETUP-FREE] Error creating subscription:", subscriptionError);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    console.log("[SETUP-FREE] Free subscription created successfully:", {
      subscriptionId: newSubscription.id,
      userId: authUser.id,
      planId: "free"
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: newSubscription.id,
        planId: newSubscription.planId,
        status: newSubscription.status,
      }
    });
  } catch (error) {
    console.error("[SETUP-FREE] Error in setup-free:", error);
    return NextResponse.json(
      { error: "Failed to setup free plan" },
      { status: 500 }
    );
  }
}

