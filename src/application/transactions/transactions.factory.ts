/**
 * Transactions Factory
 * Dependency injection factory for TransactionsService
 */

import { TransactionsService } from "./transactions.service";
import { TransactionsRepository } from "@/src/infrastructure/database/repositories/transactions.repository";
import { AccountsRepository } from "@/src/infrastructure/database/repositories/accounts.repository";
import { CategoriesRepository } from "@/src/infrastructure/database/repositories/categories.repository";

/**
 * Create a TransactionsService instance with all dependencies
 */
export function makeTransactionsService(): TransactionsService {
  const repository = new TransactionsRepository();
  const accountsRepository = new AccountsRepository();
  const categoriesRepository = new CategoriesRepository();
  return new TransactionsService(repository, accountsRepository, categoriesRepository);
}

