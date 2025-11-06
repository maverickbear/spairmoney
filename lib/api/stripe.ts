"use server";

import Stripe from "stripe";
import { createServerClient } from "@/lib/supabase-server";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

export interface CheckoutSessionData {
  planId: string;
  priceId: string; // monthly or yearly
  mode: "subscription";
}

export async function createCheckoutSession(
  userId: string,
  planId: string,
  interval: "month" | "year" = "month"
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createServerClient();
    
    // Get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser || authUser.id !== userId) {
      return { url: null, error: "Unauthorized" };
    }

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from("Plan")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return { url: null, error: "Plan not found" };
    }

    const priceId = interval === "month" 
      ? plan.stripePriceIdMonthly 
      : plan.stripePriceIdYearly;

    if (!priceId) {
      return { url: null, error: "Stripe price ID not configured for this plan" };
    }

    // Get or create Stripe customer
    let customerId: string;
    const { data: subscription } = await supabase
      .from("Subscription")
      .select("stripeCustomerId")
      .eq("userId", userId)
      .limit(1)
      .single();

    if (subscription?.stripeCustomerId) {
      customerId = subscription.stripeCustomerId;
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: authUser.email!,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      // Update subscription with customer ID
      await supabase
        .from("Subscription")
        .update({ stripeCustomerId: customerId })
        .eq("userId", userId)
        .limit(1);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/welcome?plan=paid`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/select-plan?canceled=true`,
      metadata: {
        userId: userId,
        planId: planId,
        interval: interval,
      },
    });

    return { url: session.url, error: null };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { 
      url: null, 
      error: error instanceof Error ? error.message : "Failed to create checkout session" 
    };
  }
}

export async function createPortalSession(userId: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createServerClient();
    
    // Get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser || authUser.id !== userId) {
      return { url: null, error: "Unauthorized" };
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from("Subscription")
      .select("stripeCustomerId")
      .eq("userId", userId)
      .limit(1)
      .single();

    if (subError || !subscription?.stripeCustomerId) {
      return { url: null, error: "No active subscription found" };
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing`,
    });

    return { url: session.url, error: null };
  } catch (error) {
    console.error("Error creating portal session:", error);
    return { 
      url: null, 
      error: error instanceof Error ? error.message : "Failed to create portal session" 
    };
  }
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeletion(supabase, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling webhook event:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to handle webhook event" 
    };
  }
}

async function handleSubscriptionChange(
  supabase: ReturnType<typeof createServerClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  
  // Find user by customer ID
  const { data: existingSub } = await supabase
    .from("Subscription")
    .select("userId")
    .eq("stripeCustomerId", customerId)
    .limit(1)
    .single();

  if (!existingSub) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  // Get plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error("No price ID in subscription");
    return;
  }

  // Find plan by price ID
  const { data: plan } = await supabase
    .from("Plan")
    .select("id")
    .or(`stripePriceIdMonthly.eq.${priceId},stripePriceIdYearly.eq.${priceId}`)
    .single();

  if (!plan) {
    console.error("No plan found for price ID:", priceId);
    return;
  }

  // Update or create subscription
  const status = mapStripeStatus(subscription.status);
  
  await supabase
    .from("Subscription")
    .upsert({
      id: existingSub.userId + "-" + plan.id,
      userId: existingSub.userId,
      planId: plan.id,
      status: status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    });
}

async function handleSubscriptionDeletion(
  supabase: ReturnType<typeof createServerClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  
  // Update subscription to cancelled and change to free plan
  const { data: existingSub } = await supabase
    .from("Subscription")
    .select("userId")
    .eq("stripeCustomerId", customerId)
    .limit(1)
    .single();

  if (existingSub) {
    // Update to cancelled status
    await supabase
      .from("Subscription")
      .update({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .eq("stripeCustomerId", customerId);

    // Create new free subscription
    await supabase
      .from("Subscription")
      .insert({
        id: existingSub.userId + "-free",
        userId: existingSub.userId,
        planId: "free",
        status: "active",
      });
  }
}

async function handleInvoicePaymentSucceeded(
  supabase: ReturnType<typeof createServerClient>,
  invoice: Stripe.Invoice
) {
  // Payment succeeded - subscription should already be updated
  // This is just for logging or additional actions
  console.log("Payment succeeded for invoice:", invoice.id);
}

async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createServerClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  
  // Update subscription status to past_due
  await supabase
    .from("Subscription")
    .update({
      status: "past_due",
      updatedAt: new Date(),
    })
    .eq("stripeCustomerId", customerId);
}

function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "cancelled" | "past_due" | "trialing" {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
    case "unpaid":
      return "cancelled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    default:
      return "active";
  }
}

