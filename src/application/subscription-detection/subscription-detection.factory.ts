/**
 * Subscription Detection Factory
 * Dependency injection factory for SubscriptionDetectionService
 */

import { SubscriptionDetectionService } from "./subscription-detection.service";

/**
 * Create a SubscriptionDetectionService instance with all dependencies
 */
export function makeSubscriptionDetectionService(): SubscriptionDetectionService {
  return new SubscriptionDetectionService();
}

