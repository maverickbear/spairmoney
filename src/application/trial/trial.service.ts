/**
 * Trial Service
 * Business logic for starting trial subscriptions without payment method
 */

import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { getActiveHouseholdId } from "@/lib/utils/household";
import { getStripeClient } from "@/src/infrastructure/external/stripe/stripe-client";
import { makeSubscriptionsService } from "../subscriptions/subscriptions.factory";
import { logger } from "@/src/infrastructure/utils/logger";

export interface StartTrialResult {
  success: boolean;
  subscription?: any;
  trialEndDate?: string;
  error?: string;
}

export class TrialService {
  /**
   * Start a trial subscription for a user without requiring payment method
   */
  async startTrial(userId: string, planId: string): Promise<StartTrialResult> {
    try {
      const supabase = await createServerClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser || authUser.id !== userId) {
        return { success: false, error: "Unauthorized" };
      }

      // Verify plan exists
      const { data: plan, error: planError } = await supabase
        .from("Plan")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError || !plan) {
        return { success: false, error: "Plan not found" };
      }

      // Check if user already has an active subscription or trial
      const { data: existingSubscriptions, error: subError } = await supabase
        .from("Subscription")
        .select("*")
        .eq("userId", authUser.id)
        .in("status", ["active", "trialing"])
        .order("createdAt", { ascending: false });

      if (subError) {
        logger.error("[TrialService] Error checking existing subscriptions:", subError);
        return { success: false, error: "Failed to check existing subscriptions" };
      }

      // If user already has an active subscription or trial, return error
      if (existingSubscriptions && existingSubscriptions.length > 0) {
        return { success: false, error: "User already has an active subscription or trial" };
      }

      // Check if user already had a trial before (cancelled subscription with trialEndDate)
      const { data: cancelledSubscriptions, error: cancelledError } = await supabase
        .from("Subscription")
        .select("trialEndDate")
        .eq("userId", authUser.id)
        .eq("status", "cancelled")
        .not("trialEndDate", "is", null)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelledError && cancelledError.code !== "PGRST116") {
        logger.error("[TrialService] Error checking cancelled subscriptions:", cancelledError);
      }

      // If user already had a trial (cancelled subscription with trialEndDate), don't allow another trial
      if (cancelledSubscriptions && cancelledSubscriptions.trialEndDate) {
        return { success: false, error: "You have already used your trial period. Please subscribe to a plan." };
      }

      // Calculate trial dates (30 days from now)
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      // Get or create Stripe customer
      let customerId: string;
      const { data: existingSubscription } = await supabase
        .from("Subscription")
        .select("stripeCustomerId")
        .eq("userId", authUser.id)
        .not("stripeCustomerId", "is", null)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get user name from User table
      const { data: userData } = await supabase
        .from("User")
        .select("name")
        .eq("id", authUser.id)
        .single();

      // Get active household ID for the user
      const householdId = await getActiveHouseholdId(authUser.id);
      if (!householdId) {
        logger.error("[TrialService] No active household found for user:", authUser.id);
        return { success: false, error: "No active household found. Please contact support." };
      }

      if (existingSubscription?.stripeCustomerId) {
        customerId = existingSubscription.stripeCustomerId;
        logger.info("[TrialService] Using existing Stripe customer:", customerId);
        
        // Update existing customer with current email and name
        try {
          const stripe = getStripeClient();
          await stripe.customers.update(customerId, {
            email: authUser.email!,
            name: userData?.name || undefined,
            metadata: {
              userId: authUser.id,
            },
          });
          logger.info("[TrialService] Updated existing Stripe customer with email and name:", { 
            customerId, 
            email: authUser.email, 
            name: userData?.name 
          });
        } catch (updateError) {
          logger.error("[TrialService] Error updating existing Stripe customer:", updateError);
          // Continue anyway - customer exists, just couldn't update
        }
      } else {
        // Create Stripe customer
        logger.info("[TrialService] Creating new Stripe customer for user:", authUser.id);
        const stripe = getStripeClient();
        const customer = await stripe.customers.create({
          email: authUser.email!,
          name: userData?.name || undefined,
          metadata: {
            userId: authUser.id,
          },
        });
        customerId = customer.id;
        logger.info("[TrialService] Stripe customer created:", { customerId, email: authUser.email, name: userData?.name });
      }

      // Get price ID (default to monthly)
      const priceId = plan.stripePriceIdMonthly;
      if (!priceId) {
        return { success: false, error: "Stripe price ID not configured for this plan" };
      }

      // Create subscription in Stripe with trial period
      // Using payment_behavior: "default_incomplete" allows trial without payment method
      // The subscription will be in "incomplete" status until payment method is added
      logger.info("[TrialService] Creating Stripe subscription with trial:", { customerId, priceId });
      const stripe = getStripeClient();
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: 30,
        payment_behavior: "default_incomplete",
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          userId: authUser.id,
          planId: planId,
        },
      });

      logger.info("[TrialService] Stripe subscription created:", {
        subscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        trialEnd: stripeSubscription.trial_end,
      });

      // Create subscription in database
      // Use same ID format as webhook handler: userId + "-" + planId
      const subscriptionId = `${authUser.id}-${planId}`;
      const { data: newSubscription, error: insertError } = await supabase
        .from("Subscription")
        .insert({
          id: subscriptionId,
          userId: authUser.id,
          householdId: householdId, // Link to active household
          planId: planId,
          status: "trialing",
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: customerId,
          trialStartDate: trialStartDate.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          currentPeriodStart: stripeSubscription.trial_start 
            ? new Date(stripeSubscription.trial_start * 1000).toISOString()
            : trialStartDate.toISOString(),
          currentPeriodEnd: stripeSubscription.trial_end 
            ? new Date(stripeSubscription.trial_end * 1000).toISOString()
            : trialEndDate.toISOString(),
          cancelAtPeriodEnd: false,
        })
        .select()
        .single();

      if (insertError || !newSubscription) {
        logger.error("[TrialService] Error creating subscription:", insertError);
        // If database insert fails, cancel the Stripe subscription
        try {
          const stripe = getStripeClient();
          await stripe.subscriptions.cancel(stripeSubscription.id);
          logger.info("[TrialService] Stripe subscription cancelled due to database error");
        } catch (cancelError) {
          logger.error("[TrialService] Error cancelling Stripe subscription:", cancelError);
        }
        return { success: false, error: "Failed to create trial subscription" };
      }

      // Move temporary income to household settings and generate initial data if exists
      const { makeProfileService } = await import("@/src/application/profile/profile.factory");
      const profileService = makeProfileService();
      const profile = await profileService.getProfile();
      
      if (profile?.temporaryExpectedIncome) {
        const { makeOnboardingService } = await import("@/src/application/onboarding/onboarding.factory");
        const onboardingService = makeOnboardingService();
        const incomeRange = profile.temporaryExpectedIncome;
        const incomeAmount = profile.temporaryExpectedIncomeAmount;
        
        // Save income to household settings (including custom amount if provided)
        await onboardingService.saveExpectedIncome(
          userId,
          incomeRange,
          undefined,
          undefined,
          incomeAmount
        );
        
        // Generate initial budgets
        try {
          const { makeBudgetRulesService } = await import("@/src/application/budgets/budget-rules.factory");
          const budgetRulesService = makeBudgetRulesService();
          const monthlyIncome = onboardingService.getMonthlyIncomeFromRange(incomeRange, incomeAmount);
          const suggestion = budgetRulesService.suggestRule(monthlyIncome);
          
          await onboardingService.generateInitialBudgets(
            userId,
            incomeRange,
            undefined,
            undefined,
            suggestion.rule.id,
            incomeAmount
          );
          logger.info("[TrialService] Generated initial budgets");
        } catch (error) {
          logger.error("[TrialService] Error generating budgets:", error);
          // Don't fail if budget generation fails
        }
        
        // Create emergency fund goal
        try {
          const { makeGoalsService } = await import("@/src/application/goals/goals.factory");
          const goalsService = makeGoalsService();
          await goalsService.calculateAndUpdateEmergencyFund();
          logger.info("[TrialService] Created emergency fund goal");
        } catch (error) {
          logger.error("[TrialService] Error creating emergency fund:", error);
          // Don't fail if emergency fund creation fails
        }
        
        // Clear temporary income from profile
        await profileService.updateProfile({ 
          temporaryExpectedIncome: null,
          temporaryExpectedIncomeAmount: null 
        });
        logger.info("[TrialService] Moved temporary income to household settings");
      }

      // Invalidate subscription cache to ensure fresh data on next check
      const subscriptionsService = makeSubscriptionsService();
      subscriptionsService.invalidateSubscriptionCache(userId);
      
      // Small delay to ensure cache invalidation is processed and database is consistent
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send welcome email when subscription is created
      if (authUser.email) {
        try {
          const { sendWelcomeEmail } = await import("@/lib/utils/email");
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sparefinance.com/";
          
          await sendWelcomeEmail({
            to: authUser.email,
            userName: "", // Not used anymore, but keeping for interface compatibility
            founderName: "Naor Tartarotti",
            appUrl: appUrl,
          });
          
          logger.info("[TrialService] ✅ Welcome email sent successfully to:", authUser.email);
        } catch (welcomeEmailError) {
          logger.error("[TrialService] ❌ Error sending welcome email:", welcomeEmailError);
          // Don't fail subscription creation if welcome email fails
        }
      }

      logger.info("[TrialService] Trial started successfully:", {
        subscriptionId: newSubscription.id,
        stripeSubscriptionId: stripeSubscription.id,
        planId: planId,
        status: newSubscription.status,
        trialEndDate: trialEndDate.toISOString(),
      });

      return {
        success: true,
        subscription: newSubscription,
        trialEndDate: trialEndDate.toISOString(),
      };
    } catch (error) {
      logger.error("[TrialService] Error starting trial:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start trial",
      };
    }
  }
}

