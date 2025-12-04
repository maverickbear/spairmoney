/**
 * Budgets Factory
 * Dependency injection factory for BudgetsService
 */

import { BudgetsService } from "./budgets.service";
import { BudgetsRepository } from "@/src/infrastructure/database/repositories/budgets.repository";
import { CategoriesRepository } from "@/src/infrastructure/database/repositories/categories.repository";
import { TransactionsRepository } from "@/src/infrastructure/database/repositories/transactions.repository";

/**
 * Create a BudgetsService instance with all dependencies
 */
export function makeBudgetsService(): BudgetsService {
  const repository = new BudgetsRepository();
  const categoriesRepository = new CategoriesRepository();
  const transactionsRepository = new TransactionsRepository();
  return new BudgetsService(repository, categoriesRepository, transactionsRepository);
}

