/**
 * Members Factory
 * Dependency injection factory for MembersService
 */

import { MembersService } from "./members.service";
import { MembersRepository } from "@/src/infrastructure/database/repositories/members.repository";
import { HouseholdRepository } from "@/src/infrastructure/database/repositories/household.repository";

/**
 * Create a MembersService instance with all dependencies
 */
export function makeMembersService(): MembersService {
  const repository = new MembersRepository();
  const householdRepository = new HouseholdRepository();
  return new MembersService(repository, householdRepository);
}

