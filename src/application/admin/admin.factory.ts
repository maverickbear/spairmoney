/**
 * Admin Factory
 * Dependency injection factory for AdminService
 */

import { AdminService } from "./admin.service";
import { AdminRepository } from "@/src/infrastructure/database/repositories/admin.repository";
import { AuthRepository } from "@/src/infrastructure/database/repositories/auth.repository";
import { AccountsRepository } from "@/src/infrastructure/database/repositories/accounts.repository";
import { CategoriesRepository } from "@/src/infrastructure/database/repositories/categories.repository";

/**
 * Create an AdminService instance with all dependencies
 */
export function makeAdminService(): AdminService {
  const repository = new AdminRepository();
  const authRepository = new AuthRepository();
  const accountsRepository = new AccountsRepository();
  const categoriesRepository = new CategoriesRepository();
  return new AdminService(
    repository,
    authRepository,
    accountsRepository,
    categoriesRepository
  );
}

