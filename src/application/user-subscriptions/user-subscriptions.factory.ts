/**
 * User Subscriptions Factory
 * Dependency injection factory for UserSubscriptionsService
 */

import { UserSubscriptionsService } from "./user-subscriptions.service";
import { UserSubscriptionsRepository } from "@/src/infrastructure/database/repositories/user-subscriptions.repository";

/**
 * Create a UserSubscriptionsService instance with all dependencies
 */
export function makeUserSubscriptionsService(): UserSubscriptionsService {
  const repository = new UserSubscriptionsRepository();
  return new UserSubscriptionsService(repository);
}

