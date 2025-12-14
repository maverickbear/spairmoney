/**
 * Profile Factory
 * Dependency injection factory for ProfileService and ProfileAnonymizationService
 */

import { ProfileService } from "./profile.service";
import { ProfileAnonymizationService } from "./profile-anonymization.service";
import { ProfileRepository } from "@/src/infrastructure/database/repositories/profile.repository";
import { PlaidItemsRepository } from "@/src/infrastructure/database/repositories/plaid-items.repository";

/**
 * Create a ProfileService instance with all dependencies
 */
export function makeProfileService(): ProfileService {
  const repository = new ProfileRepository();
  return new ProfileService(repository);
}

/**
 * Create a ProfileAnonymizationService instance with all dependencies
 */
export function makeProfileAnonymizationService(): ProfileAnonymizationService {
  const plaidItemsRepository = new PlaidItemsRepository();
  return new ProfileAnonymizationService(plaidItemsRepository);
}

