/**
 * Subscription Services Mapper
 * Maps between domain entities and infrastructure DTOs
 */

import {
  BaseSubscriptionServiceCategory,
  BaseSubscriptionService,
  BaseSubscriptionServicePlan,
} from "../../domain/subscription-services/subscription-services.types";
import {
  SubscriptionServiceCategoryRow,
  SubscriptionServiceRow,
  SubscriptionServicePlanRow,
} from "@/src/infrastructure/database/repositories/subscription-services.repository";

export class SubscriptionServicesMapper {
  /**
   * Map repository row to domain entity
   */
  static categoryToDomain(row: SubscriptionServiceCategoryRow): BaseSubscriptionServiceCategory {
    return {
      id: row.id,
      name: row.name,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  /**
   * Map repository row to domain entity
   */
  static serviceToDomain(row: SubscriptionServiceRow): BaseSubscriptionService {
    return {
      id: row.id,
      name: row.name,
      categoryId: row.categoryId,
      logo: row.logo,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  /**
   * Map repository row to domain entity
   */
  static planToDomain(row: SubscriptionServicePlanRow): BaseSubscriptionServicePlan {
    return {
      id: row.id,
      serviceId: row.serviceId,
      planName: row.planName,
      price: row.price,
      currency: row.currency,
      billingCycle: row.billingCycle,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

