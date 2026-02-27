/**
 * Onboarding Factory
 * Dependency injection factory for OnboardingService and OnboardingDecisionService
 */

import { OnboardingService } from "./onboarding.service";
import { OnboardingDecisionService } from "./onboarding-decision.service";
import { HouseholdRepository } from "@/src/infrastructure/database/repositories/household.repository";
import { CurrencyRepository } from "@/src/infrastructure/database/repositories/currency.repository";
import { BudgetGenerator } from "./budget-generator";
import { CategoryHelper } from "./category-helper";

/**
 * Create an OnboardingService instance with all dependencies
 */
export function makeOnboardingService(): OnboardingService {
  const householdRepository = new HouseholdRepository();
  const currencyRepository = new CurrencyRepository();
  const categoryHelper = new CategoryHelper();
  const budgetGenerator = new BudgetGenerator(categoryHelper);
  return new OnboardingService(
    householdRepository,
    budgetGenerator,
    categoryHelper,
    currencyRepository
  );
}

/**
 * Create an OnboardingDecisionService instance
 */
export function makeOnboardingDecisionService(): OnboardingDecisionService {
  return new OnboardingDecisionService();
}

