/**
 * Import Jobs Factory
 * Dependency injection factory for ImportJobsService
 */

import { ImportJobsService } from "./import-jobs.service";
import { ImportJobsRepository } from "@/src/infrastructure/database/repositories/import-jobs.repository";

/**
 * Create an ImportJobsService instance with all dependencies
 */
export function makeImportJobsService(): ImportJobsService {
  const repository = new ImportJobsRepository();
  return new ImportJobsService(repository);
}

