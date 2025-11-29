/**
 * Reports Factory
 * Dependency injection factory for ReportsService
 */

import { ReportsService } from "./reports.service";

/**
 * Create a ReportsService instance with all dependencies
 */
export function makeReportsService(): ReportsService {
  return new ReportsService();
}

