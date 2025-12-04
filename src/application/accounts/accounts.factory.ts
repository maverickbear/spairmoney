/**
 * Accounts Factory
 * Dependency injection factory for AccountsService
 */

import { AccountsService } from "./accounts.service";
import { AccountsRepository } from "@/src/infrastructure/database/repositories/accounts.repository";
import { InvestmentsRepository } from "@/src/infrastructure/database/repositories/investments.repository";

/**
 * Create an AccountsService instance with all dependencies
 */
export function makeAccountsService(): AccountsService {
  const repository = new AccountsRepository();
  const investmentsRepository = new InvestmentsRepository();
  return new AccountsService(repository, investmentsRepository);
}

