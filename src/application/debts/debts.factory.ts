/**
 * Debts Factory
 * Dependency injection factory for DebtsService
 */

import { DebtsService } from "./debts.service";
import { DebtsRepository } from "@/src/infrastructure/database/repositories/debts.repository";
import { TransactionsRepository } from "@/src/infrastructure/database/repositories/transactions.repository";

/**
 * Create a DebtsService instance with all dependencies
 */
export function makeDebtsService(): DebtsService {
  const repository = new DebtsRepository();
  const transactionsRepository = new TransactionsRepository();
  return new DebtsService(repository, transactionsRepository);
}

