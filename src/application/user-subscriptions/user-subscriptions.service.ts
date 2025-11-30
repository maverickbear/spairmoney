/**
 * User Subscriptions Service
 * Business logic for user service subscriptions (Netflix, Spotify, etc.)
 */

import { UserSubscriptionsRepository } from "@/src/infrastructure/database/repositories/user-subscriptions.repository";
import { UserServiceSubscription, UserServiceSubscriptionFormData } from "../../domain/subscriptions/subscriptions.types";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { formatTimestamp, formatDateOnly } from "@/src/infrastructure/utils/timestamp";
import { getActiveHouseholdId } from "@/lib/utils/household";
import { logger } from "@/src/infrastructure/utils/logger";
import { invalidateSubscriptionCaches } from "@/src/infrastructure/cache/cache.manager";
import { makeCategoriesService } from "../categories/categories.factory";
import { makePlannedPaymentsService } from "../planned-payments/planned-payments.factory";
import { AppError } from "../shared/app-error";

const PLANNED_HORIZON_DAYS = 365; // 1 year horizon for planned payments

export class UserSubscriptionsService {
  constructor(private repository: UserSubscriptionsRepository) {}

  /**
   * Get all user service subscriptions (e.g., Netflix, Spotify, etc.)
   * 
   * Note: This method returns user service subscriptions, NOT Stripe subscription plans.
   * User service subscriptions are recurring payments for external services that the user
   * manually tracks (like streaming services, gym memberships, etc.).
   * 
   * @param userId - The user ID to fetch subscriptions for
   * @returns Array of user service subscriptions with enriched data (subcategory, account, service logo, plan)
   */
  async getUserSubscriptions(userId: string): Promise<UserServiceSubscription[]> {
    try {
      logger.debug(
        `[UserSubscriptionsService] Fetching user service subscriptions (Netflix, Spotify, etc.) ` +
        `for user: ${userId}`
      );

      const rows = await this.repository.findAll(userId);
      
      // Enrich with related data
      const enriched = await Promise.all(
        rows.map(async (row) => this.enrichSubscription(row))
      );

      if (enriched.length === 0) {
        logger.debug(
          `[UserSubscriptionsService] No user service subscriptions found for user: ${userId}. ` +
          `This is expected if the user hasn't added any service subscriptions yet.`
        );
      } else {
        logger.debug(
          `[UserSubscriptionsService] Found ${enriched.length} user service subscription(s) ` +
          `for user: ${userId}`,
          {
            serviceNames: enriched.map(s => s.serviceName),
            activeCount: enriched.filter(s => s.isActive).length,
          }
        );
      }

      return enriched;
    } catch (error) {
      logger.error("[UserSubscriptionsService] Error fetching user service subscriptions:", error);
      throw new AppError("Failed to fetch subscriptions", 500);
    }
  }

  /**
   * Create a new subscription
   */
  async createUserSubscription(
    userId: string,
    data: UserServiceSubscriptionFormData
  ): Promise<UserServiceSubscription> {
    try {
      let subcategoryId = data.subcategoryId;

      // If creating a new subcategory
      if (data.newSubcategoryName && data.categoryId) {
        const categoriesService = makeCategoriesService();
        const newSubcategory = await categoriesService.createSubcategory({
          name: data.newSubcategoryName,
          categoryId: data.categoryId,
        });
        subcategoryId = newSubcategory.id;
      }

      // Get active household ID
      const householdId = await getActiveHouseholdId(userId);
      if (!householdId) {
        throw new AppError("No active household found. Please contact support.", 400);
      }

      const id = crypto.randomUUID();
      const now = formatTimestamp(new Date());
      const firstBillingDate = formatDateOnly(new Date(data.firstBillingDate));

      const subscriptionData = {
        id,
        userId,
        householdId,
        serviceName: data.serviceName.trim(),
        subcategoryId: subcategoryId || null,
        planId: data.planId || null,
        amount: data.amount,
        description: data.description?.trim() || null,
        billingFrequency: data.billingFrequency,
        billingDay: data.billingDay || null,
        accountId: data.accountId,
        isActive: true,
        firstBillingDate,
        createdAt: now,
        updatedAt: now,
      };

      const row = await this.repository.create(subscriptionData);

      // Create planned payments for this subscription
      if (row.isActive) {
        try {
          await this.createSubscriptionPlannedPayments(row);
        } catch (error) {
          // Log error but don't fail subscription creation
          logger.error("[UserSubscriptionsService] Error creating planned payments:", error);
        }
      }

      // Enrich with related data
      const enriched = await this.enrichSubscription(row);

      // Invalidate cache
      invalidateSubscriptionCaches();

      return enriched;
    } catch (error) {
      logger.error("[UserSubscriptionsService] Error creating subscription:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create subscription", 500);
    }
  }

  /**
   * Enrich subscription with related data
   */
  private async enrichSubscription(row: any): Promise<UserServiceSubscription> {
    const supabase = await createServerClient();

    const [subcategoryResult, accountResult, serviceResult, planResult] = await Promise.all([
      row.subcategoryId
        ? supabase
            .from("Subcategory")
            .select("id, name, logo")
            .eq("id", row.subcategoryId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("Account")
        .select("id, name")
        .eq("id", row.accountId)
        .single(),
      row.serviceName
        ? supabase
            .from("SubscriptionService")
            .select("name, logo")
            .eq("name", row.serviceName)
            .single()
        : Promise.resolve({ data: null, error: null }),
      row.planId
        ? supabase
            .from("SubscriptionServicePlan")
            .select("id, planName")
            .eq("id", row.planId)
            .single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    return {
      ...row,
      amount: Number(row.amount),
      subcategory: subcategoryResult.data || null,
      account: accountResult.data || null,
      serviceLogo: serviceResult.data?.logo || null,
      plan: planResult.data || null,
    };
  }

  /**
   * Create planned payments for a subscription
   */
  private async createSubscriptionPlannedPayments(subscription: any): Promise<void> {
    if (!subscription.accountId || !subscription.isActive) {
      return;
    }

    const { addMonths, startOfMonth, setDate } = await import("date-fns");
    const plannedPaymentsService = makePlannedPaymentsService();

    const firstBillingDate = new Date(subscription.firstBillingDate);
    const amount = subscription.amount;
    const billingFrequency = subscription.billingFrequency || "monthly";

    if (amount <= 0) {
      return;
    }

    const plannedPayments = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const horizonDate = new Date(today);
    horizonDate.setDate(horizonDate.getDate() + PLANNED_HORIZON_DAYS);
    horizonDate.setHours(23, 59, 59, 999);

    let currentDate = new Date(firstBillingDate);
    currentDate.setHours(0, 0, 0, 0);

    let paymentCount = 0;
    const maxPayments = 100;

    while (currentDate <= horizonDate && paymentCount < maxPayments) {
      if (currentDate >= today) {
        plannedPayments.push({
          date: new Date(currentDate),
          type: "expense" as const,
          amount: amount,
          accountId: subscription.accountId,
          categoryId: null,
          subcategoryId: subscription.subcategoryId || null,
          description: subscription.serviceName,
          source: "subscription" as const,
          subscriptionId: subscription.id,
        });
      }

      // Calculate next payment date
      if (billingFrequency === "monthly") {
        const nextMonth = addMonths(currentDate, 1);
        const monthStart = startOfMonth(nextMonth);
        const dayOfMonth = firstBillingDate.getDate();
        currentDate = setDate(monthStart, Math.min(dayOfMonth, 28));
        if (dayOfMonth === 31) {
          const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
          currentDate = lastDay;
        }
      } else {
        // Default to monthly for other frequencies (can be extended)
        currentDate = addMonths(currentDate, 1);
      }
      paymentCount++;
    }

    if (plannedPayments.length === 0) {
      return;
    }

    // Create planned payments in batches
    const batchSize = 50;
    for (let i = 0; i < plannedPayments.length; i += batchSize) {
      const batch = plannedPayments.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map((pp) =>
          plannedPaymentsService.createPlannedPayment(pp).catch((error) => {
            logger.error(
              `[UserSubscriptionsService] Error creating planned payment:`,
              error
            );
          })
        )
      );
    }
  }
}

