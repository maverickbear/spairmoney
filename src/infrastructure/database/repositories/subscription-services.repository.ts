/**
 * Subscription Services Repository
 * Data access layer for subscription services - only handles database operations
 */

import { createServerClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";
import {
  BaseSubscriptionServiceCategory,
  BaseSubscriptionService,
  BaseSubscriptionServicePlan,
} from "@/src/domain/subscription-services/subscription-services.types";

export interface SubscriptionServiceCategoryRow {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionServiceRow {
  id: string;
  name: string;
  categoryId: string;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionServicePlanRow {
  id: string;
  serviceId: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class SubscriptionServicesRepository {
  /**
   * Get all active categories
   */
  async findAllActiveCategories(): Promise<SubscriptionServiceCategoryRow[]> {
    const supabase = await createServerClient();

    const { data: categories, error } = await supabase
      .from("SubscriptionServiceCategory")
      .select("*")
      .eq("isActive", true)
      .order("displayOrder", { ascending: true });

    if (error) {
      logger.error("[SubscriptionServicesRepository] Error fetching categories:", error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (categories || []) as SubscriptionServiceCategoryRow[];
  }

  /**
   * Get all active services
   */
  async findAllActiveServices(): Promise<SubscriptionServiceRow[]> {
    const supabase = await createServerClient();

    const { data: services, error } = await supabase
      .from("SubscriptionService")
      .select("*")
      .eq("isActive", true)
      .order("name", { ascending: true });

    if (error) {
      logger.error("[SubscriptionServicesRepository] Error fetching services:", error);
      throw new Error(`Failed to fetch services: ${error.message}`);
    }

    return (services || []) as SubscriptionServiceRow[];
  }

  /**
   * Get active plans for a service
   */
  async findActivePlansByServiceId(serviceId: string): Promise<SubscriptionServicePlanRow[]> {
    const supabase = await createServerClient();

    const { data: plans, error } = await supabase
      .from("SubscriptionServicePlan")
      .select("*")
      .eq("serviceId", serviceId)
      .eq("isActive", true)
      .order("planName", { ascending: true });

    if (error) {
      logger.error("[SubscriptionServicesRepository] Error fetching plans:", error);
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    return (plans || []) as SubscriptionServicePlanRow[];
  }

  /**
   * Find services by names
   */
  async findServicesByNames(names: string[]): Promise<SubscriptionServiceRow[]> {
    if (names.length === 0) {
      return [];
    }

    const supabase = await createServerClient();

    const { data: services, error } = await supabase
      .from("SubscriptionService")
      .select("name, logo")
      .in("name", names);

    if (error) {
      logger.error("[SubscriptionServicesRepository] Error fetching services by names:", error);
      throw new Error(`Failed to fetch services: ${error.message}`);
    }

    return (services || []) as SubscriptionServiceRow[];
  }
}

