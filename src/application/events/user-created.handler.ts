/**
 * User Created Event Handler
 * Handles UserCreated events by creating personal household
 */

import { UserCreatedEvent, isUserCreatedEvent } from "@/src/domain/events/domain-events.types";
import { logger } from "@/src/infrastructure/utils/logger";
import { DomainEvent } from "@/src/domain/events/domain-events.types";

/**
 * Handle UserCreated event
 * Creates personal household for new user
 */
export async function handleUserCreated(event: DomainEvent): Promise<void> {
  if (!isUserCreatedEvent(event)) {
    return;
  }

  const userCreatedEvent = event as UserCreatedEvent;
  logger.info(`[UserCreatedHandler] Processing UserCreated event for user: ${userCreatedEvent.userId}`);

  try {
    // Import services dynamically to avoid circular dependencies
    const { createServiceRoleClient } = await import("@/src/infrastructure/database/supabase-server");
    const serviceRoleClient = createServiceRoleClient();
    const householdName = userCreatedEvent.name || "Minha Conta";

    // Call the atomic SQL function to create household, member, and active household
    // Function signature: create_personal_household_atomic(p_user_id uuid, p_household_name text)
    const { data, error } = await serviceRoleClient.rpc("create_personal_household_atomic", {
      p_user_id: userCreatedEvent.userId,
      p_household_name: householdName,
    });

    if (error) {
      logger.error("[UserCreatedHandler] Error calling create_personal_household_atomic:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create personal household: ${errorMessage}`);
    }

    if (!data) {
      throw new Error("Failed to create personal household: function returned no data");
    }

    const householdId = data as string;
    logger.info(`[UserCreatedHandler] Personal household created atomically for user ${userCreatedEvent.userId}, household ID: ${householdId}`);

    // Create Trial plan subscription so the user/household always has a plan (no Stripe until upgrade)
    try {
      const { makeSubscriptionsService } = await import("@/src/application/subscriptions/subscriptions.factory");
      const subscriptionsService = makeSubscriptionsService();
      await subscriptionsService.createTrialSubscriptionForNewUser(userCreatedEvent.userId, householdId);

      // Persist Stripe customer on trial subscription (reuses customer created at signup)
      try {
        const { makeStripeService } = await import("@/src/application/stripe/stripe.factory");
        const stripeService = makeStripeService();
        const { customerId } = await stripeService.createOrGetStripeCustomer(
          userCreatedEvent.userId,
          userCreatedEvent.email,
          userCreatedEvent.name ?? undefined,
          householdId
        );
        const subscriptionId = `${userCreatedEvent.userId}-trial`;
        await subscriptionsService.updateStripeCustomerId(subscriptionId, customerId);
        logger.info("[UserCreatedHandler] Stripe customer persisted on trial subscription", { userId: userCreatedEvent.userId, subscriptionId });
      } catch (stripeError) {
        logger.error("[UserCreatedHandler] Error persisting Stripe customer on trial (non-fatal):", stripeError);
      }
    } catch (trialError) {
      logger.error("[UserCreatedHandler] Error creating Trial subscription (non-fatal):", trialError);
      throw trialError;
    }
  } catch (error) {
    logger.error("[UserCreatedHandler] Error handling UserCreated event:", error);
    // Re-throw to allow event bus to handle it
    throw error;
  }
}

