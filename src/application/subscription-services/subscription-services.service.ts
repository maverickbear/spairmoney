/**
 * Subscription Services Service
 * Business logic for subscription service categories
 */

import { SubscriptionServicesRepository } from "@/src/infrastructure/database/repositories/subscription-services.repository";
import { SubscriptionServicesMapper } from "./subscription-services.mapper";
import { BaseSubscriptionServiceCategory } from "../../domain/subscription-services/subscription-services.types";

export class SubscriptionServicesService {
  constructor(private repository: SubscriptionServicesRepository) {}

  /**
   * Get all active categories (no services)
   */
  async getCategoriesAndServices(): Promise<{
    categories: Array<BaseSubscriptionServiceCategory & { services: never[] }>;
    services: never[];
  }> {
    const categories = await this.repository.findAllActiveCategories();
    const domainCategories = categories.map(SubscriptionServicesMapper.categoryToDomain);

    return {
      categories: domainCategories.map((c) => ({ ...c, services: [] })),
      services: [],
    };
  }

  /**
   * Get active plans for a service (deprecated – always empty)
   */
  async getPlansByServiceId(_serviceId: string): Promise<never[]> {
    return [];
  }
}
