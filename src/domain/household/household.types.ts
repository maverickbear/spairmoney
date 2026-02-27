/**
 * Household Domain Types
 * Pure domain types for household feature
 */

import { BudgetRuleType } from "../budgets/budget-rules.types";

export interface HouseholdSettings {
  /** Expected annual household income (single amount). Replaces legacy expectedIncome range + expectedIncomeAmount. */
  expectedAnnualIncome?: number | null;
  /** Per-member annual income: key = user id (or member row id for pending), value = amount. Sum should equal expectedAnnualIncome. */
  memberIncomes?: Record<string, number> | null;
  country?: string | null; // ISO 3166-1 alpha-2 country code (e.g., "US", "CA")
  stateOrProvince?: string | null; // State/province code (e.g., "CA", "ON")
  budgetRule?: BudgetRuleType | null; // Selected budget rule type
  onboardingCompletedAt?: string | null; // ISO timestamp when onboarding was completed
  onboardingGoals?: string[] | null; // User goals selected during onboarding
  onboardingHouseholdType?: "personal" | "shared" | null; // Household type selected during onboarding
  /** ISO 4217 currency code for app display (e.g. "CAD", "USD"). */
  displayCurrency?: string | null;
}

