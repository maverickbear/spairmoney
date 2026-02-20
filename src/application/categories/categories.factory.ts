/**
 * Categories Factory
 * Dependency injection factory for CategoriesService
 */

import { CategoriesService } from "./categories.service";
import { CategoriesRepository } from "@/src/infrastructure/database/repositories/categories.repository";
import { TransactionsRepository } from "@/src/infrastructure/database/repositories/transactions.repository";

/**
 * Create a CategoriesService instance with all dependencies
 */
export function makeCategoriesService(): CategoriesService {
  const repository = new CategoriesRepository();
  const transactionsRepository = new TransactionsRepository();
  return new CategoriesService(repository, transactionsRepository);
}

