/**
 * Subscription Services Repository
 * Data access for subscription service categories only
 */

import { createServerClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";
import { BaseSubscriptionServiceCategory } from "@/src/domain/subscription-services/subscription-services.types";

export interface SubscriptionServiceCategoryRow {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SubscriptionServicesRepository {
  /**
   * Get all active categories
   */
  async findAllActiveCategories(): Promise<SubscriptionServiceCategoryRow[]> {
    const supabase = await createServerClient();

    const { data: categories, error } = await supabase
      .from("external_service_categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      logger.error("[SubscriptionServicesRepository] Error fetching categories:", error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (categories || []) as SubscriptionServiceCategoryRow[];
  }
}
