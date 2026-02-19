/**
 * Subscription Services Mapper
 * Maps between domain entities and infrastructure DTOs
 */

import { BaseSubscriptionServiceCategory } from "../../domain/subscription-services/subscription-services.types";
import { SubscriptionServiceCategoryRow } from "@/src/infrastructure/database/repositories/subscription-services.repository";

export class SubscriptionServicesMapper {
  static categoryToDomain(row: SubscriptionServiceCategoryRow): BaseSubscriptionServiceCategory {
    return {
      id: row.id,
      name: row.name,
      displayOrder: row.display_order,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
