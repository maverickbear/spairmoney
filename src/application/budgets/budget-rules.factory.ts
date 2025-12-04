/**
 * Budget Rules Factory
 * Dependency injection for BudgetRulesService
 */

import { BudgetRulesService } from "./budget-rules.service";

export function makeBudgetRulesService(): BudgetRulesService {
  return new BudgetRulesService();
}

