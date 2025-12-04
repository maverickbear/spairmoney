/**
 * Stripe Service
 * Business logic for Stripe integration
 * Orchestrates Stripe operations including checkout, subscriptions, and webhooks
 */

import { getStripeClient } from "@/src/infrastructure/external/stripe/stripe-client";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { CheckoutSessionResult, WebhookEventResult } from "../../domain/stripe/stripe.types";
import Stripe from "stripe";
import { logger } from "@/src/infrastructure/utils/logger";

export class StripeService {
  /**
   * Create a checkout session for trial (no authentication required)
   * NOTE: This method requires payment method collection. For trial without card,
   * use /api/billing/start-trial instead which creates subscription directly.
   * This method is kept for backward compatibility but should not be used for new trial flows.
   */
  async createTrialCheckoutSession(
    planId: string,
    interval: "month" | "year" = "month",
    returnUrl?: string,
    promoCode?: string
  ): Promise<CheckoutSessionResult> {
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();

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

      // Get promo code if provided
      let stripeCouponId: string | undefined;
      if (promoCode) {
        const { data: promoCodeData } = await supabase
          .from("PromoCode")
          .select("stripeCouponId, isActive, expiresAt, planIds")
          .eq("code", promoCode.toUpperCase())
          .single();

        if (promoCodeData && promoCodeData.isActive) {
          if (promoCodeData.expiresAt && new Date(promoCodeData.expiresAt) < new Date()) {
            return { url: null, error: "Promo code has expired" };
          }

          const planIds = (promoCodeData.planIds || []) as string[];
          if (planIds.length > 0 && !planIds.includes(planId)) {
            return { url: null, error: "Promo code not valid for this plan" };
          }

          stripeCouponId = promoCodeData.stripeCouponId || undefined;
        } else {
          return { url: null, error: "Promo code not found" };
        }
      }

      // Create checkout session
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sparefinance.com/";
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: 30,
          metadata: {
            planId: planId,
            interval: interval,
          },
        },
        payment_method_collection: "always",
        client_reference_id: `trial-${planId}-${Date.now()}`,
        success_url: returnUrl 
          ? `${baseUrl}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`
          : `${baseUrl}subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}dashboard?openPricingModal=true&canceled=true`,
        metadata: {
          planId: planId,
          interval: interval,
          isTrial: "true",
        },
      };

      if (stripeCouponId) {
        sessionParams.discounts = [{ coupon: stripeCouponId }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return { url: session.url, error: null };
    } catch (error) {
      logger.error("[StripeService] Error creating trial checkout session:", error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : "Failed to create checkout session" 
      };
    }
  }

  /**
   * Create a checkout session for authenticated user
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    interval: "month" | "year" = "month",
    returnUrl?: string,
    promoCode?: string
  ): Promise<CheckoutSessionResult> {
    try {
      const stripe = getStripeClient();
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
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscription?.stripeCustomerId) {
        customerId = subscription.stripeCustomerId;
      } else {
        // Get user data
        const { data: userData } = await supabase
          .from("User")
          .select("name, email")
          .eq("id", userId)
          .single();

        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: userData?.email || authUser.email || undefined,
          name: userData?.name || undefined,
          metadata: {
            userId: userId,
          },
        });

        customerId = customer.id;
      }

      // Get promo code if provided
      let stripeCouponId: string | undefined;
      if (promoCode) {
        const { data: promoCodeData } = await supabase
          .from("PromoCode")
          .select("stripeCouponId, isActive, expiresAt, planIds")
          .eq("code", promoCode.toUpperCase())
          .single();

        if (promoCodeData && promoCodeData.isActive) {
          if (promoCodeData.expiresAt && new Date(promoCodeData.expiresAt) < new Date()) {
            return { url: null, error: "Promo code has expired" };
          }

          const planIds = (promoCodeData.planIds || []) as string[];
          if (planIds.length > 0 && !planIds.includes(planId)) {
            return { url: null, error: "Promo code not valid for this plan" };
          }

          stripeCouponId = promoCodeData.stripeCouponId || undefined;
        } else {
          return { url: null, error: "Promo code not found" };
        }
      }

      // Create checkout session
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sparefinance.com/";
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: {
            userId: userId,
            planId: planId,
            interval: interval,
          },
        },
        success_url: returnUrl 
          ? `${baseUrl}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`
          : `${baseUrl}subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}dashboard?openPricingModal=true&canceled=true`,
        metadata: {
          userId: userId,
          planId: planId,
          interval: interval,
        },
      };

      if (stripeCouponId) {
        sessionParams.discounts = [{ coupon: stripeCouponId }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return { url: session.url, error: null };
    } catch (error) {
      logger.error("[StripeService] Error creating checkout session:", error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : "Failed to create checkout session" 
      };
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(userId: string): Promise<CheckoutSessionResult> {
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();

      // Get user's Stripe customer ID
      const { data: subscription } = await supabase
        .from("Subscription")
        .select("stripeCustomerId")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription?.stripeCustomerId) {
        return { url: null, error: "No Stripe customer found" };
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sparefinance.com/";
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${baseUrl}subscription`,
      });

      return { url: session.url, error: null };
    } catch (error) {
      logger.error("[StripeService] Error creating portal session:", error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : "Failed to create portal session" 
      };
    }
  }

  /**
   * Handle webhook event
   * Note: This is a simplified version. The full implementation should handle
   * all webhook event types (checkout.session.completed, subscription.updated, etc.)
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<WebhookEventResult> {
    try {
      // This is a placeholder. The full implementation should:
      // 1. Handle checkout.session.completed
      // 2. Handle subscription.created/updated/deleted
      // 3. Handle invoice.payment_succeeded/failed
      // 4. Update database accordingly
      
      logger.info("[StripeService] Webhook event received:", { type: event.type, id: event.id });
      
      // Return success for now - full implementation should be added
      return { success: true };
    } catch (error) {
      logger.error("[StripeService] Error handling webhook event:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to handle webhook event" 
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): Stripe.Event {
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(body, signature, secret);
  }

  /**
   * Sync plan to Stripe (features, prices, product name)
   */
  async syncPlanToStripe(planId: string): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
    const warnings: string[] = [];
    
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();
      
      // Get plan from database
      const { data: plan, error: planError } = await supabase
        .from("Plan")
        .select("id, name, priceMonthly, priceYearly, features, stripeProductId, stripePriceIdMonthly, stripePriceIdYearly")
        .eq("id", planId)
        .single();

      if (planError || !plan) {
        return { success: false, error: `Plan ${planId} not found` };
      }

      if (!plan.stripeProductId) {
        return { success: false, error: `Plan ${planId} has no Stripe Product ID configured` };
      }

      // 1. Update product name
      try {
        await stripe.products.update(plan.stripeProductId, {
          name: plan.name,
        });
        logger.info(`[StripeService] Updated product name: ${plan.name}`);
      } catch (error) {
        warnings.push(`Failed to update product name: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      // 2. Update or create prices
      const currency = "cad";
      
      // Update monthly price
      if (plan.stripePriceIdMonthly) {
        try {
          const currentPrice = await stripe.prices.retrieve(plan.stripePriceIdMonthly);
          const currentAmount = currentPrice.unit_amount || 0;
          const newAmount = Math.round(plan.priceMonthly * 100);
          
          if (currentAmount !== newAmount) {
            const newMonthlyPrice = await stripe.prices.create({
              product: plan.stripeProductId,
              unit_amount: newAmount,
              currency: currency,
              recurring: { interval: "month" },
            });
            
            await stripe.prices.update(plan.stripePriceIdMonthly, { active: false });
            
            await supabase
              .from("Plan")
              .update({ stripePriceIdMonthly: newMonthlyPrice.id })
              .eq("id", planId);
            
            logger.info(`[StripeService] Updated monthly price: ${newMonthlyPrice.id}`);
          }
        } catch (error) {
          warnings.push(`Failed to update monthly price: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      } else if (plan.priceMonthly) {
        try {
          const newMonthlyPrice = await stripe.prices.create({
            product: plan.stripeProductId,
            unit_amount: Math.round(plan.priceMonthly * 100),
            currency: currency,
            recurring: { interval: "month" },
          });
          
          await supabase
            .from("Plan")
            .update({ stripePriceIdMonthly: newMonthlyPrice.id })
            .eq("id", planId);
          
          logger.info(`[StripeService] Created monthly price: ${newMonthlyPrice.id}`);
        } catch (error) {
          warnings.push(`Failed to create monthly price: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Update yearly price
      if (plan.stripePriceIdYearly) {
        try {
          const currentPrice = await stripe.prices.retrieve(plan.stripePriceIdYearly);
          const currentAmount = currentPrice.unit_amount || 0;
          const newAmount = Math.round(plan.priceYearly * 100);
          
          if (currentAmount !== newAmount) {
            const newYearlyPrice = await stripe.prices.create({
              product: plan.stripeProductId,
              unit_amount: newAmount,
              currency: currency,
              recurring: { interval: "year" },
            });
            
            await stripe.prices.update(plan.stripePriceIdYearly, { active: false });
            
            await supabase
              .from("Plan")
              .update({ stripePriceIdYearly: newYearlyPrice.id })
              .eq("id", planId);
            
            logger.info(`[StripeService] Updated yearly price: ${newYearlyPrice.id}`);
          }
        } catch (error) {
          warnings.push(`Failed to update yearly price: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      } else if (plan.priceYearly) {
        try {
          const newYearlyPrice = await stripe.prices.create({
            product: plan.stripeProductId,
            unit_amount: Math.round(plan.priceYearly * 100),
            currency: currency,
            recurring: { interval: "year" },
          });
          
          await supabase
            .from("Plan")
            .update({ stripePriceIdYearly: newYearlyPrice.id })
            .eq("id", planId);
          
          logger.info(`[StripeService] Created yearly price: ${newYearlyPrice.id}`);
        } catch (error) {
          warnings.push(`Failed to create yearly price: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // 3. Sync features
      const featuresResult = await this.syncPlanFeaturesToStripe(planId);
      if (!featuresResult.success) {
        warnings.push(`Failed to sync features: ${featuresResult.error}`);
      }

      return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (error) {
      logger.error("[StripeService] Error syncing plan to Stripe:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  }

  /**
   * Map Stripe subscription status to domain status
   */
  mapStripeStatus(status: Stripe.Subscription.Status): "active" | "cancelled" | "past_due" | "trialing" | "unpaid" {
    switch (status) {
      case "active":
        return "active";
      case "canceled":
      case "unpaid":
        return status === "unpaid" ? "unpaid" : "cancelled";
      case "past_due":
        return "past_due";
      case "trialing":
        return "trialing";
      case "incomplete":
      case "incomplete_expired":
        // Incomplete subscriptions (no payment method) should be treated as trialing
        // until payment method is added, then they become active
        // If incomplete_expired, treat as cancelled
        return status === "incomplete_expired" ? "cancelled" : "trialing";
      default:
        return "active";
    }
  }

  /**
   * Get payment methods for customer
   */
  async getPaymentMethods(userId: string): Promise<{
    paymentMethods: Stripe.PaymentMethod[];
    error: string | null;
  }> {
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();
      
      // Get customer ID
      const { data: subscription } = await supabase
        .from("Subscription")
        .select("stripeCustomerId")
        .eq("userId", userId)
        .not("stripeCustomerId", "is", null)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription?.stripeCustomerId) {
        return { paymentMethods: [], error: "No customer found" };
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: subscription.stripeCustomerId,
        type: "card",
      });

      return { paymentMethods: paymentMethods.data, error: null };
    } catch (error) {
      logger.error("[StripeService] Error getting payment methods:", error);
      return { 
        paymentMethods: [], 
        error: error instanceof Error ? error.message : "Failed to get payment methods" 
      };
    }
  }

  /**
   * Create setup intent for adding new payment method
   */
  async createSetupIntent(userId: string): Promise<{
    clientSecret: string | null;
    error: string | null;
  }> {
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();
      
      // Get customer ID
      const { data: subscription } = await supabase
        .from("Subscription")
        .select("stripeCustomerId")
        .eq("userId", userId)
        .not("stripeCustomerId", "is", null)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription?.stripeCustomerId) {
        return { clientSecret: null, error: "No customer found" };
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: subscription.stripeCustomerId,
        payment_method_types: ["card"],
      });

      return { clientSecret: setupIntent.client_secret, error: null };
    } catch (error) {
      logger.error("[StripeService] Error creating setup intent:", error);
      return { 
        clientSecret: null, 
        error: error instanceof Error ? error.message : "Failed to create setup intent" 
      };
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();
      
      // Get customer ID
      const { data: subscription } = await supabase
        .from("Subscription")
        .select("stripeCustomerId")
        .eq("userId", userId)
        .not("stripeCustomerId", "is", null)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription?.stripeCustomerId) {
        return { success: false, error: "No customer found" };
      }

      // Verify payment method belongs to customer
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod.customer !== subscription.stripeCustomerId) {
        return { success: false, error: "Payment method does not belong to customer" };
      }

      await stripe.paymentMethods.detach(paymentMethodId);

      return { success: true, error: null };
    } catch (error) {
      logger.error("[StripeService] Error deleting payment method:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete payment method" 
      };
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();
      
      // Get customer ID
      const { data: subscription } = await supabase
        .from("Subscription")
        .select("stripeCustomerId")
        .eq("userId", userId)
        .not("stripeCustomerId", "is", null)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription?.stripeCustomerId) {
        return { success: false, error: "No customer found" };
      }

      // Verify payment method belongs to customer
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod.customer !== subscription.stripeCustomerId) {
        return { success: false, error: "Payment method does not belong to customer" };
      }

      // Attach payment method to customer if not already attached
      if (!paymentMethod.customer) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: subscription.stripeCustomerId,
        });
      }

      // Update customer's default payment method
      await stripe.customers.update(subscription.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return { success: true, error: null };
    } catch (error) {
      logger.error("[StripeService] Error setting default payment method:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to set default payment method" 
      };
    }
  }

  /**
   * Update subscription trial end date
   */
  async updateSubscriptionTrial(
    userId: string,
    trialEndDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();
      
      // Get subscription
      const { data: subscription, error: subError } = await supabase
        .from("Subscription")
        .select("id, stripeSubscriptionId, status, trialEndDate")
        .eq("userId", userId)
        .not("stripeSubscriptionId", "is", null)
        .in("status", ["trialing", "active"])
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError || !subscription?.stripeSubscriptionId) {
        return { success: false, error: "No active subscription found" };
      }

      if (subscription.status !== "trialing") {
        return { success: false, error: "Subscription is not in trial period" };
      }

      const now = new Date();
      if (trialEndDate <= now) {
        return { success: false, error: "Trial end date must be in the future" };
      }

      const trialEndTimestamp = Math.floor(trialEndDate.getTime() / 1000);

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        trial_end: trialEndTimestamp,
      });

      // Invalidate cache
      const { makeSubscriptionsService } = await import("../subscriptions/subscriptions.factory");
      const subscriptionsService = makeSubscriptionsService();
      subscriptionsService.invalidateSubscriptionCache(userId);

      logger.info(`[StripeService] Updated subscription trial for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error("[StripeService] Error updating subscription trial:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update subscription trial",
      };
    }
  }

  /**
   * Sync plan features to Stripe using Features API
   */
  private async syncPlanFeaturesToStripe(planId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = getStripeClient();
      const supabase = await createServerClient();
      
      // Get plan from database
      const { data: plan, error: planError } = await supabase
        .from("Plan")
        .select("id, name, features, stripeProductId")
        .eq("id", planId)
        .single();

      if (planError || !plan) {
        return { success: false, error: `Plan ${planId} not found` };
      }

      if (!plan.stripeProductId) {
        return { success: false, error: `Plan ${planId} has no Stripe Product ID configured` };
      }

      const FEATURE_DEFINITIONS = [
        { lookupKey: "investments", name: "Investments", description: "Investment tracking and portfolio management" },
        { lookupKey: "household", name: "Household Members", description: "Add and manage household members" },
        { lookupKey: "advanced_reports", name: "Advanced Reports", description: "Access to advanced financial reports" },
        { lookupKey: "csv_export", name: "CSV Export", description: "Export data to CSV format" },
        { lookupKey: "csv_import", name: "CSV Import", description: "Import data from CSV files" },
        { lookupKey: "debts", name: "Debt Tracking", description: "Track and manage debts" },
        { lookupKey: "goals", name: "Goals", description: "Set and track financial goals" },
        { lookupKey: "bank_integration", name: "Bank Integration", description: "Connect bank accounts via Plaid" },
        { lookupKey: "receipt_scanner", name: "Receipt Scanner", description: "AI-powered receipt scanning and transaction extraction" },
      ] as const;

      // Map our features to Stripe Features
      const featureMap: Record<string, boolean> = {
        investments: plan.features.hasInvestments,
        household: plan.features.hasHousehold,
        advanced_reports: plan.features.hasAdvancedReports,
        csv_export: plan.features.hasCsvExport,
        csv_import: plan.features.hasCsvImport,
        debts: plan.features.hasDebts,
        goals: plan.features.hasGoals,
        bank_integration: plan.features.hasBankIntegration,
        receipt_scanner: plan.features.hasReceiptScanner,
      };

      // Create/update all features in Stripe
      const featureIds: string[] = [];
      for (const featureDef of FEATURE_DEFINITIONS) {
        if (featureMap[featureDef.lookupKey]) {
          try {
            const featureId = await this.ensureStripeFeature(
              featureDef.lookupKey,
              featureDef.name,
              featureDef.description
            );
            featureIds.push(featureId);
            logger.info(`[StripeService] Feature ${featureDef.lookupKey} ensured: ${featureId}`);
          } catch (error) {
            logger.error(`[StripeService] Error ensuring feature ${featureDef.lookupKey}:`, error);
          }
        }
      }

      // Update product with features metadata
      const metadata: Record<string, string> = {
        planId: plan.id,
        planName: plan.name,
        hasInvestments: String(plan.features.hasInvestments),
        hasAdvancedReports: String(plan.features.hasAdvancedReports),
        hasCsvExport: String(plan.features.hasCsvExport),
        hasCsvImport: String(plan.features.hasCsvImport),
        hasDebts: String(plan.features.hasDebts),
        hasGoals: String(plan.features.hasGoals),
        hasBankIntegration: String(plan.features.hasBankIntegration),
        hasHousehold: String(plan.features.hasHousehold),
        maxTransactions: String(plan.features.maxTransactions),
        maxAccounts: String(plan.features.maxAccounts),
        featureIds: featureIds.join(","),
        features: JSON.stringify(plan.features),
      };

      await stripe.products.update(plan.stripeProductId, {
        metadata,
      });

      return { success: true };
    } catch (error) {
      logger.error("[StripeService] Error syncing plan features to Stripe:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create or update a Stripe Feature (private method)
   */
  private async ensureStripeFeature(
    lookupKey: string,
    name: string,
    description: string
  ): Promise<string> {
    const stripe = getStripeClient();
    
    try {
      // Try to find existing feature
      const existingFeatures = await stripe.entitlements.features.list({
        lookup_key: lookupKey,
        limit: 1,
      });

      if (existingFeatures.data.length > 0) {
        // Update existing feature
        const feature = await stripe.entitlements.features.update(
          existingFeatures.data[0].id,
          {
            name,
            metadata: {
              description,
            },
          }
        );
        return feature.id;
      } else {
        // Create new feature
        const feature = await stripe.entitlements.features.create({
          lookup_key: lookupKey,
          name,
          metadata: {
            description,
          },
        });
        return feature.id;
      }
    } catch (error) {
      logger.error(`[StripeService] Error ensuring feature ${lookupKey}:`, error);
      throw error;
    }
  }
}

