/**
 * Investments Factory
 * Dependency injection factory for InvestmentsService
 */

import { InvestmentsService } from "./investments.service";
import { InvestmentsRepository } from "@/src/infrastructure/database/repositories/investments.repository";
import { AccountsRepository } from "@/src/infrastructure/database/repositories/accounts.repository";

/**
 * Create an InvestmentsService instance with all dependencies
 */
export function makeInvestmentsService(): InvestmentsService {
  const repository = new InvestmentsRepository();
  const accountsRepository = new AccountsRepository();
  return new InvestmentsService(repository, accountsRepository);
}

