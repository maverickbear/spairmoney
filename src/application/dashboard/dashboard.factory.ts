/**
 * Dashboard Factory
 * Dependency injection factory for DashboardService
 */

import { DashboardService } from "./dashboard.service";
import { DashboardRepository } from "@/src/infrastructure/database/repositories/dashboard.repository";

/**
 * Create a DashboardService instance with all dependencies
 */
export function makeDashboardService(): DashboardService {
  const repository = new DashboardRepository();
  return new DashboardService(repository);
}

