import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { makeStripeService } from "@/src/application/stripe/stripe.factory";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId as string | undefined;
    const interval = (body.interval === "year" ? "year" : "month") as "month" | "year";
    const returnUrl = typeof body.returnUrl === "string" ? body.returnUrl : undefined;
    const promoCode = typeof body.promoCode === "string" ? body.promoCode : undefined;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data: existingSubscriptions } = await supabase
      .from("app_subscriptions")
      .select("id, status, plan_id, stripe_subscription_id")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const sub = existingSubscriptions[0];
      const isLocalTrialOnly =
        sub.plan_id === "trial" && sub.stripe_subscription_id == null;
      if (!isLocalTrialOnly) {
        return NextResponse.json(
          { error: "You already have an active subscription or trial." },
          { status: 400 }
        );
      }
    }

    const { data: cancelledWithTrial } = await supabase
      .from("app_subscriptions")
      .select("trial_end_date")
      .eq("user_id", userId)
      .eq("status", "cancelled")
      .not("trial_end_date", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isLocalTrialOnly =
      existingSubscriptions?.[0]?.plan_id === "trial" &&
      existingSubscriptions[0]?.stripe_subscription_id == null;
    const alreadyUsedTrial = !!cancelledWithTrial?.trial_end_date;
    const skipTrial = isLocalTrialOnly || alreadyUsedTrial;

    const stripeService = makeStripeService();
    const result = await stripeService.createTrialCheckoutSessionForUser(
      userId,
      planId,
      interval,
      returnUrl,
      undefined,
      promoCode,
      skipTrial
    );

    if (result.error || !result.url) {
      const statusCode =
        result.error === "Unauthorized"
          ? 401
          : result.error === "Plan not found"
            ? 404
            : result.error?.includes("not configured in Stripe") || result.error?.includes("Stripe Price")
              ? 503
              : result.error?.includes("email is required") || result.error?.includes("account profile")
                ? 400
                : 500;
      if (statusCode === 500) {
        console.error("[BILLING/CHECKOUT-SESSION] Service error (500):", result.error);
      }
      return NextResponse.json(
        { error: result.error || "Failed to create checkout session" },
        { status: statusCode }
      );
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[BILLING/CHECKOUT-SESSION] Unhandled error:", message, stack ?? String(error));
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
