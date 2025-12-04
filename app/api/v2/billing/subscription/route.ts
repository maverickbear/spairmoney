import { NextRequest, NextResponse } from "next/server";
import { makeSubscriptionsService } from "@/src/application/subscriptions/subscriptions.factory";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

/**
 * GET /api/v2/billing/subscription
 * 
 * Returns current user's subscription data (subscription + plan + limits)
 * Uses SubscriptionsService as single source of truth
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const service = makeSubscriptionsService();
    const subscriptionData = await service.getCurrentUserSubscriptionData();
    
    // OPTIMIZATION: Fetch limits in parallel with Stripe interval check
    // This reduces total request time by doing everything in parallel
    const { searchParams } = new URL(request.url);
    const includeStripe = searchParams.get("includeStripe") === "true";
    const includeLimits = searchParams.get("includeLimits") !== "false"; // Default true
    
    // Fetch everything in parallel for better performance
    const [intervalResult, limitsResult] = await Promise.all([
      // Determine subscription interval (monthly/yearly) from Stripe
      // OPTIMIZATION: Only fetch from Stripe if explicitly requested (includeStripe=true)
      (async (): Promise<"month" | "year" | null> => {
        if (!includeStripe || !subscriptionData.subscription?.stripeSubscriptionId || !subscriptionData.plan) {
          return null;
        }
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscriptionData.subscription.stripeSubscriptionId
          );
          const priceId = stripeSubscription.items.data[0]?.price.id;
          
          if (priceId && subscriptionData.plan) {
            if (subscriptionData.plan.stripePriceIdMonthly === priceId) {
              return "month";
            } else if (subscriptionData.plan.stripePriceIdYearly === priceId) {
              return "year";
            }
          }
        } catch (error) {
          console.error("Error fetching Stripe subscription interval:", error);
        }
        return null;
      })(),
      // Fetch transaction and account limits (only if requested)
      includeLimits
        ? Promise.all([
            service.checkTransactionLimit(userId),
            service.checkAccountLimit(userId),
          ]).then(([transactionLimit, accountLimit]) => ({
            transactionLimit,
            accountLimit,
          }))
        : Promise.resolve({ transactionLimit: null, accountLimit: null }),
    ]);

    // Add cache headers for better performance
    // Cache for 60 seconds - subscription data doesn't change frequently
    return NextResponse.json(
      {
        subscription: subscriptionData.subscription,
        plan: subscriptionData.plan,
        limits: subscriptionData.limits,
        interval: intervalResult,
        transactionLimit: limitsResult.transactionLimit,
        accountLimit: limitsResult.accountLimit,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching subscription:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

