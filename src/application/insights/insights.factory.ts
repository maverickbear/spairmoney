/**
 * Insights Factory
 * Dependency injection factory for InsightsService
 */

import { InsightsService } from "./insights.service";

/**
 * Create an InsightsService instance
 */
export function makeInsightsService(): InsightsService {
  return new InsightsService();
}
