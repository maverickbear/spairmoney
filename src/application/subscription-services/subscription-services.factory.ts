/**
 * Subscription Services Factory
 * Dependency injection factory for SubscriptionServicesService
 */

import { SubscriptionServicesService } from "./subscription-services.service";
import { SubscriptionServicesRepository } from "@/src/infrastructure/database/repositories/subscription-services.repository";

/**
 * Create a SubscriptionServicesService instance with all dependencies
 */
export function makeSubscriptionServicesService(): SubscriptionServicesService {
  const repository = new SubscriptionServicesRepository();
  return new SubscriptionServicesService(repository);
}

