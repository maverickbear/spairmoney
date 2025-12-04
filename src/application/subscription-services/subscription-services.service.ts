/**
 * Subscription Services Service
 * Business logic for subscription services management
 */

import { SubscriptionServicesRepository } from "@/src/infrastructure/database/repositories/subscription-services.repository";
import { SubscriptionServicesMapper } from "./subscription-services.mapper";
import {
  BaseSubscriptionServiceCategory,
  BaseSubscriptionService,
  BaseSubscriptionServicePlan,
} from "../../domain/subscription-services/subscription-services.types";

export class SubscriptionServicesService {
  constructor(private repository: SubscriptionServicesRepository) {}

  /**
   * Get all active categories and services
   */
  async getCategoriesAndServices(): Promise<{
    categories: Array<BaseSubscriptionServiceCategory & { services: BaseSubscriptionService[] }>;
    services: BaseSubscriptionService[];
  }> {
    const [categories, services] = await Promise.all([
      this.repository.findAllActiveCategories(),
      this.repository.findAllActiveServices(),
    ]);

    const domainCategories = categories.map(SubscriptionServicesMapper.categoryToDomain);
    const domainServices = services.map(SubscriptionServicesMapper.serviceToDomain);

    // Group services by category
    const servicesByCategory = new Map<string, BaseSubscriptionService[]>();
    domainServices.forEach((service) => {
      if (!servicesByCategory.has(service.categoryId)) {
        servicesByCategory.set(service.categoryId, []);
      }
      servicesByCategory.get(service.categoryId)!.push(service);
    });

    // Enrich categories with their services
    const enrichedCategories = domainCategories.map((category) => ({
      ...category,
      services: servicesByCategory.get(category.id) || [],
    }));

    return {
      categories: enrichedCategories,
      services: domainServices,
    };
  }

  /**
   * Get active plans for a service
   */
  async getPlansByServiceId(serviceId: string): Promise<BaseSubscriptionServicePlan[]> {
    const plans = await this.repository.findActivePlansByServiceId(serviceId);
    return plans.map(SubscriptionServicesMapper.planToDomain);
  }
}

