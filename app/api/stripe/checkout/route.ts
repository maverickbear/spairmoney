import { NextRequest, NextResponse } from "next/server";
import { makeStripeService } from "@/src/application/stripe/stripe.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, interval = "month", returnUrl, promoCode, isTrial = false } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Build return URL - use provided returnUrl or default to subscription success page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://spair.co/";
    const finalReturnUrl = returnUrl 
      ? `${baseUrl}${returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`}`
      : `${baseUrl}/subscription/success`;

    const stripeService = makeStripeService();

    // For trial checkout, allow unauthenticated users
    // NOTE: This path requires payment method. For trial without card,
    // users should use /api/billing/start-trial after authentication.
    // This is kept for backward compatibility.
    if (isTrial) {
      const result = await stripeService.createTrialCheckoutSession(planId, interval, finalReturnUrl, promoCode);
      
      if (result.error || !result.url) {
        return NextResponse.json(
          { error: result.error || "Failed to create checkout session" },
          { status: 500 }
        );
      }

      return NextResponse.json({ url: result.url });
    }

    // For regular checkout, require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create checkout session
    const result = await stripeService.createCheckoutSession(userId, planId, interval, finalReturnUrl, promoCode);

    if (result.error || !result.url) {
      return NextResponse.json(
        { error: result.error || "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

